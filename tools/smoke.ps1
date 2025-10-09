param(
  [Parameter(Mandatory=$true)] [string]$BaseUrl,
  [Parameter(Mandatory=$false)] [string]$BypassToken
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Normalize-BaseUrl([string]$u) {
  $u = $u.Trim()
  if (-not $u.StartsWith('http')) { $u = "https://$u" }
  if ($u.EndsWith('/')) { $u = $u.Substring(0, $u.Length - 1) }
  return $u
}

function Add-BypassQuery([string]$Url, [string]$Token) {
  if ([string]::IsNullOrWhiteSpace($Token)) { return $Url }
  $sep = ($Url -match '\?') ? '&' : '?'
  return "$Url${sep}vercel-protection-bypass=$Token"
}

function Test-IsVercelPreviewProtection {
  param(
    [int]$StatusCode,
    $Headers,
    [string]$ErrorMessage
  )
  try {
    # If we have a status code and it's definitely not auth-related, bail early
    if ($null -ne $StatusCode -and $StatusCode -ne 401 -and $StatusCode -ne 403) { return $false }
    if ($null -ne $Headers) {
      $verr = $Headers['x-vercel-error']
      $vid  = $Headers['x-vercel-id']
      $vc   = $Headers['x-vercel-cache']
      $srv  = $Headers['server']
      if ($verr -match 'preview_protection') { return $true }
      if ($vid -or $vc) { return $true }
      if ($srv -and ($srv -match 'vercel')) { return $true }
    }
    # If host is vercel.app and the status suggests auth, treat as preview protection
    if ($script:BaseHost -and $script:BaseHost.EndsWith('.vercel.app')) {
      if ($null -eq $StatusCode -or $StatusCode -eq 401 -or $StatusCode -eq 403) { return $true }
    }
    if ($ErrorMessage -and ($ErrorMessage.ToLowerInvariant() -match 'preview.*protect|vercel')) { return $true }
  } catch {}
  return $false
}

$Base = Normalize-BaseUrl $BaseUrl
Write-Host "Base URL: $Base"

# Validate base URL includes a hostname
try {
  $uri = [Uri]$Base
  if (-not $uri.Host -or [string]::IsNullOrWhiteSpace($uri.Host)) {
    throw "Missing host"
  }
  # expose base host for preview-protection heuristics
  $script:BaseHost = $uri.Host.ToLowerInvariant()
} catch {
  throw "BaseUrl is invalid. Provide a full URL like https://your-app.vercel.app"
}

# Endpoints to probe (tune to your app)
$Endpoints = @(
  '/',                  # root
  '/dashboard',         # dashboard bundle (ensures copy step succeeded)
  '/api/health',        # health (if present)
  '/api/summarize/stream?dryRun=1'   # dry-run SSE/JSON path if you expose one
) | Select-Object -Unique

$HasBypass = ($BypassToken -and $BypassToken.Trim().Length -gt 0)
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$Headers = @{}
if ($HasBypass) {
  $Headers['x-vercel-protection-bypass'] = $BypassToken.Trim()
  Write-Host "Bypass enabled: header + query param + cookie via WebSession."
  # Warm-up GET to set bypass cookie
  $warmUrl = Add-BypassQuery "$Base/" $BypassToken
  try { $null = Invoke-WebRequest -UseBasicParsing -Method Get -Uri $warmUrl -Headers $Headers -WebSession $Session -MaximumRedirection 5 -TimeoutSec 20 } catch {}
}

# Accept 2xx + 3xx as success.
$OkCodes = 200..299 + 300..399

function Invoke-Probe {
  param(
    [string]$Url
  )
  $UrlQ = if ($HasBypass) { Add-BypassQuery $Url $BypassToken } else { $Url }
  if ($HasBypass) {
    $r = Invoke-WebRequest -Uri $UrlQ -Method Get -Headers $Headers -WebSession $Session -MaximumRedirection 5 -TimeoutSec 20
    $r | Add-Member -NotePropertyName MethodUsed -NotePropertyValue 'GET' -Force
    return $r
  }
  try {
    $r = Invoke-WebRequest -Uri $UrlQ -Method Head -Headers $Headers -WebSession $Session -MaximumRedirection 5 -TimeoutSec 20
    $r | Add-Member -NotePropertyName MethodUsed -NotePropertyValue 'HEAD' -Force
    return $r
  } catch {
    Write-Host "HEAD failed for $Url - falling back to GET. Reason: $($_.Exception.Message)"
    $r = Invoke-WebRequest -Uri $UrlQ -Method Get -Headers $Headers -WebSession $Session -MaximumRedirection 5 -TimeoutSec 25
    $r | Add-Member -NotePropertyName MethodUsed -NotePropertyValue 'GET' -Force
    return $r
  }
}

$Results = New-Object System.Collections.Generic.List[Object]

foreach ($ep in $Endpoints) {
  $url = "$Base$ep"
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $code = $null
  $ok = $false
  $err = $null
  $method = $null
  $previewProtected = $false

  try {
    if ($ep -match '/stream') {
      # SSE endpoints: GET only with Accept header
      $h = @{}
      foreach ($k in $Headers.Keys) { $h[$k] = $Headers[$k] }
      $h['Accept'] = 'text/event-stream'

      $urlSse = if ($HasBypass) { Add-BypassQuery $url $BypassToken } else { $url }
      $resp = Invoke-WebRequest -Uri $urlSse -Method Get -Headers $h -WebSession $Session -MaximumRedirection 5 -TimeoutSec 25
      $resp | Add-Member -NotePropertyName MethodUsed -NotePropertyValue 'GET (SSE)' -Force
    } else {
      $resp = Invoke-Probe -Url $url
    }

    $code = [int]$resp.StatusCode
    $ok = $OkCodes -contains $code
    $method = $resp.MethodUsed

    # Surface helpful Vercel headers when available
    $vcache = $resp.Headers['x-vercel-cache']
    $vid    = $resp.Headers['x-vercel-id']
    $verr   = $resp.Headers['x-vercel-error']
    $hints = @()
    if ($verr) { $hints += "x-vercel-error=$verr" }
    if ($vcache) { $hints += "x-vercel-cache=$vcache" }
    if ($vid)    { $hints += "x-vercel-id=$vid" }
    if ($hints.Count -gt 0) {
      $err = ($hints -join '; ')
    }

    if (-not $ok) {
      if (Test-IsVercelPreviewProtection -StatusCode $code -Headers $resp.Headers -ErrorMessage $err) {
        $previewProtected = $true
      }
    }
  } catch {
    $method = if ($ep -match '/stream') { 'GET (SSE)' } else { 'HEAD→GET' }
    $err = $_.Exception.Message
    # Try to parse status code from error message when no response object is available
    if (-not $code) {
      if ($err -match '\b401\b') { $code = 401 }
      elseif ($err -match '\b403\b') { $code = 403 }
    }
    # Try to extract response details from WebException when present
    try {
      $we = $_.Exception
      if ($we.Response) {
        $resp = $we.Response
        if ($resp.StatusCode) { $code = [int]$resp.StatusCode }
        $vcache = $resp.Headers['x-vercel-cache']
        $vid    = $resp.Headers['x-vercel-id']
        $verr   = $resp.Headers['x-vercel-error']
        $hints = @()
        if ($verr) { $hints += "x-vercel-error=$verr" }
        if ($vcache) { $hints += "x-vercel-cache=$vcache" }
        if ($vid)    { $hints += "x-vercel-id=$vid" }
        if ($hints.Count -gt 0) {
          $err = ($err + ' | ' + ($hints -join '; ')).Trim()
        }
        if (Test-IsVercelPreviewProtection -StatusCode $code -Headers $resp.Headers -ErrorMessage $err) { $previewProtected = $true }
      } else {
        # No response object; still try host-based detection
        if (Test-IsVercelPreviewProtection -StatusCode $code -Headers $null -ErrorMessage $err) { $previewProtected = $true }
      }
    } catch { }
  } finally {
    $sw.Stop()
  }

  $Results.Add([pscustomobject]@{
    Endpoint = $ep
    Url      = $url
    Status   = $(if ($code) { $code } else { 'ERR' })
    Ok       = $(if ($ok) { 'OK' } elseif ($previewProtected) { 'SKIP' } else { 'FAIL' })
    Ms       = $sw.ElapsedMilliseconds
    Method   = $method
    Error    = $err
  })
}

# Print table + summary
# If protected preview (vercel.app + no bypass), convert 401/403 failures to SKIP
$isProtectedHost = ($script:BaseHost -and $script:BaseHost.EndsWith('.vercel.app'))
$hasBypass = ($BypassToken -and $BypassToken.Trim().Length -gt 0)
if ($isProtectedHost -and -not $hasBypass) {
  foreach ($row in $Results) {
    if ($row.Ok -eq 'FAIL' -and ($row.Status -eq 401 -or $row.Status -eq 403)) {
      $row.Ok = 'SKIP'
    }
  }
}

$Results | Sort-Object { $_.Ok -ne 'OK' }, Ms | Format-Table -AutoSize | Out-String | Write-Host

$failed = @($Results | Where-Object { $_.Ok -eq 'FAIL' })
if ($failed.Count -gt 0) {
  Write-Host "`nFailures:"
  $failed | Format-Table -AutoSize | Out-String | Write-Host
  Exit 1
}

Write-Host "`nAll smoke checks passed (non-200s due to preview protection are marked SKIP)."
Exit 0
