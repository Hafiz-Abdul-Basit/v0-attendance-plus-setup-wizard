/**
 * Chatbot → app event bus.
 *
 * The chatbot lives in a sibling tree from the host components
 * (it mounts in `app/ClientLayout.tsx`; the hosts are in
 * `components/installation-wizard.tsx` and `components/snippets-content.tsx`).
 * Rather than thread dispatchers through every layer, the widget
 * dispatches a custom DOM event and the host components listen for it.
 *
 * Usage from the widget:
 *
 *   fireChatbotAction({
 *     type: "search-snippets",
 *     label: "Show me snippets about IIS URL Rewrite",
 *     payload: { query: "IIS URL Rewrite" },
 *   })
 *   // window.dispatchEvent(new CustomEvent("snip:action", { detail: action }))
 *
 * Usage from a host component:
 *
 *   useEffect(() => {
 *     const handler = (e: Event) => {
 *       const detail = (e as CustomEvent<ChatbotAction>).detail
 *       if (detail.type === "search-snippets") {
 *         setLocalSearchQuery(detail.payload.query)
 *       }
 *     }
 *     window.addEventListener("snip:action", handler as EventListener)
 *     return () => window.removeEventListener("snip:action", handler as EventListener)
 *   }, [])
 *
 * Centralising the payload types here keeps both ends honest — the
 * widget can only emit actions the host knows how to handle.
 */

export type ChatbotAction =
  | {
      type: "search-snippets"
      label: string
      payload: { query: string }
    }
  | {
      type: "filter-category"
      label: string
      payload: { category: string }
    }
  | {
      // Switch one of the wizard's main tabs. The host
      // (installation-wizard) listens for this and toggles its
      // internal boolean flags; no URL change is needed since the
      // wizard is a single-page app.
      type: "switch-tab"
      label: string
      payload: {
        tab: "snippets" | "setup-agent" | "setups" | "app-menu"
      }
    }
  | {
      // Filter / search Azure Tasks. Implemented by navigating to
      // /azure-tasks with one or more URL params; the page reads them
      // on mount. A "navigate" is required because Azure Tasks lives
      // on a separate page; the chat widget can't reach into it from
      // the wizard.
      //
      // All payload fields are optional, but at least one must be
      // present for the action to be useful:
      //
      //   • `query`         — free-text search bar (matches title/description).
      //                       Use for keywords like "blocked", "iis", "july".
      //   • `fromDaysBack`  — set the date window to "last N days from
      //                       now". Use for natural phrases like "last
      //                       3 days" (3), "past week" (7), "past 24
      //                       hours" (1), "past month" (30).
      //   • `from` / `to`   — explicit ISO date range. Use for named
      //                       months like "July" (`from=2026-07-01`,
      //                       `to=2026-07-31T23:59:59Z`). `from` alone
      //                       means "since date X".
      //
      // The system prompt teaches the model when to use which field.
      type: "search-azure-tasks"
      label: string
      payload: {
        query?: string
        fromDaysBack?: number
        from?: string // ISO date or datetime
        to?: string // ISO date or datetime
      }
    }

export const CHATBOT_ACTION_EVENT = "snip:action"

export function fireChatbotAction(action: ChatbotAction): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<ChatbotAction>(CHATBOT_ACTION_EVENT, { detail: action }),
  )
}
