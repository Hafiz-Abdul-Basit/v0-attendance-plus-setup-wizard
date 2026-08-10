'use client'

/**
 * ServerSetup — the "Server Setup / IIS Deployment" tab inside the
 * existing Setup Agent.
 *
 * UI sections (top to bottom):
 *   1. Privilege banner (warns the operator that PowerShell scripts must
 *      be run as Administrator on the target Windows server)
 *   2. Configuration form (paths, Azure DevOps, MongoDB, SSL, IIS sites,
 *      pinned versions). The PAT input is masked and never persisted to
 *      localStorage.
 *   3. Step list with live status (pending / running / success / failed
 *      / skipped) + Start button
 *   4. Live log feed + final summary
 *   5. PowerShell script downloads (mongo, extract, iis, combined)
 *
 * State shape mirrors `RedactedServerSetupConfig` so the PAT is never
 * round-tripped to the server in a way that would leak it through logs
 * or persisted storage.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Download,
  Loader2,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  SETUP_STEP_LABELS,
  type RedactedServerSetupConfig,
  type SetupRunState,
  type SetupStepId,
  type IisSiteConfig,
} from '@/lib/setup-agent/client'

const PAT_KEY = 'attendance-plus-setup-agent-pat'
const CONFIG_KEY = 'attendance-plus-setup-agent-config'

interface BootstrapResponse {
  config: RedactedServerSetupConfig
  privilege: {
    isElevated: boolean
    platform: string
    label: string
    message: string
    requireOperatorElevation: boolean
  }
  pinnedVersions: { rabbitMq: string; erlang: string }
}

const EMPTY_SITE: IisSiteConfig = {
  name: '',
  port: 443,
  physicalSubPath: '',
  host: '',
}

export function ServerSetup() {
  // ------- Bootstrap (default config + privilege info) -------
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  // Local form state. The PAT lives in a separate ref (never persisted).
  const [config, setConfig] = useState<RedactedServerSetupConfig | null>(null)
  const patRef = useRef<string>('')
  // ------- Run state -------
  const [runId, setRunId] = useState<string | null>(null)
  const [run, setRun] = useState<SetupRunState | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [validationReport, setValidationReport] = useState<
    Array<{
      id: string
      category: string
      label: string
      status: 'ok' | 'warn' | 'fail' | 'skipped'
      message: string
    }> | null
  >(null)
  const [isValidating, setIsValidating] = useState(false)
  // Active log filter to keep the panel readable.
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn'>('all')

  // Load bootstrap + persisted (redacted) config on mount.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/setup-agent/run', { method: 'GET' })
        if (!res.ok) {
          throw new Error(`bootstrap failed: ${res.status}`)
        }
        const data = (await res.json()) as BootstrapResponse
        if (cancelled) return
        setBootstrap(data)

        // Merge persisted (redacted) config over the defaults so the user
        // doesn't have to re-type the IIS site list every visit.
        const persisted = loadPersistedConfig()
        const merged: RedactedServerSetupConfig = persisted
          ? mergeRedacted(data.config, persisted)
          : data.config
        setConfig(merged)
        // PAT lives only in memory. We never persist it.
        patRef.current = ''
      } catch (err) {
        if (!cancelled) {
          setBootstrapError(
            err instanceof Error ? err.message : String(err),
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Poll the run state while a run is in flight.
  useEffect(() => {
    if (!runId || !isRunning) return
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch(`/api/setup-agent/runs/${runId}`)
        if (!res.ok) return
        const next = (await res.json()) as SetupRunState
        if (cancelled) return
        setRun(next)
        if (next.finishedAt) {
          setIsRunning(false)
        }
      } catch {
        // ignore transient errors; polling resumes next tick
      }
    }
    void tick()
    const timer = setInterval(tick, 1500)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [runId, isRunning])

  const fullConfig = useMemo(() => {
    // Build the *unredacted* config that we send to the server. The PAT
    // comes from the unmasked ref. We never send this object back to the
    // client after the API call.
    if (!config) return null
    return {
      ...config,
      azureDevOps: {
        ...config.azureDevOps,
        personalAccessToken: patRef.current,
      },
    }
  }, [config])

  const updateConfig = (next: RedactedServerSetupConfig) => {
    setConfig(next)
    savePersistedConfig(next)
  }

  const updateSite = (idx: number, patch: Partial<IisSiteConfig>) => {
    if (!config) return
    const sites = config.iisSites.slice()
    sites[idx] = { ...sites[idx], ...patch }
    updateConfig({ ...config, iisSites: sites })
  }

  const addSite = () => {
    if (!config) return
    updateConfig({ ...config, iisSites: [...config.iisSites, { ...EMPTY_SITE }] })
  }

  const removeSite = (idx: number) => {
    if (!config) return
    const sites = config.iisSites.slice()
    sites.splice(idx, 1)
    updateConfig({ ...config, iisSites: sites })
  }

  const validate = async () => {
    if (!fullConfig) return
    setIsValidating(true)
    try {
      const res = await fetch('/api/setup-agent/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig),
      })
      const data = (await res.json()) as {
        ok: boolean
        checks: Array<{
          id: string
          category: string
          label: string
          status: 'ok' | 'warn' | 'fail' | 'skipped'
          message: string
        }>
      }
      setValidationReport(data.checks ?? [])
      toast.success(data.ok ? 'Validation completed.' : 'Validation reported issues.')
    } catch (err) {
      toast.error('Validation failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsValidating(false)
    }
  }

  const startRun = async () => {
    if (!fullConfig) return
    if (!fullConfig.azureDevOps.personalAccessToken) {
      toast.error('Azure DevOps PAT is required to start the run.')
      return
    }
    setIsRunning(true)
    setRun(null)
    setValidationReport(null)
    try {
      const res = await fetch('/api/setup-agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Run start failed: ${res.status} ${body}`)
      }
      const { runId: id } = (await res.json()) as { runId: string }
      setRunId(id)
      toast.success('Setup run started.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      setIsRunning(false)
    }
  }

  // ------ Downloads ------------------------------------------------
  const downloadScript = async (
    type: 'iis' | 'mongo' | 'extract' | 'all',
  ) => {
    if (!fullConfig) return
    try {
      const res = await fetch(`/api/setup-agent/scripts?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig),
      })
      if (!res.ok) {
        throw new Error(`Script generation failed: ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type === 'all' ? 'setup-agent' : type}.ps1`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${a.download}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  if (bootstrapError) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
        Failed to bootstrap the Setup Agent: {bootstrapError}
      </div>
    )
  }

  if (!bootstrap || !config) {
    return (
      <div className="flex items-center gap-2 p-8 text-slate-600 dark:text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading Setup Agent…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Privilege banner */}
      <PrivilegeBanner privilege={bootstrap.privilege} />

      {/* Configuration form */}
      <ConfigSection title="Deployment Paths">
        <Field label="Deployment base path" hint="Where downloaded artifacts are staged.">
          <Input
            value={config.deploymentBasePath}
            onChange={(e) => updateConfig({ ...config, deploymentBasePath: e.target.value })}
            placeholder="D:\\myNGApp\\Deployments\\Rk12.AttPlus.Integration"
          />
        </Field>
        <Field label="IIS base path" hint="Physical parent of each IIS site.">
          <Input
            value={config.iisBasePath}
            onChange={(e) => updateConfig({ ...config, iisBasePath: e.target.value })}
            placeholder="D:\\myNgApp\\Rk12.AttPlus.Solution.US"
          />
        </Field>
      </ConfigSection>

      <ConfigSection title="Azure DevOps">
        <Field label="Organization">
          <Input
            value={config.azureDevOps.organization}
            onChange={(e) =>
              updateConfig({
                ...config,
                azureDevOps: { ...config.azureDevOps, organization: e.target.value },
              })
            }
            placeholder="Raaweek12Organization"
          />
        </Field>
        <Field label="Project">
          <Input
            value={config.azureDevOps.project}
            onChange={(e) =>
              updateConfig({
                ...config,
                azureDevOps: { ...config.azureDevOps, project: e.target.value },
              })
            }
            placeholder="Rk12.AttPlus.Integration"
          />
        </Field>
        <Field label="Backend pipeline id">
          <Input
            type="number"
            inputMode="numeric"
            value={String(config.azureDevOps.backendPipelineId || '')}
            onChange={(e) =>
              updateConfig({
                ...config,
                azureDevOps: {
                  ...config.azureDevOps,
                  backendPipelineId: Number(e.target.value) || 0,
                },
              })
            }
          />
        </Field>
        <Field label="Frontend pipeline id">
          <Input
            type="number"
            inputMode="numeric"
            value={String(config.azureDevOps.frontendPipelineId || '')}
            onChange={(e) =>
              updateConfig({
                ...config,
                azureDevOps: {
                  ...config.azureDevOps,
                  frontendPipelineId: Number(e.target.value) || 0,
                },
              })
            }
          />
        </Field>
        <Field
          label="Personal Access Token"
          hint="Used only for this run. Never persisted, never displayed back."
        >
          <PasswordInput
            value={patRef.current}
            onChange={(e) => {
              patRef.current = e.target.value
              // Trigger re-render so the UI reflects the masked input
              setConfig((prev) => (prev ? { ...prev } : prev))
            }}
            placeholder="Paste PAT"
            autoComplete="off"
          />
        </Field>
      </ConfigSection>

      <ConfigSection title="MongoDB">
        <Field label="Replica set name">
          <Input
            value={config.mongoDb.replicaSetName}
            onChange={(e) =>
              updateConfig({
                ...config,
                mongoDb: { ...config.mongoDb, replicaSetName: e.target.value },
              })
            }
          />
        </Field>
        <Field label="mongod config file path">
          <Input
            value={config.mongoDb.configFilePath}
            onChange={(e) =>
              updateConfig({
                ...config,
                mongoDb: { ...config.mongoDb, configFilePath: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Data directory">
          <Input
            value={config.mongoDb.dbPath}
            onChange={(e) =>
              updateConfig({
                ...config,
                mongoDb: { ...config.mongoDb, dbPath: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Log file path">
          <Input
            value={config.mongoDb.logPath}
            onChange={(e) =>
              updateConfig({
                ...config,
                mongoDb: { ...config.mongoDb, logPath: e.target.value },
              })
            }
          />
        </Field>
      </ConfigSection>

      <ConfigSection title="SSL Certificate">
        <Field label="Friendly name" hint="Cert is looked up under Cert:\\LocalMachine\\My.">
          <Input
            value={config.ssl.certificateFriendlyName}
            onChange={(e) =>
              updateConfig({
                ...config,
                ssl: { ...config.ssl, certificateFriendlyName: e.target.value },
              })
            }
            placeholder="*.raaweek12_01-2026"
          />
        </Field>
        <Field label="Store location">
          <Input
            value={config.ssl.storeLocation}
            onChange={(e) =>
              updateConfig({
                ...config,
                ssl: { ...config.ssl, storeLocation: e.target.value },
              })
            }
          />
        </Field>
      </ConfigSection>

      <ConfigSection title="Pinned Software Versions">
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
          These versions are pinned because RabbitMQ and Erlang have an ABI
          compatibility requirement. Do not change without coordinated upgrade.
        </p>
        <Field label="RabbitMQ">
          <Input
            value={config.softwareVersions.rabbitMq}
            onChange={(e) =>
              updateConfig({
                ...config,
                softwareVersions: { ...config.softwareVersions, rabbitMq: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Erlang">
          <Input
            value={config.softwareVersions.erlang}
            onChange={(e) =>
              updateConfig({
                ...config,
                softwareVersions: { ...config.softwareVersions, erlang: e.target.value },
              })
            }
          />
        </Field>
      </ConfigSection>

      <ConfigSection title="IIS Sites">
        <div className="space-y-3">
          {config.iisSites.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No sites configured. Add at least one to enable the run.
            </p>
          )}
          {config.iisSites.map((site, idx) => (
            <div
              key={`${site.name}-${idx}`}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field label="Name" small>
                  <Input
                    value={site.name}
                    onChange={(e) => updateSite(idx, { name: e.target.value })}
                  />
                </Field>
                <Field label="Port" small>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={String(site.port || '')}
                    onChange={(e) =>
                      updateSite(idx, { port: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Host" small>
                  <Input
                    value={site.host}
                    onChange={(e) => updateSite(idx, { host: e.target.value })}
                  />
                </Field>
                <Field label="Physical sub-path" small>
                  <Input
                    value={site.physicalSubPath ?? ''}
                    onChange={(e) =>
                      updateSite(idx, { physicalSubPath: e.target.value })
                    }
                    placeholder="optional"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSite(idx)}
                  className="gap-2 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              </div>
            </div>
          ))}
          <Button onClick={addSite} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add site
          </Button>
        </div>
      </ConfigSection>

      {/* Steps + run controls */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Setup Steps
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={validate} disabled={isValidating} className="gap-2">
              {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Validate
            </Button>
            <Button onClick={startRun} disabled={isRunning} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Running…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Start setup
                </>
              )}
            </Button>
          </div>
        </div>
        <ol className="space-y-2">
          {(Object.entries(SETUP_STEP_LABELS) as Array<[SetupStepId, string]>).map(([id, label]) => {
            const step = run?.steps.find((s) => s.id === id)
            return (
              <li key={id} className="flex items-start gap-3 text-sm">
                <StepIcon status={step?.status ?? 'pending'} />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{label}</div>
                  {step?.message && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">{step.message}</div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Validation report */}
      {validationReport && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Validation report
          </h2>
          <ul className="space-y-1 text-sm">
            {validationReport.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <ValidationGlyph status={c.status} />
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{c.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{c.message}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Live log + summary */}
      {run && run.logs.length > 0 && (
        <div className="bg-slate-950 text-slate-100 rounded-lg border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="text-sm font-semibold">Live setup log</div>
            <div className="flex items-center gap-2 text-xs">
              <select
                aria-label="Filter logs"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as 'all' | 'error' | 'warn')}
                className="rounded bg-slate-800 px-2 py-1 text-slate-100 border border-slate-700"
              >
                <option value="all">All</option>
                <option value="warn">Warnings + errors</option>
                <option value="error">Errors only</option>
              </select>
            </div>
          </div>
          <div className="px-4 py-3 max-h-72 overflow-y-auto font-mono text-xs leading-5">
            {run.logs
              .filter((l) =>
                logFilter === 'all'
                  ? true
                  : logFilter === 'error'
                  ? l.level === 'error'
                  : l.level === 'error' || l.level === 'warn',
              )
              .map((l, idx) => (
                <div
                  key={idx}
                  className={
                    l.level === 'error'
                      ? 'text-red-300'
                      : l.level === 'warn'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }
                >
                  [{l.timestamp}] {l.step}: {l.message}
                </div>
              ))}
          </div>
        </div>
      )}

      {run && run.finishedAt && (
        <SummaryBlock run={run} />
      )}

      {/* PowerShell downloads */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            PowerShell Scripts
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Download the idempotent PowerShell scripts the operator runs on the
          target Windows server as Administrator.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadScript('all')} className="gap-2">
            <Download className="h-4 w-4" /> Combined (.ps1)
          </Button>
          <Button variant="outline" onClick={() => downloadScript('mongo')} className="gap-2">
            <Download className="h-4 w-4" /> MongoDB
          </Button>
          <Button variant="outline" onClick={() => downloadScript('extract')} className="gap-2">
            <Download className="h-4 w-4" /> Extract
          </Button>
          <Button variant="outline" onClick={() => downloadScript('iis')} className="gap-2">
            <Download className="h-4 w-4" /> IIS
          </Button>
        </div>
      </div>
    </div>
  )
}

// ----- helpers / subcomponents ----------------------------------------------------

function PrivilegeBanner({
  privilege,
}: {
  privilege: BootstrapResponse['privilege']
}) {
  const ok = !privilege.requireOperatorElevation
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        ok
          ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100'
          : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100'
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      )}
      <div className="text-sm">
        <p className="font-semibold">
          {ok ? 'Privilege OK' : 'Operator elevation required'}
        </p>
        <p className="text-xs opacity-90">{privilege.message}</p>
        <p className="text-xs opacity-75 mt-1">
          This web app runs in your browser — it cannot elevate itself. Run the
          generated PowerShell scripts on the target server from an elevated
          PowerShell session.
        </p>
      </div>
    </div>
  )
}

function ConfigSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
  small,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  small?: boolean
}) {
  return (
    <label className={small ? 'block' : 'block md:col-span-1'}>
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </label>
  )
}

function StepIcon({
  status,
}: {
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'partial-success'
}) {
  if (status === 'running')
    return <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-blue-500" />
  if (status === 'success')
    return <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
  if (status === 'failed')
    return <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
  if (status === 'partial-success')
    return <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
  if (status === 'skipped')
    return <CircleDashed className="h-4 w-4 mt-0.5 text-slate-400" />
  return <CircleDashed className="h-4 w-4 mt-0.5 text-slate-400" />
}

function ValidationGlyph({
  status,
}: {
  status: 'ok' | 'warn' | 'fail' | 'skipped' | 'pending' | 'running' | 'success' | 'failed' | 'partial-success'
}) {
  if (status === 'success' || status === 'ok')
    return <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
  if (status === 'warn')
    return <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
  if (status === 'failed' || status === 'fail')
    return <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
  if (status === 'running')
    return <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-blue-500" />
  if (status === 'partial-success')
    return <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
  return <CircleDashed className="h-4 w-4 mt-0.5 text-slate-400" />
}

function SummaryBlock({ run }: { run: SetupRunState }) {
  const overallClass =
    run.overallStatus === 'success'
      ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100'
      : run.overallStatus === 'failed'
      ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100'
      : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100'

  return (
    <div className={`rounded-lg border p-4 ${overallClass}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Final Deployment Summary</h2>
        <span className="text-xs uppercase font-bold">{run.overallStatus}</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {run.steps.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <ValidationGlyph status={s.status} />
            <span>{SETUP_STEP_LABELS[s.id]}</span>
            <span className="text-xs opacity-70 ml-auto">{s.status}</span>
          </li>
        ))}
      </ul>
      {run.finishedAt && (
        <p className="mt-3 text-xs opacity-75">Finished at {run.finishedAt}</p>
      )}
    </div>
  )
}

// ------ persistence helpers ------

type PersistedShape = Omit<RedactedServerSetupConfig, 'azureDevOps'> & {
  azureDevOps: Omit<RedactedServerSetupConfig['azureDevOps'], 'hasPat'>
}

function loadPersistedConfig(): PersistedShape | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY)
    return raw ? (JSON.parse(raw) as PersistedShape) : null
  } catch {
    return null
  }
}

function savePersistedConfig(next: RedactedServerSetupConfig): void {
  if (typeof window === 'undefined') return
  try {
    const persisted: PersistedShape = {
      ...next,
      azureDevOps: {
        organization: next.azureDevOps.organization,
        project: next.azureDevOps.project,
        backendPipelineId: next.azureDevOps.backendPipelineId,
        frontendPipelineId: next.azureDevOps.frontendPipelineId,
      },
    }
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(persisted))
  } catch {
    // localStorage may be disabled (private mode) — fail silent.
  }
}

/** Merge a persisted (redacted) shape over the bootstrap defaults. */
function mergeRedacted(
  base: RedactedServerSetupConfig,
  persisted: PersistedShape,
): RedactedServerSetupConfig {
  return {
    ...base,
    ...persisted,
    azureDevOps: {
      ...base.azureDevOps,
      ...persisted.azureDevOps,
      hasPat: false, // never persist a PAT
    },
    iisSites: persisted.iisSites ?? base.iisSites,
    mongoDb: persisted.mongoDb ?? base.mongoDb,
    ssl: persisted.ssl ?? base.ssl,
    softwareVersions: persisted.softwareVersions ?? base.softwareVersions,
  }
}
