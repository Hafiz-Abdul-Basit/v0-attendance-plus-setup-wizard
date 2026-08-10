/**
 * IIS configuration — PowerShell script generator.
 *
 * Generates the idempotent PowerShell script that an administrator runs
 * on the target server to:
 *   1. Create / update the application pool (LocalSystem identity,
 *      AlwaysRunning, no managed runtime version)
 *   2. Create the IIS website (if missing) bound to the physical path
 *   3. Remove any existing HTTPS binding matching host:port and re-create
 *      it bound to the configured SSL certificate (found by friendly name)
 *   4. Start the website
 *
 * Behaviour is equivalent to the existing PowerShell snippet referenced in
 * the task spec, but expressed as data + a single emitter function so it
 * is testable and easy to extend.
 *
 * The script is generated client- AND server-side (no `server-only`
 * marker) so the UI can preview the script the user is about to run.
 *
 * Implementation note: we build the script by concatenating plain strings
 * (not template literals) so the embedded PowerShell `$var` and `${expr}`
 * syntax doesn't collide with the JavaScript template-substitution syntax.
 */

import type { IisSiteConfig, SslConfig } from "./types"

export interface IisSetupScriptOptions {
  /** Per-site action log file the admin can tail. */
  logPath?: string
}

/** Render a single site's PowerShell block. Idempotent — every step is guarded. */
export function renderIisSiteBlock(
  site: IisSiteConfig,
  iisBasePath: string,
  ssl: SslConfig,
): string {
  const name = escapePs(site.name)
  const host = escapePs(site.host)
  const port = Number.isFinite(site.port) ? site.port : 443
  const physicalSub = site.physicalSubPath ? escapePs(site.physicalSubPath) : ""
  const physicalOverride = site.physicalPath ? escapePs(site.physicalPath) : ""
  const friendly = escapePs(ssl.certificateFriendlyName)
  const storeLocation = escapePs(ssl.storeLocation)

  // Resolve the physical path: prefer the override, otherwise base + sub.
  const physicalExpr = physicalOverride
    ? '"' + physicalOverride + '"'
    : '(Join-Path "' + escapePs(iisBasePath) + '" "' + physicalSub + '")'

  const lines: string[] = []
  lines.push("")
  lines.push("# ---- Site: " + name + " ---------------------------------------------------")
  lines.push('$siteName = "' + name + '"')
  lines.push('$siteHost = "' + host + '"')
  lines.push("$sitePort = " + port)
  lines.push("$sitePhysicalPath = " + physicalExpr)
  lines.push('$certFriendlyName = "' + friendly + '"')
  lines.push("")
  lines.push("if (-not (Test-Path $sitePhysicalPath)) {")
  lines.push('    Write-SetupLog "Physical path missing for $siteName — creating it: $sitePhysicalPath" "WARN"')
  lines.push("    New-Item -Path $sitePhysicalPath -ItemType Directory -Force | Out-Null")
  lines.push("}")
  lines.push("")
  lines.push("# Application pool")
  lines.push('if (Test-Path "IIS:\\AppPools\\$siteName") {')
  lines.push('    Write-SetupLog "App pool \'$siteName\' already exists."')
  lines.push("} else {")
  lines.push("    New-WebAppPool -Name $siteName | Out-Null")
  lines.push('    Write-SetupLog "Created app pool \'$siteName\'."')
  lines.push("}")
  lines.push('Set-ItemProperty -Path "IIS:\\AppPools\\$siteName" -Name managedRuntimeVersion -Value ""')
  lines.push('Set-ItemProperty -Path "IIS:\\AppPools\\$siteName" -Name startMode -Value "AlwaysRunning"')
  lines.push('Set-ItemProperty -Path "IIS:\\AppPools\\$siteName" -Name processModel.identityType -Value 0 # LocalSystem')
  lines.push("")
  lines.push("# Website")
  lines.push('if (Test-Path "IIS:\\Sites\\$siteName") {')
  lines.push('    Write-SetupLog "Website \'$siteName\' already exists."')
  lines.push("} else {")
  lines.push("    New-Website -Name $siteName -PhysicalPath $sitePhysicalPath -ApplicationPool $siteName | Out-Null")
  lines.push('    Write-SetupLog "Created website \'$siteName\'."')
  lines.push("}")
  lines.push('Set-ItemProperty -Path "IIS:\\Sites\\$siteName" -Name applicationPool -Value $siteName')
  lines.push('Set-ItemProperty -Path "IIS:\\Sites\\$siteName" -Name physicalPath -Value $sitePhysicalPath')
  lines.push("")
  lines.push("# Remove any default http binding on the same port so we don't conflict.")
  lines.push("Get-WebBinding -Name $siteName -Protocol http -HostHeader $siteHost -Port $sitePort -ErrorAction SilentlyContinue |")
  lines.push("    ForEach-Object { Remove-WebBinding -BindingInformation $_.bindingInformation; Write-SetupLog \"Removed default http binding from $siteName\" \"WARN\" }")
  lines.push("")
  lines.push("# HTTPS binding")
  lines.push("$existingHttps = Get-WebBinding -Name $siteName -Protocol https -HostHeader $siteHost -Port $sitePort -ErrorAction SilentlyContinue")
  lines.push("if ($existingHttps) {")
  lines.push('    Write-SetupLog "Removing existing HTTPS binding for $siteName ($siteHost`:$sitePort) before recreating."')
  lines.push("    Remove-WebBinding -BindingInformation $existingHttps.bindingInformation")
  lines.push("}")
  lines.push("")
  lines.push("# Resolve certificate thumbprint")
  lines.push('$thumb = (Get-ChildItem "' + storeLocation + '" |')
  lines.push("    Where-Object { $_.FriendlyName -eq $certFriendlyName } |")
  lines.push("    Select-Object -First 1).Thumbprint")
  lines.push("if (-not $thumb) {")
  lines.push('    Write-SetupLog "Certificate \'$certFriendlyName\' not found in ' + storeLocation + '" "ERROR"')
  lines.push('    throw "Certificate \'$certFriendlyName\' not found."')
  lines.push("}")
  lines.push('$thumb = $thumb -replace "\\s", ""')
  lines.push("")
  lines.push("New-WebBinding -Name $siteName -Protocol https -HostHeader $siteHost -Port $sitePort -SslFlags 0 | Out-Null")
  lines.push("$newBinding = Get-WebBinding -Name $siteName -Protocol https -HostHeader $siteHost -Port $sitePort")
  lines.push('$bindingInfo = "$($newBinding.bindingInformation)"')
  lines.push('$bindParts = $bindingInfo -split ":"')
  lines.push("$ipAddress = $bindParts[0]")
  lines.push("$portStr = $bindParts[1]")
  lines.push("$hostname = $bindParts[2]")
  lines.push(
    '& netsh http add sslcert ipport="${ipAddress}:${portStr}" certhash=$thumb appid="{$([Guid]::NewGuid().ToString())}" certstorename=MY | Out-Null',
  )
  lines.push('Write-SetupLog "HTTPS binding configured for $siteName ($siteHost`:$sitePort, thumb $thumb)."')
  lines.push("")
  lines.push("# Start website")
  lines.push("try {")
  lines.push("    Start-WebSite -Name $siteName -ErrorAction Stop")
  lines.push('    Write-SetupLog "Started website \'$siteName\'."')
  lines.push("} catch {")
  lines.push('    Write-SetupLog "Failed to start website \'$siteName\': $($_.Exception.Message)" "ERROR"')
  lines.push("}")
  return lines.join("\n")
}

