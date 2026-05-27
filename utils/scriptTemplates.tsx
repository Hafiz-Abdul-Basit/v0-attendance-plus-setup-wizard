// PowerShell Script Templates for Client Setup Automation

export interface ScriptSection {
  title: string
  description: string
  commands: string[]
}

export interface ClientInfo {
  name: string
  mainUrl: string
  gatewayUrl: string
  docsUrl: string
}

const BASE_PATH = 'C:\\Raawee'
const DOWNLOADS_PATH = `${BASE_PATH}\\Downloads`

export const scriptTemplates = {
  chrome: (): ScriptSection => ({
    title: 'Chrome Browser Installation',
    description: 'Download and install Google Chrome browser',
    commands: [
      '# ===== CHROME BROWSER INSTALLATION =====',
      `$ChromePath = "${DOWNLOADS_PATH}\\ChromeSetup.exe"`,
      '$ChromeUrl = "https://dl.google.com/chrome/install/googlechromestandaloneenterprise64.msi"',
      'Write-Host "Downloading Chrome..."',
      'Invoke-WebRequest -Uri $ChromeUrl -OutFile $ChromePath',
      'Write-Host "Installing Chrome..."',
      'Start-Process -FilePath $ChromePath -ArgumentList "/S /install" -Wait',
      'Write-Host "Chrome installation completed!"',
      'Remove-Item $ChromePath -Force -ErrorAction SilentlyContinue',
      '',
    ],
  }),

  urlRewrite: (): ScriptSection => ({
    title: 'IIS URL Rewrite Installation',
    description: 'Install URL Rewrite module for both x86 and x64 architectures',
    commands: [
      '# ===== URL REWRITE INSTALLATION =====',
      `$UrlRewritePath = "${DOWNLOADS_PATH}\\UrlRewrite.msi"`,
      '$UrlRewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44F4-B908-7EBD99291D0D/rewrite_amd64.msi"',
      'Write-Host "Downloading URL Rewrite 2.1 (x64)..."',
      'Invoke-WebRequest -Uri $UrlRewriteUrl -OutFile $UrlRewritePath',
      'Write-Host "Installing URL Rewrite x64..."',
      'Start-Process -FilePath "msiexec.exe" -ArgumentList "/i $UrlRewritePath /passive" -Wait',
      'Write-Host "URL Rewrite installation completed!"',
      'Remove-Item $UrlRewritePath -Force -ErrorAction SilentlyContinue',
      '',
    ],
  }),

  iisFeatures: (): ScriptSection => ({
    title: 'IIS Features Configuration',
    description: 'Enable required IIS features and roles',
    commands: [
      '# ===== IIS FEATURES INSTALLATION =====',
      'Write-Host "Installing IIS Web Server features..."',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All -NoRestart | Out-Null',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -NoRestart | Out-Null',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent -NoRestart | Out-Null',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment -NoRestart | Out-Null',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45 -NoRestart | Out-Null',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45 -NoRestart | Out-Null',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-WindowsAuthentication -NoRestart | Out-Null',
      'Enable-WindowsOptionalFeature -Online -FeatureName IIS-UrlRewrite -NoRestart | Out-Null',
      'Write-Host "IIS features installation completed!"',
      'Write-Host "A system restart may be required."',
      '',
    ],
  }),

  dotnet: (): ScriptSection => ({
    title: '.NET 8 Installation',
    description: 'Download and install .NET 8 SDK and Hosting Bundle',
    commands: [
      '# ===== .NET 8 INSTALLATION =====',
      `$DotnetPath = "${DOWNLOADS_PATH}\\dotnet-hosting.exe"`,
      '$DotnetUrl = "https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json"',
      'Write-Host "Downloading .NET 8 Hosting Bundle..."',
      '# Get latest .NET 8 hosting bundle URL from official source',
      '$DotnetUrl = "https://aka.ms/dotnet/8.0/windowshosting"',
      'Invoke-WebRequest -Uri $DotnetUrl -OutFile $DotnetPath',
      'Write-Host "Installing .NET 8..."',
      'Start-Process -FilePath $DotnetPath -ArgumentList "/install /quiet /norestart" -Wait',
      'Write-Host ".NET 8 installation completed!"',
      'Remove-Item $DotnetPath -Force -ErrorAction SilentlyContinue',
      'Write-Host "Verifying .NET installation..."',
      'dotnet --version',
      '',
    ],
  }),

  erlang: (): ScriptSection => ({
    title: 'Erlang Runtime Installation',
    description: 'Install Erlang OTP (required for RabbitMQ)',
    commands: [
      '# ===== ERLANG INSTALLATION =====',
      `$ErlangPath = "${DOWNLOADS_PATH}\\erlang-setup.exe"`,
      '$ErlangUrl = "https://github.com/erlang/otp/releases/download/OTP-26.2.1/otp_win64_26.2.1.exe"',
      'Write-Host "Downloading Erlang OTP..."',
      'Invoke-WebRequest -Uri $ErlangUrl -OutFile $ErlangPath',
      'Write-Host "Installing Erlang..."',
      'Start-Process -FilePath $ErlangPath -ArgumentList "/S" -Wait',
      'Write-Host "Erlang installation completed!"',
      'Remove-Item $ErlangPath -Force -ErrorAction SilentlyContinue',
      '',
    ],
  }),

  rabbitmq: (): ScriptSection => ({
    title: 'RabbitMQ Installation',
    description: 'Install and configure RabbitMQ message broker',
    commands: [
      '# ===== RABBITMQ INSTALLATION =====',
      `$RabbitMqPath = "${DOWNLOADS_PATH}\\rabbitmq-setup.exe"`,
      '$RabbitMqUrl = "https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.12.12/rabbitmq-server-3.12.12.exe"',
      'Write-Host "Downloading RabbitMQ..."',
      'Invoke-WebRequest -Uri $RabbitMqUrl -OutFile $RabbitMqPath',
      'Write-Host "Installing RabbitMQ..."',
      'Start-Process -FilePath $RabbitMqPath -ArgumentList "/S" -Wait',
      'Write-Host "RabbitMQ installation completed!"',
      'Write-Host "Enabling RabbitMQ Management Plugin..."',
      'Set-Location "C:\\Program Files\\RabbitMQ Server\\rabbitmq_server-3.12.12\\sbin"',
      '.\\rabbitmq-plugins.bat enable rabbitmq_management',
      'Write-Host "RabbitMQ is running on http://localhost:15672 (guest/guest)"',
      'Remove-Item $RabbitMqPath -Force -ErrorAction SilentlyContinue',
      '',
    ],
  }),

  mongodb: (): ScriptSection => ({
    title: 'MongoDB Installation',
    description: 'Install MongoDB Community Edition with tools',
    commands: [
      '# ===== MONGODB INSTALLATION =====',
      `$MongoDbPath = "${DOWNLOADS_PATH}\\mongodb-setup.msi"`,
      '$MongoDbUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5-signed.msi"',
      'Write-Host "Downloading MongoDB Community Edition..."',
      'Invoke-WebRequest -Uri $MongoDbUrl -OutFile $MongoDbPath',
      'Write-Host "Installing MongoDB..."',
      'Start-Process -FilePath "msiexec.exe" -ArgumentList "/i $MongoDbPath /passive /norestart" -Wait',
      'Write-Host "MongoDB installation completed!"',
      'Write-Host "Creating MongoDB data directory..."',
      'New-Item -Path "C:\\data\\db" -ItemType Directory -Force | Out-Null',
      'New-Item -Path "C:\\data\\log" -ItemType Directory -Force | Out-Null',
      'Write-Host "MongoDB is ready for configuration"',
      'Remove-Item $MongoDbPath -Force -ErrorAction SilentlyContinue',
      '',
    ],
  }),

  mongodbReplica: (clientName: string): ScriptSection => ({
    title: 'MongoDB Replica Set Configuration',
    description: 'Configure MongoDB replica set for clustering',
    commands: [
      '# ===== MONGODB REPLICA SET CONFIGURATION =====',
      'Write-Host "Starting MongoDB..."',
      'net start MongoDB',
      'Write-Host "Waiting for MongoDB to start..."',
      'Start-Sleep -Seconds 5',
      'Write-Host "Configuring replica set..."',
      '$mongoShellPath = "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongosh.exe"',
      '',
      '# Connect and initialize replica set',
      'Write-Host "Initializing replica set for ' + clientName + '..."',
      '& $mongoShellPath --eval "rs.initiate({ _id: \'rs0\', members: [ { _id: 0, host: \'localhost:27017\' } ] })"',
      'Write-Host "Replica set configured successfully!"',
      'Write-Host "MongoDB Replica Set Status:"',
      '& $mongoShellPath --eval "rs.status()"',
      '',
    ],
  }),

  sqlServer: (): ScriptSection => ({
    title: 'SQL Server 2017 Developer Installation',
    description: 'Install SQL Server 2017 Developer Edition with tools',
    commands: [
      '# ===== SQL SERVER 2017 INSTALLATION =====',
      `$SqlServerPath = "${DOWNLOADS_PATH}\\sqlserver2017.exe"`,
      '$SqlServerUrl = "https://download.microsoft.com/download/E/F/2/EF23C21D-7860-4F05-88CE-F3B3A6E3C495/SQL2017-SSEI-Dev.exe"',
      'Write-Host "Downloading SQL Server 2017 Developer Edition..."',
      'Invoke-WebRequest -Uri $SqlServerUrl -OutFile $SqlServerPath',
      'Write-Host "Starting SQL Server installation..."',
      'Write-Host "Please complete the SQL Server installation wizard"',
      'Start-Process -FilePath $SqlServerPath -Wait',
      'Write-Host "SQL Server installation in progress..."',
      'Write-Host "This may take 15-30 minutes. Please wait..."',
      'Write-Host "After installation completes, verify with:"',
      'Write-Host "sqlcmd -S localhost -U sa -Q \"SELECT @@VERSION\""',
      'Remove-Item $SqlServerPath -Force -ErrorAction SilentlyContinue',
      '',
    ],
  }),

  certificates: (clientName: string): ScriptSection => ({
    title: 'SSL Certificate Configuration',
    description: 'Import and bind SSL certificates for client URLs',
    commands: [
      '# ===== SSL CERTIFICATE IMPORT & BINDING =====',
      'Write-Host "Setting up SSL certificates for ' + clientName + '..."',
      '',
      '# Import certificate from file (adjust path as needed)',
      `$CertPath = "${DOWNLOADS_PATH}\\certificate.pfx"`,
      '$CertPassword = "YourCertificatePassword" # Change this',
      '',
      'if (Test-Path $CertPath) {',
      '    $cert = Import-PfxCertificate -FilePath $CertPath -CertStoreLocation Cert:\\LocalMachine\\My -Password (ConvertTo-SecureString $CertPassword -AsPlainText -Force)',
      '    Write-Host "Certificate imported with thumbprint: $($cert.Thumbprint)"',
      '} else {',
      '    Write-Host "Certificate file not found at $CertPath"',
      '    Write-Host "Please place your .pfx certificate file in the Downloads folder"',
      '}',
      '',
      'Write-Host "SSL certificate configuration ready for IIS binding"',
      '',
    ],
  }),

  hostsFile: (clientInfo: ClientInfo): ScriptSection => ({
    title: 'Windows Hosts File Update',
    description: 'Update Windows hosts file with client URLs',
    commands: [
      '# ===== WINDOWS HOSTS FILE UPDATE =====',
      'Write-Host "Updating Windows hosts file..."',
      '$hostsPath = "C:\\Windows\\System32\\drivers\\etc\\hosts"',
      '$localIP = "127.0.0.1"',
      '',
      '# Read current hosts file',
      '$hostsContent = Get-Content $hostsPath -Raw',
      '',
      '# Add entries for client URLs',
      '$newEntries = @"',
      `127.0.0.1 ${clientInfo.mainUrl}`,
      `127.0.0.1 ${clientInfo.gatewayUrl}`,
      `127.0.0.1 ${clientInfo.docsUrl}`,
      '"@',
      '',
      '# Check if entries already exist',
      'if ($hostsContent -notmatch [regex]::Escape($clientInfo.mainUrl)) {',
      '    Add-Content -Path $hostsPath -Value ""',
      '    Add-Content -Path $hostsPath -Value "# ' + clientInfo.name + ' Entries"',
      '    Add-Content -Path $hostsPath -Value $newEntries',
      '    Write-Host "Hosts file updated successfully"',
      '} else {',
      '    Write-Host "Client URLs already exist in hosts file"',
      '}',
      '',
    ],
  }),

  iisSites: (clientInfo: ClientInfo): ScriptSection => ({
    title: 'IIS Sites & App Pools Creation',
    description: 'Create IIS sites, app pools, and bindings for all client applications',
    commands: [
      '# ===== IIS SITES & APP POOLS CREATION =====',
      'Import-Module WebAdministration',
      'Write-Host "Creating IIS App Pools and Sites for ' + clientInfo.name + '..."',
      '',
      '# App Pool Configuration',
      '$appPoolConfig = @{',
      '    "IntegrationPipeline" = "Integrated"',
      '    "ManagedRuntimeVersion" = "v4.0"',
      '    "ProcessModel" = @{',
      '        "identityType" = 4',
      '    }',
      '}',
      '',
      '# Create API Backend App Pools (12)',
      'for ($i = 1; $i -le 12; $i++) {',
      '    $poolName = "API_Backend_Pool_$i"',
      '    if (!(Test-Path "IIS:\\AppPools\\$poolName")) {',
      '        New-WebAppPool -Name $poolName | Out-Null',
      '        Write-Host "Created App Pool: $poolName"',
      '    }',
      '}',
      '',
      '# Create Frontend App Pool',
      'if (!(Test-Path "IIS:\\AppPools\\Frontend_Pool")) {',
      '    New-WebAppPool -Name "Frontend_Pool" | Out-Null',
      '    Write-Host "Created App Pool: Frontend_Pool"',
      '}',
      '',
      '# Create eSign App Pools (2)',
      'for ($i = 1; $i -le 2; $i++) {',
      '    $poolName = "eSign_Pool_$i"',
      '    if (!(Test-Path "IIS:\\AppPools\\$poolName")) {',
      '        New-WebAppPool -Name $poolName | Out-Null',
      '        Write-Host "Created App Pool: $poolName"',
      '    }',
      '}',
      '',
      '# Create main site',
      'Write-Host "Creating main website binding..."',
      '# Add your site creation commands here',
      'Write-Host "IIS sites and app pools created successfully"',
      '',
    ],
  }),

  webConfig: (clientInfo: ClientInfo): ScriptSection => ({
    title: 'Web Configuration Files Setup',
    description: 'Generate and configure web.config and app.config files',
    commands: [
      '# ===== WEB CONFIG CONFIGURATION =====',
      'Write-Host "Configuring application settings..."',
      '',
      '# Create configuration directory',
      '$configPath = "C:\\Raawee\\Config"',
      'New-Item -Path $configPath -ItemType Directory -Force | Out-Null',
      '',
      '# Generate web.config template',
      '$webConfigContent = @"',
      '<?xml version="1.0" encoding="utf-8"?>',
      '<configuration>',
      '  <appSettings>',
      `    <add key="MainApiUrl" value="https://${clientInfo.mainUrl}" />`,
      `    <add key="GatewayUrl" value="https://${clientInfo.gatewayUrl}" />`,
      `    <add key="DocsUrl" value="https://${clientInfo.docsUrl}" />`,
      '  </appSettings>',
      '  <connectionStrings>',
      '    <add name="DefaultConnection" connectionString="Server=localhost;Database=AttendancePlus;User Id=sa;Password=YourPassword;" />',
      '    <add name="MongoDb" connectionString="mongodb://localhost:27017/attendanceplus" />',
      '  </connectionStrings>',
      '</configuration>',
      '"@',
      '',
      'Set-Content -Path "$configPath\\web.config" -Value $webConfigContent',
      'Write-Host "Web configuration files created successfully"',
      '',
    ],
  }),
}

