/**
 * POST /api/azure-tasks/key-changes
 *
 * Body: { tasks: [{ id, title, description, comments: [{author,date,text}] }] }
 * Returns: { changes: KeyChange[] }
 *
 * Sends the task text to Gemini and asks it to pull out explicit
 * "add / update a config key" instructions, e.g.
 *   "Add Key in MongoDB (Setup Configuration) Key: ShowTardyInAbsenceCalendar: false"
 *
 * Env:
 *   GEMINI_API_KEY   (or GOOGLE_API_KEY)  — the key you already use
 *   GEMINI_MODEL     optional, default "gemini-3.8-flash"
 *   GEMINI_FALLBACK_MODEL  optional — tried when the main model keeps
 *                          answering 503 / 429 (overloaded)
 */
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

// ⚠️ Use the SAME auth check as app/api/azure-tasks/route.ts.
// These two imports are what the page uses; adjust the path if your
// authOptions live elsewhere.
import { authOptions, canAccessAzureTasks } from "@/lib/auth"

export const runtime = "nodejs"
export const maxDuration = 60

interface InTask {
  id: number
  title: string
  description?: string
  comments?: Array<{ author?: string; date?: string; text?: string }>
}

const MAX_CHARS_PER_TASK = 6000

const SYSTEM = `You extract configuration-key changes from software work items.
A work item may say things like:
  "Add Key in MongoDB (Setup Configuration) Key: ShowTardyInAbsenceCalendar: false"
  "Mongo key in Setup Parameters and Global Parametrs:InterventionsToBeCompletedBeforeRTO=\"WL1,WL2:'…'; AC:'…'\""
  "Update key X to true in appsettings"
Focus on MongoDB and appsettings / config-file keys.
For every EXPLICIT instruction to add, update or remove a configuration key / setting / flag, return one object.
Rules:
- Only report what the text clearly says. Never invent keys or values.
- "target" = system or file (MongoDB, appsettings.json, SQL table, Azure App Config…). Empty string if unknown.
- "location" = collection / section / table in brackets or nearby (e.g. "Setup Configuration"). Empty string if unknown.
- "value" = the FULL value exactly as written, including quotes and long strings ("false", "30", a JSON snippet, a long delimited string…). Never shorten it. Empty string if none given.
- "note" = the original sentence, max 200 chars.
- "source" = "description" or "comment".
- "action" = add | update | remove | other.
- If a task has no such instruction, return nothing for it.`

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canAccessAzureTasks(session.user as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
  }

  let tasks: InTask[]
  try {
    tasks = ((await req.json()) as { tasks: InTask[] }).tasks ?? []
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 })
  }
  if (!Array.isArray(tasks) || tasks.length === 0) return NextResponse.json({ changes: [] })

  const payload = tasks
    .slice(0, 15)
    .map((t) => {
      const body = [
        `DESCRIPTION:\n${t.description ?? ""}`,
        ...(t.comments ?? []).map((c) => `COMMENT by ${c.author ?? "?"} (${c.date ?? ""}):\n${c.text ?? ""}`),
      ]
        .join("\n\n")
        .slice(0, MAX_CHARS_PER_TASK)
      return `=== TASK ${t.id}: ${t.title} ===\n${body}`
    })
    .join("\n\n")

  const primary = process.env.GEMINI_MODEL ?? "gemini-3.8-flash"
  const fallback = process.env.GEMINI_FALLBACK_MODEL
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: payload }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            taskId: { type: "INTEGER" },
            action: { type: "STRING", enum: ["add", "update", "remove", "other"] },
            target: { type: "STRING" },
            location: { type: "STRING" },
            key: { type: "STRING" },
            value: { type: "STRING" },
            note: { type: "STRING" },
            source: { type: "STRING", enum: ["description", "comment"] },
          },
          required: ["taskId", "action", "key"],
        },
      },
    },
  })

  const call = (model: string) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
    })

  // 503 ("high demand") and 429 are temporary: retry with backoff
  // (1.5s, 4s, 8s), then switch to the fallback model if one is set.
  const RETRYABLE = new Set([429, 500, 502, 503, 504])
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const models = fallback && fallback !== primary ? [primary, fallback] : [primary]
  let res: Response | null = null
  outer: for (const model of models) {
    for (const wait of [0, 1500, 4000, 8000]) {
      if (wait) await sleep(wait)
      res = await call(model)
      if (res.ok || !RETRYABLE.has(res.status)) break outer
    }
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 502
    const raw = await res?.text().catch(() => "")
    let msg = (raw ?? "").slice(0, 200)
    try {
      msg = JSON.parse(raw ?? "")?.error?.message ?? msg
    } catch {
      /* keep raw */
    }
    const busy = RETRYABLE.has(status)
    return NextResponse.json(
      {
        error: busy
          ? `Gemini is busy right now (${status}). Try again in a minute.`
          : `Gemini ${status}: ${msg.slice(0, 160)}`,
        retryable: busy,
      },
      { status: busy ? 503 : 502 },
    )
  }

  try {
    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "[]"
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as any[]
    const titles = new Map(tasks.map((t) => [t.id, t.title]))
    const changes = parsed
      .filter((c) => c && c.key && titles.has(c.taskId))
      .map((c) => ({
        taskId: c.taskId,
        taskTitle: titles.get(c.taskId) ?? "",
        action: c.action ?? "other",
        target: c.target ?? "",
        location: c.location ?? "",
        key: String(c.key).trim(),
        value: c.value ?? "",
        note: c.note ?? "",
        source: c.source === "comment" ? "comment" : "description",
      }))
    return NextResponse.json({ changes })
  } catch {
    return NextResponse.json({ error: "Gemini returned unparseable output" }, { status: 502 })
  }
}
