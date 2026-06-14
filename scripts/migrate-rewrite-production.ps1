param(
  [string]$SshHost = "raspi",
  [switch]$ResetTarget,
  [switch]$UpdateEnvLocal,
  [string]$OutputDir = "",
  [string]$Email = ""
)

$ErrorActionPreference = "Stop"

$setupScript = Join-Path $PSScriptRoot "setup-raspi-rewrite-db.ps1"
$exportScript = Join-Path $PSScriptRoot "export-rewrite-source.py"
$importScript = Join-Path $PSScriptRoot "import-rewrite-target.py"
$setEnvScript = Join-Path $PSScriptRoot "set-rewrite-db-env.py"
$originalDatabaseUrl = $env:DATABASE_URL

$databaseUrl = if ($ResetTarget) {
  & $setupScript -SshHost $SshHost -ForceRecreate
} else {
  & $setupScript -SshHost $SshHost
}

$databaseUrl = $databaseUrl.Trim()
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  throw "Failed to resolve rewrite database URL."
}

if ($UpdateEnvLocal) {
  python $setEnvScript --database-url $databaseUrl
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to update .env.local"
  }
}

$env:DATABASE_URL = $databaseUrl
pnpm exec prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  throw "Prisma migrate deploy failed for rewrite target."
}
$env:DATABASE_URL = $originalDatabaseUrl
$env:REWRITE_DATABASE_URL = $databaseUrl

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $scope = if ([string]::IsNullOrWhiteSpace($Email)) { "full-export" } else { $Email.ToLower() -replace "[^a-z0-9]+", "-" }
  $resolvedOutputDir = Join-Path (Join-Path $PSScriptRoot "data") "$scope-$timestamp"
} else {
  $resolvedOutputDir = [System.IO.Path]::GetFullPath($OutputDir)
}

$exportArgs = @($exportScript, "--output-dir", $resolvedOutputDir)
if (-not [string]::IsNullOrWhiteSpace($Email)) {
  $exportArgs += @("--email", $Email)
}
python @exportArgs
if ($LASTEXITCODE -ne 0) {
  throw "Legacy export failed."
}

python $importScript --input-dir $resolvedOutputDir --target-url-env REWRITE_DATABASE_URL
if ($LASTEXITCODE -ne 0) {
  throw "Rewrite import failed."
}

Write-Host "Dry-run completed."
Write-Host "Rewrite target: $databaseUrl"
Write-Host "Export directory: $resolvedOutputDir"
Write-Host "Verification report: $(Join-Path $resolvedOutputDir 'verification.json')"