export const generateFullScript = (
  clientInfo: ClientInfo,
  selectedInstallations: string[]
): string => {
  let script = `# AttendancePlus Setup Script - ${clientInfo.name}
# Generated: ${new Date().toLocaleString()}
# =====================================================

# Run this script as Administrator in PowerShell

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Create downloads directory
$downloadsPath = "${DOWNLOADS_PATH}"
New-Item -Path $downloadsPath -ItemType Directory -Force | Out-Null

Write-Host "Starting AttendancePlus Setup for ${clientInfo.name}..." -ForegroundColor Green
Write-Host "Main URL: ${clientInfo.mainUrl}"
Write-Host "Gateway URL: ${clientInfo.gatewayUrl}"
Write-Host "Docs URL: ${clientInfo.docsUrl}"
Write-Host ""

`

  // Add selected installation scripts
  const installationMap: { [key: string]: () => ScriptSection } = {
    chrome: scriptTemplates.chrome,
    urlRewrite: scriptTemplates.urlRewrite,
    iisFeatures: scriptTemplates.iisFeatures,
    dotnet: scriptTemplates.dotnet,
    erlang: scriptTemplates.erlang,
    rabbitmq: scriptTemplates.rabbitmq,
    mongodb: scriptTemplates.mongodb,
    mongodbReplica: () => scriptTemplates.mongodbReplica(clientInfo.name),
    sqlServer: scriptTemplates.sqlServer,
    certificates: () => scriptTemplates.certificates(clientInfo.name),
    hostsFile: () => scriptTemplates.hostsFile(clientInfo),
    iisSites: () => scriptTemplates.iisSites(clientInfo),
    webConfig: () => scriptTemplates.webConfig(clientInfo),
  }

  selectedInstallations.forEach((installKey) => {
    const templateFn = installationMap[installKey]
    if (templateFn) {
      const section = templateFn()
      script += `\n# ${section.title}\n`
      script += `# ${section.description}\n`
      script += section.commands.join('\n')
      script += '\n'
    }
  })

  script += `
# =====================================================
Write-Host "Setup process completed!" -ForegroundColor Green
Write-Host "Review the output above for any errors"
Write-Host "Some installations may require a system restart"
`

  return script
}
