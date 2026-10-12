import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import type { Role } from "@/lib/auth";
import { resolveChatbotAccess } from "@/lib/chatbot";
import { getChatTools, type ChatTool, type ChatToolContext } from "@/lib/chatbot-tools";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Free Gemini API - get a key at https://aistudio.google.com/apikey (no credit card needed)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Models to try, newest first. Google retires / rotates model names
// regularly, and free-tier keys don't always have access to the newest
// version. We try each in order; the first one that returns 2xx with
// content wins. Only 404s trigger a fallback — 429 / 403 / 500 are
// surfaced immediately since retrying wouldn't help.
//
// Add new entries at the TOP of the list as Google publishes them.
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

/**
 * Max model ↔ tool round-trips per user message. The last round is sent
 * without tools so the model is forced to write a final answer.
 */
const MAX_TOOL_ROUNDS = 4;

/** Per-user message limits for /api/chat. */
const CHAT_MAX_PER_MINUTE = 15;
const CHAT_MAX_PER_DAY = 300;

// Tell the model what your app actually is, so it doesn't hallucinate features.
// Edit this to match your real categories/snippet count, or fetch them dynamically
// from your own DB/JSON if you want it always accurate.
const SYSTEM_CONTEXT = `You are Snip, the built-in AI assistant inside "Snippets" — an internal
developer tool built by Abdul Basit. You are a general-purpose assistant
FIRST, with full working knowledge of this app as a bonus — you are not
restricted to only answering questions about snippets or code.

PERSONALITY
- Friendly, sharp, no fluff. Talk like a knowledgeable coworker, not a
  corporate support bot.
- Default to short answers. Expand only when the question needs depth.
- Use code blocks for any code, command, or config — never inline-cram code
  into prose.

LANGUAGE
- Reply in whatever language the user writes in. They speak English →
  you reply English; they write Urdu → you reply Urdu (in Nastaliq /
  Urdu script, اردو).
- Mixes are fine; pick the dominant language of the user's message.
- If you're unsure, default to English.
- The action-block JSON (snip-action / snip-followups fenced blocks) stays in
  the same shape regardless of language — only the visible prose
  around it is localised.

WHAT THIS APP DOES (for context, not a limit on what you can discuss)
- Stores code snippets organized into categories: IIS & Web Server, MongoDB,
  SQL Server, User Management, Development, Documentation, Cloud & Networking,
  Quick Scripts.
- Each snippet has a title, description, code/content, language tag, and tags.
- Users can search by title/description/content/tags, browse by category,
  export all snippets, favorite snippets, and one-click copy.
- Includes a "Setup Agent" and "View Installation Steps" onboarding flow, an
  Azure Tasks section, and an admin panel with per-user controls.

WHAT YOU HELP WITH
1. App navigation and how-to questions — answer from the app description above.
2. Anything code/dev related — SQL, MongoDB, PowerShell, IIS, Azure, general
   programming, debugging, architecture questions, etc.
3. Anything else the user asks — general knowledge, writing help, explaining a
   concept, brainstorming, quick calculations, whatever comes up. Treat it like
   a normal helpful assistant conversation, not a narrow support bot. Don't
   deflect a question just because it's unrelated to snippets or code.
4. App data questions (does a snippet exist, what are my tasks, what's in
   task #123) — answer from your TOOLS (below), never from memory. If no tool
   covers it, say you can't know instead of guessing — don't invent snippet
   names, task ids, or counts.

BOUNDARIES
- Don't claim to perform actions you can't. Your tools are READ-ONLY — you
  can't create/edit/delete snippets or tasks; guide the user to the UI.
- Keep responses under ~150 words unless the user asks for a deep explanation.

TOOLS
You can call functions to read live app data. Only the tools you are given
in this request exist for this user — don't mention others.
- search_snippets: search the saved snippet library. Call it before writing
  a script from scratch when a saved snippet might already cover it, and
  whenever the user asks what snippets exist. When you use a result, name
  the snippet by its title and show its code.
- search_azure_tasks: query Azure DevOps work items (filters: keywords,
  date window, state, type, assignee, assignedToMe). Use it to ANSWER task
  questions directly (counts, lists, "my open bugs").
- get_azure_task: full details of one work item by id — use for "explain /
  summarise task 1234".
Rules:
- Call tools silently — don't announce "let me search", just answer with
  the results.
- Summarise tool results; list at most ~8 items, then say how many more.
- Include task ids and titles so the user can find them. Link a task with
  its webUrl as plain text when helpful.
- If a tool returns an error, tell the user briefly what failed.
- You may still add a search-azure-tasks / search-snippets action block so
  the user can open the full filtered view in the app.

ACTION FORMAT
When the user's intent clearly maps to one of the in-app actions below,
end your reply with a fenced JSON block on its own line. The block MUST
be the last thing in the response. Format:

\`\`\`snip-action
{ "type": "search-snippets", "label": "Search snippets for 'IIS URL Rewrite'", "payload": { "query": "IIS URL Rewrite" } }
\`\`\`

Available action types and when to use them:

1. search-snippets
   - Use when: user asks to find / show / search snippets by topic.
   - Payload: { "query": "<search string>" }
   - Example label: "Apply search: IIS URL Rewrite"

2. filter-category
   - Use when: user asks for snippets in a specific category
     (IIS, MongoDB, SQL Server, etc.).
   - Payload: { "category": "<one of: IIS & Web Server, MongoDB, SQL Server, User Management, Development, Documentation, Cloud & Networking, Quick Scripts>" }
   - Example label: "Show only: SQL Server"

3. switch-tab
   - Use when: user asks to navigate to a specific tab
     (Setup Agent, Setups, etc.).
   - Payload: { "tab": "<one of: snippets, setup-agent, setups>" }
   - Example label: "Switch to: Setup Agent"

4. search-azure-tasks
   - Use when: user asks to look up Azure DevOps work items by topic,
     by date range, or by both.
   - Payload (ALL fields optional, but provide at least one):
     • "query"        — free-text search (title/description). Use for
                        topic keywords ("blocked", "iis", "login bug").
     • "fromDaysBack" — integer 1..365. Narrows the window to "last N
                        days from now". Use for relative phrases:
                        "last 3 days" → 3
                        "yesterday" / "past 24 hours" → 1
                        "this week" / "past week" → 7
                        "past 2 weeks" → 14
                        "past month" / "last 30 days" → 30
     • "from" / "to"  — ISO date/datetime strings. Use for named
                        timeframes that aren't "last N days":
                        "July"     → from = first day of that month,
                                      to   = last instant of that month
                        "Q3"       → from = Jul 1, to = Sep 30 23:59:59
                        "since <date>" → from = that date, no to
                        Always compute these against TODAY's date.
   - Examples:
     "give me last 3 days tasks"
       → { "fromDaysBack": 3 }
     "show me July tasks"
       → { "from": "<YYYY>-07-01T00:00:00Z",
           "to":   "<YYYY>-07-31T23:59:59Z" }
     "blocked bugs this week"
       → { "query": "blocked", "fromDaysBack": 7 }
   - Never put a month name like "July" into the "query" field —
     that's a date range, not a free-text search. The Azure Tasks
     search bar is for keywords; the date picker is separate.
   - Example label: "Search Azure Tasks: last 3 days"

Emit at most ONE action block per reply. If the user is just asking a
question (no clear in-app action), DON'T emit a block. If you're unsure
whether an action fits, prefer to NOT emit one and just answer in text.
The widget treats the block as a *suggestion* — the user clicks a button
to actually apply it, so getting the type wrong is recoverable.

FOLLOW-UP QUESTIONS
After every reply, optionally suggest 1-3 short follow-up questions the
user might want to ask next. Wrap them in a separate fenced block
(language: snip-followups) and place it AFTER any action block. The
widget renders these as tappable chips below the model reply. Examples:

\`\`\`snip-followups
["How do I run this locally?", "What about TypeScript types?", "Show me an example"]
\`\`\`

Or, equivalently, an object form:

\`\`\`snip-followups
{ "followups": ["How do I run this locally?", "What about TypeScript types?"] }
\`\`\`

Guidelines for follow-ups:
- Keep them short (under ~80 chars each) — they're chips, not paragraphs.
- They should be natural continuations, not generic ("Ask another question").
- 0-3 chips per reply. 0 is fine for short factual answers; up to 3 for
  open-ended topics where the user might want to drill in.
- Phrase them as questions a curious user would actually ask. Imperative
  "Show me…" forms are also fine.
- NEVER include a follow-up that duplicates the action suggestion (e.g.
  don't follow up "Search Azure Tasks" with "Want me to search Azure
  Tasks again?").`;

