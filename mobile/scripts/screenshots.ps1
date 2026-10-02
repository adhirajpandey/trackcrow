<#
Captures the Android screenshot set from the installed TrackCrow Dev app with Maestro.
Run from mobile/ with `corepack pnpm screenshots:android [-Device <adb serial>]`.

Uses the local backend on 127.0.0.1:3000 and Metro on 127.0.0.1:8082, starting either one when it
is not running. Resets only the screenshot account's data. Never installs, rebuilds, or reconfigures
the app. Writes numbered PNGs to mobile/artifacts/screenshots/android/.
#>
param(
  # adb serial, such as a USB serial or ip:port. Defaults to ANDROID_SERIAL, then the only connected device.
  [string]$Device = $env:ANDROID_SERIAL,
  # Internal: run Metro or the backend in the foreground for a detached process.
  [ValidateSet('', 'metro', 'backend')][string]$Serve = ''
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$env:MAESTRO_CLI_NO_ANALYTICS = '1'
$env:MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED = 'true'

$mobileDir = Split-Path -Parent $PSScriptRoot
$rootDir = Split-Path -Parent $mobileDir
$artifacts = Join-Path $mobileDir 'artifacts'
$logDir = Join-Path $artifacts 'logs'
$devPackage = 'app.trackcrow.mobile.dev'
$apiUrl = 'http://127.0.0.1:3000'
$metroPort = 8082
$devClientUrl = "exp+trackcrow-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A$metroPort"
$expected = @(
  '01-overview', '02-transactions', '03-transaction-filters', '04-transaction-detail', '05-category-picker',
  '06-add-transaction', '07-review', '08-recipients', '09-recipient-detail', '10-rules', '11-rule-editor',
  '12-insights', '13-more', '14-categories', '15-accounts', '16-settings', '17-diagnostics',
  '18-onboarding-welcome', '19-onboarding-bank', '20-onboarding-sms'
)

New-Item -ItemType Directory -Force $logDir | Out-Null

if ($Serve -eq 'metro') {
  Set-Location $mobileDir
  Remove-Item Env:CI -ErrorAction SilentlyContinue
  $env:APP_VARIANT = 'development'
  $env:NODE_OPTIONS = '--dns-result-order=ipv4first'
  & corepack pnpm exec expo start --dev-client --localhost --port $metroPort *> (Join-Path $logDir 'metro.log')
  exit $LASTEXITCODE
}
if ($Serve -eq 'backend') {
  Set-Location $rootDir
  & corepack pnpm dev --hostname 127.0.0.1 --port 3000 *> (Join-Path $logDir 'backend.log')
  exit $LASTEXITCODE
}

function Fail([string]$Message) { throw "screenshots: $Message" }
# Runs a native command and returns its output as text. Windows PowerShell turns redirected stderr into
# errors, so this runs with Continue and callers check $LASTEXITCODE.
function Invoke-Native {
  $ErrorActionPreference = 'Continue'
  $arguments = @($args | Select-Object -Skip 1)
  & $args[0] @arguments 2>&1 | ForEach-Object { "$_" }
}
function Step([string]$Message) { Write-Host "-- $Message" }

# Starts this script in -Serve mode outside the current console and SSH session, so Metro and the
# backend keep running for the next capture.
function Start-Detached([string]$Mode) {
  $command = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSCommandPath`" -Serve $Mode"
  $result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = $command; CurrentDirectory = $mobileDir
  }
  if ($result.ReturnValue -ne 0) { Fail "could not start $Mode (Win32_Process error $($result.ReturnValue))." }
}

function Wait-Until([scriptblock]$Ready, [int]$Seconds, [string]$What) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while (-not (& $Ready)) {
    if ((Get-Date) -gt $deadline) { Fail "$What was not ready within $Seconds s." }
    Start-Sleep -Seconds 2
  }
}

function Test-Port([int]$Port) {
  $client = New-Object Net.Sockets.TcpClient
  try { $client.ConnectAsync('127.0.0.1', $Port).Wait(1000) -and $client.Connected } catch { $false } finally { $client.Dispose() }
}

function Invoke-Http([string]$Url, [hashtable]$Headers = @{}) {
  try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 -Headers $Headers $Url } catch { $null }
}

# Metro answers /status with its project root in a header.
function Get-MetroRoot {
  $response = Invoke-Http "http://127.0.0.1:$metroPort/status"
  if (-not $response) { return $null }
  $content = $response.Content
  if ($content -is [byte[]]) { $content = [Text.Encoding]::UTF8.GetString($content) }
  if ($content -ne 'packager-status:running') { return $null }
  [Uri]::UnescapeDataString("$($response.Headers['X-React-Native-Project-Root'])")
}

function Normalize-Path([string]$Path) { $Path.TrimEnd('\', '/').Replace('/', '\').ToLowerInvariant() }

# Tools
Step 'tools'
$adb = if ($env:ANDROID_HOME -and (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe")) {
  "$env:ANDROID_HOME\platform-tools\adb.exe"
} else { (Get-Command adb -ErrorAction SilentlyContinue).Source }
if (-not $adb) { Fail 'adb was not found. Set ANDROID_HOME or add the SDK platform-tools to PATH.' }
$java = if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) { "$env:JAVA_HOME\bin\java.exe" }
  else { (Get-Command java -ErrorAction SilentlyContinue).Source }
if (-not $java) { Fail 'Java 17 or newer was not found. Set JAVA_HOME; Maestro needs it.' }
if (-not (Get-Command maestro -ErrorAction SilentlyContinue)) {
  Fail 'maestro was not found. Install the Maestro CLI and add its bin folder to PATH (see docs/android.md).'
}
$maestroVersion = Invoke-Native maestro --version | Select-Object -Last 1
if ($LASTEXITCODE -ne 0) { Fail 'maestro --version failed. Check JAVA_HOME.' }
"adb: $adb"
"maestro: $maestroVersion"

# Device
Step 'device'
if (-not $Device) {
  $devices = @(Invoke-Native $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '^(\S+)\s+device$' } | ForEach-Object { $Matches[1] })
  if ($devices.Count -ne 1) {
    Fail "pass -Device <serial>. Connected devices: $(if ($devices) { $devices -join ', ' } else { 'none' })."
  }
  $Device = $devices[0]
}
# A wireless debugging address may need connecting after an adb server restart.
if ($Device -match ':\d+$') { Invoke-Native $adb connect $Device | Out-Null }
$state = (Invoke-Native $adb -s $Device get-state) -join ' '
if ($LASTEXITCODE -ne 0 -or $state -ne 'device') {
  Fail "device $Device is not ready ($state). Unlock the phone, accept USB or wireless debugging, and check adb devices -l."
}
Invoke-Native $adb -s $Device shell pm path $devPackage | Out-Null
if ($LASTEXITCODE -ne 0) {
  Fail "TrackCrow Dev ($devPackage) is not installed on $Device. Install it with the TrackCrow Dev native build workflow in docs/android.md; this command never builds it."
}
# Keep SMS capture off for the screenshot session.
Invoke-Native $adb -s $Device shell pm revoke $devPackage android.permission.RECEIVE_SMS | Out-Null
"device: $Device"

# Backend and fixture
Step 'backend'
if (-not (Test-Port 3000)) {
  if (-not (Test-Port 5434)) {
    Push-Location $rootDir
    try { & docker compose up -d --wait db } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Fail 'the local database did not start. Start Docker Desktop and retry.' }
  }
  Start-Detached backend
  "backend: starting from $rootDir (log: $logDir\backend.log)"
}
Wait-Until { Invoke-Http "$apiUrl/api/mobile/config" } 180 "The backend on $apiUrl"

Step 'screenshot account'
Push-Location $rootDir
try { & node scripts/local-db.mjs screenshot-reset } finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { Fail 'resetting the screenshot account failed.' }
$token = (Get-Content (Join-Path $rootDir '.screenshot-token') -Raw).Trim()
if (-not (Invoke-Http "$apiUrl/api/transactions?page=1&size=1" @{ Authorization = "Bearer $token" })) {
  Fail "the backend on $apiUrl rejected the screenshot token. Make sure it uses the local database at 127.0.0.1:5434."
}

# Metro
Step 'metro'
$metroRoot = Get-MetroRoot
if ($metroRoot) {
  if ((Normalize-Path $metroRoot) -ne (Normalize-Path $mobileDir)) {
    Fail "Metro on port $metroPort serves $metroRoot, not $mobileDir. Stop it, or run this command from that checkout."
  }
  "metro: reusing $mobileDir"
} elseif (Test-Port $metroPort) {
  Fail "port $metroPort is in use, but not by Metro."
} else {
  Start-Detached metro
  Wait-Until { Get-MetroRoot } 120 'Metro'
  "metro: started for $mobileDir (log: $logDir\metro.log)"
}

# Build the bundle once before opening the app. A cold build can take longer than the dev client
# waits, which shows a compile error on the phone.
Step 'bundle'
try {
  Invoke-WebRequest -UseBasicParsing -TimeoutSec 600 "http://127.0.0.1:$metroPort/index.bundle?platform=android&dev=true&minify=false" | Out-Null
} catch { Fail "Metro could not build the bundle: $($_.Exception.Message). See $logDir\metro.log." }

# App
Step 'app'
foreach ($port in 3000, $metroPort) {
  Invoke-Native $adb -s $Device reverse "tcp:$port" "tcp:$port" | Out-Null
  if ($LASTEXITCODE -ne 0) { Fail "adb reverse tcp:$port failed." }
}
Invoke-Native $adb -s $Device shell am force-stop $devPackage | Out-Null
Invoke-Native $adb -s $Device shell am start -a android.intent.action.VIEW -d $devClientUrl $devPackage | Out-Null
if ($LASTEXITCODE -ne 0) { Fail 'could not open TrackCrow Dev on Metro.' }

# Capture
Step 'maestro'
$output = Join-Path $artifacts 'screenshots\android'
$run = Join-Path $artifacts 'maestro-run'
Remove-Item -Recurse -Force $run -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $output | Out-Null
Get-ChildItem $output -Filter *.png | Remove-Item
& maestro --device $Device test `
  --test-output-dir $run --debug-output $run `
  -e "API_URL=$apiUrl" -e "SCREENSHOT_TOKEN=$token" `
  (Join-Path $mobileDir '.maestro\screenshots\capture.yaml')
if ($LASTEXITCODE -ne 0) {
  Fail "Maestro failed. The failing step's screenshot and hierarchy are under $run."
}
Get-ChildItem $run -Recurse -Filter *.png | Where-Object { $_.Directory.Name -eq 'takeScreenshot' } |
  ForEach-Object { Copy-Item $_.FullName (Join-Path $output $_.Name) }
$missing = $expected | Where-Object { -not (Test-Path (Join-Path $output "$_.png")) }
if ($missing) { Fail "missing screenshots: $($missing -join ', '). Maestro output: $run" }
# The run folder holds logs that can include the local token.
Remove-Item -Recurse -Force $run

Step 'done'
"$($expected.Count) screenshots in $output"
