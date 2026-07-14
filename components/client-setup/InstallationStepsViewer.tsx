'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import Image from 'next/image'

interface Step {
  id: string
  number: number
  title: string
  description: string
  image: string
  details: string[]
}

const steps: Step[] = [
  {
    id: 'step1',
    number: 1,
    title: 'Step 1: Pipeline Permissions',
    description: 'Configure Azure DevOps variable groups and pipeline permissions.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-944bzfoxf7m9WG8t4D9PS0S4fk6tAE.png',
    details: [
      'Navigate to Pipelines → Library → Variable groups in Azure DevOps',
      'Create variable groups for your environment (rwk12, Demo, Production, etc.)',
      'Add configuration keys: ClientID, Environment, BackupFolder, BaseFilePath',
      'Mark sensitive values as secrets for security',
      'Set pipeline permissions: Click + icon to link variable groups to pipelines',
      'Save changes to enable pipeline access to variables',
    ],
  },
  {
    id: 'step2',
    number: 2,
    title: 'Step 2: Azure DevOps Organization Settings',
    description: 'Configure your Azure DevOps organization for agent pools.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-kfGxq03RfLPIMLoj2MJlbNLYqoFDVR.png',
    details: [
      'Navigate to Organization Settings in Azure DevOps',
      'Go to Pipelines → Agent pools section',
      'Create or select your deployment agent pool',
      'Configure pool settings for your deployment environment',
      'Note the pool name for agent configuration',
    ],
  },
  {
    id: 'step3',
    number: 3,
    title: 'Step 3: Agent Pools Dashboard',
    description: 'View and manage available agent pools.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-e0AHTH8scnt1Cv1OdZhcfszLyoG0U3.png',
    details: [
      'Select the "Deploy" agent pool from available options',
      'View all configured agent pools in your organization',
      'Each pool can have multiple agents for load distribution',
      'Monitor agent pool status and capacity',
      'Create new pools for different environments (Staging, Production, etc.)',
    ],
  },
  {
    id: 'step4',
    number: 4,
    title: 'Step 4: Download Azure Pipelines Agent',
    description: 'Download and extract the agent software.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VlkS90J3ZvjZ7fLoPnsi11B3TNlHAD.png',
    details: [
      'Click "New agent" button in Agent pools',
      'Select Windows, macOS, or Linux based on your deployment server',
      'Select architecture: x64, x86, or arm64',
      'Click "Download" or copy the download link',
      'Extract the agent package to C:\\azagent or preferred directory',
      'Keep the path simple without spaces for compatibility',
    ],
  },
  {
    id: 'step5',
    number: 5,
    title: 'Step 5: Run Deployment Pipelines',
    description: 'Execute the frontend and backend deployment pipelines.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RUejHkTecU0d55u0YgsXwfPHYciRun.png',
    details: [
      'Navigate to Pipelines → Jobs section',
      'View all pipeline jobs and their execution history',
      'Monitor job status: Running, Completed, or Failed',
      'Click on a job to view detailed logs and outputs',
      'Red X indicates failed jobs requiring attention',
      'Green checkmark indicates successful completion',
      'Use job duration information for performance monitoring',
    ],
  },
  {
    id: 'step6',
    number: 6,
    title: 'Step 6: Understand Deployment Workflow',
    description: 'Learn the complete deployment and update process flow.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-qcLgn0ALvhGaMsedmA7HYQxieAEgQK.png',
    details: [
      'Azure trigger initiates the deployment workflow',
      'Build is saved in Azure repository',
      'Stop IIS Server before deployment',
      'Download deployment artifacts from Azure',
      'Create system backups before updating files',
      'Skip step allows bypassing optional tasks',
      'Update Ocelot.json configuration file',
      'Copy and replace updated files on IIS Server',
      'Restart IIS Server to apply changes',
      'Run health checks to verify deployment success',
    ],
  },
  {
    id: 'step7',
    number: 7,
    title: 'Step 7: Service Configuration',
    description: 'Configure Windows Services for deployment.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-LGtPR1pF3vgEwhQRBShdmxXAZCFK2y.png',
    details: [
      'Open Windows Services to view available services',
      'Locate the Azure Pipelines Agent service',
      'Service shows deployment status and health',
      'Verify service is running with status "Running"',
      'Check service startup type is set to "Automatic"',
      'Other services visible: IIS, SQL Server, RabbitMQ, MongoDB',
      'Monitor service health and restart if needed',
    ],
  },
  {
    id: 'step8',
    number: 8,
    title: 'Step 8: Agent Configuration',
    description: 'Configure the Azure Pipelines Agent service properties.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-SuF4VtLGIHIhddoNT2Wd8TcqijVNtj.png',
    details: [
      'Right-click Azure Pipelines Agent service and select Properties',
      'Go to "Log On" tab to configure service credentials',
      'Select "Local System account" for maximum permissions',
      'Check "Allow service to interact with desktop" option',
      'This allows deployments to interact with IIS and other services',
      'Click Apply and OK to save configuration',
      'Restart the service for changes to take effect',
    ],
  },
  {
    id: 'step9',
    number: 9,
    title: 'Step 9: Agent Pools Status',
    description: 'Verify agent pools and deployment configuration.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-e0AHTH8scnt1Cv1OdZhcfszLyoG0U3.png',
    details: [
      'Navigate to Organization Settings → Pipelines → Agent pools',
      'Verify all agents show "Online" status',
      'Check agent pool assignment matches pipeline configuration',
      'View agent version and capabilities',
      'Ensure Deploy pool has at least one online agent',
      'Configure multiple agents for high availability',
      'Monitor agent utilization and performance',
      'System is ready for deployment when all agents are online',
    ],
  },
]