/**
 * Gemini content shapes. Parts are kept loosely typed and passed back to
 * Gemini verbatim — newer models attach a `thoughtSignature` to function
 * call parts that MUST be echoed back on the next turn.
 */
type GeminiPart = {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: { name: string; id?: string; response: Record<string, unknown> };
  [key: string]: unknown;
};
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

/**
 * Events streamed to the widget as NDJSON (one JSON object per line):
 *   { type: "text",  delta }                    — visible reply text
 *   { type: "tool",  name, label, status }      — tool started / finished
 *   { type: "done",  reply, action, followups } — final parsed reply
 *   { type: "error", error }                    — failure mid-stream
 * Errors before the stream starts are plain JSON with an HTTP status.
 */
type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string; label: string; status: "start" | "done" }
  | {
      type: "done";
      reply: string;
      action: ReturnType<typeof parseStructuredBlocks>["action"];
      followups: string[] | null;
    }
  | { type: "error"; error: string };

function buildSystemInstruction(language: "en" | "ur" | null) {
  return {
    parts: [
      { text: SYSTEM_CONTEXT },
      // The prompt asks for date math "against TODAY" — give it today.
      { text: `TODAY: ${new Date().toISOString()}` },
      // Overrides the default "match the user's language" rule when the
      // widget sends an explicit preference.
      ...(language
        ? [
            {
              text: `LANGUAGE OVERRIDE: Reply in ${language === "ur" ? "Urdu (اردو script)" : "English"}. Even if the user's message is in a different language, respond in ${language === "ur" ? "Urdu" : "English"}. Keep action-block JSON in the same shape regardless of language; only the visible reply text changes.`,
            },
          ]
        : []),
    ],
  };
}

