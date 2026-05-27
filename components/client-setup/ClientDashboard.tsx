'use client'

import { ClientSetup } from '@/utils/clientSetupStorage'
import { clientSetupStorage } from '@/utils/clientSetupStorage'
import { Button } from '@/components/ui/button'
import { Trash2, Settings, Code, Zap, Server } from 'lucide-react'

interface ClientDashboardProps {
  clients: ClientSetup[]
  onEdit: (clientId: string) => void
  onGenerateScript: (clientId: string) => void
  onDelete: (clientId: string) => void
}

export function ClientDashboard({
  clients,
  onEdit,
  onGenerateScript,
  onDelete,
}: ClientDashboardProps) {
  const getStatusColor = (progress: number) => {
    if (progress === 0) return 'bg-red-500'
    if (progress < 50) return 'bg-yellow-500'
    if (progress < 100) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStatusText = (progress: number) => {
    if (progress === 0) return 'Not Started'
    if (progress < 50) return 'In Progress'
    if (progress < 100) return 'Almost Done'
    return 'Completed'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg p-12 border border-slate-200 dark:border-slate-700">
          <Server className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Clients Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create your first client to start automating deployments
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Click the "New Client" button in the header to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {clients.map((client) => {
          const progress = clientSetupStorage.getSetupProgress(client)
          const statusColor = getStatusColor(progress)
          const statusText = getStatusText(progress)
          
          return (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{client.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      progress === 100 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : progress > 0 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                    }`}>
                      {statusText}
                    </span>
                  </div>

                  {/* URLs Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold uppercase tracking-wider">Configuration URLs</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Main</p>
                        <p className="text-sm text-slate-900 dark:text-white font-mono break-all">{client.mainUrl}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Gateway</p>
                        <p className="text-sm text-slate-900 dark:text-white font-mono break-all">{client.gatewayUrl}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Docs</p>
                        <p className="text-sm text-slate-900 dark:text-white font-mono break-all">{client.docsUrl}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Setup Progress</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${statusColor}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <Zap className="w-3 h-3 inline mr-1" />
                      {client.selectedInstallations.length} installation{client.selectedInstallations.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Created on {formatDate(client.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-6 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(client.id)}
                    title="Edit client"
                    className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onGenerateScript(client.id)}
                    title="Generate setup scripts"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <Code className="w-4 h-4" />
                    <span className="hidden sm:inline">Script</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(client.id)}
                    title="Delete client"
                    className="hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
