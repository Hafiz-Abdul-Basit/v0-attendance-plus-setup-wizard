# Import IIS module
Import-Module WebAdministration

# List all websites
Get-Website

# List all application pools
Get-IISAppPool

# Restart application pool
Restart-WebAppPool -Name "YourAppPoolName"

# Reset IIS
iisreset /restart

# Check website status
Get-Website -Name "YourWebsiteName" | Select-Object Name, State, PhysicalPath