function callGemini(
  model: string,
  body: {
    system_instruction: ReturnType<typeof buildSystemInstruction>;
    contents: GeminiContent[];
    tools: ChatTool[];
  },
  signal: AbortSignal,
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: body.system_instruction,
      contents: body.contents,
      ...(body.tools.length > 0
        ? { tools: [{ functionDeclarations: body.tools.map((t) => t.declaration) }] }
        : {}),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    }),
    signal,
  });
}

/**
 * Read one SSE response from Gemini. Visible text is forwarded through
 * `onText` as it arrives; the full set of model parts (merged text +
 * function calls, signatures intact) is returned so it can be appended
 * to the conversation for the next tool round.
 */
async function consumeGeminiStream(
  res: Response,
  onText: (delta: string) => void,
): Promise<{ parts: GeminiPart[]; calls: NonNullable<GeminiPart["functionCall"]>[] }> {
  const parts: GeminiPart[] = [];
  const calls: NonNullable<GeminiPart["functionCall"]>[] = [];
  if (!res.body) return { parts, calls };

  const handlePart = (part: GeminiPart) => {
    if (part.functionCall) {
      parts.push(part);
      calls.push(part.functionCall);
      return;
    }
    if (typeof part.text === "string") {
      if (!part.thought) onText(part.text);
      // Merge consecutive text chunks of the same kind into one part.
      const prev = parts[parts.length - 1];
      if (prev && typeof prev.text === "string" && !prev.functionCall && !!prev.thought === !!part.thought) {
        prev.text += part.text;
        if (part.thoughtSignature) prev.thoughtSignature = part.thoughtSignature;
      } else {
        parts.push({ ...part });
      }
      return;
    }
    parts.push(part);
  };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    // SSE events are separated by a blank line; each has a `data:` line.
    let sep: number;
    while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
      const event = buffer.slice(0, sep);
      buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, "");
      const data = event
        .split(/\r?\n/)
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (!data) continue;
      let chunk: { candidates?: { content?: { parts?: GeminiPart[] } }[] };
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }
      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) handlePart(part);
    }
    if (done) break;
  }
  return { parts, calls };
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Chatbot not configured: missing GEMINI_API_KEY" },
        { status: 500 },
      );
    }

    // Auth + the admin's chatbot toggle. The widget treats 403 as
    // "disabled mid-session" and locks the panel.
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = token.userId as string;
    if (!(await resolveChatbotAccess(userId))) {
      return NextResponse.json({ error: "Chatbot is currently disabled" }, { status: 403 });
    }
    // Protect the shared Gemini quota from one user (or a script) burning it.
    for (const [key, max, windowMs] of [
      [`chat-min:${userId}`, CHAT_MAX_PER_MINUTE, 60_000],
      [`chat-day:${userId}`, CHAT_MAX_PER_DAY, 86_400_000],
    ] as const) {
      const limit = rateLimit(key, max, windowMs);
      if (!limit.ok) {
        return tooManyRequests(
          limit.retryAfter,
          `You've reached Snip's message limit. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
        );
      }
    }
    const ctx: ChatToolContext = {
      userId,
      role: ((token.role as Role) ?? "user") as Role,
      userName: typeof token.name === "string" && token.name.trim() ? token.name : null,
    };

    const body = await request.json();

    // The widget sends the user's preferred language (`"en"` or `"ur"`).
    const requestedLanguage: "en" | "ur" | null =
      body?.language === "en" || body?.language === "ur" ? body.language : null;

    // Accept TWO payload shapes so this endpoint works with both the
    // simple widget and any richer client:
    //   1. { messages: [{ role, content }, ...] }  — full transcript
    //   2. { message: string, history?: [{ role, content }, ...] } —
    //      the latest turn + optional prior turns (what the widget
    //      sends). The server appends `message` as the final entry.
    //
    // Roles are normalised to Gemini's `"user" | "model"` here, so
    // senders can use either "assistant" or "model" for the model role.
    const contents: GeminiContent[] = [];
    const toContent = (m: { role: string; content: string }): GeminiContent => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    });

    if (Array.isArray(body?.messages) && body.messages.length > 0) {
      contents.push(...body.messages.map(toContent));
    } else if (typeof body?.message === "string" && body.message.trim()) {
      const history = Array.isArray(body.history) ? body.history : [];
      contents.push(...history.map(toContent));
      contents.push({ role: "user", parts: [{ text: body.message }] });
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const tools = await getChatTools(ctx);
    const system_instruction = buildSystemInstruction(requestedLanguage);
    // Stop talking to Gemini if the user closes the tab / starts over.
    const signal = request.signal;

    // First request happens BEFORE the stream opens so that model
    // fallback (404 → next model) and upstream errors can still return a
    // proper HTTP status. 429 / 403 / 500 are surfaced immediately since
    // retrying wouldn't help.
    let model: string | null = null;
    let firstRes: Response | null = null;
    let last404: string | null = null;
    for (const candidate of GEMINI_MODELS) {
      let res: Response;
      try {
        res = await callGemini(candidate, { system_instruction, contents, tools }, signal);
      } catch (error) {
        console.error("Gemini fetch failed:", error);
        return NextResponse.json(
          { error: "Chatbot request failed. Try again in a moment." },
          { status: 502 },
        );
      }
      if (res.status === 404) {
        console.warn(`[chat] Gemini model ${candidate} not available, trying next`);
        last404 = (await res.text().catch(() => "")).slice(0, 200);
        continue;
      }
      if (!res.ok) {
        console.error("Gemini API error:", await res.text().catch(() => ""));
        return NextResponse.json(
          {
            error:
              res.status === 429
                ? "Snip is getting too many requests right now. Try again in a minute."
                : "Chatbot request failed. Try again in a moment.",
          },
          { status: 502 },
        );
      }
      model = candidate;
      firstRes = res;
      break;
    }

    if (!model || !firstRes) {
      // Every model returned 404 — log a useful diagnostic for the operator.
      console.error("[chat] No Gemini model available. Last error:", last404, "Tried:", GEMINI_MODELS.join(", "));
      return NextResponse.json(
        {
          error:
            "No Gemini model is available for this API key. Run `curl 'https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY'` to see the supported list, then update GEMINI_MODELS in app/api/chat/route.ts.",
        },
        { status: 502 },
      );
    }

    const activeModel = model;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: StreamEvent) =>
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

        let fullText = "";
        const onText = (delta: string) => {
          if (!delta) return;
          fullText += delta;
          emit({ type: "text", delta });
        };

        try {
          let res: Response = firstRes!;
          for (let round = 0; ; round++) {
            // Separate text from consecutive rounds with a paragraph break.
            let needsSep = fullText.length > 0 && !fullText.endsWith("\n\n");
            const result = await consumeGeminiStream(res, (delta) => {
              if (needsSep && delta) {
                onText("\n\n");
                needsSep = false;
              }
              onText(delta);
            });

            if (result.calls.length === 0 || round >= MAX_TOOL_ROUNDS) break;

            contents.push({ role: "model", parts: result.parts });
            const responses: GeminiPart[] = [];
            for (const call of result.calls) {
              const tool = tools.find((t) => t.name === call.name);
              const label = tool?.label ?? call.name;
              emit({ type: "tool", name: call.name, label, status: "start" });
              let output: unknown;
              try {
                output = tool
                  ? await tool.execute(call.args ?? {}, ctx)
                  : { error: `Unknown tool: ${call.name}` };
              } catch (err) {
                console.error(`[chat] tool ${call.name} failed:`, err);
                output = { error: "The tool failed unexpectedly." };
              }
              emit({ type: "tool", name: call.name, label, status: "done" });
              responses.push({
                functionResponse: {
                  name: call.name,
                  ...(call.id ? { id: call.id } : {}),
                  response: { result: output },
                },
              });
            }
            contents.push({ role: "user", parts: responses });

            // Last allowed round goes out without tools → forces an answer.
            const nextTools = round + 1 >= MAX_TOOL_ROUNDS ? [] : tools;
            res = await callGemini(activeModel, { system_instruction, contents, tools: nextTools }, signal);
            if (!res.ok) {
              console.error("Gemini API error:", await res.text().catch(() => ""));
              emit({ type: "error", error: "Chatbot request failed. Try again in a moment." });
              controller.close();
              return;
            }
          }

          // Strip optional fenced blocks out of the visible reply and
          // surface them as structured payloads:
          //   ```snip-action    → in-app action suggestion
          //   ```snip-followups → 1-3 short follow-up question chips
          const { reply, action, followups } = parseStructuredBlocks(
            fullText.trim() || "Sorry, I couldn't generate a response.",
          );
          emit({ type: "done", reply, action: action ?? null, followups: followups ?? null });
        } catch (err) {
          if (!signal.aborted) {
            console.error("[chat] stream error:", err);
            emit({ type: "error", error: "Something went wrong while generating the reply." });
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * Parse a fenced ```snip-action``` JSON block out of `rawReply`.
 *
 * Returns the visible reply (with the block stripped) plus a typed
 * action payload if the block was well-formed and we recognise its
 * `type`. Any malformed block is silently ignored — the widget still
 * shows the raw reply so the user sees something rather than nothing.
 *
 * Recognised action types and their required payload shape:
 *   - search-snippets      { query: string }
 *   - filter-category      { category: string }
 *   - switch-tab           { tab: "snippets" | "setup-agent" | "setups" }
 *   - search-azure-tasks   { query?: string, fromDaysBack?: number,
 *                           from?: string, to?: string } — at least one
 *                           field must be present and well-formed.
 */
const ALLOWED_TABS = new Set([
  "snippets",
  "setup-agent",
  "setups",
]);

/** Cap date-window offsets so a stray "last 99999 days" can't wreck the query. */
const MAX_DAYS_BACK = 365;

function parseActionBlock(rawReply: string): {
  reply: string;
  action: null | {
    type: string;
    label: string;
    payload: Record<string, unknown>;
  };
} {
  const match = rawReply.match(/```snip-action\s*([\s\S]*?)```/i);
  if (!match) return { reply: rawReply, action: null };

  const json = match[1].trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    // Malformed JSON — leave the block in the reply so the user knows
    // something went wrong, and don't surface a broken action.
    return { reply: rawReply, action: null };
  }

  if (!parsed || typeof parsed !== "object") {
    return { reply: rawReply, action: null };
  }
  const candidate = parsed as Record<string, unknown>;
  const type = typeof candidate.type === "string" ? candidate.type : "";
  const label = typeof candidate.label === "string" ? candidate.label : "";
  const payload =
    candidate.payload && typeof candidate.payload === "object"
      ? (candidate.payload as Record<string, unknown>)
      : {};

  let validated: Record<string, unknown> | null = null;
  switch (type) {
    case "search-snippets":
      if (typeof payload.query === "string" && payload.query.trim()) {
        validated = { query: payload.query.trim().slice(0, 200) };
      }
      break;
    case "search-azure-tasks": {
      // All four fields are optional but at least one must pass
      // validation, otherwise we drop the action. Each field has its
      // own shape check below.
      const out: Record<string, unknown> = {};
      if (typeof payload.query === "string" && payload.query.trim()) {
        out.query = payload.query.trim().slice(0, 200);
      }
      if (typeof payload.fromDaysBack === "number" && Number.isFinite(payload.fromDaysBack)) {
        const n = Math.floor(payload.fromDaysBack);
        if (n >= 1 && n <= MAX_DAYS_BACK) {
          out.fromDaysBack = n;
        }
      }
      // ISO date/datetime strings — accept any string Date can parse,
      // then re-stringify to ISO so downstream code gets a canonical
      // shape. We don't try to be clever about formats here.
      for (const k of ["from", "to"] as const) {
        const raw = payload[k];
        if (typeof raw === "string" && raw.trim()) {
          const d = new Date(raw);
          if (!Number.isNaN(d.getTime())) {
            out[k] = d.toISOString();
          }
        }
      }
      if (Object.keys(out).length > 0) {
        validated = out;
      }
      break;
    }
    case "filter-category":
      if (typeof payload.category === "string" && payload.category.trim()) {
        validated = { category: payload.category.trim().slice(0, 100) };
      }
      break;
    case "switch-tab":
      if (
        typeof payload.tab === "string" &&
        ALLOWED_TABS.has(payload.tab)
      ) {
        validated = { tab: payload.tab };
      }
      break;
    default:
      // Unknown action type — drop it.
      return { reply: rawReply, action: null };
  }

  if (!validated) return { reply: rawReply, action: null };

  const visibleReply = rawReply.replace(match[0], "").trimEnd();
  return {
    reply: visibleReply,
    action: {
      type,
      label: label || `Apply: ${type}`,
      payload: validated,
    },
  };
}

/**
 * Cap on how many follow-up chips a single reply can carry. More than
 * 3 starts to feel like a menu rather than a suggestion.
 */
const MAX_FOLLOWUPS = 3;
const MAX_FOLLOWUP_LEN = 120;

/**
 * Parse a fenced ```snip-followups``` JSON array block out of `raw`.
 *
 * Accepts any of:
 *   ```snip-followups
 *   ["How do I run this locally?", "What about TypeScript?"]
 *   ```
 *   ```snip-followups
 *   { "followups": ["…", "…"] }
 *   ```
 *
 * Returns the cleaned string array, or null if the block was missing
 * or malformed. Strings are trimmed and length-capped so a verbose
 * model can't blow up the widget UI.
 */
function parseFollowups(raw: string): string[] | null {
  const match = raw.match(/```snip-followups\s*([\s\S]*?)```/i);
  if (!match) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1].trim());
  } catch {
    return null;
  }

  // Accept either a top-level array or an object with `followups`.
  let arr: unknown;
  if (Array.isArray(parsed)) arr = parsed;
  else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as Record<string, unknown>).followups)
  ) {
    arr = (parsed as Record<string, unknown>).followups;
  } else {
    return null;
  }

  const cleaned: string[] = [];
  for (const item of arr as unknown[]) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t) continue;
    cleaned.push(t.slice(0, MAX_FOLLOWUP_LEN));
    if (cleaned.length >= MAX_FOLLOWUPS) break;
  }
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Strip both `snip-action` and `snip-followups` blocks out of `rawReply`.
 *
 * This is the single entry point the route uses. It handles the case
 * where the model emits both kinds in one reply (action suggestion
 * plus 1-3 follow-up chips). Malformed blocks are silently dropped —
 * the visible reply keeps the raw text so the user always sees
 * something.
 */
function parseStructuredBlocks(rawReply: string): {
  reply: string;
  action: null | {
    type: string;
    label: string;
    payload: Record<string, unknown>;
  };
  followups: string[] | null;
} {
  // Strip the action block first (existing logic). The remaining text
  // is what we render visibly.
  const actionResult = parseActionBlock(rawReply);
  // Now look for follow-ups in the *visible* reply — the model is
  // instructed to emit the follow-ups block last, after the action,
  // so it survives the first strip.
  const followups = parseFollowups(actionResult.reply);
  // If we found follow-ups, strip them from the visible text too.
  let reply = actionResult.reply
  if (followups) {
    const m = reply.match(/```snip-followups\s*[\s\S]*?```/i)
    if (m) reply = reply.replace(m[0], "").trimEnd()
  }
  return {
    reply,
    action: actionResult.action,
    followups,
  };
}
