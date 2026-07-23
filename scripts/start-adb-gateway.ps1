[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 17830
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot '.opencli'
$tokenFile = Join-Path $runtimeDirectory 'gateway-token'

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
  throw 'adb is not available on PATH'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'node is not available on PATH'
}
if ((adb get-state 2>$null) -ne 'device') {
  throw 'No authorized Android device is connected through adb'
}

New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
if (-not (Test-Path -LiteralPath $tokenFile)) {
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $bytes = New-Object byte[] 32
    $generator.GetBytes($bytes)
    $token = [Convert]::ToHexString($bytes).ToLowerInvariant()
    Set-Content -LiteralPath $tokenFile -Value $token -Encoding ascii -NoNewline
  } finally {
    $generator.Dispose()
  }
}

$token = (Get-Content -Raw -LiteralPath $tokenFile).Trim()
if ($token.Length -lt 24) {
  throw "Gateway token in $tokenFile must contain at least 24 characters"
}

$env:ZHIHU_MOBILE_GATEWAY_HOST = '127.0.0.1'
$env:ZHIHU_MOBILE_GATEWAY_PORT = [string]$Port
$env:ZHIHU_MOBILE_GATEWAY_TOKEN = $token

adb reverse "tcp:$Port" "tcp:$Port" | Out-Null

Write-Host "ADB reverse configured: device tcp:$Port -> host tcp:$Port"
Write-Host "Gateway token stored in ignored runtime file: $tokenFile"
Write-Host 'Keep this window open while using the remote source.'

& node (Join-Path $projectRoot 'scripts/gateway.mjs')
exit $LASTEXITCODE
