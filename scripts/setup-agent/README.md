# Setup Agent — Server Setup / IIS Deployment

The Setup Agent already manages per-client PowerShell scripts. This
extension adds **automated server-side provisioning** that the existing
UI surfaces as a new tab: **Server Setup / IIS Deployment**.

## What it does

A single run performs these steps (each is idempotent and logs its result):

1. **Validate prerequisites** — paths exist, Azure DevOps config is
   valid, IIS site list is non-empty, pinned versions match the project
   convention.
2. **Resolve Azure DevOps artifacts** — fetch the latest successful
   build of the backend pipeline and the frontend pipeline. PAT is used
   server-side only, never returned to the client.
3. **MongoDB replica set** — idempotently write `replSetName` to the
   mongod config, restart the Windows service, initialize the replica
   set only if not already initialized, print `rs.status()`.
4. **Backend package extraction** — for every `*.zip` under the
   configured deployment base path: extract to a sibling folder named
   after the ZIP, delete the ZIP, rewrite `web.config` so
   `stdoutLogEnabled="true"` and `hostingModel="OutOfProcess"`. Other
   settings are left untouched.
5. **IIS application pools** — create one pool per IIS site (name
   matches the site). Identity = LocalSystem, `startMode =
   AlwaysRunning`, no managed runtime version.
6. **IIS websites** — create the website if missing, assign physical
   path and application pool.
7. **HTTPS / SSL bindings** — find the certificate by FriendlyName in
   `Cert:\LocalMachine\My`, normalize the thumbprint, recreate the
   HTTPS binding bound to that cert.
8. **Start websites** — start each site, log success / failure, never
   abort on a single site failure.
9. **Validate deployment** — verify expected directories, extracted
   folders, web.config files, MongoDB service, replica-set status.
10. **Final summary** — aggregate per-step status.

## Architecture

```
existing Setup Agent (unchanged)
  └── ClientSetupAgent.tsx  (added one new tab: "server-setup")
        └── components/client-setup/ServerSetup.tsx
              ├── /api/setup-agent/run        (bootstrap + launch)
              ├── /api/setup-agent/runs/[id]  (polled by UI)
              ├── /api/setup-agent/validate   (structural checks)
              ├── /api/setup-agent/scripts    (PowerShell generator)
              └── /api/setup-agent/download/[pipelineId]

lib/setup-agent/
  ├── types.ts              ← ServerSetupConfig + RedactedServerSetupConfig
  ├── logger.ts             ← secret-scrubbing setup logger (server-only)
  ├── azureArtifacts.ts     ← Azure DevOps Builds API client (server-only)
  ├── orchestrator.ts       ← run registry + step execution (server-only)
  ├── deploymentValidator.ts← structural path / config checks (server-only)
  ├── privilegeChecker.ts   ← detects current-process elevation
  ├── mongoSetup.ts         ← PowerShell generator for MongoDB setup
  ├── iisSetup.ts           ← PowerShell generator for IIS + SSL
  ├── deploymentExtractor.ts← PowerShell generator for ZIP extraction
  ├── client.ts             ← client-safe barrel (types + script gens)
  └── index.ts              ← server-only barrel

scripts/setup-agent/        ← PowerShell scripts the operator runs
  ├── Invoke-SetupAgent.ps1     (full orchestrator — copy to target)
  ├── Set-MongoReplicaSet.ps1
  ├── Get-BackendArtifact.ps1
  ├── Expand-BackendPackage.ps1
  ├── New-SetupAgentAppPool.ps1
  ├── New-SetupAgentWebsite.ps1
  ├── Test-SetupAgentDeployment.ps1
  └── Get-SetupAgentInlineConfig.ps1
```

The Setup Agent's existing tabs (`dashboard`, `new-client`,
`select-installations`, `script-generator`) are unchanged. The new
`server-setup` tab is added by extending the `Tab` union and adding one
button to the dashboard header.

## What is hardcoded (nothing)

Every value the spec called out as "do not hardcode" is configurable in
the UI or via env vars:

- Deployment base path
- IIS base path
- Azure DevOps organization / project / PAT / pipeline IDs
- MongoDB replica set name, bind IP, port, config file path, db path,
  log path, service name