/**
 * Build the full IIS setup script. Each site block is rendered with
 * `renderIisSiteBlock` so failures in one site don't abort the others —
 * the caller (administrator) inspects the log at the end.
 */
export function buildIisSetupScript(
  sites: IisSiteConfig[],
  iisBasePath: string,
  ssl: SslConfig,
  opts: IisSetupScriptOptions = {},
): string {
  const scriptLog = escapePs(opts.logPath ?? "C:\\Raawee\\Logs\\setup-agent-iis.log")

  const header =
    "# =====================================================================\n" +
    "# IIS configuration script — generated by Setup Agent.\n" +
    "# Idempotent: safe to re-run. Run as Administrator.\n" +
    "# Total sites: " + sites.length + "\n" +
    sites.map((site, idx) => "# [" + (idx + 1) + "/" + sites.length + "] " + site.name).join("\n") +
    "\n# =====================================================================\n" +
    "\n" +
    "$ErrorActionPreference = 'Continue'   # do NOT abort the script on a single site failure\n" +
    "$ProgressPreference = 'SilentlyContinue'\n" +
    "Import-Module WebAdministration\n" +
    "\n" +
    '$ScriptLog = "' + scriptLog + '"\n' +
    "New-Item -Path (Split-Path -Parent $ScriptLog) -ItemType Directory -Force | Out-Null\n" +
    "\n" +
    "function Write-SetupLog {\n" +
    "    param([string]$Message, [string]$Level = \"INFO\")\n" +
    "    $line = \"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message\"\n" +
    "    Add-Content -Path $ScriptLog -Value $line\n" +
    "    if ($Level -eq \"ERROR\") { Write-Host $line -ForegroundColor Red }\n" +
    "    elseif ($Level -eq \"WARN\") { Write-Host $line -ForegroundColor Yellow }\n" +
    "    else { Write-Host $line -ForegroundColor Cyan }\n" +
    "}\n" +
    "\n" +
    'Write-SetupLog "Starting IIS setup for ' + sites.length + ' site(s)."\n'

  const body = sites.map((s) => renderIisSiteBlock(s, iisBasePath, ssl)).join("\n")

  const footer = "\nWrite-SetupLog \"IIS setup complete.\"\n"

  return header + body + footer
}

/** Escape a string for embedding inside a double-quoted PowerShell string. */
function escapePs(input: string): string {
  return input.replace(/`/g, "``").replace(/"/g, '`"').replace(/\$/g, "`$")
}
