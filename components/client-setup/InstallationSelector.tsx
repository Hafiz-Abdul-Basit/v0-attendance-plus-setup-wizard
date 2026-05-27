'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

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
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAll}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>
        <span className="text-sm text-muted-foreground pt-2">
          {selected.length} of {INSTALLATIONS.length} selected
        </span>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByCategory).map(([category, installations]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">
              {category}
            </h3>
            <div className="space-y-2 pl-4 border-l-2 border-border">
              {installations.map((installation) => (
                <label
                  key={installation.id}
                  className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={selected.includes(installation.id)}
                    onCheckedChange={() =>
                      toggleInstallation(installation.id)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {installation.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
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
