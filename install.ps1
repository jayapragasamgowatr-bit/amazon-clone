param(
  [string]$ProjectPath = "D:\Waventravetric"
)
$ErrorActionPreference = "Stop"
$sourceRoot = Join-Path $PSScriptRoot "files"
if (-not (Test-Path (Join-Path $ProjectPath "server\controllers\riskController.js"))) {
  throw "Could not find the Waventravetric project at '$ProjectPath'. Pass -ProjectPath with the correct folder."
}
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$targets = @(
  "server\controllers\riskController.js",
  "server\controllers\automationController.js",
  "server\tests\riskSignals.test.js",
  "client\pages\admin\risk.js",
  "client\pages\admin\automation.js"
)
foreach ($relative in $targets) {
  $source = Join-Path $sourceRoot $relative
  $destination = Join-Path $ProjectPath $relative
  if (-not (Test-Path $source)) { throw "Patch file missing: $source" }
  if (Test-Path $destination) {
    $backup = "$destination.phase18-backup-$stamp"
    Copy-Item -LiteralPath $destination -Destination $backup
    Write-Host "Backup: $backup"
  }
  Copy-Item -LiteralPath $source -Destination $destination -Force
  Write-Host "Updated: $relative"
}
Write-Host "`nPatch files copied. No secrets, environment files, or unrelated files were changed."
Write-Host "Next: run backend tests and frontend production build before committing or deploying."
