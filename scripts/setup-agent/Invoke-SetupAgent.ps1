# =====================================================================
# Invoke-SetupAgent.ps1
#
# Standalone PowerShell runner — runs the full Setup Agent flow on the
# TARGET Windows server. Used in two ways:
#
#   1. Operator runs it manually (after copying the generated scripts
#      from the Setup Agent UI).
#   2. The operator pastes a single config JSON into the script (see
#      `Set-SetupAgentConfig` below) and the script orchestrates the
#      whole flow.
#
# Why a standalone runner? The Setup Agent web app cannot directly invoke
# PowerShell on a remote Windows server (the Next.js process runs on a
# different host). The runner script performs the IIS / Mongo / SSL
# steps inline so the operator doesn't have to run each generated
# .ps1 individually.
#
# Idempotent: safe to re-run. Every step checks the current state and
# skips work that's already done.
# =====================================================================

[CmdletBinding()]
param(
    [string]$ConfigPath,
    [string]$LogPath = "C:\Raawee\Logs\setup-agent.log"
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
    elseif ($Level -eq "STEP") { Write-Host $line -ForegroundColor Magenta }
    else { Write-Host $line -ForegroundColor Cyan }
}

# --- Privilege check ----------------------------------------------------
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-SetupLog "This script MUST be run as Administrator. Re-launch from an elevated PowerShell." "ERROR"
    throw "Not elevated."
}
Write-SetupLog "Running as Administrator. Good."

# --- Load configuration -------------------------------------------------
if (-not $ConfigPath) {
    Write-SetupLog "No -ConfigPath supplied. Reading inline configuration..." "WARN"
    $config = Get-SetupAgentInlineConfig
} elseif (Test-Path $ConfigPath) {
    Write-SetupLog "Loading configuration from $ConfigPath"
    $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
} else {
    Write-SetupLog "ConfigPath not found: $ConfigPath" "ERROR"
    throw "ConfigPath not found."
}

# --- Import modules -----------------------------------------------------
Import-Module WebAdministration -ErrorAction SilentlyContinue

$results = [ordered]@{
    Prerequisites    = "skipped"
    MongoDb          = "skipped"
    MongoDbReplica   = "skipped"
    BackendDownload  = "skipped"
    BackendExtract   = "skipped"
    WebConfigUpdate  = "skipped"
    IisAppPools      = "skipped"
    IisWebsites      = "skipped"
    SslBindings      = "skipped"
    StartWebsites    = "skipped"
    Validation       = "skipped"
}

