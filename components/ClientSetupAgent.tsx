'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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

  // Load clients from storage on mount
  useEffect(() => {
    const loadedClients = clientSetupStorage.getAllClients()
    setClients(loadedClients)
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
      setClients(clientSetupStorage.getAllClients())
      setEditingClientId(null)
      setSelectedClientId(client.id)
      setActiveTab('select-installations')
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
        setClients(clientSetupStorage.getAllClients())
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
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => handleAddClient()}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'new-client'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus className="w-4 h-4" />
          New Client
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'dashboard' && (
          <ClientDashboard
            clients={clients}
            onEdit={handleEditClient}
            onGenerateScript={handleGenerateScript}
            onDelete={handleDeleteClient}
          />
        )}

        {activeTab === 'new-client' && (
          <div className="max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingClientId ? 'Edit Client' : 'Add New Client'}
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
        )}

        {activeTab === 'select-installations' && selectedClient && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedClient.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Select installations to automate
                </p>
              </div>
              <Button variant="outline" onClick={handleBackToDashboard}>
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
                className="w-full"
              >
                Generate Setup Script →
              </Button>
            )}
          </div>
        )}

        {activeTab === 'script-generator' && selectedClient && (
          <ScriptGenerator
            client={selectedClient}
            onBack={handleBackToClient}
          />
        )}
      </div>
    </div>
  )
}
