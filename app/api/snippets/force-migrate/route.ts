import { NextResponse } from "next/server"
import { getDatabase, isMongoDBAvailable } from "@/lib/mongodb"

// Force migration - clears existing and re-migrates all snippets
export async function POST() {
  try {
    if (!isMongoDBAvailable()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const db = await getDatabase()
    const collection = db.collection("snippets")

    // Clear existing snippets
    await collection.deleteMany({})

    // Trigger the regular migration
    const migrateResponse = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/snippets/migrate`, {
      method: "POST",
    })

    if (!migrateResponse.ok) {
      throw new Error("Migration failed")
    }

    const result = await migrateResponse.json()

    return NextResponse.json({
      message: "Force migration completed successfully!",
      ...result,
    })
  } catch (error) {
    console.error("Error in force migration:", error)
    return NextResponse.json({ error: "Failed to force migrate snippets" }, { status: 500 })
  }
}
