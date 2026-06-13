param(
  [Parameter(Mandatory = $true)]
  [string]$Email,

  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"

$exportScript = Join-Path $PSScriptRoot "export-rewrite-source.py"
$importScript = Join-Path $PSScriptRoot "import-rewrite-target.py"

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  python $exportScript --email $Email
  $latestExport = Get-ChildItem (Join-Path $PSScriptRoot "data") -Directory |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1

  if ($null -eq $latestExport) {
    throw "Export directory could not be resolved."
  }

  $resolvedOutputDir = $latestExport.FullName
} else {
  $resolvedOutputDir = [System.IO.Path]::GetFullPath($OutputDir)
  python $exportScript --email $Email --output-dir $resolvedOutputDir
}

python $importScript --input-dir $resolvedOutputDir

Write-Host "Migration completed from export directory: $resolvedOutputDir"
