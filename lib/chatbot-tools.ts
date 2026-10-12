/**
 * Snip chatbot — server-side tools (Gemini function calling).
 *
 * Each tool has two halves:
 *   - a Gemini `functionDeclaration` (name + description + JSON schema)
 *     that tells the model what it can call, and
 *   - an `execute()` that runs on the server with the signed-in user's
 *     permissions and returns a small JSON result for the model.
 *
 * Tools are READ-ONLY. Anything that changes state still goes through the
 * existing `snip-action` suggestion chip so the user confirms it.
 *
 * Permission model: `getChatTools(ctx)` only returns the tools the user is
 * allowed to use (Azure tools need admin or `can_see_azure_tasks`), so the
 * model never even sees a tool it can't call. `execute()` re-checks anyway.
 *
 * Results are deliberately trimmed (snippet bodies, descriptions) — every
 * byte goes back into the model's context window and the free-tier quota.
 */
import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase"
import { loadTabVisibilityFlags, type Role } from "@/lib/auth"
import {
  AzureApiError,
  getWorkItemById,
  getWorkItems,
  type AzureWorkItem,
} from "@/lib/azure-devops"

export interface ChatToolContext {
  userId: string
  role: Role
  /** Display name from the session — used for "my tasks" lookups. */
  userName: string | null
}

export interface ChatTool {
  name: string
  /** Short human label shown in the widget while the tool runs. */
  label: string
  declaration: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
  execute: (args: Record<string, unknown>, ctx: ChatToolContext) => Promise<unknown>
}

const MAX_SNIPPET_RESULTS = 8
const MAX_SNIPPET_CONTENT = 1500
const MAX_TASK_RESULTS = 15
const MAX_TASK_DESCRIPTION = 2000
const MAX_DAYS_BACK = 365

function str(v: unknown, max = 200): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined
}

function int(v: unknown, min: number, max: number): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined
  const n = Math.floor(v)
  return n >= min && n <= max ? n : undefined
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return ""
  return text.length > max ? `${text.slice(0, max)}… [truncated]` : text
}

/** Azure descriptions are HTML — strip tags so the model sees plain text. */
function htmlToText(html: string | null): string {
  if (!html) return ""
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function summariseTask(t: AzureWorkItem) {
  return {
    id: t.id,
    type: t.type,
    title: t.title,
    state: t.state,
    assignedTo: t.assignedTo?.displayName ?? null,
    priority: t.priority,
    changedDate: t.changedDate,
    tags: t.tags,
    webUrl: t.webUrl,
  }
}

async function canSeeAzureTasks(ctx: ChatToolContext): Promise<boolean> {
  if (ctx.role === "admin") return true
  const flags = await loadTabVisibilityFlags(ctx.userId)
  return flags.canSeeAzureTasks
}

function azureError(err: unknown) {
  if (err instanceof AzureApiError) {
    return {
      error:
        err.status === 501 || err.code === "config"
          ? "Azure DevOps is not configured on this server."
          : `Azure DevOps request failed (${err.status}).`,
    }
  }
  throw err
}

// ── Tools ────────────────────────────────────────────────────────────

const searchSnippets: ChatTool = {
  name: "search_snippets",
  label: "Searching snippets",
  declaration: {
    name: "search_snippets",
    description:
      "Search the app's snippet library (SQL, PowerShell, MongoDB, IIS configs, etc.). " +
      "Use this whenever the user asks whether a snippet exists, wants a script that might " +
      "already be saved, or asks what snippets are available. Returns matching snippets " +
      "with their code. Prefer saved snippets over writing new code from scratch.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keywords to search title/description/content, e.g. 'mongodb replica'.",
        },
        category: {
          type: "string",
          description:
            "Optional exact category: IIS & Web Server, MongoDB, SQL Server, User Management, " +
            "Development, Documentation, Cloud & Networking, Quick Scripts.",
        },
        limit: {
          type: "integer",
          description: `Max results (1-${MAX_SNIPPET_RESULTS}). Default 5.`,
        },
      },
    },
  },
  async execute(args) {
    const query = str(args.query)
    const category = str(args.category, 80)
    const limit = int(args.limit, 1, MAX_SNIPPET_RESULTS) ?? 5

    const supabase = getSupabaseAdmin()
    let q = supabase
      .from("snippets")
      .select("legacy_id, id, title, description, content, category, language, tags")
      .eq("is_public", true)
      .limit(limit)
    if (category) q = q.eq("category", category)
    if (query) q = q.textSearch("fts", query, { type: "websearch", config: "english" })

    let { data, error } = await q
    // Full-text search can miss partial words ("mongo" vs "mongodb") — fall
    // back to a title/description ILIKE so the model isn't told "nothing".
    if (!error && query && (data?.length ?? 0) === 0) {
      const like = `%${query.replace(/[%_,()]/g, " ")}%`
      let fallback = supabase
        .from("snippets")
        .select("legacy_id, id, title, description, content, category, language, tags")
        .eq("is_public", true)
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(limit)
      if (category) fallback = fallback.eq("category", category)
      ;({ data, error } = await fallback)
    }
    if (error) return { error: `Snippet search failed: ${error.message}` }

    return {
      count: data?.length ?? 0,
      snippets: (data ?? []).map((s) => ({
        id: s.legacy_id ?? s.id,
        title: s.title,
        description: s.description ?? "",
        category: s.category,
        language: s.language ?? "",
        tags: s.tags ?? [],
        content: truncate(s.content, MAX_SNIPPET_CONTENT),
      })),
    }
  },
}

