'use client'

import { ClientSetup } from '@/utils/clientSetupStorage'
import { clientSetupStorage } from '@/utils/clientSetupStorage'
import { Button } from '@/components/ui/button'
import { Trash2, Settings, Code } from 'lucide-react'

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
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No clients added yet. Create your first client to get started.
        </p>
        <p className="text-sm text-muted-foreground">
          Click the "New Client" tab to add a client.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {clients.map((client) => {
          const progress = clientSetupStorage.getSetupProgress(client)
          return (
            <div
              key={client.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{client.name}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Main:</span> {client.mainUrl}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Gateway:</span>{' '}
                      {client.gatewayUrl}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Docs:</span> {client.docsUrl}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getStatusColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{progress}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getStatusText(progress)} -{' '}
                      {client.selectedInstallations.length} installation
                      {client.selectedInstallations.length !== 1
                        ? 's'
                        : ''}{' '}
                      selected
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {formatDate(client.createdAt)}
                  </p>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(client.id)}
                    title="Edit client"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onGenerateScript(client.id)}
                    title="Generate setup scripts"
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(client.id)}
                    title="Delete client"
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
