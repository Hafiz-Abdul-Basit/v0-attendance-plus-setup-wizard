/**
 * scripts/seed-snippets.ts
 *
 * One-shot migration of the 22 hardcoded snippets in data/snippets.tsx into
 * the Supabase `snippets` table. Idempotent — re-running updates existing rows
 * (keyed on `legacy_id`).
 *
 * Usage:
 *   cp .env.local.example .env.local        # fill in real values
 *   npm run db:seed                          # upserts all 22 snippets
 *   npm run db:reset                         # truncates `snippets`, then seeds
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Run with `tsx` (added as a devDependency). We import the source .tsx file
 * directly so we get the same data the UI had — no copy-paste, no drift.
 */
import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

import { snippetsData } from "../data/snippets"

config({ path: ".env.local" })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

interface SourceSnippet {
  id: string
  title: string
  description: string
  content: string
  category: string
  language?: string
  icon?: string
  color?: string
  tags?: string[]
  lastUsed?: Date
  isInteractive?: boolean
  tableData?: unknown
}

function toRow(s: SourceSnippet) {
  return {
    legacy_id: s.id,
    title: s.title,
    description: s.description ?? null,
    content: s.content,
    category: s.category,
    language: s.language ?? null,
    icon: s.icon ?? "FileText",
    color: s.color ?? "bg-gray-600",
    tags: s.tags ?? [],
    is_interactive: Boolean(s.isInteractive),
    table_data: s.tableData ?? null,
    is_public: true,
    last_used_at:
      s.lastUsed instanceof Date && !Number.isNaN(s.lastUsed.getTime())
        ? s.lastUsed.toISOString()
        : null,
  }
}

async function reset() {
  console.log("→ Truncating snippets table…")
  const { error } = await supabase.from("snippets").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (error) {
    console.error("Truncate failed:", error.message)
    process.exit(1)
  }
}

async function seed() {
  if (process.argv.includes("--reset")) {
    await reset()
  }

  console.log(`→ Upserting ${snippetsData.length} snippets…`)

  let inserted = 0
  let updated = 0
  let failed = 0

  for (const raw of snippetsData as SourceSnippet[]) {
    const row = toRow(raw)
    const { data, error } = await supabase
      .from("snippets")
      .upsert(row, { onConflict: "legacy_id" })
      .select("id, created_at, updated_at")
      .single()

    if (error || !data) {
      console.error(`  ✗ ${raw.id}: ${error?.message ?? "unknown error"}`)
      failed++
      continue
    }

    const created = new Date(data.created_at).getTime()
    const updated_at = new Date(data.updated_at).getTime()
    if (Math.abs(updated_at - created) < 1000) {
      inserted++
    } else {
      updated++
    }
  }

  console.log("")
  console.log("Done.")
  console.log(`  Inserted: ${inserted}`)
  console.log(`  Updated:  ${updated}`)
  console.log(`  Failed:   ${failed}`)
  console.log(`  Total:    ${snippetsData.length}`)

  if (failed > 0) process.exit(1)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
