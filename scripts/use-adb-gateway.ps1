[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 17830
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$tokenFile = Join-Path $projectRoot '.opencli\gateway-token'

if (-not (Test-Path -LiteralPath $tokenFile)) {
  throw "Gateway token is missing. Start scripts/start-adb-gateway.ps1 first."
}

$env:ZHIHU_MOBILE_GATEWAY_URL = "http://127.0.0.1:$Port"
$env:ZHIHU_MOBILE_GATEWAY_TOKEN = (Get-Content -Raw -LiteralPath $tokenFile).Trim()

if (-not $env:ZHIHU_MOBILE_GATEWAY_TOKEN) {
  throw "Gateway token in $tokenFile is empty"
}

adb reverse "tcp:$Port" "tcp:$Port" | Out-Null

Write-Host "Current PowerShell configured for $env:ZHIHU_MOBILE_GATEWAY_URL"
Write-Host 'Run: opencli zhihu-mobile doctor --probe'
