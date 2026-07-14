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
    <div className="w-full space-y-4">
      <div className="grid w-full gap-4">
        {clients.map((client) => {
          const progress = clientSetupStorage.getSetupProgress(client)
          const statusColor = getStatusColor(progress)
          const statusText = getStatusText(progress)
          
          return (
            <div
              key={client.id}
              className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              {/* Header Section */}
              <div className="w-full bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${statusColor}`} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white break-words">{client.name}</h3>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0 ${
                    progress === 100 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : progress > 0 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {statusText}
                  </span>

                  {/* Actions */}
                  <div className="w-full sm:w-auto flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(client.id)}
                      title="Edit client"
                      className="flex-1 sm:flex-none border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onGenerateScript(client.id)}
                      title="Generate setup scripts"
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      <Code className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Script</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(client.id)}
                      title="Delete client"
                      className="flex-1 sm:flex-none hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="w-full p-4 sm:p-6 space-y-5">
                
                {/* URLs Section */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Configuration URLs</p>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Main Application</p>
                      <p className="text-sm text-slate-900 dark:text-white font-mono break-all line-clamp-2 hover:line-clamp-none cursor-help" title={client.mainUrl}>{client.mainUrl}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">API Gateway</p>
                      <p className="text-sm text-slate-900 dark:text-white font-mono break-all line-clamp-2 hover:line-clamp-none cursor-help" title={client.gatewayUrl}>{client.gatewayUrl}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SecureDoc/Docs</p>
                      <p className="text-sm text-slate-900 dark:text-white font-mono break-all line-clamp-2 hover:line-clamp-none cursor-help" title={client.docsUrl}>{client.docsUrl}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Setup Progress</span>
                      <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1 rounded-lg">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 shadow-md ${statusColor}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-sm">
                    <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Zap className="w-4 h-4 flex-shrink-0" />
                      <span>{client.selectedInstallations.length} installation{client.selectedInstallations.length !== 1 ? 's' : ''} selected</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap">
                      Created {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
