import { MongoClient, type Db } from "mongodb"

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

function getMongoClient(): Promise<MongoClient> {
  // Only initialize when actually needed (not at build time)
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI

    if (!uri) {
      throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
    }

    const options = {}

    if (process.env.NODE_ENV === "development") {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Reloading).
      const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>
      }

      if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options)
        globalWithMongo._mongoClientPromise = client.connect()
      }
      clientPromise = globalWithMongo._mongoClientPromise
    } else {
      // In production mode, it's best to not use a global variable.
      client = new MongoClient(uri, options)
      clientPromise = client.connect()
    }
  }

  return clientPromise
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default getMongoClient

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient()
  return client.db("snippets_db")
}

// Helper function to check if MongoDB is available
export function isMongoDBAvailable(): boolean {
  return !!process.env.MONGODB_URI
}
