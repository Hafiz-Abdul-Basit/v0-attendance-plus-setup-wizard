# =====================================================================
# Expand-BackendPackage.ps1
#
# For every *.zip in $DeploymentPath:
#   - Extract to a sibling folder named after the zip (BaseName)
#   - Overwrite existing extraction if necessary
#   - Delete the zip after successful extraction
#   - Find web.config and rewrite:
#       stdoutLogEnabled="false" -> stdoutLogEnabled="true"
#       hostingModel="inprocess" -> hostingModel="OutOfProcess"
#   - Leave other settings alone
# Idempotent: zips already removed are simply absent and the loop
# becomes a no-op.
# =====================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$DeploymentPath,
    [string]$LogPath = "C:\Raawee\Logs\setup-agent-extract.log"
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

New-Item -Path (Split-Path -Parent $LogPath) -ItemType Directory -Force | Out-Null

function Write-SetupLog {
    param([string]$Message, [string]$Level = "INFO")
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    Add-Content -Path $LogPath -Value $line
    if ($Level -eq "ERROR") { Write-Host $line -ForegroundColor Red }
    elseif ($Level -eq "WARN") { Write-Host $line -ForegroundColor Yellow }
    else { Write-Host $line -ForegroundColor Cyan }
}

if (-not (Test-Path $DeploymentPath)) {
    Write-SetupLog "Deployment path not found: $DeploymentPath" "ERROR"
    exit 1
}

Write-SetupLog "Extracting backend packages from: $DeploymentPath"
Get-ChildItem -Path $DeploymentPath -Filter "*.zip" | ForEach-Object {
    $destFolder = Join-Path $DeploymentPath $_.BaseName
    try {
        Write-SetupLog "Extracting: $($_.Name) -> $($_.BaseName)\"
        Expand-Archive -Path $_.FullName -DestinationPath $destFolder -Force
        Write-SetupLog "Extracted: $($_.BaseName)"

        Remove-Item -Path $_.FullName -Force
        Write-SetupLog "Deleted zip: $($_.Name)"

        $webConfig = Join-Path $destFolder "web.config"
        if (Test-Path $webConfig) {
            $content = Get-Content $webConfig -Raw
            $original = $content
            if ($content -match 'stdoutLogEnabled="false"') {
                $content = $content -replace 'stdoutLogEnabled="false"', 'stdoutLogEnabled="true"'
            }
            if ($content -match 'hostingModel="inprocess"') {
                $content = $content -replace 'hostingModel="inprocess"', 'hostingModel="OutOfProcess"'
            }
            if ($content -ne $original) {
                Set-Content $webConfig $content -Encoding UTF8
                Write-SetupLog "web.config updated: $($_.BaseName)"
            } else {
                Write-SetupLog "web.config already correct: $($_.BaseName)"
            }
        } else {
            Write-SetupLog "web.config NOT FOUND in: $($_.BaseName)" "WARN"
        }
    } catch {
        Write-SetupLog "Failed to process $($_.Name): $($_.Exception.Message)" "ERROR"
    }
}

Write-SetupLog "All done! ZIPs extracted, deleted, and web.configs updated."