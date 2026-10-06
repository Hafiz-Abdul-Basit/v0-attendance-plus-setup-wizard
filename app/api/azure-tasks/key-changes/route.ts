/**
 * POST /api/azure-tasks/key-changes
 *
 * Body: { tasks: [{ id, title, description, comments: [{author,date,text}] }] }
 * Returns: { changes: KeyChange[], sql: SqlScript[] }
 *
 * Sends the task text to Gemini and asks it to pull out
 *   1. explicit "add / update a config key" instructions, e.g.
 *   "Add Key in MongoDB (Setup Configuration) Key: ShowTardyInAbsenceCalendar: false"
 *   2. SQL: table schemas, stored procedures, functions, views, scripts
 *      (copied verbatim).
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

// Safety cap only. The client already splits big tasks into ≤ ~20k-char
// chunks, so nothing is normally cut. (Previously 6000 — too small for
// long comments that hold SQL.)
const MAX_CHARS_PER_TASK = 120_000

const SYSTEM = `You read software work items (description + comments) and extract two things.

PART 1 — configuration-key changes ("keyChanges")
A work item may say things like:
  "Add Key in MongoDB (Setup Configuration) Key: ShowTardyInAbsenceCalendar: false"
  "Mongo key in Setup Parameters and Global Parametrs:InterventionsToBeCompletedBeforeRTO=\"WL1,WL2:'…'; AC:'…'\""
  "Update key X to true in appsettings"
Focus on MongoDB and appsettings / config-file keys.
For every EXPLICIT instruction to add, update or remove a configuration key / setting / flag, return one object.
- Only report what the text clearly says. Never invent keys or values.
- "target" = system or file (MongoDB, appsettings.json, SQL table, Azure App Config…). Empty string if unknown.
- "location" = collection / section / table in brackets or nearby (e.g. "Setup Configuration"). Empty string if unknown.
- "value" = the FULL value exactly as written, including quotes and long strings. Never shorten it. Empty string if none given.
- "note" = the original sentence, max 200 chars.
- "source" = "description" or "comment".
- "action" = add | update | remove | other.

PART 2 — SQL ("sqlScripts")
Work items often contain SQL: table schemas, stored procedures, functions, views, triggers, indexes, ALTER / INSERT / UPDATE / DELETE scripts, and queries.
- Copy every SQL block EXACTLY as written: every line, every column, every comment, original formatting. NEVER shorten, summarise, reformat, or replace anything with "…".
- A stored procedure / function / view / trigger must be returned COMPLETE, from CREATE/ALTER to its final END.
- A table schema must contain ALL columns and constraints.
- "kind" = table | stored_procedure | function | view | trigger | index | script | query.
- "name" = the object name if there is one (e.g. "dbo.usp_GetAbsences"), otherwise a short label.
- "source" = "description" or "comment".
- Include a SELECT query only if the text presents it as part of the work (e.g. "Query used to get data:"). Skip prose that merely mentions a table name.

If a task has nothing for a part, return nothing for it. Return JSON only.`

// ---------------------------------------------------------------------------
// Model selection. Quotas are PER MODEL, so when one model answers 429
// (quota exhausted / "limit: 0" on a free key) or 404 (retired), the next
// usable model is tried automatically. The usable list comes from Google's
// own ListModels for THIS key, so we never guess model names.
// ---------------------------------------------------------------------------
let workingModel: string | null = null
let modelCache: { at: number; names: string[] } | null = null

function rankModels(names: string[]): string[] {
  const score = (n: string) => (/flash-lite/i.test(n) ? 1 : /flash/i.test(n) ? 0 : 2)
  return [...names].sort((a, b) => score(a) - score(b) || b.localeCompare(a, undefined, { numeric: true }))
}

async function candidateModels(apiKey: string, primary: string, fallback?: string): Promise<string[]> {
  const now = Date.now()
  if (!modelCache || now - modelCache.at > 60 * 60 * 1000) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
        headers: { "x-goog-api-key": apiKey },
      })
      if (r.ok) {
        const j = (await r.json()) as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> }
        const names = (j.models ?? [])
          .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
          .map((m) => String(m.name ?? "").replace(/^models\//, ""))
          .filter(
            (n) =>
              /^gemini/i.test(n) &&
              !/(embedding|image|tts|live|audio|robotics|computer-use|preview|exp|thinking|learnlm|aqa|nano|banana|veo)/i.test(n),
          )
        modelCache = { at: now, names: rankModels(names) }
      }
    } catch {
      /* ListModels is best-effort */
    }
  }
  const all = [workingModel, primary, fallback, ...(modelCache?.names ?? [])].filter(Boolean) as string[]
  return Array.from(new Set(all)).slice(0, 6)
}

