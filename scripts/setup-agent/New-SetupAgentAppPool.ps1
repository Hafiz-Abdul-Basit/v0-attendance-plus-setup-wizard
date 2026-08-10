# =====================================================================
# New-SetupAgentAppPool.ps1
#
# Create / update the IIS application pools used by the configured
# sites. Each app pool is named to match the IIS site name. Settings:
#   - identityType: LocalSystem
#   - managedRuntimeVersion: ""
#   - startMode: AlwaysRunning
# Idempotent.
# =====================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string[]]$SiteNames,
    [string]$LogPath = "C:\Raawee\Logs\setup-agent-apppool.log"
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
Import-Module WebAdministration

New-Item -Path (Split-Path -Parent $LogPath) -ItemType Directory -Force | Out-Null

function Write-SetupLog {
    param([string]$Message, [string]$Level = "INFO")
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    Add-Content -Path $LogPath -Value $line
    if ($Level -eq "ERROR") { Write-Host $line -ForegroundColor Red }
    elseif ($Level -eq "WARN") { Write-Host $line -ForegroundColor Yellow }
    else { Write-Host $line -ForegroundColor Cyan }
}

foreach ($name in $SiteNames) {
    try {
        if (Test-Path "IIS:\AppPools\$name") {
            Write-SetupLog "App pool '$name' already exists."
        } else {
            New-WebAppPool -Name $name | Out-Null
            Write-SetupLog "Created app pool '$name'."
        }
        Set-ItemProperty -Path "IIS:\AppPools\$name" -Name managedRuntimeVersion -Value ""
        Set-ItemProperty -Path "IIS:\AppPools\$name" -Name startMode -Value "AlwaysRunning"
        Set-ItemProperty -Path "IIS:\AppPools\$name" -Name processModel.identityType -Value 0 # LocalSystem
    } catch {
        Write-SetupLog "Failed to configure app pool '$name': $($_.Exception.Message)" "ERROR"
    }
}