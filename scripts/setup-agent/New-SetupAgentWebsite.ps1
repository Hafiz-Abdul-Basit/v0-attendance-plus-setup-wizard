# =====================================================================
# New-SetupAgentWebsite.ps1
#
# Create / update one IIS website: physical path, app pool, HTTPS
# binding with SSL cert bound. Idempotent.
# =====================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]$Site,
    [Parameter(Mandatory=$true)][string]$IisBasePath,
    [Parameter(Mandatory=$true)][string]$CertificateFriendlyName,
    [string]$CertificateStore = "Cert:\LocalMachine\My",
    [string]$LogPath = "C:\Raawee\Logs\setup-agent-website.log"
)

$ErrorActionPreference = 'Stop'
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

$siteName = $Site.name
$siteHost = $Site.host
$sitePort = $Site.port

# Resolve physical path
if ($Site.physicalPath) {
    $physicalPath = $Site.physicalPath
} elseif ($Site.physicalSubPath) {
    $physicalPath = Join-Path $IisBasePath $Site.physicalSubPath
} else {
    throw "Site $siteName has neither physicalPath nor physicalSubPath."
}

if (-not (Test-Path $physicalPath)) {
    Write-SetupLog "Physical path missing — creating: $physicalPath" "WARN"
    New-Item -Path $physicalPath -ItemType Directory -Force | Out-Null
}

# Website
if (Test-Path "IIS:\Sites\$siteName") {
    Write-SetupLog "Website '$siteName' already exists."
} else {
    New-Website -Name $siteName -PhysicalPath $physicalPath -ApplicationPool $siteName | Out-Null
    Write-SetupLog "Created website '$siteName'."
}
Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name applicationPool -Value $siteName
Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name physicalPath -Value $physicalPath

# Remove any default http binding on the same port so we don't conflict.
Get-WebBinding -Name $siteName -Protocol http -HostHeader $siteHost -Port $sitePort -ErrorAction SilentlyContinue |
    ForEach-Object {
        Remove-WebBinding -BindingInformation $_.bindingInformation
        Write-SetupLog "Removed default http binding from $siteName" "WARN"
    }

# HTTPS binding
$existingHttps = Get-WebBinding -Name $siteName -Protocol https -HostHeader $siteHost -Port $sitePort -ErrorAction SilentlyContinue
if ($existingHttps) {
    Write-SetupLog "Removing existing HTTPS binding for $siteName ($siteHost`:$sitePort)."
    Remove-WebBinding -BindingInformation $existingHttps.bindingInformation
}

# Resolve certificate thumbprint
$thumb = (Get-ChildItem $CertificateStore | Where-Object { $_.FriendlyName -eq $CertificateFriendlyName } | Select-Object -First 1).Thumbprint
if (-not $thumb) {
    Write-SetupLog "Certificate '$CertificateFriendlyName' not found in $CertificateStore" "ERROR"
    throw "Certificate not found."
}
$thumb = $thumb -replace "\s", ""

New-WebBinding -Name $siteName -Protocol https -HostHeader $siteHost -Port $sitePort -SslFlags 0 | Out-Null
$binding = Get-WebBinding -Name $siteName -Protocol https -HostHeader $siteHost -Port $sitePort
$parts = $binding.bindingInformation -split ":"
$ipAddress = $parts[0]
$portStr = $parts[1]
& netsh http add sslcert ipport="${ipAddress}:${portStr}" certhash=$thumb appid="{$([Guid]::NewGuid().ToString())}" certstorename=MY | Out-Null
Write-SetupLog "HTTPS binding configured for $siteName ($siteHost`:$sitePort, thumb $thumb)."

try {
    Start-WebSite -Name $siteName -ErrorAction Stop
    Write-SetupLog "Started website '$siteName'."
} catch {
    Write-SetupLog "Failed to start website '$siteName': $($_.Exception.Message)" "ERROR"
    throw
}