/** GET = diagnostics: which models this key can use and which one is active. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canAccessAzureTasks(session.user as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
  const models = await candidateModels(apiKey, process.env.GEMINI_MODEL ?? "gemini-3.8-flash", process.env.GEMINI_FALLBACK_MODEL)
  return NextResponse.json({ candidates: models, working: workingModel })
}

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
  if (!Array.isArray(tasks) || tasks.length === 0) return NextResponse.json({ changes: [], sql: [] })

  const payload = tasks
    .slice(0, 30)
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
      maxOutputTokens: 16384,
      responseSchema: {
        type: "OBJECT",
        properties: {
          keyChanges: {
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
          sqlScripts: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                taskId: { type: "INTEGER" },
                kind: {
                  type: "STRING",
                  enum: ["table", "stored_procedure", "function", "view", "trigger", "index", "script", "query"],
                },
                name: { type: "STRING" },
                sql: { type: "STRING" },
                source: { type: "STRING", enum: ["description", "comment"] },
              },
              required: ["taskId", "kind", "sql"],
            },
          },
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

  const TEMPORARY = new Set([500, 502, 503, 504])
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  interface GeminiFailure {
    status: number
    message: string
    retryAfterSec: number | null
    quota: "minute" | "day" | "none" | "unknown"
  }
  const readFailure = async (r: Response): Promise<GeminiFailure> => {
    const raw = await r.text().catch(() => "")
    let message = raw.slice(0, 300)
    let retryAfterSec: number | null = null
    let quota: GeminiFailure["quota"] = r.status === 429 ? "unknown" : "none"
    try {
      const err = JSON.parse(raw)?.error
      if (err?.message) message = String(err.message)
      for (const d of err?.details ?? []) {
        const type = String(d?.["@type"] ?? "")
        if (type.endsWith("RetryInfo") && typeof d.retryDelay === "string") {
          const sec = parseFloat(d.retryDelay)
          if (Number.isFinite(sec)) retryAfterSec = Math.ceil(sec)
        }
        if (type.endsWith("QuotaFailure")) {
          const ids = (d.violations ?? []).map((v: any) => `${v?.quotaId ?? ""} ${v?.quotaMetric ?? ""}`).join(" ")
          if (/PerDay/i.test(ids)) quota = "day"
          else if (/PerMinute/i.test(ids)) quota = "minute"
        }
      }
      if (quota === "unknown" && /per day|daily/i.test(message)) quota = "day"
      if (quota === "unknown" && /limit:\s*0\b/.test(message)) quota = "day" // no quota at all on this model/key
    } catch {
      /* keep raw text */
    }
    const hdr = Number(r.headers.get("retry-after"))
    if (retryAfterSec == null && Number.isFinite(hdr) && hdr > 0) retryAfterSec = Math.ceil(hdr)
    return { status: r.status, message, retryAfterSec, quota }
  }

  // Walk the candidate models until one answers. Stay inside the 60s route budget.
  const started = Date.now()
  const candidates = await candidateModels(apiKey, primary, fallback)
  const tried: string[] = []
  let res: Response | null = null
  let failure: GeminiFailure | null = null
  let usedModel = ""
  outer: for (const model of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() - started > 45_000) break outer
      res = await call(model)
      if (res.ok) {
        workingModel = model
        usedModel = model
        break outer
      }
      failure = await readFailure(res)
      tried.push(`${model}: ${failure.status}${failure.quota === "day" ? " no/used-up quota" : failure.quota === "minute" ? " per-minute limit" : ""}`)
      // Short per-minute limit or a brief overload: wait once and retry the SAME model.
      const waitSec =
        failure.status === 429 && failure.quota !== "day"
          ? failure.retryAfterSec != null && failure.retryAfterSec <= 15
            ? failure.retryAfterSec + 1
            : null
          : TEMPORARY.has(failure.status)
            ? 3
            : null
      if (waitSec != null && attempt === 0) {
        await sleep(waitSec * 1000)
        continue
      }
      break // otherwise: move on to the next model
    }
  }

  if (!res || !res.ok) {
    const f = failure ?? { status: 502, message: "No response from Gemini", retryAfterSec: null, quota: "none" as const }
    const short = f.message.replace(/\s+/g, " ").slice(0, 200)
    const allDead = tried.length > 0 && failure?.quota === "day"
    return NextResponse.json(
      {
        error: `No Gemini model could answer (${tried.join(" · ") || "no attempt"}). Google says: ${short}`,
        retryable: !allDead && (f.status === 429 || TEMPORARY.has(f.status)),
        retryAfterSec: f.retryAfterSec,
        quota: allDead ? "day" : f.quota,
        tried,
      },
      { status: f.status === 429 ? 429 : TEMPORARY.has(f.status) ? 503 : 502 },
    )
  }

  try {
    const data = await res.json()
    const finish = data?.candidates?.[0]?.finishReason
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "{}"
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as {
      keyChanges?: any[]
      sqlScripts?: any[]
    }
    const titles = new Map(tasks.map((t) => [t.id, t.title]))
    const changes = (parsed.keyChanges ?? [])
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
    const sql = (parsed.sqlScripts ?? [])
      .filter((c) => c && typeof c.sql === "string" && c.sql.trim() && titles.has(c.taskId))
      .map((c) => ({
        taskId: c.taskId,
        taskTitle: titles.get(c.taskId) ?? "",
        kind: c.kind ?? "script",
        name: c.name ?? "",
        sql: c.sql,
        source: c.source === "comment" ? "comment" : "description",
      }))
    return NextResponse.json({ changes, sql, truncated: finish === "MAX_TOKENS", model: usedModel })
  } catch {
    return NextResponse.json({ error: "Gemini returned unparseable output (output too long?)" }, { status: 502 })
  }
}