- SSL certificate friendly name, store location
- IIS sites (name, port, host, physical path) — represented as
  configuration objects, one entry per site
- RabbitMQ version (`4.3.1`) and Erlang version (`27.3.4.13`) are pinned
  via the `softwareVersions` block — the UI clearly flags them as
  pinned and warns the operator.

## Security

- **PAT** is sent only over authenticated POST bodies (`/api/setup-agent/run`).
  It is never persisted in `localStorage`, never returned in any API
  response, never logged. The client uses a `useRef` so the value lives
  only in component memory until the POST.
- The `SetupLogger` scrubs the PAT from every emitted log line via
  regex (Basic auth, `pat=`, password-shaped key/value pairs, and
  MongoDB connection-string passwords).
- All PowerShell scripts generated for download are sanitised at
  generation time — `escapePs` escapes PowerShell-active characters
  (` `, `"`, `$`) before inlining user-supplied values into double-quoted
  strings.
- The validator never mutates any external system.

## Idempotency

| Step | Idempotent strategy |
|---|---|
| MongoDB config | Skip edit if `replSetName` already matches. |
| MongoDB replica set | Only call `rs.initiate` if `rs.status()` reports no init. |
| Package extraction | Zips already deleted are absent → loop is a no-op. |
| web.config | Compare `$content` before/after the rewrites; skip write if unchanged. |
| App pool | `Test-Path IIS:\AppPools\$name`; create only if missing. |
| Website | `Test-Path IIS:\Sites\$name`; create only if missing. |
| HTTPS binding | Remove the existing binding for host:port before recreating. |
| Cert | `Get-ChildItem Cert:\LocalMachine\My` filtered by FriendlyName. |
| Start | Wrap in try/catch; never abort other sites. |

## Running the Setup Agent flow

1. Sign in to the app and open **Setup Agent** in the left navigation.
2. Click **Server Setup** (new button next to "New Client").
3. Fill in:
   - Deployment paths (deployment base, IIS base)
   - Azure DevOps (organization, project, backend & frontend pipeline IDs, PAT)
   - MongoDB (replica set name, config file path, db path, log path)
   - SSL certificate FriendlyName
   - Pinned versions (RabbitMQ, Erlang — leave at defaults unless you
     know what you're doing)
   - IIS sites (one entry per site)
4. Click **Validate** — runs structural checks (path existence etc).
5. Click **Start setup** — kicks off the Azure DevOps artifact lookup
   server-side and starts polling.
6. Watch the live log + step list update.
7. Download the PowerShell scripts (`Combined`, `MongoDB`, `Extract`,
   `IIS`) at the bottom of the tab.
8. Transfer the scripts to the **target Windows server**, open
   **PowerShell as Administrator**, and run:

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\setup-agent.ps1
   ```

9. The combined script runs every step in order. Inspect the log file
   (`C:\Raawee\Logs\setup-agent.log` by default) at the end.

## Troubleshooting

- **PAT rejected (401/403)** — verify the PAT has `Build (Read)` scope
  in addition to the existing `Work Items (Read)`. Recreate at
  https://dev.azure.com/_usersSettings/tokens.
- **MongoDB service not found** — install MongoDB Community first; the
  script aborts with a clear message rather than guessing.
- **Certificate not found** — confirm the FriendlyName matches exactly
  (case-sensitive) and the cert is in `Cert:\LocalMachine\My`.
- **IIS site fails but others succeed** — inspect the log; the script
  never aborts on a single site failure.
- **Build has no successful artifacts** — the orchestrator logs a
  warning and continues. Trigger a successful pipeline run and retry.

## Required Windows prerequisites

The combined script assumes the target server already has:

- Windows Server 2019+ with IIS role enabled
- PowerShell 5.1+
- WebAdministration module (`Install-WindowsFeature Web-Scripting-Tools`)
- MongoDB Community Edition (the script does NOT install it; it
  configures an existing installation)
- `mongosh` on PATH for replica-set probes

The Setup Agent does not install RabbitMQ, Erlang, .NET, SQL Server,
Chrome, or URL Rewrite — those are still handled by the existing
"Generate Setup Script" tab (the four original tabs are unchanged).
