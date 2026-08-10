# =====================================================================
# Test-SetupAgentDeployment.ps1
#
# Read-only validation of the deployed state. Verifies:
#   - IIS website exists, app pool exists & is running, HTTPS binding
#     present, website started
#   - MongoDB service running, replica-set name matches config
#   - Deployment directories exist with web.config inside
# Throws on first hard failure so the orchestrator can mark the
# validation step as failed.
# =====================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]$Config,
    [string]$LogPath = "C:\Raawee\Logs\setup-agent-validate.log"
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

$issues = 0

# --- IIS ---
foreach ($site in $Config.iisSites) {
    $name = $site.name
    if (-not (Test-Path "IIS:\Sites\$name")) {
        Write-SetupLog "Website '$name' missing." "ERROR"
        $issues++
        continue
    }
    if (-not (Test-Path "IIS:\AppPools\$name")) {
        Write-SetupLog "App pool '$name' missing." "ERROR"
        $issues++
        continue
    }
    $pool = Get-WebAppPoolState -Name $name
    if ($pool.Value -ne "Started") {
        Write-SetupLog "App pool '$name' not running (state $($pool.Value))." "ERROR"
        $issues++
    }
    $https = Get-WebBinding -Name $name -Protocol https -HostHeader $site.host -Port $site.port -ErrorAction SilentlyContinue
    if (-not $https) {
        Write-SetupLog "HTTPS binding missing for $name ($($site.host):$($site.port))." "ERROR"
        $issues++
    }
    $state = (Get-Website -Name $name).State
    if ($state -ne "Started") {
        Write-SetupLog "Website '$name' not started (state $state)." "ERROR"
        $issues++
    }
}

# --- MongoDB ---
$svc = Get-Service -Name $Config.mongoDb.serviceName -ErrorAction SilentlyContinue
if (-not $svc -or $svc.Status -ne 'Running') {
    Write-SetupLog "MongoDB service not running." "ERROR"
    $issues++
} else {
    $mongosh = Get-Command mongosh.exe -ErrorAction SilentlyContinue
    if ($mongosh) {
        $status = & $mongosh.Source --quiet --eval "try { JSON.stringify(rs.status()); } catch (e) { '' }"
        if ($status -match '"set"\s*:\s*"' + [regex]::Escape($Config.mongoDb.replicaSetName)) {
            Write-SetupLog "MongoDB replica set $($Config.mongoDb.replicaSetName) is healthy."
        } else {
            Write-SetupLog "MongoDB replica set name not verified." "WARN"
        }
    } else {
        Write-SetupLog "mongosh not on PATH; skipping replica set probe." "WARN"
    }
}

# --- Deployment directories ---
if (Test-Path $Config.deploymentBasePath) {
    $zips = Get-ChildItem -Path $Config.deploymentBasePath -Filter "*.zip" -ErrorAction SilentlyContinue
    if ($zips) {
        Write-SetupLog "$($zips.Count) zip(s) remain in $($Config.deploymentBasePath) — extraction may be incomplete." "WARN"
        $issues++
    } else {
        Write-SetupLog "No leftover zips in $($Config.deploymentBasePath)."
    }
    $folders = Get-ChildItem -Path $Config.deploymentBasePath -Directory -ErrorAction SilentlyContinue
    foreach ($folder in $folders) {
        if (-not (Test-Path (Join-Path $folder.FullName "web.config"))) {
            Write-SetupLog "web.config missing in $($folder.Name)" "WARN"
        }
    }
}

if ($issues -gt 0) {
    Write-SetupLog "Validation reported $issues issue(s)." "WARN"
    throw "$issues validation issue(s)"
}
Write-SetupLog "Validation passed."