'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { getEstimatedDeploymentTime, getDeploymentRecommendations } from '@/utils/setupUtils'
import { Clock, AlertTriangle, Lightbulb } from 'lucide-react'
import { useState } from 'react'

export interface Installation {
  id: string
  name: string
  description: string
  category: string
}

const INSTALLATIONS: Installation[] = [
  {
    id: 'chrome',
    name: 'Chrome Browser',
    description: 'Download and install Google Chrome',
    category: 'Browser',
  },
  {
    id: 'urlRewrite',
    name: 'IIS URL Rewrite',
    description: 'Install URL Rewrite module (x86 & x64)',
    category: 'IIS',
  },
  {
    id: 'iisFeatures',
    name: 'IIS Web Server Features',
    description: 'Enable required IIS roles and features',
    category: 'IIS',
  },
  {
    id: 'dotnet',
    name: '.NET 8 Runtime',
    description: 'Install .NET 8 SDK and Hosting Bundle',
    category: '.NET',
  },
  {
    id: 'erlang',
    name: 'Erlang OTP',
    description: 'Install Erlang runtime (required for RabbitMQ)',
    category: 'Message Queue',
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ Server',
    description: 'Install and configure RabbitMQ message broker',
    category: 'Message Queue',
  },
  {
    id: 'mongodb',
    name: 'MongoDB Community',
    description: 'Install MongoDB database engine with tools',
    category: 'Database',
  },
  {
    id: 'mongodbReplica',
    name: 'MongoDB Replica Set',
    description: 'Configure MongoDB replica set for clustering',
    category: 'Database',
  },
  {
    id: 'sqlServer',
    name: 'SQL Server 2017 Developer',
    description: 'Install SQL Server 2017 Developer Edition',
    category: 'Database',
  },
  {
    id: 'certificates',
    name: 'SSL Certificates',
    description: 'Import and configure SSL certificates',
    category: 'Security',
  },
  {
    id: 'hostsFile',
    name: 'Windows Hosts File',
    description: 'Update hosts file with client URLs',
    category: 'Configuration',
  },
  {
    id: 'iisSites',
    name: 'IIS Sites & App Pools',
    description: 'Create IIS sites and application pools',
    category: 'IIS',
  },
  {
    id: 'webConfig',
    name: 'Application Configuration',
    description: 'Generate web.config and app.config files',
    category: 'Configuration',
  },
]

interface InstallationSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function InstallationSelector({
  selected,
  onChange,
}: InstallationSelectorProps) {
  const [showRecommendations, setShowRecommendations] = useState(true)

  const groupedByCategory = INSTALLATIONS.reduce(
    (acc, inst) => {
      if (!acc[inst.category]) acc[inst.category] = []
      acc[inst.category].push(inst)
      return acc
    },
    {} as Record<string, Installation[]>
  )

  const allSelected = selected.length === INSTALLATIONS.length
  const allDeselected = selected.length === 0
  
  // Get installation names from selected IDs
  const selectedInstallations = INSTALLATIONS.filter(inst => selected.includes(inst.id)).map(inst => inst.name)
  const deploymentTime = getEstimatedDeploymentTime(selectedInstallations)
  const recommendations = getDeploymentRecommendations(selectedInstallations)

  const toggleAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(INSTALLATIONS.map((inst) => inst.id))
    }
  }

  const toggleInstallation = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Select Installations</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Choose which components to install and configure
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="border-slate-300 dark:border-slate-700"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {/* Deployment Info Cards */}
        {selected.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">Estimated Time</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {deploymentTime.min}-{deploymentTime.max} minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm mb-1">Selections</p>
                  <p className="text-xs text-indigo-800 dark:text-indigo-200">
                    {selected.length} of {INSTALLATIONS.length} installations
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && showRecommendations && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">Recommendations</p>
                <ul className="space-y-1">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByCategory).map(([category, installations]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 z-10 bg-gradient-to-b from-white dark:from-slate-950 pb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {category}
                </h3>
                <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                  {installations.length} items
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {installations.filter(i => selected.includes(i.id)).length} selected
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {installations.map((installation) => (
                <label
                  key={installation.id}
                  className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150 group"
                >
                  <Checkbox
                    checked={selected.includes(installation.id)}
                    onCheckedChange={() =>
                      toggleInstallation(installation.id)
                    }
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {installation.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {installation.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
