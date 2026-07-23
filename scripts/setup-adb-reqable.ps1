[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 9000,

  [string]$Serial = ''
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
  throw 'adb is not available on PATH'
}

$devices = @(
  adb devices |
    Select-Object -Skip 1 |
    ForEach-Object {
      if ($_ -match '^(\S+)\s+device(?:\s|$)') { $Matches[1] }
    }
)

if ($Serial) {
  if ($Serial -notin $devices) {
    throw "ADB device $Serial is not connected and authorized"
  }
} elseif ($devices.Count -eq 1) {
  $Serial = $devices[0]
} elseif ($devices.Count -eq 0) {
  throw 'No authorized Android device is connected through adb'
} else {
  throw 'Multiple Android devices are connected. Re-run with -Serial <serial>.'
}

$reqableUrl = "http://127.0.0.1:$Port"
$filterBody = @{ filters = @() } | ConvertTo-Json -Compress
try {
  Invoke-RestMethod `
    -Method Post `
    -Uri "$reqableUrl/capture/live/filter" `
    -ContentType 'application/json' `
    -Body $filterBody `
    -TimeoutSec 5 | Out-Null
} catch {
  throw "Reqable live API is unavailable at $reqableUrl. Start Reqable capture first."
}

$packagePath = adb -s $Serial shell pm path com.zhihu.android
if (-not ($packagePath -match '^package:')) {
  throw "com.zhihu.android is not installed on $Serial"
}

adb -s $Serial reverse "tcp:$Port" "tcp:$Port" | Out-Null
adb -s $Serial shell settings put global http_proxy "127.0.0.1:$Port"

$proxy = (adb -s $Serial shell settings get global http_proxy).Trim()
if ($proxy -ne "127.0.0.1:$Port") {
  throw "Android proxy setup failed: $proxy"
}

$env:ZHIHU_MOBILE_ADB_SERIAL = $Serial
$env:REQABLE_ZHIHU_URL = $reqableUrl

Write-Host "Ready: $Serial -> Reqable $reqableUrl"
Write-Host 'Current PowerShell now has ZHIHU_MOBILE_ADB_SERIAL and REQABLE_ZHIHU_URL.'
Write-Host 'Run: opencli zhihu-mobile doctor --probe'
Write-Host 'Restore later: adb -s <serial> shell settings put global http_proxy :0'
