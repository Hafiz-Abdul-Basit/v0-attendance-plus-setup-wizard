# PowerShell script for IIS configuration
# AttendancePlus IIS Setup Script

Write-Host "Starting IIS Configuration for AttendancePlus..." -ForegroundColor Green

# Enable IIS features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument

# Install ASP.NET Core Hosting Bundle
Write-Host "Please download and install ASP.NET Core Hosting Bundle from Microsoft" -ForegroundColor Yellow

# Create application pool
New-WebAppPool -Name "AttendancePlusPool" -Force
Set-ItemProperty -Path "IIS:\AppPools\AttendancePlusPool" -Name "processModel.identityType" -Value "ApplicationPoolIdentity"
Set-ItemProperty -Path "IIS:\AppPools\AttendancePlusPool" -Name "managedRuntimeVersion" -Value ""

# Create websites
New-Website -Name "AttendancePlus-Frontend" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\AttendancePlus\Frontend" -ApplicationPool "AttendancePlusPool"
New-Website -Name "AttendancePlus-Backend" -Port 5000 -PhysicalPath "C:\inetpub\wwwroot\AttendancePlus\Backend" -ApplicationPool "AttendancePlusPool"

Write-Host "IIS Configuration completed!" -ForegroundColor Green