export function InstallationStepsViewer() {
  const [expandedStep, setExpandedStep] = useState<string>('step1')
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? '' : stepId)
  }

  const toggleComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId)
    } else {
      newCompleted.add(stepId)
    }
    setCompletedSteps(newCompleted)
  }

  const progressPercentage = Math.round((completedSteps.size / steps.length) * 100)

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950/80 backdrop-blur border-b border-slate-700/50 px-8 py-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Azure DevOps Deployment Setup Guide</h1>
          <p className="text-slate-400 text-sm mb-4">Complete step-by-step instructions for configuring and deploying AttendancePlus</p>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">
              {completedSteps.size}/{steps.length} Complete
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden transition-all duration-300 hover:border-slate-600"
            >
              {/* Step Header */}
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-750 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  {/* Step Number Badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white">{step.title}</h2>
                    <p className="text-sm text-slate-400 mt-1">{step.description}</p>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {completedSteps.has(step.id) && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {expandedStep === step.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedStep === step.id && (
                <div className="border-t border-slate-700 bg-slate-750 px-6 py-6">
                  <div className="space-y-6">
                    {/* Screenshot */}
                    <div className="relative w-full bg-black rounded-lg overflow-hidden border border-slate-600">
                      <Image
                        src={step.image}
                        alt={step.title}
                        width={1200}
                        height={700}
                        className="w-full h-auto"
                        priority
                      />
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Implementation Details</h3>
                      <ul className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="text-cyan-400 font-bold flex-shrink-0 mt-0.5">•</span>
                            <span className="text-slate-300 text-sm leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Complete Button */}
                    <button
                      onClick={() => toggleComplete(step.id)}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                        completedSteps.has(step.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {completedSteps.has(step.id) ? '✓ Completed' : 'Mark as Completed'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="border-t border-slate-700/50 bg-slate-950/80 backdrop-blur px-8 py-4 sticky bottom-0">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-slate-400">
            {progressPercentage === 100
              ? '✓ All steps completed! Your Azure DevOps deployment is ready.'
              : `Progress: ${completedSteps.size} of ${steps.length} steps completed`}
          </p>
        </div>
      </div>
    </div>
  )
}
