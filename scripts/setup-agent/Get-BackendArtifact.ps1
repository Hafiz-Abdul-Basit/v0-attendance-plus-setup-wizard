# =====================================================================
# Get-BackendArtifact.ps1
#
# Download the latest successful artifact from an Azure DevOps pipeline.
# Requires -Config.azureDevOps.personalAccessToken. The PAT is used to
# construct the Basic auth header; it is never logged.
# =====================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]$Config,
    [Parameter(Mandatory=$true)][int]$PipelineId,
    [Parameter(Mandatory=$true)][string]$DeploymentPath,
    [string]$LogPath = "C:\Raawee\Logs\setup-agent-download.log",
    [string]$ArtifactLabel = "backend"
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

New-Item -Path (Split-Path -Parent $LogPath) -ItemType Directory -Force | Out-Null
New-Item -Path $DeploymentPath -ItemType Directory -Force | Out-Null

function Write-SetupLog {
    param([string]$Message, [string]$Level = "INFO")
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    Add-Content -Path $LogPath -Value $line
    if ($Level -eq "ERROR") { Write-Host $line -ForegroundColor Red }
    elseif ($Level -eq "WARN") { Write-Host $line -ForegroundColor Yellow }
    else { Write-Host $line -ForegroundColor Cyan }
}

$pat = $Config.personalAccessToken
if (-not $pat) {
    Write-SetupLog "Azure DevOps PAT is missing." "ERROR"
    throw "PAT missing."
}
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{ Authorization = "Basic $auth"; Accept = "application/json" }

$base = "https://dev.azure.com/$($Config.organization)"
$project = [uri]::EscapeDataString($Config.project)

Write-SetupLog "Finding latest successful build for $ArtifactLabel pipeline $PipelineId."

$buildListUrl = "$base/$project/_apis/build/builds?definitions=$PipelineId&statusFilter=completed&resultFilter=succeeded&`$top=5&api-version=7.1"
try {
    $builds = Invoke-RestMethod -Uri $buildListUrl -Headers $headers -Method Get
} catch {
    Write-SetupLog "Failed to list builds: $($_.Exception.Message)" "ERROR"
    throw
}
if (-not $builds.value -or $builds.value.Count -eq 0) {
    Write-SetupLog "No successful builds found for pipeline $PipelineId." "WARN"
    return
}
$build = $builds.value[0]
Write-SetupLog "Latest build: #$($build.id) $($build.buildNumber)"

$artifactsUrl = "$base/$project/_apis/build/builds/$($build.id)/artifacts?api-version=7.1"
$artifacts = Invoke-RestMethod -Uri $artifactsUrl -Headers $headers -Method Get
if (-not $artifacts.value -or $artifacts.value.Count -eq 0) {
    Write-SetupLog "Build $($build.id) has no artifacts." "WARN"
    return
}
$artifact = $artifacts.value[0]
$dest = Join-Path $DeploymentPath "$($artifact.name)-$($build.buildNumber).zip"
Write-SetupLog "Downloading $($artifact.name) -> $dest"

Invoke-WebRequest -Uri $artifact.resource.downloadUrl -Headers @{ Authorization = $headers.Authorization } -OutFile $dest -UseBasicParsing
if (Test-Path $dest) {
    $size = (Get-Item $dest).Length
    Write-SetupLog "Downloaded $size bytes to $dest"
} else {
    Write-SetupLog "Download verification failed for $dest" "ERROR"
    throw "Download failed."
}