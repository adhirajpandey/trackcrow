param(
  [Parameter(Mandatory = $true)]
  [string]$ConfirmProductionReset,

  [string]$OutputDir = "",
  [string]$ReferenceVerification = "",
  [switch]$SkipReferenceVerification
)

$ErrorActionPreference = "Stop"

$requiredConfirmation = "RESET PRODUCTION PUBLIC SCHEMA"
if ($ConfirmProductionReset -ne $requiredConfirmation) {
  throw "ConfirmProductionReset must be exactly: $requiredConfirmation"
}

$exportScript = Join-Path $PSScriptRoot "export-rewrite-source.py"
$resetScript = Join-Path $PSScriptRoot "reset-production-public-schema.py"
$applyBaselineScript = Join-Path $PSScriptRoot "apply-rewrite-baseline.py"
$importScript = Join-Path $PSScriptRoot "import-rewrite-target.py"
$databaseUrl = (& python -c "import sys; sys.path.insert(0, r'$PSScriptRoot'); from rewrite_migration_lib import SOURCE_ENV_FILE, load_env, require_env; load_env(SOURCE_ENV_FILE); print(require_env('DATABASE_URL'))").Trim()
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  throw "Could not resolve production DATABASE_URL."
}
$env:DATABASE_URL = $databaseUrl

function Assert-LastExitCode {
  param([string]$Message)
  if ($LASTEXITCODE -ne 0) {
    throw $Message
  }
}

function Test-VerificationReport {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Verification report not found: $Path"
  }

  $report = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  foreach ($property in $report.countChecks.PSObject.Properties) {
    if (-not $property.Value.matches) {
      throw "Verification report has a failed count check: $($property.Name)"
    }
  }

  if (
    $report.timestampSample.transactionId -eq 4878 -and
    $report.timestampSample.renderedIst -ne "2026-06-12T22:20:34.186000+05:30"
  ) {
    throw "Verification report has an unexpected transaction 4878 timestamp."
  }
}

if (-not $SkipReferenceVerification) {
  if ([string]::IsNullOrWhiteSpace($ReferenceVerification)) {
    $latestExport = Get-ChildItem (Join-Path $PSScriptRoot "data") -Directory |
      Where-Object { Test-Path (Join-Path $_.FullName "verification.json") } |
      Sort-Object LastWriteTimeUtc -Descending |
      Select-Object -First 1

    if ($null -eq $latestExport) {
      throw "No prior verification.json found. Pass -ReferenceVerification or -SkipReferenceVerification."
    }

    $ReferenceVerification = Join-Path $latestExport.FullName "verification.json"
  }

  Test-VerificationReport -Path $ReferenceVerification
  Write-Host "Reference verification passed: $ReferenceVerification"
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $resolvedOutputDir = Join-Path (Join-Path $PSScriptRoot "data") "production-final-export-$timestamp"
} else {
  $resolvedOutputDir = [System.IO.Path]::GetFullPath($OutputDir)
}

Write-Host "Creating fresh production export: $resolvedOutputDir"
python $exportScript --output-dir $resolvedOutputDir
Assert-LastExitCode "Fresh production export failed."

$metadataPath = Join-Path $resolvedOutputDir "metadata.json"
if (-not (Test-Path -LiteralPath $metadataPath)) {
  throw "Fresh export did not produce metadata.json."
}

$metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
$preflightCounts = $metadata.preflight.counts
$exportCounts = $metadata.exported.counts
foreach ($property in $exportCounts.PSObject.Properties) {
  $preflightValue = $preflightCounts.PSObject.Properties[$property.Name].Value
  if ($preflightValue -ne $property.Value) {
    throw "Fresh export count mismatch for $($property.Name): preflight=$preflightValue export=$($property.Value)"
  }
}

Write-Host "Resetting production public schema."
python $resetScript --confirm $requiredConfirmation
Assert-LastExitCode "Production public schema reset failed."

$env:DATABASE_URL = $databaseUrl
Write-Host "Applying rewrite baseline SQL to production."
python $applyBaselineScript
Assert-LastExitCode "Production rewrite baseline apply failed."

Write-Host "Importing fresh production export into rewrite schema."
python $importScript --input-dir $resolvedOutputDir
Assert-LastExitCode "Production rewrite import failed."

$verificationPath = Join-Path $resolvedOutputDir "verification.json"
Test-VerificationReport -Path $verificationPath

Write-Host "Production rewrite migration completed."
Write-Host "Export directory: $resolvedOutputDir"
Write-Host "Verification report: $verificationPath"
Write-Host "Deploy the rewrite backend now, after reviewing the verification report."
