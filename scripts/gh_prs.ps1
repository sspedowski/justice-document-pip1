Param(
    [string]$Repo = "sspedowski/justice-document-pip1"
)

$ProgressPreference = 'SilentlyContinue'

$headers = @{
    'User-Agent' = 'codex-cli'
    'Accept'     = 'application/vnd.github+json'
}

# Try to use a token from env or from local .env file
$token = $env:GITHUB_TOKEN
try {
    $envFile = Join-Path -Path (Get-Location) -ChildPath 'justice-server/.env'
    if (-not $token -and (Test-Path $envFile)) {
        $line = Get-Content $envFile | Where-Object { $_ -match '^GITHUB_TOKEN\s*=\s*' } | Select-Object -First 1
        if ($line) {
            $tokenValue = ($line -split '=',2)[1]
            if ($null -ne $tokenValue) {
                $tokenValue = $tokenValue.Trim()
                if ($tokenValue.StartsWith('"') -and $tokenValue.EndsWith('"')) { $tokenValue = $tokenValue.Trim('"') }
                if ($tokenValue.StartsWith("'") -and $tokenValue.EndsWith("'")) { $tokenValue = $tokenValue.Trim("'") }
            }
            if ($tokenValue) { $token = $tokenValue }
        }
    }
} catch {}

if ($token) { $headers['Authorization'] = "Bearer $token" }

function Get-GitHubJson([string]$url) {
    Invoke-RestMethod -Headers $headers -Uri $url -Method Get -ErrorAction Stop
}

$prs = @()
$page = 1
$perPage = 100
while ($true) {
    $url = "https://api.github.com/repos/$Repo/pulls?state=open&per_page=$perPage&page=$page"
    try {
        $batch = Get-GitHubJson $url
    } catch {
        Write-Error ("GitHub API error: " + $_.Exception.Message)
        break
    }
    if (-not $batch) { break }
    if ($batch -isnot [System.Array]) { $batch = @($batch) }
    $prs += $batch
    if ($batch.Count -lt $perPage) { break }
    $page++
}

if ($prs.Count -eq 0) {
    Write-Output "No open PRs found or unauthorized."
    return
}

$results = foreach ($pr in $prs) {
    $detailUrl = "https://api.github.com/repos/$Repo/pulls/$($pr.number)"
    $mergeableState = ''
    try {
        $detail = Get-GitHubJson $detailUrl
        $mergeableState = $detail.mergeable_state
    } catch {
        $mergeableState = ''
    }
    [PSCustomObject]@{
        number          = $pr.number
        title           = $pr.title
        author          = $pr.user.login
        draft           = [bool]$pr.draft
        age_days        = [Math]::Round(((Get-Date) - [DateTime]$pr.created_at).TotalDays, 1)
        mergeable_state = $mergeableState
        url             = $pr.html_url
    }
}

$results | Sort-Object age_days -Descending | Format-Table -AutoSize number,age_days,mergeable_state,draft,title,author,url
Write-Output ("`nTOTAL: " + $results.Count)
