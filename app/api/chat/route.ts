import { type NextRequest, NextResponse } from "next/server";

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
4. If asked something app-specific you genuinely can't know (exact snippet
   count today, whether a specific snippet exists), say so instead of
   guessing — don't invent snippet names or counts. This is the only category
   where you hold back; everything else, just answer.

BOUNDARIES
- Don't claim to perform actions you can't (you can't create/edit/delete
  snippets yourself unless explicitly wired up to do so — just guide the user
  to the UI).
- Keep responses under ~150 words unless the user asks for a deep explanation.

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
     (Setup Agent, Setups, Main App Menu, etc.).
   - Payload: { "tab": "<one of: snippets, setup-agent, setups, app-menu>" }
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

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Chatbot not configured: missing GEMINI_API_KEY" },
        { status: 500 },
      );
    }

    const body = await request.json();

    // The widget sends the user's preferred language (`"en"` or
    // `"ur"`) so the model can reply in the right script. We accept
    // and forward it; the system prompt has a language directive
    // that honours whatever is passed here.
    const requestedLanguage =
      typeof body?.language === "string" &&
      (body.language === "en" || body.language === "ur")
        ? body.language
        : null;

    // Accept TWO payload shapes so this endpoint works with both the
    // simple widget and any richer client:
    //   1. { messages: [{ role, content }, ...] }  — full transcript
    //   2. { message: string, history?: [{ role, content }, ...] } —
    //      the latest turn + optional prior turns (what the widget
    //      sends). The server appends `message` as the final entry.
    //
    // Roles are normalised to Gemini's `"user" | "model"` here, so
    // senders can use either "assistant" or "model" for the model role.
    let contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (Array.isArray(body?.messages) && body.messages.length > 0) {
      contents = body.messages.map(
        (m: { role: string; content: string }) => ({
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: String(m.content ?? "") }],
        }),
      );
    } else if (typeof body?.message === "string" && body.message.trim()) {
      const history = Array.isArray(body.history) ? body.history : [];
      for (const m of history) {
        contents.push({
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: String(m.content ?? "") }],
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: body.message }],
      });
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 },
      );
    }

    // Try each model in order. 404 (model retired / not provisioned for
    // this key) falls through to the next entry. Any other non-2xx is
    // surfaced immediately — retrying a 429 or 403 would just hit the
    // same failure.
    let last404: string | null = null;
    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Build a language directive that overrides the default
            // "match the user's language" rule in SYSTEM_CONTEXT. We
            // append it after the base prompt so the model sees both.
            // When `requestedLanguage` is null (older client or
            // /api/chat called without a language field), we fall
            // back to the prompt's default behaviour.
            system_instruction: {
              parts: [
                { text: SYSTEM_CONTEXT },
                ...(requestedLanguage
                  ? [
                      {
                        text: `LANGUAGE OVERRIDE: Reply in ${requestedLanguage === "ur" ? "Urdu (اردو script)" : "English"}. Even if the user's message is in a different language, respond in ${requestedLanguage === "ur" ? "Urdu" : "English"}. Keep action-block JSON in the same shape regardless of language; only the visible reply text changes.`,
                      },
                    ]
                  : []),
              ],
            },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
            },
          }),
          // Cap so a stalled connection doesn't tie up the route handler.
          signal: AbortSignal.timeout(20_000),
        });
      } catch (error) {
        console.error("Gemini fetch failed:", error);
        return NextResponse.json(
          { error: "Chatbot request failed. Try again in a moment." },
          { status: 502 },
        );
      }

      if (response.status === 404) {
        const errText = await response.text().catch(() => "");
        console.warn(`[chat] Gemini model ${model} not available, trying next`);
        last404 = errText.slice(0, 200);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", errText);
        return NextResponse.json(
          { error: "Chatbot request failed. Try again in a moment." },
          { status: 502 },
        );
      }

      const data = await response.json();
      const rawReply =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text)
          .join("") ?? "Sorry, I couldn't generate a response.";

      // Strip optional fenced blocks out of the visible reply and
      // surface them as structured payloads. Two block kinds:
      //   ```snip-action    → in-app action suggestion (search/filter/tab)
      //   ```snip-followups → 1-3 short follow-up question chips
      // Both use their own fence language so prose wrapped in
      // `json`/`` ` `` etc. fences is left untouched.
      const { reply, action, followups } = parseStructuredBlocks(rawReply);

      return NextResponse.json({
        reply,
        action: action ?? null,
        followups: followups ?? null,
      });
    }

    // Every model returned 404 — log a useful diagnostic for the operator.
    console.error(
      "[chat] No Gemini model available. Last error:",
      last404,
      "Tried:",
      GEMINI_MODELS.join(", "),
    );
    return NextResponse.json(
      {
        error:
          "No Gemini model is available for this API key. Run `curl 'https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY'` to see the supported list, then update GEMINI_MODELS in app/api/chat/route.ts.",
      },
      { status: 502 },
    );
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
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
 *   - switch-tab           { tab: "snippets" | "setup" | "azure-tasks" | "app-menu" }
 *   - search-azure-tasks   { query?: string, fromDaysBack?: number,
 *                           from?: string, to?: string } — at least one
 *                           field must be present and well-formed.
 */
const ALLOWED_TABS = new Set([
  "snippets",
  "setup-agent",
  "setups",
  "app-menu",
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
