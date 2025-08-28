param(
  [int[]] $Ports = @(3000,5174,5175)
)

function Stop-PortOwner($port) {
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
      $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($pid in $pids) {
        try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
      }
    }
  } catch {}
}

foreach ($p in $Ports) { Stop-PortOwner -port $p }
Write-Host "Stopped listeners on ports: $($Ports -join ', ') (if any)"

