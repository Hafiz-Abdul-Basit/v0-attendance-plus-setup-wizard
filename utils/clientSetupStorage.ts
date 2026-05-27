// Client Setup Storage Utility
export interface ClientSetup {
  id: string
  name: string
  mainUrl: string
  gatewayUrl: string
  docsUrl: string
  selectedInstallations: string[]
  setupStatus: {
    [key: string]: 'pending' | 'in-progress' | 'completed'
  }
  createdAt: string
  lastModified: string
}

const STORAGE_KEY = 'attendance-plus-client-setups'

export const clientSetupStorage = {
  getAllClients: (): ClientSetup[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading clients from storage:', error)
      return []
    }
  },

  getClientById: (id: string): ClientSetup | null => {
    const clients = clientSetupStorage.getAllClients()
    return clients.find((c) => c.id === id) || null
  },

  saveClient: (client: ClientSetup): void => {
    if (typeof window === 'undefined') return
    try {
      const clients = clientSetupStorage.getAllClients()
      const existingIndex = clients.findIndex((c) => c.id === client.id)

      const updatedClient = {
        ...client,
        lastModified: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        clients[existingIndex] = updatedClient
      } else {
        clients.push(updatedClient)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
    } catch (error) {
      console.error('Error saving client to storage:', error)
    }
  },

  deleteClient: (id: string): void => {
    if (typeof window === 'undefined') return
    try {
      const clients = clientSetupStorage.getAllClients()
      const filtered = clients.filter((c) => c.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting client from storage:', error)
    }
  },

  createNewClient: (
    name: string,
    mainUrl: string,
    gatewayUrl: string,
    docsUrl: string
  ): ClientSetup => {
    const now = new Date().toISOString()
    return {
      id: `client-${Date.now()}`,
      name,
      mainUrl,
      gatewayUrl,
      docsUrl,
      selectedInstallations: [],
      setupStatus: {},
      createdAt: now,
      lastModified: now,
    }
  },

  updateClientInstallations: (
    clientId: string,
    installations: string[]
  ): void => {
    const client = clientSetupStorage.getClientById(clientId)
    if (client) {
      client.selectedInstallations = installations
      clientSetupStorage.saveClient(client)
    }
  },

  updateInstallationStatus: (
    clientId: string,
    installationId: string,
    status: 'pending' | 'in-progress' | 'completed'
  ): void => {
    const client = clientSetupStorage.getClientById(clientId)
    if (client) {
      client.setupStatus[installationId] = status
      clientSetupStorage.saveClient(client)
    }
  },

  getSetupProgress: (client: ClientSetup): number => {
    if (client.selectedInstallations.length === 0) return 0
    const completed = client.selectedInstallations.filter(
      (inst) => client.setupStatus[inst] === 'completed'
    ).length
    return Math.round((completed / client.selectedInstallations.length) * 100)
  },
}
