'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, BarChart3, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  ClientSetup,
  clientSetupStorage,
} from '@/utils/clientSetupStorage'
import { ClientDashboard } from '@/components/client-setup/ClientDashboard'
import { ClientForm } from '@/components/client-setup/ClientForm'
import { InstallationSelector } from '@/components/client-setup/InstallationSelector'
import { ScriptGenerator } from '@/components/client-setup/ScriptGenerator'

type Tab = 'dashboard' | 'new-client' | 'select-installations' | 'script-generator'

export function ClientSetupAgent() {
  const [clients, setClients] = useState<ClientSetup[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, notStarted: 0 })

  // Load clients from storage on mount and calculate stats
  useEffect(() => {
    const loadedClients = clientSetupStorage.getAllClients()
    setClients(loadedClients)
    
    // Calculate stats
    const total = loadedClients.length
    const completed = loadedClients.filter(c => clientSetupStorage.getSetupProgress(c) === 100).length
    const notStarted = loadedClients.filter(c => clientSetupStorage.getSetupProgress(c) === 0).length
    const inProgress = total - completed - notStarted
    
    setStats({ total, completed, inProgress, notStarted })
  }, [])

  const selectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)
    : null

  const editingClient = editingClientId
    ? clients.find((c) => c.id === editingClientId)
    : null

  const handleAddClient = () => {
    setEditingClientId(null)
    setActiveTab('new-client')
  }

  const handleEditClient = (clientId: string) => {
    setEditingClientId(clientId)
    setActiveTab('new-client')
  }

  const handleSaveClient = (data: {
    name: string
    mainUrl: string
    gatewayUrl: string
    docsUrl: string
  }) => {
    setIsLoading(true)
    try {
      let client: ClientSetup

      if (editingClientId) {
        client = clientSetupStorage.getClientById(editingClientId)!
        client.name = data.name
        client.mainUrl = data.mainUrl
        client.gatewayUrl = data.gatewayUrl
        client.docsUrl = data.docsUrl
      } else {
        client = clientSetupStorage.createNewClient(
          data.name,
          data.mainUrl,
          data.gatewayUrl,
          data.docsUrl
        )
      }

      clientSetupStorage.saveClient(client)
      const updated = clientSetupStorage.getAllClients()
      setClients(updated)
      setEditingClientId(null)
      setSelectedClientId(client.id)
      setActiveTab('select-installations')
      
      // Update stats
      const total = updated.length
      const completed = updated.filter(c => clientSetupStorage.getSetupProgress(c) === 100).length
      const notStarted = updated.filter(c => clientSetupStorage.getSetupProgress(c) === 0).length
      const inProgress = total - completed - notStarted
      setStats({ total, completed, inProgress, notStarted })
      toast.success(
        editingClientId
          ? 'Client updated successfully'
          : 'Client created successfully'
      )
    } catch (error) {
      toast.error('Failed to save client')
      console.error('Error saving client:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectInstallations = (installations: string[]) => {
    if (!selectedClientId) return

    try {
      clientSetupStorage.updateClientInstallations(
        selectedClientId,
        installations
      )
      setClients(clientSetupStorage.getAllClients())
      toast.success('Installations updated')
    } catch (error) {
      toast.error('Failed to update installations')
      console.error('Error updating installations:', error)
    }
  }

  const handleGenerateScript = (clientId: string) => {
    setSelectedClientId(clientId)
    setActiveTab('script-generator')
  }

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        clientSetupStorage.deleteClient(clientId)
        const updated = clientSetupStorage.getAllClients()
        setClients(updated)
        
        // Update stats
        const total = updated.length
        const completed = updated.filter(c => clientSetupStorage.getSetupProgress(c) === 100).length
        const notStarted = updated.filter(c => clientSetupStorage.getSetupProgress(c) === 0).length
        const inProgress = total - completed - notStarted
        setStats({ total, completed, inProgress, notStarted })
        
        if (selectedClientId === clientId) {
          setSelectedClientId(null)
          setActiveTab('dashboard')
        }
        toast.success('Client deleted')
      } catch (error) {
        toast.error('Failed to delete client')
        console.error('Error deleting client:', error)
      }
    }
  }

  const handleBackToClient = () => {
    setActiveTab('select-installations')
  }

  const handleBackToDashboard = () => {
    setSelectedClientId(null)
    setActiveTab('dashboard')
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header with Stats */}
      {activeTab === 'dashboard' && (
        <div className="border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Setup Agent</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage and automate client deployments</p>
              </div>
              <Button onClick={handleAddClient} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                New Client
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Clients</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-300 dark:text-blue-700" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-300 dark:text-green-700" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-300 dark:text-amber-700" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Not Started</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.notStarted}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-300 dark:text-red-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6">
          {activeTab === 'dashboard' && (
            <ClientDashboard
              clients={clients}
              onEdit={handleEditClient}
              onGenerateScript={handleGenerateScript}
              onDelete={handleDeleteClient}
            />
          )}

          {activeTab === 'new-client' && (
            <div className="max-w-2xl">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                  {editingClientId ? 'Edit Client' : 'Create New Client'}
                </h2>
                <ClientForm
                  initialName={editingClient?.name}
                  initialMainUrl={editingClient?.mainUrl}
                  initialGatewayUrl={editingClient?.gatewayUrl}
                  initialDocsUrl={editingClient?.docsUrl}
                  onSubmit={handleSaveClient}
                  onCancel={() => {
                    setEditingClientId(null)
                    setActiveTab('dashboard')
                  }}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {activeTab === 'select-installations' && selectedClient && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedClient.name}</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Select which installations to automate for this client
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleBackToDashboard} className="gap-2">
                    ← Back to Dashboard
                  </Button>
                </div>

                <InstallationSelector
                  selected={selectedClient.selectedInstallations}
                  onChange={handleSelectInstallations}
                />

                {selectedClient.selectedInstallations.length > 0 && (
                  <Button
                    onClick={() => setActiveTab('script-generator')}
                    className="w-full mt-6 bg-green-600 hover:bg-green-700 h-12 text-lg"
                  >
                    Generate Setup Script →
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'script-generator' && selectedClient && (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <ScriptGenerator
                client={selectedClient}
                onBack={handleBackToClient}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
