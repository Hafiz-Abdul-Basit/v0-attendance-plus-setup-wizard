# =====================================================================
# Set-MongoReplicaSet.ps1
#
# Configure MongoDB replica set idempotently. Companion to
# Invoke-SetupAgent.ps1 — also runnable standalone.
# =====================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]$Config,
    [string]$LogPath = "C:\Raawee\Logs\setup-agent-mongo.log"
)

$ErrorActionPreference = 'Stop'
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

Write-SetupLog "Starting MongoDB replica set configuration."

# Ensure data & log dirs exist
if (-not (Test-Path $Config.dbPath)) {
    New-Item -Path $Config.dbPath -ItemType Directory -Force | Out-Null
    Write-SetupLog "Created MongoDB data directory: $($Config.dbPath)"
}
$logDir = Split-Path -Parent $Config.logPath
if ($logDir -and -not (Test-Path $logDir)) {
    New-Item -Path $logDir -ItemType Directory -Force | Out-Null
}

# Service must exist
$svc = Get-Service -Name $Config.serviceName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-SetupLog "MongoDB service '$($Config.serviceName)' not found." "ERROR"
    throw "Service not installed."
}

# Idempotent config edit: inject replication.replSetName if missing
if (Test-Path $Config.configFilePath) {
    $content = Get-Content $Config.configFilePath -Raw
    $expected = "  replication:`n    replSetName: `"$($Config.replicaSetName)`""
    if ($content -notmatch "(?ms)^\s*replication:\s*\r?\n\s*replSetName:\s*[`"']?$($Config.replicaSetName)[`"']?") {
        if ($content -match "(?ms)^\s*replication:\s*\r?\n\s*replSetName:.*?(?=\r?\n\S|$)") {
            $content = $content -replace "(?ms)^\s*replication:\s*\r?\n\s*replSetName:.*?(?=\r?\n\S|$)", $expected
        } else {
            $content += "`n`nreplication:`n  replSetName: `"$($Config.replicaSetName)`"`n"
        }
        Set-Content $Config.configFilePath $content -Encoding UTF8
        Write-SetupLog "Wrote replication.replSetName to $($Config.configFilePath)"
    } else {
        Write-SetupLog "replSetName already configured. Skipping edit."
    }
} else {
    Write-SetupLog "MongoDB config file not found: $($Config.configFilePath)" "WARN"
}

# Restart service to pick up the config
if ($svc.Status -ne 'Stopped') {
    Stop-Service -Name $Config.serviceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
}
Start-Service -Name $Config.serviceName
Start-Sleep -Seconds 5

# Verify replica set state
$mongosh = Get-Command mongosh.exe -ErrorAction SilentlyContinue
if (-not $mongosh) {
    Write-SetupLog "mongosh not on PATH." "ERROR"
    throw "mongosh not found."
}

$probe = & $mongosh.Source --quiet --eval "try { JSON.stringify(rs.status()); } catch (e) { print('NOT_INITIALIZED'); }"
if ($probe -match 'NOT_INITIALIZED' -or $probe -match '"ok"\s*:\s*0') {
    Write-SetupLog "Replica set not initialized — running rs.initiate()."
    & $mongosh.Source --quiet --eval "rs.initiate({ _id: '$($Config.replicaSetName)', members: [ { _id: 0, host: 'localhost:$($Config.port)' } ] })"
    Start-Sleep -Seconds 5
} else {
    Write-SetupLog "Replica set already initialized — skipping."
}

Write-SetupLog "Final replica set status:"
& $mongosh.Source --quiet --eval "JSON.stringify(rs.status(), null, 2)"
Write-SetupLog "MongoDB replica set configuration complete."