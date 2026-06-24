Import-Module WebAdministration

# --- SSL Certificate Friendly Name ---
$certFriendlyName = "*.raaweek12_01-2026"

# --- Find Certificate ---
$cert = Get-ChildItem Cert:\LocalMachine\My |
    Where-Object { $_.FriendlyName -eq $certFriendlyName }

if (-not $cert) {
    Write-Host "Certificate not found: $certFriendlyName" -ForegroundColor Red
    exit 1
}

$thumbprint = $cert.Thumbprint -replace " ", ""
Write-Host "Certificate found: $thumbprint"
Write-Host ""

# --- Base Path ---
$basePath = "C:\myNGApp\Deployments\Backend"

# --- Hosts ---
$commonHost = "attplusgv.raaweek12.com"
$gatewayHost = "gatewaygv.raaweek12.com"

# --- Sites ---
$sites = @(
    @{ Name="Rk12.AttPlus.Intervention.API"; Port=7189; Path="$basePath\Rk12.AttPlus.Intervention.API"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.Analysis.API"; Port=7296; Path="$basePath\Rk12.AttPlus.Analysis.API"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.Administration.API"; Port=7239; Path="$basePath\Rk12.AttPlus.Administration.API"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.CourtManagement.API"; Port=7007; Path="$basePath\Rk12.AttPlus.CourtManagement.API"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.Identity.API"; Port=7206; Path="$basePath\Rk12.AttPlus.Identity.API"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.SentLetter.API"; Port=7101; Path="$basePath\RK12.AttPlus.Intervention.SendLetter.QConsumer"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.LetterDispatch.API"; Port=7119; Path="$basePath\Rk12.AttPlus.LetterDispatch.API"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.MessageHub.API"; Port=7120; Path="$basePath\Rk12.AttPlus.MessageHub"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.Miscellaneous.API"; Port=7061; Path="$basePath\Rk12.AttPlus.Miscellaneous.API"; Host=$commonHost },
    @{ Name="Rk12.AttPlus.ApiGateway"; Port=443; Path="$basePath\Rk12.AttPlus.ApiGateway"; Host=$gatewayHost }
)

foreach ($s in $sites) {

    $siteName = $s.Name
    $appPool = $siteName
    $physicalPath = $s.Path
    $port = $s.Port
    $siteHost = $s.Host

    Write-Host "Configuring $siteName ($($siteHost):$port)..."

    # --- Create folder if missing ---
    if (-not (Test-Path $physicalPath)) {
        Write-Host "Creating folder: $physicalPath"
        New-Item -ItemType Directory -Path $physicalPath -Force | Out-Null
    }

    # --- App Pool ---
    if (-not (Test-Path "IIS:\AppPools\$appPool")) {
        New-WebAppPool -Name $appPool | Out-Null
    }

    Set-ItemProperty "IIS:\AppPools\$appPool" -Name processModel.identityType -Value "LocalSystem"
    Set-ItemProperty "IIS:\AppPools\$appPool" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$appPool" -Name startMode -Value "AlwaysRunning"

    # --- Create Website if missing ---
    if (-not (Get-Website -Name $siteName -ErrorAction SilentlyContinue)) {
        New-Website -Name $siteName `
            -Port 99999 `
            -PhysicalPath $physicalPath `
            -ApplicationPool $appPool | Out-Null

        Remove-WebBinding -Name $siteName -Protocol http -Port 99999 -ErrorAction SilentlyContinue
    }

    # --- HTTPS Binding ---
    # Clean up existing binding
    Remove-WebBinding -Name $siteName -Protocol https -Port $port -HostHeader $siteHost -ErrorAction SilentlyContinue

    # Create the binding with SNI Explicitly Disabled (-SslFlags 0)
    New-WebBinding -Name $siteName `
        -Protocol https `
        -Port $port `
        -HostHeader $siteHost `
        -SslFlags 0 | Out-Null

    # --- SSL Certificate Assignment (Non-SNI Method) ---
    # Without SNI, we attach the certificate to the IP and Port registry directly
    $sslPath = "IIS:\SslBindings\0.0.0.0!$port"
    
    # Clean out old HTTP.sys registration safely
    if (Test-Path $sslPath) {
        Remove-Item $sslPath -Force -ErrorAction SilentlyContinue
    }
    
    # Register the cert globally to this port
    New-Item $sslPath -Thumbprint $thumbprint -SSLFlags 0 -ErrorAction SilentlyContinue | Out-Null

    # --- Settle down pause ---
    Start-Sleep -Seconds 2

    # --- Start Site Safely ---
    $site = Get-Website -Name $siteName -ErrorAction SilentlyContinue

    if ($site) {
        try {
            Start-Website -Name $siteName -ErrorAction Stop
            Write-Host "Successfully started $siteName" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to start $siteName. Error details: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

Write-Host "Deployment script execution completed"