const searchAzureTasks: ChatTool = {
  name: "search_azure_tasks",
  label: "Searching Azure Tasks",
  declaration: {
    name: "search_azure_tasks",
    description:
      "Query Azure DevOps work items (tasks, bugs, user stories). Use this to answer questions " +
      "like 'what are my open tasks', 'any blocked bugs this week', 'how many tasks are active'. " +
      "Returns a summary (counts by state/assignee) plus the matching items.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text keywords across title/description/tags. Not for dates.",
        },
        fromDaysBack: {
          type: "integer",
          description: `Only items changed in the last N days (1-${MAX_DAYS_BACK}).`,
        },
        from: { type: "string", description: "ISO datetime lower bound on ChangedDate." },
        to: { type: "string", description: "ISO datetime upper bound on ChangedDate." },
        state: { type: "string", description: "Exact state, e.g. Active, New, Resolved, Closed, Done." },
        type: { type: "string", description: "Exact work item type, e.g. Task, Bug, User Story." },
        assignee: { type: "string", description: "Exact assignee display name." },
        assignedToMe: {
          type: "boolean",
          description: "Only items assigned to the signed-in user.",
        },
        limit: {
          type: "integer",
          description: `Max items to return (1-${MAX_TASK_RESULTS}). Default 10.`,
        },
      },
    },
  },
  async execute(args, ctx) {
    if (!(await canSeeAzureTasks(ctx))) {
      return { error: "This user does not have access to Azure Tasks." }
    }
    const limit = int(args.limit, 1, MAX_TASK_RESULTS) ?? 10

    let from = str(args.from, 40)
    const to = str(args.to, 40)
    const daysBack = int(args.fromDaysBack, 1, MAX_DAYS_BACK)
    if (daysBack) from = new Date(Date.now() - daysBack * 86_400_000).toISOString()
    const iso = (v?: string) => {
      if (!v) return undefined
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
    }

    const onlyMine = args.assignedToMe === true
    if (onlyMine && !ctx.userName) {
      return { error: "Can't resolve the signed-in user's name for 'assigned to me'." }
    }

    try {
      const page = await getWorkItems(
        {
          q: str(args.query),
          from: iso(from),
          to: iso(to),
          state: str(args.state, 80),
          type: str(args.type, 80),
          assignee: str(args.assignee),
          onlyMine,
          currentUserName: ctx.userName ?? undefined,
          page: 1,
          pageSize: limit,
        },
        { currentUserName: ctx.userName },
      )
      return {
        total: page.total,
        returned: page.items.length,
        summary: page.summary,
        items: page.items.map(summariseTask),
      }
    } catch (err) {
      return azureError(err)
    }
  },
}

const getAzureTask: ChatTool = {
  name: "get_azure_task",
  label: "Opening Azure task",
  declaration: {
    name: "get_azure_task",
    description:
      "Fetch full details (description, dates, attachments) of one Azure DevOps work item by " +
      "its numeric ID. Use when the user mentions a specific task number or asks to explain / " +
      "summarise a task.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Work item ID, e.g. 12345." },
      },
      required: ["id"],
    },
  },
  async execute(args, ctx) {
    if (!(await canSeeAzureTasks(ctx))) {
      return { error: "This user does not have access to Azure Tasks." }
    }
    const id = int(args.id, 1, Number.MAX_SAFE_INTEGER)
    if (!id) return { error: "A valid numeric work item id is required." }
    try {
      const item = await getWorkItemById(id)
      if (!item) return { error: `Work item ${id} not found.` }
      return {
        ...summariseTask(item),
        reason: item.reason,
        createdBy: item.createdBy?.displayName ?? null,
        createdDate: item.createdDate,
        iterationPath: item.iterationPath,
        areaPath: item.areaPath,
        startDate: item.startDate,
        targetDate: item.targetDate,
        description: truncate(htmlToText(item.description), MAX_TASK_DESCRIPTION),
        attachments: (item.attachments ?? []).map((a) => a.name),
      }
    } catch (err) {
      return azureError(err)
    }
  },
}

const ALL_TOOLS = [searchSnippets, searchAzureTasks, getAzureTask]

/** Tools this user may call — pass the declarations to Gemini. */
export async function getChatTools(ctx: ChatToolContext): Promise<ChatTool[]> {
  const azure = await canSeeAzureTasks(ctx)
  return ALL_TOOLS.filter((t) => azure || !t.name.includes("azure"))
}
