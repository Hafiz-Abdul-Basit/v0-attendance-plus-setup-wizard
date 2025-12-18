// IndexedDB utility for storing custom snippets

const DB_NAME = "AttendancePlusDB"
const STORE_NAME = "snippets"
const DB_VERSION = 1

export interface CustomSnippet {
  id: string
  title: string
  description: string
  content: string
  category: string
  language: string
  icon: string
  color: string
  tags: string[]
  lastUsed: Date
  isCustom: boolean
  createdAt: Date
  updatedAt: Date
}

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        objectStore.createIndex("category", "category", { unique: false })
        objectStore.createIndex("createdAt", "createdAt", { unique: false })
      }
    }
  })
}

// Create a new snippet
export const createSnippet = async (
  snippet: Omit<CustomSnippet, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const db = await initDB()
  const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date()

  const newSnippet: CustomSnippet = {
    ...snippet,
    id,
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(newSnippet)

    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

// Read all snippets
export const getAllSnippets = async (): Promise<CustomSnippet[]> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Read a single snippet by ID
export const getSnippetById = async (id: string): Promise<CustomSnippet | undefined> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Update an existing snippet
export const updateSnippet = async (id: string, updates: Partial<CustomSnippet>): Promise<void> => {
  const db = await initDB()
  const existing = await getSnippetById(id)

  if (!existing) {
    throw new Error("Snippet not found")
  }

  const updatedSnippet: CustomSnippet = {
    ...existing,
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(updatedSnippet)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Delete a snippet
export const deleteSnippet = async (id: string): Promise<void> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get snippets by category
export const getSnippetsByCategory = async (category: string): Promise<CustomSnippet[]> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("category")
    const request = index.getAll(category)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Migrate default snippets to IndexedDB
export const migrateDefaultSnippets = async (defaultSnippets: any[]): Promise<void> => {
  const db = await initDB()
  const existingSnippets = await getAllSnippets()

  // Only migrate if database is empty
  if (existingSnippets.length > 0) {
    console.log("[v0] Snippets already exist in IndexedDB, skipping migration")
    return
  }

  console.log("[v0] Starting migration of", defaultSnippets.length, "default snippets to IndexedDB")

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    let successCount = 0
    defaultSnippets.forEach((snippet) => {
      const migratedSnippet: CustomSnippet = {
        ...snippet,
        isCustom: false, // Mark as default snippet
        createdAt: snippet.lastUsed || new Date(),
        updatedAt: new Date(),
        lastUsed: snippet.lastUsed || new Date(),
      }

      const request = store.add(migratedSnippet)
      request.onsuccess = () => {
        successCount++
        if (successCount === defaultSnippets.length) {
          console.log("[v0] Successfully migrated", successCount, "snippets")
          resolve()
        }
      }
      request.onerror = () => {
        console.error("[v0] Error migrating snippet:", snippet.title, request.error)
      }
    })

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Clear all snippets (for reset/testing)
export const clearAllSnippets = async (): Promise<void> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
