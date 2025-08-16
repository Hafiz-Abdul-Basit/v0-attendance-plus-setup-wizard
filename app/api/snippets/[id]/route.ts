import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Snippet } from "@/types/snippet"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const collection = db.collection<Snippet>("snippets")

    const snippet = await collection.findOne({
      $or: [{ id: params.id }, { _id: new ObjectId(params.id) }],
    })

    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    return NextResponse.json(snippet)
  } catch (error) {
    console.error("Error fetching snippet:", error)
    return NextResponse.json({ error: "Failed to fetch snippet" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, description, category, content, language, tags, isPublic } = body

    const db = await getDatabase()
    const collection = db.collection<Snippet>("snippets")

    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(category && { category }),
      ...(content && { content }),
      ...(language && { language }),
      ...(tags && { tags }),
      ...(isPublic !== undefined && { isPublic }),
      updatedAt: new Date(),
    }

    const result = await collection.updateOne(
      {
        $or: [{ id: params.id }, { _id: new ObjectId(params.id) }],
      },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    const updatedSnippet = await collection.findOne({
      $or: [{ id: params.id }, { _id: new ObjectId(params.id) }],
    })

    return NextResponse.json(updatedSnippet)
  } catch (error) {
    console.error("Error updating snippet:", error)
    return NextResponse.json({ error: "Failed to update snippet" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const collection = db.collection<Snippet>("snippets")

    const result = await collection.deleteOne({
      $or: [{ id: params.id }, { _id: new ObjectId(params.id) }],
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Snippet deleted successfully" })
  } catch (error) {
    console.error("Error deleting snippet:", error)
    return NextResponse.json({ error: "Failed to delete snippet" }, { status: 500 })
  }
}
