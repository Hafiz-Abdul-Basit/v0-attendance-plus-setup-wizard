"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"

interface StepContentProps {
  activeSection: string
  completedSteps: Record<string, boolean>
  onToggleStep: (stepId: string) => void
}

export function StepContent({ activeSection, completedSteps, onToggleStep }: StepContentProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
    <div className="relative bg-gray-900 rounded-lg p-4 font-mono text-sm border">
      {title && <div className="text-gray-400 text-xs mb-2 font-semibold">{title}</div>}
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-700"
        onClick={() => copyToClipboard(children)}
      >
        <Copy className="w-4 h-4 text-gray-400" />
      </Button>
      <pre className="overflow-x-auto pr-12 text-green-400">{children}</pre>
    </div>
  )

  const StepItem = ({
    stepNumber,
    title,
    children,
    isExpanded = true,
    stepId,
    isCompleted = false,
    onToggle,
  }: {
    stepNumber: number
    title: string
    children: React.ReactNode
    isExpanded?: boolean
    stepId?: string
    isCompleted?: boolean
    onToggle?: () => void
  }) => (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        {stepId && onToggle && <Checkbox checked={isCompleted} onCheckedChange={onToggle} className="w-5 h-5" />}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isCompleted ? "bg-green-500 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {isCompleted ? "✓" : stepNumber}
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500 font-medium">Step {stepNumber}</div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  )

  const ExternalLinkButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Button variant="outline" asChild className="gap-2 bg-transparent">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="w-4 h-4" />
        {children}
      </a>
    </Button>
  )

  const ErrorFix = ({ error, fix }: { error: string; fix: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 mb-2">Common Error:</h4>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm font-medium">{fix}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "browser":
        return (
          <div>
            <p className="text-gray-600 mb-6">
              Install and configure the required web browser for optimal compatibility with the AttendancePlus System.
            </p>

            <StepItem
              stepNumber={1}
              title="Download Google Chrome"
              stepId="browser-1"
              isCompleted={completedSteps["browser-1"]}
              onToggle={() => onToggleStep("browser-1")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Download and install the latest version of Google Chrome for optimal compatibility.
                  </p>
                  <ExternalLinkButton href="https://www.google.com/chrome/">Download Google Chrome</ExternalLinkButton>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Installation Command:</h4>
                  <CodeBlock title="PowerShell Command">
                    {`# Download and install Chrome silently
$url = "https://dl.google.com/chrome/install/ChromeStandaloneSetup64.exe"
Invoke-WebRequest -Uri $url -OutFile "ChromeSetup.exe"
Start-Process -FilePath "ChromeSetup.exe" -ArgumentList "/silent /install" -Wait`}
                  </CodeBlock>
                </div>
              </div>
            </StepItem>
          </div>
        )

      case "iis":
        return (
          <div>
            <p className="text-gray-600 mb-6">
              Configure Internet Information Services (IIS) with required features and bindings.
            </p>

            <StepItem
              stepNumber={1}
              title="Enable IIS Features"
              stepId="iis-1"
              isCompleted={completedSteps["iis-1"]}
              onToggle={() => onToggleStep("iis-1")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Add required IIS roles and features through PowerShell or Server Manager.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">PowerShell Method (Recommended):</h4>
                    <CodeBlock title="Enable IIS Features">
                      {`Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIExtensions
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIFilter
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45`}
                    </CodeBlock>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Critical:</strong> Ensure Application Development features are enabled for ASP.NET Core hosting.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Required IIS Features:</h4>
                  <Image
                    src="/images/iis-web-server-features.png"
                    alt="IIS Web Server Features Selection"
                    width={400}
                    height={300}
                    className="rounded-lg border shadow-sm w-full"
                  />
                  
                  <ErrorFix
                    error="HTTP Error 500.19 - Internal Server Error"
                    fix="Ensure ASP.NET Core Hosting Bundle is installed and Application Initialization is enabled in IIS features."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={2}
              title="Configure Port Bindings"
              stepId="iis-2"
              isCompleted={completedSteps["iis-2"]}
              onToggle={() => onToggleStep("iis-2")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Set up required port bindings for all AttendancePlus services.</p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Updated Port Configuration:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>• Intervention API: <code className="bg-blue-100 px-1 rounded">7189</code></div>
                      <div>• Analysis API: <code className="bg-blue-100 px-1 rounded">7296</code></div>
                      <div>• Administration: <code className="bg-blue-100 px-1 rounded">7239</code></div>
                      <div>• Court Management: <code className="bg-blue-100 px-1 rounded">7007</code></div>
                      <div>• Identity API: <code className="bg-blue-100 px-1 rounded">7206</code></div>
                      <div>• SentLetter API: <code className="bg-blue-100 px-1 rounded">7101</code></div>
                      <div>• LetterDispatch API: <code className="bg-blue-100 px-1 rounded">7119</code></div>
                      <div>• MessageHub API: <code className="bg-blue-100 px-1 rounded">7120</code></div>
                      <div>• Miscellaneous: <code className="bg-blue-100 px-1 rounded">7061</code></div>
                      <div>• Gateway: <code className="bg-blue-100 px-1 rounded">443</code></div>
                      <div>• Angular Web: <code className="bg-blue-100 px-1 rounded">443</code></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">PowerShell Binding Commands:</h4>
                    <CodeBlock title="Create Site Bindings">
                      {`# Example for Identity API
New-WebBinding -Name "RK12.AttPlus.Identity.API" -Protocol https -Port 7206 -IPAddress "*"

# Example for Gateway
New-WebBinding -Name "RK12.AttPlus.APIGateway" -Protocol https -Port 443 -IPAddress "*"`}
                    </CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Site Bindings Configuration:</h4>
                  <Image
                    src="/images/iis-site-bindings.png"
                    alt="IIS Site Bindings Configuration"
                    width={400}
                    height={300}
                    className="rounded-lg border shadow-sm w-full"
                  />

                  <ErrorFix
                    error="Port already in use or binding conflicts"
                    fix="Use netstat -an | findstr :PORT to check port usage. Stop conflicting services or choose different ports."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={3}
              title="Configure Application Pools"
              stepId="iis-3"
              isCompleted={completedSteps["iis-3"]}
              onToggle={() => onToggleStep("iis-3")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>CRITICAL:</strong> .NET CLR Version MUST be "No Managed Code" and Identity MUST be "LocalSystem"
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">PowerShell Configuration:</h4>
                    <CodeBlock title="Configure Application Pools">
                      {`# Create and configure application pool
New-WebAppPool -Name "RK12.AttPlus.Identity.API"
Set-ItemProperty -Path "IIS:\\AppPools\\RK12.AttPlus.Identity.API" -Name managedRuntimeVersion -Value ""
Set-ItemProperty -Path "IIS:\\AppPools\\RK12.AttPlus.Identity.API" -Name processModel.identityType -Value LocalSystem
Set-ItemProperty -Path "IIS:\\AppPools\\RK12.AttPlus.Identity.API" -Name processModel.idleTimeout -Value "00:00:00"`}
                    </CodeBlock>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Required Settings:</h4>
                    <ul className="space-y-1 text-blue-800 text-sm">
                      <li>• .NET CLR Version: No Managed Code</li>
                      <li>• Identity: LocalSystem</li>
                      <li>• Managed Pipeline Mode: Integrated</li>
                      <li>• Start Mode: Always Running</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Application Pool Configuration:</h4>
                  <Image
                    src="/images/iis-app-pools.png"
                    alt="IIS Application Pools Configuration"
                    width={400}
                    height={200}
                    className="rounded-lg border shadow-sm w-full"
                  />

                  <ErrorFix
                    error="Application pool keeps stopping or recycling"
                    fix="Set Idle Timeout to 0, enable Always Running, and ensure LocalSystem identity has proper permissions."
                  />
                </div>
              </div>
            </StepItem>
          </div>
        )

      case "dotnet":
        return (
          <div>
            <p className="text-gray-600 mb-6">Install .NET 8 SDK and Hosting Bundle for the AttendancePlus System.</p>

            <StepItem
              stepNumber={1}
              title="Download .NET 8"
              stepId="dotnet-1"
              isCompleted={completedSteps["dotnet-1"]}
              onToggle={() => onToggleStep("dotnet-1")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Download and install the .NET 8 SDK and Hosting Bundle.</p>

                  <ExternalLinkButton href="https://dotnet.microsoft.com/en-us/download/dotnet/8.0">
                    Download .NET 8 SDK & Hosting Bundle
                  </ExternalLinkButton>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Silent Installation:</h4>
                    <CodeBlock title="PowerShell Installation">
                      {`# Download and install .NET 8 Hosting Bundle
$url = "https://download.visualstudio.microsoft.com/download/pr/xxx/dotnet-hosting-8.0.x-win.exe"
Invoke-WebRequest -Uri $url -OutFile "dotnet-hosting.exe"
Start-Process -FilePath "dotnet-hosting.exe" -ArgumentList "/quiet" -Wait`}
                    </CodeBlock>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Install both SDK (development) and Hosting Bundle (production). Hosting Bundle is required for IIS.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">.NET 8.0 Download Page:</h4>
                  <Image
                    src="/images/dotnet-download.png"
                    alt=".NET 8.0 Download Page"
                    width={400}
                    height={200}
                    className="rounded-lg border shadow-sm w-full"
                  />

                  <ErrorFix
                    error=".NET applications not starting in IIS"
                    fix="Restart IIS after installing Hosting Bundle: iisreset /restart"
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={2}
              title="Verify Installation"
              stepId="dotnet-2"
              isCompleted={completedSteps["dotnet-2"]}
              onToggle={() => onToggleStep("dotnet-2")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Verify the installation by checking the .NET version.</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Verification Commands:</h4>
                    <CodeBlock title="Check .NET Version">dotnet --version</CodeBlock>
                    <CodeBlock title="List Installed Runtimes">dotnet --list-runtimes</CodeBlock>
                    <CodeBlock title="Check Hosting Bundle">reg query "HKEY_LOCAL_MACHINE\SOFTWARE\dotnet\Setup\InstalledVersions\x64\sharedhost" /v Version</CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Expected Output:</h4>
                    <div className="text-sm text-green-800 font-mono">
                      <div>8.0.x (or higher)</div>
                      <div className="mt-2">Microsoft.AspNetCore.App 8.0.x</div>
                      <div>Microsoft.NETCore.App 8.0.x</div>
                    </div>
                  </div>

                  <ErrorFix
                    error="Command 'dotnet' not recognized"
                    fix="Add C:\Program Files\dotnet to system PATH environment variable and restart command prompt."
                  />
                </div>
              </div>
            </StepItem>
          </div>
        )

      case "rabbitmq":
        return (
          <div>
            <p className="text-gray-600 mb-6">
              Install and configure RabbitMQ message broker for the AttendancePlus System.
            </p>

            <StepItem
              stepNumber={1}
              title="Install Erlang"
              stepId="rabbitmq-1"
              isCompleted={completedSteps["rabbitmq-1"]}
              onToggle={() => onToggleStep("rabbitmq-1")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">RabbitMQ requires Erlang to be installed first.</p>
                  <ExternalLinkButton href="https://www.erlang.org/downloads">
                    Download Erlang for Windows
                  </ExternalLinkButton>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Installation Path:</h4>
                    <CodeBlock title="Default Installation Path">C:\Program Files\Erlang OTP</CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Verify Erlang Installation:</h4>
                    <CodeBlock title="Check Erlang Version">erl -version</CodeBlock>
                  </div>

                  <ErrorFix
                    error="Erlang not found in PATH"
                    fix="Add C:\Program Files\Erlang OTP\bin to system PATH environment variable."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={2}
              title="Install RabbitMQ"
              stepId="rabbitmq-2"
              isCompleted={completedSteps["rabbitmq-2"]}
              onToggle={() => onToggleStep("rabbitmq-2")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Download and install RabbitMQ server.</p>
                  <ExternalLinkButton href="https://www.rabbitmq.com/download.html">Download RabbitMQ</ExternalLinkButton>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Installation Paths:</h4>
                    <CodeBlock title="RabbitMQ Installation">C:\Program Files\RabbitMQ Server</CodeBlock>
                    <CodeBlock title="RabbitMQ sbin Directory">C:\Program Files\RabbitMQ Server\rabbitmq_server-3.x.x\sbin</CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Start RabbitMQ Service:</h4>
                    <CodeBlock title="Windows Service Commands">
                      {`# Start RabbitMQ service
net start RabbitMQ

# Check service status
sc query RabbitMQ`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="RabbitMQ service fails to start"
                    fix="Ensure Erlang is properly installed and ERLANG_HOME environment variable is set to Erlang installation directory."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={3}
              title="Enable Management Plugin"
              stepId="rabbitmq-3"
              isCompleted={completedSteps["rabbitmq-3"]}
              onToggle={() => onToggleStep("rabbitmq-3")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Enable the RabbitMQ management plugin for web-based administration.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Enable Plugin Command:</h4>
                    <CodeBlock title="Enable Management Plugin">
                      {`cd "C:\\Program Files\\RabbitMQ Server\\rabbitmq_server-3.x.x\\sbin"
rabbitmq-plugins enable rabbitmq_management`}
                    </CodeBlock>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Run Command Prompt as Administrator when executing RabbitMQ commands.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Command Execution Example:</h4>
                  <Image
                    src="/images/rabbitmq-plugins.png"
                    alt="RabbitMQ Plugins Command Execution"
                    width={400}
                    height={200}
                    className="rounded-lg border shadow-sm w-full"
                  />

                  <ErrorFix
                    error="Plugin enable command not recognized"
                    fix="Navigate to RabbitMQ sbin directory first, or add it to system PATH."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={4}
              title="Restart RabbitMQ Server"
              stepId="rabbitmq-4"
              isCompleted={completedSteps["rabbitmq-4"]}
              onToggle={() => onToggleStep("rabbitmq-4")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Restart the RabbitMQ server to apply changes.</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Restart Commands:</h4>
                    <CodeBlock title="Restart RabbitMQ Service">
                      {`net stop RabbitMQ
net start RabbitMQ`}
                    </CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Alternative Method:</h4>
                    <CodeBlock title="RabbitMQ Control Commands">
                      {`rabbitmqctl stop_app
rabbitmqctl start_app`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="Service restart fails"
                    fix="Check Windows Event Viewer for detailed error messages and ensure no port conflicts exist."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={5}
              title="Access Management Interface"
              stepId="rabbitmq-5"
              isCompleted={completedSteps["rabbitmq-5"]}
              onToggle={() => onToggleStep("rabbitmq-5")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Access the RabbitMQ management interface to verify installation.</p>
                  
                  <Button variant="outline" asChild className="gap-2 bg-transparent">
                    <a href="http://localhost:15672" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Open RabbitMQ Management (localhost:15672)
                    </a>
                  </Button>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Default Credentials:</h4>
                    <div className="text-sm text-green-800">
                      <div>Username: <code className="bg-green-100 px-1 rounded">guest</code></div>
                      <div>Password: <code className="bg-green-100 px-1 rounded">guest</code></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Create Application User:</h4>
                    <CodeBlock title="Add RabbitMQ User">
                      {`rabbitmqctl add_user attendanceplus SecurePassword123
rabbitmqctl set_user_tags attendanceplus administrator
rabbitmqctl set_permissions -p / attendanceplus ".*" ".*" ".*"`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="Cannot access management interface"
                    fix="Check if port 15672 is open in firewall and RabbitMQ service is running."
                  />
                </div>
              </div>
            </StepItem>
          </div>
        )

      case "mongodb":
        return (
          <div>
            <p className="text-gray-600 mb-6">
              Install and configure MongoDB database with replica set for the AttendancePlus System.
            </p>

            <StepItem
              stepNumber={1}
              title="Download MongoDB Components"
              stepId="mongodb-1"
              isCompleted={completedSteps["mongodb-1"]}
              onToggle={() => onToggleStep("mongodb-1")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Download all required MongoDB components.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <ExternalLinkButton href="https://www.mongodb.com/try/download/community">
                      MongoDB Server
                    </ExternalLinkButton>
                    <ExternalLinkButton href="https://www.mongodb.com/try/download/compass">
                      MongoDB Compass
                    </ExternalLinkButton>
                    <ExternalLinkButton href="https://www.mongodb.com/try/download/shell">
                      MongoDB Shell
                    </ExternalLinkButton>
                    <ExternalLinkButton href="https://www.mongodb.com/try/download/database-tools">
                      MongoDB Tools
                    </ExternalLinkButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Installation Paths:</h4>
                    <CodeBlock title="MongoDB Installation Paths">
                      {`# MongoDB Server
C:\\Program Files\\MongoDB\\Server\\7.0\\

# MongoDB Tools
C:\\Program Files\\MongoDB\\Tools\\100\\

# Data Directory
C:\\data\\db\\`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="MongoDB service fails to start"
                    fix="Create data directory manually: mkdir C:\data\db and ensure MongoDB service has write permissions."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={2}
              title="Configure Replica Set"
              stepId="mongodb-2"
              isCompleted={completedSteps["mongodb-2"]}
              onToggle={() => onToggleStep("mongodb-2")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Update MongoDB configuration file to enable replica set functionality.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Configuration File Location:</h4>
                    <CodeBlock title="mongod.cfg Path">C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg</CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Add Replica Set Configuration:</h4>
                    <CodeBlock title="mongod.cfg - Add to file">
                      {`replication:
  replSetName: "rs0"`}
                    </CodeBlock>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Replica sets are required for MongoDB transactions used by AttendancePlus System.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">YAML Configuration Example:</h4>
                  <Image
                    src="/images/mongodb-yaml-config.png"
                    alt="MongoDB YAML Configuration"
                    width={300}
                    height={50}
                    className="rounded border shadow-sm w-full"
                  />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Restart MongoDB Service:</h4>
                    <CodeBlock title="Restart MongoDB">
                      {`net stop MongoDB
net start MongoDB`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="YAML parsing error in config file"
                    fix="Ensure proper indentation (2 spaces) and no tabs in YAML configuration."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={3}
              title="Initialize Replica Set"
              stepId="mongodb-3"
              isCompleted={completedSteps["mongodb-3"]}
              onToggle={() => onToggleStep("mongodb-3")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Initialize the replica set using MongoDB shell commands.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">MongoDB Shell Commands:</h4>
                    <CodeBlock title="Initialize Replica Set">
                      {`# Connect to MongoDB
mongosh.exe

# Initialize replica set
rs.initiate()

# Check replica set status
rs.status()`}
                    </CodeBlock>
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      The rs.status() command should show the replica set as "PRIMARY" when successful.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">MongoDB Shell Execution:</h4>
                  <Image
                    src="/images/mongodb-shell.png"
                    alt="MongoDB Shell Commands"
                    width={400}
                    height={200}
                    className="rounded-lg border shadow-sm w-full"
                  />

                  <ErrorFix
                    error="rs.initiate() fails with timeout"
                    fix="Check if MongoDB is running and accessible on localhost:27017. Verify firewall settings."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={5}
              title="Configure Document Paths"
              stepId="mongodb-5"
              isCompleted={completedSteps["mongodb-5"]}
              onToggle={() => onToggleStep("mongodb-5")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Set up document storage paths in the application configuration.</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Create Document Directory:</h4>
                    <CodeBlock title="Create Directory">
                      {`mkdir C:\\Raawee
icacls C:\\Raawee /grant "IIS_IUSRS:(OI)(CI)F"`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Application Configuration:</h4>
                    <CodeBlock title="appsettings.json">
                      {`"DocumentPaths": {
  "DocumentBasePath": "C:\\\\Raawee"
}`}
                    </CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">Important Notes:</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Ensure IIS_IUSRS has full control over document directory</li>
                      <li>• Use double backslashes in JSON configuration</li>
                      <li>• Consider using a dedicated drive for large document storage</li>
                    </ul>
                  </div>

                  <ErrorFix
                    error="Access denied when saving documents"
                    fix="Grant IIS_IUSRS full control permissions to the document directory using icacls command."
                  />
                </div>
              </div>
            </StepItem>
          </div>
        )

      case "sqlserver":
        return (
          <div>
            <p className="text-gray-600 mb-6 text-lg">
              Install and configure SQL Server for the AttendancePlus System database.
            </p>

            <StepItem
              stepNumber={1}
              title="Download SQL Server"
              stepId="sqlserver-1"
              isCompleted={completedSteps["sqlserver-1"]}
              onToggle={() => onToggleStep("sqlserver-1")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Download SQL Server 2019 or later with required features.</p>
                  <ExternalLinkButton href="https://www.microsoft.com/en-us/sql-server/sql-server-downloads">
                    Download SQL Server
                  </ExternalLinkButton>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Download SSMS:</h4>
                    <ExternalLinkButton href="https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms">
                      Download SQL Server Management Studio
                    </ExternalLinkButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Installation Command:</h4>
                    <CodeBlock title="Silent SQL Server Installation">
                      {`# Basic installation with Mixed Mode
setup.exe /Q /ACTION=Install /FEATURES=SQLEngine /INSTANCENAME=MSSQLSERVER /SQLSVCACCOUNT="NT AUTHORITY\\SYSTEM" /SQLSYSADMINACCOUNTS="BUILTIN\\Administrators" /SECURITYMODE=SQL /SAPWD="YourStrongPassword"`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="SQL Server installation fails"
                    fix="Run installer as Administrator and ensure Windows Features .NET Framework 3.5 is enabled."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={2}
              title="Install SQL Server"
              stepId="sqlserver-2"
              isCompleted={completedSteps["sqlserver-2"]}
              onToggle={() => onToggleStep("sqlserver-2")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Install SQL Server with the following features:</p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Required Features:</h4>
                    <ul className="space-y-2 text-blue-800">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Database Engine Services
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        SQL Server Management Tools (SSMS)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Full-Text and Semantic Extractions for Search
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        SQL Server Replication
                      </li>
                    </ul>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Choose "Mixed Mode" authentication during installation and set a strong SA password.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Post-Installation Check:</h4>
                    <CodeBlock title="Verify SQL Server Service">
                      {`# Check SQL Server service status
sc query MSSQLSERVER

# Connect to SQL Server
sqlcmd -S localhost -E`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="Cannot connect to SQL Server after installation"
                    fix="Enable SQL Server Browser service and check if TCP/IP protocol is enabled in SQL Server Configuration Manager."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={3}
              title="Configure SQL Server"
              stepId="sqlserver-3"
              isCompleted={completedSteps["sqlserver-3"]}
              onToggle={() => onToggleStep("sqlserver-3")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Configure SQL Server for AttendancePlus System.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Enable TCP/IP Protocol:</h4>
                    <CodeBlock title="SQL Server Configuration Manager Steps">
                      {`1. Open SQL Server Configuration Manager
2. Navigate to SQL Server Network Configuration
3. Enable TCP/IP protocol
4. Set TCP Port to 1433 in IP Addresses tab
5. Restart SQL Server service`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">PowerShell Configuration:</h4>
                    <CodeBlock title="Enable TCP/IP via PowerShell">
                      {`# Import SQL Server module
Import-Module SqlServer

# Enable TCP/IP
$smo = 'Microsoft.SqlServer.Management.Smo.'
$wmi = new-object ($smo + 'Wmi.ManagedComputer')
$tcp = $wmi.GetSmoObject("ManagedComputer[@Name='$env:COMPUTERNAME']/ServerInstance[@Name='MSSQLSERVER']/ServerProtocol[@Name='Tcp']")
$tcp.IsEnabled = $true
$tcp.Alter()`}
                    </CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Test Connection:</h4>
                    <CodeBlock title="Test SQL Server Connection">
                      {`# Test with Windows Authentication
sqlcmd -S localhost -E

# Test with SQL Authentication
sqlcmd -S localhost -U sa -P YourPassword`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="Login failed for user 'sa'"
                    fix="Ensure Mixed Mode authentication is enabled and SA account is not disabled. Reset SA password if needed."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={4}
              title="Create AttendancePlus Database"
              stepId="sqlserver-4"
              isCompleted={completedSteps["sqlserver-4"]}
              onToggle={() => onToggleStep("sqlserver-4")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Create the main database for AttendancePlus System.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Database Creation Script:</h4>
                    <CodeBlock title="Create Database and User">
                      {`-- Create database
CREATE DATABASE AttendancePlusDB;
GO

-- Create login for application
CREATE LOGIN AttendancePlusUser WITH PASSWORD = 'YourSecurePassword123!';
GO

-- Create user and grant permissions
USE AttendancePlusDB;
CREATE USER AttendancePlusUser FOR LOGIN AttendancePlusUser;
ALTER ROLE db_owner ADD MEMBER AttendancePlusUser;
GO`}
                    </CodeBlock>
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Save the connection string for application configuration.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Connection String:</h4>
                    <CodeBlock title="SQL Server Connection String">
                      {`Server=localhost;Database=AttendancePlusDB;User Id=AttendancePlusUser;Password=YourSecurePassword123!;TrustServerCertificate=true;`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Verify Database:</h4>
                    <CodeBlock title="Test Database Connection">
                      {`sqlcmd -S localhost -U AttendancePlusUser -P YourSecurePassword123! -d AttendancePlusDB -Q "SELECT DB_NAME()"`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="Database connection fails from application"
                    fix="Add TrustServerCertificate=true to connection string for local development or configure proper SSL certificates."
                  />
                </div>
              </div>
            </StepItem>
          </div>
        )

      case "webapi":
        return (
          <div>
            <p className="text-gray-600 mb-6 text-lg">
              Deploy and configure the AttendancePlus Web API services.
            </p>

            <StepItem
              stepNumber={1}
              title="Prepare API Files"
              stepId="webapi-1"
              isCompleted={completedSteps["webapi-1"]}
              onToggle={() => onToggleStep("webapi-1")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Extract and prepare the AttendancePlus API files for deployment.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Create Base Directory:</h4>
                    <CodeBlock title="Create Solution Directory">
                      {`mkdir "C:\\RK12.AttPlus.Solution.US"
cd "C:\\RK12.AttPlus.Solution.US"`}
                    </CodeBlock>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-800 mb-3">Required API Services with Updated Ports:</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.Intervention.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7189</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.Analysis.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7296</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.Administration.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7239</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.CourtManagement.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7007</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.Identity.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7206</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.SentLetter.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7101</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.LetterDispatch.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7119</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.MessageHub</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7120</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.Miscellaneous.API</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:7061</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• RK12.AttPlus.APIGateway</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:443</code>
                      </div>
                      <div className="flex justify-between">
                        <span>• eSignature</span>
                        <code className="bg-blue-100 px-2 py-1 rounded">:6501</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Extract API Files:</h4>
                    <CodeBlock title="PowerShell Extraction">
                      {`# Extract all API services
Expand-Archive -Path "AttendancePlus-APIs.zip" -DestinationPath "C:\\RK12.AttPlus.Solution.US\\"

# Set permissions for IIS
icacls "C:\\RK12.AttPlus.Solution.US" /grant "IIS_IUSRS:(OI)(CI)F"`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="Access denied when extracting files"
                    fix="Run PowerShell as Administrator and ensure the destination directory exists with proper permissions."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={2}
              title="Deploy to IIS"
              stepId="webapi-2"
              isCompleted={completedSteps["webapi-2"]}
              onToggle={() => onToggleStep("webapi-2")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Deploy each API service to IIS with correct configuration.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">PowerShell IIS Deployment:</h4>
                    <CodeBlock title="Create IIS Applications">
                      {`# Import IIS module
Import-Module WebAdministration

# Create application pools and sites
$apis = @(
    @{Name="RK12.AttPlus.Identity.API"; Port=7206; Path="C:\\RK12.AttPlus.Solution.US\\RK12.AttPlus.Identity.API"},
    @{Name="RK12.AttPlus.APIGateway"; Port=443; Path="C:\\RK12.AttPlus.Solution.US\\RK12.AttPlus.APIGateway"},
    @{Name="RK12.AttPlus.Administration.API"; Port=7239; Path="C:\\RK12.AttPlus.Solution.US\\RK12.AttPlus.Administration.API"}
)

foreach ($api in $apis) {
    # Create Application Pool
    New-WebAppPool -Name $api.Name
    Set-ItemProperty -Path "IIS:\\AppPools\\$($api.Name)" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty -Path "IIS:\\AppPools\\$($api.Name)" -Name processModel.identityType -Value LocalSystem
    
    # Create Website
    New-Website -Name $api.Name -PhysicalPath $api.Path -Port $api.Port -ApplicationPool $api.Name
}`}
                    </CodeBlock>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Each API service runs on its designated port with "No Managed Code" application pool.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Manual IIS Configuration:</h4>
                    <CodeBlock title="IIS Manager Steps">
                      {`1. Open IIS Manager
2. Right-click "Sites" → "Add Website"
3. Site name: RK12.AttPlus.Identity.API
4. Physical path: C:\\RK12.AttPlus.Solution.US\\RK12.AttPlus.Identity.API
5. Port: 7206
6. Application pool: RK12.AttPlus.Identity.API (No Managed Code)
7. Repeat for all API services`}
                    </CodeBlock>
                  </div>

                  <ErrorFix
                    error="HTTP Error 502.5 - Process Failure"
                    fix="Ensure .NET 8 Hosting Bundle is installed and application pool is set to 'No Managed Code'."
                  />
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={3}
              title="Configure Connection Strings"
              stepId="webapi-3"
              isCompleted={completedSteps["webapi-3"]}
              onToggle={() => onToggleStep("webapi-3")}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-700">Update appsettings.json files with correct connection strings.</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Update Configuration Files:</h4>
                    <CodeBlock title="PowerShell Configuration Update">
                      {`# Update all appsettings.json files
$configTemplate = @"
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=AttendancePlusDB;User Id=AttendancePlusUser;Password=YourSecurePassword123!;TrustServerCertificate=true;",
    "MongoConnection": "mongodb://localhost:27017/?replicaSet=rs0"
  },
  "RabbitMQ": {
    "HostName": "localhost",
    "Port": 5672,
    "UserName": "attendanceplus",
    "Password": "SecurePassword123"
  }
}
"@

# Apply to all API services
Get-ChildItem "C:\\RK12.AttPlus.Solution.US\\*\\appsettings.json" | ForEach-Object {
    $configTemplate | Out-File -FilePath $_.FullName -Encoding UTF8
}`}
                    </CodeBlock>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Sample appsettings.json:</h4>
                    <CodeBlock title="Complete Configuration">{`{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=AttendancePlusDB;User Id=AttendancePlusUser;Password=YourSecurePassword123!;TrustServerCertificate=true;",
    "MongoConnection": "mongodb://localhost:27017/?replicaSet=rs0"
  },
  "RabbitMQ": {
    "HostName": "localhost",
    "Port": 5672,
    "UserName": "attendanceplus",
    "Password": "SecurePassword123"
  }
}`}</CodeBlock>
                  </div>
                </div>
              </div>
            </StepItem>

            <StepItem
              stepNumber={4}
              title="Test API Services"
              stepId="webapi-4"
              isCompleted={completedSteps["webapi-4"]}
              onToggle={() => onToggleStep("webapi-4")}
            >
              <div className="space-y-4">
                <p className="text-gray-700">Verify all API services are running correctly:</p>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" asChild className="gap-2 bg-transparent">
                    <a href="https://localhost:7206/swagger" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Identity API Swagger
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="gap-2 bg-transparent">
                    <a href="https://localhost:443/swagger" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      API Gateway Swagger
                    </a>
                  </Button>
                </div>
              </div>
            </StepItem>
          </div>
        );

      case "angular":
        return (
          <div>
            <p className="text-gray-600 mb-6 text-lg">
              Build and deploy the AttendancePlus Angular frontend application.
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Welcome to AttendancePlus Installation</h2>
            <p className="text-gray-600">Select a section from the sidebar to begin the installation process.</p>
          </div>
        );
    }
  }

  return <div>{renderContent()}</div>;
}
