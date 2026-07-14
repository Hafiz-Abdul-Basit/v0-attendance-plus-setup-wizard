'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Download, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Step {
  id: string
  title: string
  description: string
  content: React.ReactNode
  substeps?: Substep[]
  image?: string
}

interface Substep {
  id: string
  title: string
  description: string
  image?: string
}

export function InstallationStepsViewer() {
  const [expandedSteps, setExpandedSteps] = useState<string[]>(['step1'])
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    )
  }

  const toggleComplete = (stepId: string) => {
    setCompletedSteps(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    )
  }

  const steps: Step[] = [
    {
      id: 'step1',
      title: 'Prerequisites & Review',
      description: 'Understand what will and won\'t be upgraded automatically',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-3">Items NOT Upgraded Automatically:</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Appsettings.json</strong> and appsettings.production.json</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Esign and Converse</strong> modules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Database scripts</strong> and MongoDB scripts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Log files</strong> or logs folder</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900 border border-yellow-600/30 rounded-lg p-4 mt-4">
            <p className="text-yellow-400 text-sm font-medium">⚠️ Manual intervention required for these items during upgrades.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Navigate to Agent Pools',
      description: 'Set up Azure DevOps Agent Pools',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-3">Step-by-Step:</h4>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">1.</span>
                <span>Log in to your Azure DevOps organization: <code className="bg-slate-800 px-2 py-1 rounded text-cyan-300 text-xs">https://dev.azure.com/Raaweek12Organization/</code></span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">2.</span>
                <span>Click on <strong>Organization settings</strong> in the bottom-left corner</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">3.</span>
                <span>In the left navigation, go to <strong>Pipelines → Agent pools</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">4.</span>
                <span>Select the <strong>Deploy</strong> pool from the available options</span>
              </li>
            </ol>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-kfGxq03RfLPIMLoj2MJlbNLYqoFDVR.png" 
              alt="Azure DevOps Organization Settings"
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Download & Configure Agent',
      description: 'Download and extract the Azure Pipelines Agent',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-3">Download Process:</h4>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">1.</span>
                <span>Click <strong>New agent</strong> button in the top-right corner</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">2.</span>
                <span>Ensure <strong>Windows</strong> tab and <strong>x64</strong> architecture are selected</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">3.</span>
                <span>Click the copy button to get the download link (or click Download)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">4.</span>
                <span>Extract files to: <code className="bg-slate-800 px-2 py-1 rounded text-cyan-300 text-xs">C:\azagent</code></span>
              </li>
            </ol>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VlkS90J3ZvjZ7fLoPnsi11B3TNlHAD.png" 
              alt="Get the Agent Download Dialog"
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'step4',
      title: 'Configure Agent via PowerShell',
      description: 'Run configuration commands on your local machine',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 text-sm">PowerShell Commands:</h4>
            <div className="space-y-2">
              <div className="bg-slate-950 rounded p-3 font-mono text-xs text-emerald-400">
                <div>PS C:\Windows\system32&gt; cd "C:\azagent"</div>
                <div>PS C:\azagent&gt; .\config.cmd</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 text-sm">Configuration Inputs:</h4>
            <div className="space-y-2 text-slate-300 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span>Server URL:</span>
                <code className="bg-slate-800 px-2 py-1 rounded text-cyan-300 text-xs">https://dev.azure.com/Raaweek12Organization/</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span>Authentication Type:</span>
                <span className="text-cyan-300">PAT (press enter)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span>Agent Pool:</span>
                <span className="text-cyan-300">Deploy</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span>Agent Name:</span>
                <span className="text-cyan-300">lodiUsd (must match env)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span>Run as Service:</span>
                <span className="text-cyan-300">Y (Yes)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>User Account:</span>
                <span className="text-cyan-300">NT AUTHORITY\NETWORK SERVICE</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">
              <strong className="text-white">Important:</strong> When prompted for Personal Access Token (PAT), enter the token provided by your administrator.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'step5',
      title: 'Configure Service Properties',
      description: 'Set up the Azure Pipelines Agent service to interact with desktop',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-3">Service Configuration Steps:</h4>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">1.</span>
                <span>Open <strong>Services</strong> application (search in Windows)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">2.</span>
                <span>Find <strong>Azure Pipelines Agent</strong> service and right-click it</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">3.</span>
                <span>Click <strong>Properties</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">4.</span>
                <span>Go to <strong>Log On</strong> tab</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">5.</span>
                <span>Select <strong>Local System account</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">6.</span>
                <span>Check: <strong>Allow service to interact with desktop</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">7.</span>
                <span>Click <strong>Apply</strong> → <strong>OK</strong> → Start the service</span>
              </li>
            </ol>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-SuF4VtLGIHIhddoNT2Wd8TcqijVNtj.png" 
              alt="Azure Pipelines Agent Service Properties"
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'step6',
      title: 'Create Variable Groups',
      description: 'Set up variable groups for backend and frontend deployments',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 text-sm">Backend Variable Group: RK12.AttPlus.Integration</h4>
            <div className="space-y-2 text-slate-300 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800"><span>AdministrationPort:</span> <span className="text-cyan-300">7239</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>AnalysisPort:</span> <span className="text-cyan-300">7296</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>backupFolder:</span> <span className="text-cyan-300">C:\Backups\IntegrationBackups</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>baseFilePath:</span> <span className="text-cyan-300">C:\Rk12.AttPlus.Solution.US\</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>CourtManagementPort:</span> <span className="text-cyan-300">7007</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>hostName:</span> <span className="text-cyan-300">attplusdemo.raaweek12.com</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>IdentityPort:</span> <span className="text-cyan-300">7206</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>InterventionPort:</span> <span className="text-cyan-300">7189</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>LetterDispatchPort:</span> <span className="text-cyan-300">7119</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>MessageHubPort:</span> <span className="text-cyan-300">7120</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>MiscPort:</span> <span className="text-cyan-300">7061</span></div>
              <div className="flex justify-between py-1"><span>SentLetterPort:</span> <span className="text-cyan-300">7101</span></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 text-sm">Frontend Variable Group: Angular</h4>
            <div className="space-y-2 text-slate-300 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800"><span>BackupFolder:</span> <span className="text-cyan-300">C:\Backups\AngularBackups</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800"><span>BaseFilePath:</span> <span className="text-cyan-300">C:\Rk12.AttPlus.Solution.US\Rk12.Web</span></div>
              <div className="flex justify-between py-1"><span>PoolName:</span> <span className="text-cyan-300">RK12.Web</span></div>
            </div>
          </div>

          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
            <p>After creating variable groups, go to <strong>Pipeline permissions</strong>, click the <strong>+</strong> icon, select your deployment pipeline, and save changes.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'step7',
      title: 'Run Frontend Pipeline (Angular)',
      description: 'Deploy your Angular application',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-3">Deployment Steps:</h4>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">1.</span>
                <span>Navigate to <strong>Pipelines</strong> in the frontend repository</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">2.</span>
                <span>Select <strong>angular-DirectBuild-Deploy</strong> pipeline</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">3.</span>
                <span>Click <strong>Run Pipeline</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">4.</span>
                <span>Choose your <strong>client environment</strong> and <strong>branch</strong> (default: master)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">5.</span>
                <span>Check <strong>"Create backup for existing build"</strong> if needed</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">6.</span>
                <span>Click <strong>Run</strong> to start deployment</span>
              </li>
            </ol>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PHwXfusDBCHwfXCA2oeGh1sZJrEuT.png" 
              alt="Run Pipeline Dialog"
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'step8',
      title: 'Run Backend Pipeline',
      description: 'Deploy your ASP.NET Core API',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-3">Deployment Steps:</h4>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">1.</span>
                <span>Navigate to <strong>Pipelines</strong> in the backend repository</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">2.</span>
                <span>Select <strong>AttPlus.Integration-DirectBuild-Deploy</strong> pipeline</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">3.</span>
                <span>Click <strong>Run Pipeline</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">4.</span>
                <span>Choose your <strong>client environment</strong> and <strong>branch</strong> (default: master)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">5.</span>
                <span>✓ Check <strong>"Clean up logs folder"</strong> to delete old logs before backup</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">6.</span>
                <span>✓ Check <strong>"Update ocelot.json"</strong> to update hostname and ports</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">7.</span>
                <span>Optionally select specific projects to deploy (leave unchecked to deploy all)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">8.</span>
                <span>✓ Check <strong>"Run health check"</strong> to verify each project after deployment</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold min-w-6">9.</span>
                <span>Click <strong>Run</strong> to start deployment</span>
              </li>
            </ol>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-lvAOSgY5qyxQPtX4okhpQUH5KKsZDW.png" 
              alt="Backend Pipeline Run Dialog"
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'step9',
      title: 'Monitor Deployment',
      description: 'Track pipeline execution and verify deployment success',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-3">What to Watch For:</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Green checkmarks ✓ indicate successful job completion</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Red X indicates a failed stage that needs attention</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Build artifacts are downloaded during deployment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>IIS is stopped, backups created, files replaced, then IIS restarted</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Health checks run automatically if enabled</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RUejHkTecU0d55u0YgsXwfPHYciRun.png" 
              alt="Pipeline Jobs Status"
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950/80 backdrop-blur border-b border-slate-700/50 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Installation & Setup Steps</h1>
          <p className="text-slate-400 text-sm">Complete guide for Azure DevOps automated deployment setup</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 px-8 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-cyan-400 font-semibold">{completedSteps.length}</span>
            <span>of</span>
            <span className="text-cyan-400 font-semibold">{steps.length}</span>
            <span>steps completed</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full transition-all"
              style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`rounded-lg border transition-all ${
                expandedSteps.includes(step.id)
                  ? 'bg-slate-800 border-cyan-500/50'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-700'
              }`}
            >
              {/* Step Header */}
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleComplete(step.id)
                    }}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      completedSteps.includes(step.id)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {completedSteps.includes(step.id) && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-white text-lg">{step.title}</h3>
                    <p className="text-slate-400 text-sm">{step.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-slate-400">
                  {expandedSteps.includes(step.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Step Content */}
              {expandedSteps.includes(step.id) && (
                <div className="border-t border-slate-700/50 px-6 py-4 bg-slate-800/30">
                  {step.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