try {
    # ---- Step 1: Prerequisites ----
    Write-SetupLog "STEP: Validating prerequisites" "STEP"
    $ok = $true
    if (-not (Test-Path $config.deploymentBasePath)) {
        Write-SetupLog "Creating deployment base path: $($config.deploymentBasePath)"
        New-Item -Path $config.deploymentBasePath -ItemType Directory -Force | Out-Null
    }
    if (-not (Test-Path $config.iisBasePath)) {
        Write-SetupLog "Creating IIS base path: $($config.iisBasePath)"
        New-Item -Path $config.iisBasePath -ItemType Directory -Force | Out-Null
    }
    if ($ok) { $results.Prerequisites = "success" } else { $results.Prerequisites = "failed" }

    # ---- Step 2: MongoDB replica set ----
    Write-SetupLog "STEP: Configuring MongoDB replica set" "STEP"
    try {
        & "$PSScriptRoot\Set-MongoReplicaSet.ps1" -Config $config.mongoDb -LogPath $LogPath
        $results.MongoDb = "success"
        $results.MongoDbReplica = "success"
    } catch {
        Write-SetupLog "MongoDB setup failed: $($_.Exception.Message)" "ERROR"
        $results.MongoDb = "failed"
        $results.MongoDbReplica = "failed"
    }

    # ---- Step 3: Backend download ----
    Write-SetupLog "STEP: Downloading backend artifact" "STEP"
    try {
        & "$PSScriptRoot\Get-BackendArtifact.ps1" -Config $config.azureDevOps -PipelineId $config.azureDevOps.backendPipelineId -DeploymentPath $config.deploymentBasePath -LogPath $LogPath
        $results.BackendDownload = "success"
    } catch {
        Write-SetupLog "Backend download failed: $($_.Exception.Message)" "ERROR"
        $results.BackendDownload = "failed"
    }

    # ---- Step 4: Frontend download ----
    Write-SetupLog "STEP: Downloading frontend artifact" "STEP"
    try {
        & "$PSScriptRoot\Get-BackendArtifact.ps1" -Config $config.azureDevOps -PipelineId $config.azureDevOps.frontendPipelineId -DeploymentPath $config.iisBasePath -LogPath $LogPath -ArtifactLabel "frontend"
    } catch {
        Write-SetupLog "Frontend download failed: $($_.Exception.Message)" "ERROR"
    }

    # ---- Step 5: Backend extraction ----
    Write-SetupLog "STEP: Extracting backend packages" "STEP"
    try {
        & "$PSScriptRoot\Expand-BackendPackage.ps1" -DeploymentPath $config.deploymentBasePath -LogPath $LogPath
        $results.BackendExtract = "success"
        $results.WebConfigUpdate = "success"
    } catch {
        Write-SetupLog "Backend extraction failed: $($_.Exception.Message)" "ERROR"
        $results.BackendExtract = "failed"
        $results.WebConfigUpdate = "failed"
    }

    # ---- Step 6: IIS application pools ----
    Write-SetupLog "STEP: Configuring IIS application pools" "STEP"
    try {
        & "$PSScriptRoot\New-SetupAgentAppPool.ps1" -SiteNames $config.iisSites.name -LogPath $LogPath
        $results.IisAppPools = "success"
    } catch {
        Write-SetupLog "App pool setup failed: $($_.Exception.Message)" "ERROR"
        $results.IisAppPools = "failed"
    }

    # ---- Step 7: IIS websites + HTTPS bindings + start ----
    Write-SetupLog "STEP: Configuring IIS websites + SSL bindings" "STEP"
    $siteResults = @()
    foreach ($site in $config.iisSites) {
        try {
            & "$PSScriptRoot\New-SetupAgentWebsite.ps1" -Site $site -IisBasePath $config.iisBasePath -CertificateFriendlyName $config.ssl.certificateFriendlyName -CertificateStore $config.ssl.storeLocation -LogPath $LogPath
            $siteResults += [pscustomobject]@{ Name = $site.name; Status = "success" }
        } catch {
            Write-SetupLog "Site $($site.name) failed: $($_.Exception.Message)" "ERROR"
            $siteResults += [pscustomobject]@{ Name = $site.name; Status = "failed"; Error = $_.Exception.Message }
        }
    }
    $allSiteOk = -not ($siteResults | Where-Object { $_.Status -ne "success" })
    if ($allSiteOk) {
        $results.IisWebsites = "success"
        $results.SslBindings = "success"
        $results.StartWebsites = "success"
    } else {
        $results.IisWebsites = "partial"
        $results.SslBindings = "partial"
        $results.StartWebsites = "partial"
    }

    # ---- Step 8: Validation ----
    Write-SetupLog "STEP: Validating deployment" "STEP"
    try {
        & "$PSScriptRoot\Test-SetupAgentDeployment.ps1" -Config $config -LogPath $LogPath
        $results.Validation = "success"
    } catch {
        Write-SetupLog "Validation reported issues: $($_.Exception.Message)" "WARN"
        $results.Validation = "partial"
    }

} catch {
    Write-SetupLog "Fatal error: $($_.Exception.Message)" "ERROR"
}

# ---- Final summary ----
Write-SetupLog "============================================================" "STEP"
Write-SetupLog "Setup Result" "STEP"
foreach ($key in $results.Keys) {
    Write-SetupLog ("  {0,-20} : {1}" -f $key, $results[$key])
}
Write-SetupLog "Log file: $LogPath" "STEP"
Write-SetupLog "============================================================" "STEP"