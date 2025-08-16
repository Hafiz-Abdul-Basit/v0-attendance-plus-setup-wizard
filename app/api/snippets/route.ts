import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Snippet } from "@/types/snippet"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const db = await getDatabase()
    const collection = db.collection<Snippet>("snippets")

    const query: any = {}

    if (category && category !== "all") {
      query.category = category
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    const snippets = await collection.find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(snippets)
  } catch (error) {
    console.error("Error fetching snippets:", error)
    return NextResponse.json({ error: "Failed to fetch snippets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, content, language, tags, isPublic } = body

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection<Snippet>("snippets")

    const snippet: Omit<Snippet, "_id"> = {
      id: `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: description || "",
      category,
      icon: "FileText",
      color: "bg-gray-500",
      content,
      language: language || "text",
      tags: tags || [],
      isPublic: isPublic || false,
      createdBy: "user", // In a real app, this would come from authentication
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(snippet)

    return NextResponse.json(
      {
        ...snippet,
        _id: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating snippet:", error)
    return NextResponse.json({ error: "Failed to create snippet" }, { status: 500 })
  }
}
