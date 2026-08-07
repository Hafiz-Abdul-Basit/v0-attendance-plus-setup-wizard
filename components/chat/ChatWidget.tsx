"use client";

/**
 * ChatWidget — global floating AI assistant ("Snip").
 *
 * What it does:
 *   1. On mount, fetches GET /api/chatbot-status. If enabled, renders the
 *      launcher + chat panel. If disabled (or the fetch fails), renders
 *      nothing — fail closed. Never discoverable to a user without access.
 *   2. On send, POSTs to /api/chat. The route returns `{ reply, action }`:
 *      `reply` is the visible text, `action` is an optional structured
 *      payload that the host app can run (search, filter, swap tab,
 *      search Azure Tasks). The widget renders the action as a
 *      confirmation chip — the user has to click "Apply" before anything
 *      happens (per the safe-by-default product decision).
 *   3. Every model bubble has a hover-revealed Copy button that uses
 *      `navigator.clipboard.writeText`.
 *
 * How host components opt in:
 *   The widget dispatches a CustomEvent (`snip:action`) on `window`.
 *   Host components subscribe via `window.addEventListener` and act on
 *   the typed payload. Single source of truth for the event shape is
 *   `lib/chatbot-events.ts`.
 *
 * Skip list: the widget never renders on /login or /register, matching
 * the CommandPalette / ShortcutsOverlay pattern.
 */
import * as React from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Calendar,
  CalendarDays,
  Check,
  Code2,
  CornerDownRight,
  Copy,
  Database,
  FileCode2,
  Filter,
  Globe,
  KeyRound,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Search,
  Send,
  Server,
  Sparkles,
  UserCog,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHATBOT_ACTION_EVENT,
  fireChatbotAction,
  type ChatbotAction,
} from "@/lib/chatbot-events";
import {
  detectLanguage,
  resolveRecognitionLang,
  SUPPORTED_LANGS,
  type ChatLanguage,
} from "@/lib/chatbot-language";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  /** Optional structured action surfaced alongside the reply. */
  action?: ChatbotAction | null;
  /**
   * Optional follow-up question chips. The model emits up to 3 of
   * these per reply; the widget renders them as tappable buttons
   * below the bubble.
   */
  followups?: string[] | null;
  /** ISO timestamp used for the small "x ago" label below each bubble. */
  sentAt: number;
}

/**
 * Minimal subset of the Web Speech API we use. We don't import the
 * full type because not all TS libs ship `SpeechRecognition`. Both
 * the standard and webkit-prefixed constructors expose the same
 * shape, so we treat them as the same type.
 */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type Status = "loading" | "enabled" | "disabled" | "error";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

// Human-readable labels for the action types — used by the suggestion
// card. Keep in sync with the action types in lib/chatbot-events.ts.
const ACTION_META: Record<
  ChatbotAction["type"],
  { icon: React.ComponentType<{ className?: string }>; verb: string }
> = {
  "search-snippets": { icon: Search, verb: "Search snippets" },
  "filter-category": { icon: Filter, verb: "Filter category" },
  "switch-tab": { icon: LayoutGrid, verb: "Switch tab" },
  "search-azure-tasks": { icon: Server, verb: "Search Azure Tasks" },
};

/**
 * Curated suggested questions shown in the empty state. Phrased so the
 * answer is useful even on first contact, and grouped by icon so the
 * chips look like a category list at a glance.
 *
 * Update as new product areas (or recurring questions) get added —
 * this is the single highest-leverage UX surface in the widget.
 */
const SUGGESTED_QUESTIONS: ReadonlyArray<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
}> = [
  {
    icon: Database,
    label: "Show me SQL Server snippets only",
    prompt: "Show me only the SQL Server category.",
  },

  {
    icon: FileCode2,
    label: "MongoDB: last 7 days of activity",
    prompt:
      "Write a MongoDB aggregation that groups documents by day for the last 7 days. Assume a `createdAt` date field.",
  },
  {
    icon: Code2,
    label: "PowerShell: restart a remote IIS app pool",
    prompt:
      "Write a PowerShell snippet that restarts an IIS application pool on a remote server using Invoke-Command.",
  },

  {
    icon: Calendar,
    label: "Show me the last 3 days of tasks",
    prompt: "Show me Azure Tasks from the last 3 days.",
  },
  {
    icon: CalendarDays,
    label: "Show me last month's tasks",
    prompt: "Show me Azure Tasks from last month.",
  },
];

/**
 * Tiny segmented language toggle that sits in the chat header.
 *
 * The user can pin a language (persisted in localStorage) or rely on
 * auto-detection from the most recent user message. The third "Auto"
 * option is the default and clears the stored preference.
 */
function LanguageToggle({
  value,
  effective,
  onChange,
}: {
  value: ChatLanguage | null;
  effective: ChatLanguage;
  onChange: (lang: ChatLanguage | null) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Chat language"
      className="inline-flex items-center rounded-full bg-white/15 p-0.5 text-[10px] font-medium"
    >
      {(["en", "ur"] as const).map((code) => {
        const isActive = value === code;
        const label =
          code === "ur"
            ? SUPPORTED_LANGS.ur.nativeLabel
            : SUPPORTED_LANGS.en.label;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(isActive ? null : code)}
            aria-pressed={isActive}
            title={isActive ? `Using ${label}` : `Switch to ${label}`}
            className={cn(
              "px-2 py-1 rounded-full transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-white/40",
              isActive
                ? "bg-white text-purple-700 shadow-sm"
                : "text-white/85 hover:text-white",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ChatWidget() {
  const pathname = usePathname();
  const isPublicPage = pathname !== null && PUBLIC_PATHS.has(pathname);

  const [status, setStatus] = React.useState<Status>("loading");
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [listening, setListening] = React.useState(false);
  // User's selected chat language. Persisted in localStorage so the
  // choice survives a refresh. When null, we auto-detect from the
  // most recent user message.
  const [language, setLanguage] = React.useState<ChatLanguage | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  // Tracks the latest finalised transcript across `onresult` events
  // so we can auto-send when the user stops listening.
  const finalTranscriptRef = React.useRef<string>("");
  const voiceSupported =
    typeof window !== "undefined" &&
    (typeof (window as unknown as { SpeechRecognition?: unknown })
      .SpeechRecognition !== "undefined" ||
      typeof (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition !== "undefined");

  // Load the persisted language preference on first mount.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(
        "snip-chat-language",
      ) as ChatLanguage | null;
      if (stored === "en" || stored === "ur") setLanguage(stored);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  // The effective language we send to the server / speech API.
  // Falls back to: explicit user choice → auto-detect from the last
  // user message → English default.
  const effectiveLanguage: ChatLanguage = React.useMemo(() => {
    if (language) return language;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return detectLanguage(messages[i].content);
      }
    }
    return "en";
  }, [language, messages]);

  // Single status check on mount. Per spec: fail closed. If the request
  // throws, times out, or returns non-2xx, status stays "disabled" and
  // we render nothing.
  React.useEffect(() => {
    if (isPublicPage) return;
    let cancelled = false;
    fetch("/api/chatbot-status", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return { enabled: false };
        const data = (await res.json().catch(() => ({}))) as {
          enabled?: boolean;
        };
        return { enabled: Boolean(data.enabled) };
      })
      .then((data) => {
        if (cancelled) return;
        setStatus(data.enabled ? "enabled" : "disabled");
      })
      .catch(() => {
        if (cancelled) return;
        // Fail closed — network error means we don't render the launcher.
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [isPublicPage]);

  // Auto-scroll to the latest message whenever messages change.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  /**
   * Toggle voice input on/off using the browser's Web Speech API.
   *
   * We use `continuous: true` so Chrome keeps listening past its
   * default ~3-second silence timeout. The "no-speech" error fires
   * aggressively in `continuous: false` mode the moment the user
   * pauses, which makes headphone dictation frustrating. With
   * `continuous: true`, the user can take a moment to compose a
   * thought without Chrome giving up.
   *
   * The user stops dictation by clicking the mic button again, or
   * the page can call `stop()` from elsewhere (e.g. when a final
   * transcript is captured and Enter is pressed).
   *
   * Other notes:
   *   • Web Speech only works on `localhost` and `https://`. Plain
   *     `http://192.168.x.x` will throw `not-allowed`. We surface that.
   *   • Headphone mics on Windows sometimes aren't the default input
   *     device — Chrome will still pick *some* mic, which can be the
   *     wrong one. We can't fix that, but the user-visible error will
   *     at least tell them what's wrong.
   *
   * Declared BEFORE the early returns below so the hook count stays
   * stable across renders when `status` flips from "loading" to
   * "enabled".
   */
  const toggleVoice = React.useCallback(() => {
    if (!voiceSupported) return;
    if (listening) {
      // The user clicked the mic again to stop. We'll let `onend`
      // handle the auto-send (it sees the final transcript in
      // `currentFinalRef`).
      recognitionRef.current?.stop();
      return;
    }
    const Ctor =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionLike;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRecognitionLike;
        }
      ).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    // Use the user's selected language (or browser fallback) for the
    // speech API. The server-side model uses the same language code
    // for replies so the voice → text → reply loop stays consistent.
    recognition.lang = resolveRecognitionLang(
      effectiveLanguage,
      typeof navigator !== "undefined" ? navigator.language : undefined,
    );
    // continuous: true keeps Chrome listening past short pauses,
    // so the user has time to compose their thought.
    recognition.continuous = true;
    recognition.interimResults = true;

    // We track the latest final transcript across `onresult` events
    // so we can auto-send when the user explicitly stops listening.
    finalTranscriptRef.current = "";

    recognition.onresult = (event: {
      results: ArrayLike<
        { transcript?: string; isFinal?: boolean } & ArrayLike<{
          transcript: string;
        }>
      >;
    }) => {
      let text = "";
      let lastFinal = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        text += result[0]?.transcript ?? "";
        // Capture the longest stretch of finalised text — Chrome
        // appends to `event.results` over time, so the final entry's
        // `isFinal` tells us "this chunk is locked in".
        if (result.isFinal) lastFinal = text;
      }
      setInput(text.trimStart());
      if (lastFinal) finalTranscriptRef.current = lastFinal.trimStart();
    };

    recognition.onerror = (event: { error?: string }) => {
      // Don't surface `no-speech` while in continuous mode — Chrome
      // fires it intermittently during long pauses and we don't want
      // to spam the user.
      const code = event?.error ?? "unknown";
      if (code === "no-speech") return;

      setListening(false);
      recognitionRef.current = null;
      const friendly =
        code === "not-allowed" || code === "service-not-allowed"
          ? "Microphone access blocked. Click the mic icon in the address bar and allow access, then try again."
          : code === "audio-capture"
            ? "No microphone found. Check that a mic is connected and that Chrome is allowed to use it."
            : code === "network"
              ? "Speech recognition needs an internet connection."
              : `Voice input failed (${code}).`;
      setError(friendly);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      // Auto-send: if the recognizer captured any final transcript,
      // fire `send()` with that text so the user doesn't have to
      // press Enter or click Send after dictating. The override path
      // bypasses the optimistic append, so this works whether the
      // textarea still holds the same text or has been cleared.
      const finalText = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      if (finalText && !busy) {
        // Use a microtask so React finishes the state updates from
        // `setListening(false)` before we kick off the network call.
        queueMicrotask(() => {
          void send(finalText);
        });
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setError(null);
    } catch (err) {
      // `start()` throws synchronously on insecure contexts
      // (http://192.168.x.x) or when permission is denied. Show the
      // actual error rather than failing silently.
      setListening(false);
      recognitionRef.current = null;
      const message =
        err instanceof Error && err.message
          ? `Voice input unavailable: ${err.message}`
          : "Voice input unavailable. Use HTTPS or localhost, and allow microphone access.";
      setError(message);
    }
  }, [busy, effectiveLanguage, listening, voiceSupported]);

  // Stop any in-flight recognition when the panel closes or the user
  // hits send, so the mic doesn't keep capturing audio in the
  // background. Same hook-order requirement as `toggleVoice` above.
  React.useEffect(() => {
    if (!open && listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }
  }, [open, listening]);

  // Don't render anything on auth pages, while loading, or when disabled.
  // These returns are safe because every hook above runs unconditionally.
  if (isPublicPage) return null;
  if (status !== "enabled") return null;

  /**
   * Update the language preference and persist it. The next `send()`
   * reads `effectiveLanguage` (which depends on this state) and
   * forwards it to the server so the model replies in the chosen
   * language.
   */
  const setLanguagePref = (lang: ChatLanguage | null) => {
    setLanguage(lang);
    try {
      if (lang === null) window.localStorage.removeItem("snip-chat-language");
      else window.localStorage.setItem("snip-chat-language", lang);
    } catch {
      /* localStorage unavailable */
    }
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;

    const nextHistory: ChatMessage[] = [
      ...messages,
      { role: "user", content: text, sentAt: Date.now() },
    ];
    setMessages(nextHistory);
    if (override === undefined) setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          // Send the conversation WITHOUT the just-appended user turn
          // since the server appends it again as the final entry.
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          // The user's chosen (or auto-detected) language. The server
          // forwards this to the model so replies come back in the
          // same language the user wrote in.
          language: effectiveLanguage,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        action?: ChatbotAction | null;
        followups?: string[] | null;
        error?: string;
      };
      if (res.status === 403) {
        // The admin flipped the toggle off mid-session. Lock the panel.
        setStatus("disabled");
        setError(data.error ?? "Chatbot is currently disabled");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: data.reply!,
            action: data.action ?? null,
            followups: data.followups ?? null,
            sentAt: Date.now(),
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
      // Re-focus the input on the next tick so the user can keep typing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  /**
   * Re-send the most recent user turn and replace the last model
   * message in place. Triggered by the Regenerate button on the last
   * model bubble. No-op while busy or when the conversation is empty.
   */
  const regenerate = async () => {
    if (busy) return;
    // Find the last user message — the prompt we're regenerating from.
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        const prompt = messages[i].content;
        // Trim the transcript back to just before the model reply
        // we're regenerating. We keep the original user turn so the
        // regenerated conversation still shows the original question.
        const upToUser = messages.slice(0, i + 1);
        setMessages(upToUser);
        setError(null);
        // Re-send using the trimmed history. We bypass the optimistic
        // append so we don't duplicate the user turn.
        await sendWithHistory(prompt, upToUser.slice(0, -1));
        return;
      }
    }
  };

  /**
   * Internal send helper for cases where we've already appended the
   * user message ourselves (regenerate) and want to preserve the
   * existing history exactly. Identical to `send` but takes the
   * history snapshot explicitly so we don't double-count the user turn.
   */
  const sendWithHistory = async (text: string, history: ChatMessage[]) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          language: effectiveLanguage,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        action?: ChatbotAction | null;
        followups?: string[] | null;
        error?: string;
      };
      if (res.status === 403) {
        setStatus("disabled");
        setError(data.error ?? "Chatbot is currently disabled");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: data.reply!,
            action: data.action ?? null,
            followups: data.followups ?? null,
            sentAt: Date.now(),
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline so multi-line prompts work.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const resetConversation = () => {
    if (busy) return;
    setMessages([]);
    setError(null);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <>
      {/* Launcher button */}
      <button
        type="button"
        aria-label={open ? "Close Snip" : "Open Snip"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all",
          "bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
          "focus:outline-none focus:ring-4 focus:ring-purple-300",
          // gentle attention pulse when the panel is closed and there are
          // unhandled messages (none on first open, but useful after a long
          // session the user has stepped away from)
          !open && messages.length > 0 && "ring-4 ring-purple-300/40",
        )}
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Snip AI assistant"
          dir={effectiveLanguage === "ur" ? "rtl" : "ltr"}
          className={cn(
            "fixed bottom-24 right-5 z-40 flex flex-col",
            "w-[min(400px,calc(100vw-2.5rem))] h-[min(600px,calc(100vh-8rem))]",
            "rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden",
            "animate-in fade-in slide-in-from-bottom-2",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
            <div className="relative w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-purple-600"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">Snip</div>
              <div className="text-[11px] text-white/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {effectiveLanguage === "ur"
                  ? "آن لائن · AI اسسٹنٹ"
                  : "Online · AI assistant"}
              </div>
            </div>
            <LanguageToggle
              value={language}
              effective={effectiveLanguage}
              onChange={setLanguagePref}
            />
            <button
              type="button"
              onClick={resetConversation}
              disabled={busy || messages.length === 0}
              aria-label="Start a new conversation"
              title="New conversation"
              className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-md text-white/90 hover:text-white hover:bg-white/15",
                "focus:outline-none focus:ring-2 focus:ring-white/40",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className={cn(
              "snip-scroll flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50",
            )}
          >
            {messages.length === 0 ? (
              <EmptyState
                busy={busy}
                error={error}
                language={effectiveLanguage}
                onPick={(prompt) => void send(prompt)}
              />
            ) : (
              <>
                {messages.map((m, i) => (
                  <MessageBubble
                    key={i}
                    message={m}
                    isLast={i === messages.length - 1}
                    busy={busy}
                    onRegenerate={regenerate}
                    onFollowup={(text) => void send(text)}
                  />
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 pl-9">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Snip is thinking…
                  </div>
                )}
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-gray-200 px-3 py-2 bg-white">
            {listening && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-md bg-purple-50 border border-purple-200">
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inset-0 inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-purple-600" />
                </span>
                <span className="text-[11px] font-medium text-purple-700">
                  Listening… speak now. Click the mic again to stop.
                </span>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  listening
                    ? effectiveLanguage === "ur"
                      ? "سن رہا ہوں…"
                      : "Listening…"
                    : effectiveLanguage === "ur"
                      ? "سنیپ سے کچھ بھی پوچھیں…"
                      : "Ask Snip anything…"
                }
                rows={1}
                disabled={busy}
                className={cn(
                  "flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400",
                  "disabled:opacity-50 max-h-32",
                  listening && "border-purple-400 ring-2 ring-purple-200",
                )}
              />
              {voiceSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={toggleVoice}
                  disabled={busy}
                  aria-label={listening ? "Stop dictation" : "Start dictation"}
                  title={listening ? "Stop dictation" : "Dictate"}
                  className={cn(
                    listening
                      ? "border-purple-400 text-purple-700 bg-purple-50 animate-pulse"
                      : "text-gray-500 hover:text-purple-700 hover:border-purple-300",
                  )}
                >
                  {listening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                onClick={() => void send()}
                disabled={busy || input.trim().length === 0}
                className="bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                aria-label="Send message"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-gray-400 text-center">
              Enter to send · Shift+Enter for newline ·{" "}
              {effectiveLanguage === "ur"
                ? "جمینی سے چلتا ہے"
                : "Powered by Gemini"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Empty state — greeting + curated suggested-question chips.
 *
 * The chips are clickable buttons that prefill the composer with the
 * full prompt and immediately send it. They disappear once the user
 * sends their first message so they don't compete with the transcript
 * for vertical space.
 */
function EmptyState({
  busy,
  error,
  onPick,
  language,
}: {
  busy: boolean;
  error: string | null;
  onPick: (prompt: string) => void;
  language: ChatLanguage;
}) {
  const isUrdu = language === "ur";
  return (
    <div className="flex flex-col h-full">
      {/* Greeting */}
      <div className="flex flex-col items-center text-center pt-4 pb-5 px-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">
          {isUrdu ? "ہیلو، میں سنیپ ہوں 👋" : "Hi, I'm Snip 👋"}
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-[300px]">
          {isUrdu
            ? "اسنیپٹس، ایژر ٹاسکس، اور فوری جوابات کے لیے آپ کا بلٹ ان اسسٹنٹ۔ میں ایپ میں تلاش اور فلٹر بھی کر سکتا ہوں — نیچے کوئی سوال منتخب کریں یا خود لکھیں۔"
            : "Your built-in assistant for snippets, Azure Tasks, and quick answers. I can also search and filter the app for you — pick a starter question or type your own below."}
        </p>
      </div>

      {/* Suggested question chips */}
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-gray-400 px-1">
          <MessageSquare className="w-3 h-3" />
          {isUrdu ? "تجاویز" : "Suggested"}
        </div>
        <div className="grid gap-2">
          {SUGGESTED_QUESTIONS.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.label}
                type="button"
                disabled={busy}
                onClick={() => onPick(q.prompt)}
                className={cn(
                  "group flex items-start gap-2.5 text-left rounded-xl border border-gray-200 bg-white",
                  "px-3 py-2.5 text-xs leading-snug text-gray-700",
                  "hover:border-purple-300 hover:bg-purple-50/40 hover:text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-purple-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white",
                  "transition-colors",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex shrink-0 items-center justify-center w-6 h-6 rounded-md",
                    "bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700",
                    "group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white",
                    "transition-colors",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {busy && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {isUrdu ? "سنیپ سوچ رہا ہے…" : "Snip is thinking…"}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 mt-4">
          {error}
        </div>
      )}

      {/* Push everything up so chips don't cling to the composer. */}
      <div className="flex-1" />

      <p className="text-[10px] text-gray-400 text-center pt-3">
        Snip can make mistakes — verify important info.
      </p>
    </div>
  );
}

/**
 * One message in the transcript. Model bubbles get a small "Snip" avatar
 * on the left, a hover-revealed bubble-level Copy button, a timestamp,
 * and (optionally) an action suggestion card plus follow-up chips.
 *
 * The regenerate button only appears on the LAST model message in the
 * transcript — there's no point regenerating an old reply if the
 * conversation has moved on.
 *
 * User bubbles sit flush to the right with no avatar. The shared
 * `max-w-[min(320px,…)]` keeps both bubble types roughly aligned.
 */
function MessageBubble({
  message,
  isLast,
  busy,
  onRegenerate,
  onFollowup,
}: {
  message: ChatMessage;
  isLast: boolean;
  busy: boolean;
  onRegenerate: () => void;
  onFollowup: (text: string) => void;
}) {
  const isUser = message.role === "user";
  const showRegenerate = !isUser && isLast && !busy;
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          aria-hidden="true"
          className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm mt-0.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col min-w-0",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "group/bubble relative max-w-[min(320px,calc(100vw-7rem))] rounded-2xl text-sm break-words",
            // Slightly tighter padding on user bubbles since they hold
            // prose only — model bubbles need room for code blocks.
            isUser
              ? "px-3.5 py-2 leading-relaxed bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-md"
              : "px-3.5 py-2.5 leading-relaxed bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm",
          )}
        >
          <MessageContent content={message.content} isUser={isUser} />
          {!isUser && (
            <>
              <CopyButton
                text={message.content}
                className="absolute -top-2 -right-2 opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 transition-opacity"
              />
              {showRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  aria-label="Regenerate response"
                  title="Regenerate"
                  className={cn(
                    "absolute -top-2 right-6 inline-flex items-center justify-center w-6 h-6 rounded-md",
                    "bg-white border border-gray-200 text-gray-500 shadow-sm",
                    "hover:bg-gray-50 hover:text-purple-700",
                    "focus:outline-none focus:ring-2 focus:ring-purple-300",
                    "opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 transition-opacity",
                  )}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        <div
          className={cn(
            "mt-1 text-[10px] text-gray-400 px-1 flex items-center gap-2",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <span>{formatTime(message.sentAt)}</span>
        </div>

        {!isUser && message.action && (
          <ActionSuggestion action={message.action} />
        )}

        {!isUser && message.followups && message.followups.length > 0 && (
          <FollowupChips
            items={message.followups}
            disabled={busy}
            onPick={onFollowup}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Tappable follow-up question chips rendered below a model message.
 * The model emits up to 3 of these per reply (see `parseFollowups`
 * in app/api/chat/route.ts). Tapping a chip sends the text as a new
 * user prompt — same code path as typing it manually.
 */
function FollowupChips({
  items,
  disabled,
  onPick,
}: {
  items: string[];
  disabled: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((q, i) => (
        <button
          key={`${i}-${q}`}
          type="button"
          disabled={disabled}
          onClick={() => onPick(q)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50/60 px-2.5 py-1",
            "text-[11px] leading-tight text-purple-800",
            "hover:bg-purple-100 hover:border-purple-300 hover:text-purple-900",
            "focus:outline-none focus:ring-2 focus:ring-purple-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors",
          )}
        >
          <CornerDownRight className="w-3 h-3 shrink-0" />
          <span className="text-left">{q}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Renders the model's optional action suggestion as a card with an
 * "Apply" button. Dispatching the event is the host's problem — all
 * this component does is fire `fireChatbotAction(action)`.
 */
function ActionSuggestion({ action }: { action: ChatbotAction }) {
  const meta = ACTION_META[action.type];
  const Icon = meta.icon;
  const [applied, setApplied] = React.useState(false);

  const onApply = () => {
    // For search-azure-tasks we also navigate to the page, since the
    // chat widget can't reach into the panel's state from /azure-tasks.
    // Other actions stay in-page and ride the CustomEvent bus.
    if (action.type === "search-azure-tasks") {
      // Encode each populated field as its own URL param. The panel's
      // `queryBinding.fromUrl` reads these directly from
      // `window.location.search` on mount — no localStorage handoff
      // needed.
      const params = new URLSearchParams();
      const p = action.payload;
      if (p.query) params.set("search", p.query);
      if (typeof p.fromDaysBack === "number") {
        params.set("daysBack", String(p.fromDaysBack));
      }
      if (p.from) params.set("from", p.from);
      if (p.to) params.set("to", p.to);
      window.location.href = `/azure-tasks?${params.toString()}`;
      return;
    }
    fireChatbotAction(action);
    setApplied(true);
    // The "Applied" message stays visible for the session — it's more
    // honest than letting the user re-fire the same action by accident.
    window.setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div className="mt-2 w-full rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex shrink-0 items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
          <Icon className="w-3.5 h-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-700">
            {meta.verb}
          </div>
          <div className="text-xs text-gray-700 mt-0.5">{action.label}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={applied}
        className={cn(
          "mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
          "focus:outline-none focus:ring-2 focus:ring-purple-300",
          "transition-colors",
          applied
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700",
        )}
      >
        {applied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Applied
          </>
        ) : (
          <>
            <ArrowRight className="w-3.5 h-3.5" />
            Apply
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Round hover-revealed Copy button. Uses `navigator.clipboard.writeText`
 * with a graceful fallback for non-secure contexts. Briefly swaps the
 * icon to a checkmark on success.
 */
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const onClick = async (e: React.MouseEvent) => {
    // Stop the click from bubbling to the bubble (which would re-open
    // the bubble's parent handlers, e.g. a router.push on a snippet).
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select+execCommand for non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        // give up silently — copy is a convenience, not critical
      }
      document.body.removeChild(ta);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Copied" : "Copy message"}
      title={copied ? "Copied" : "Copy"}
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-md",
        "bg-white border border-gray-200 text-gray-500 shadow-sm",
        "hover:bg-gray-50 hover:text-gray-700",
        "focus:outline-none focus:ring-2 focus:ring-purple-300",
        className,
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

/**
 * Render a message's content. The model is instructed to use fenced
 * code blocks for any code (```sql, ```ts, etc.), so we keep this
 * renderer conservative: split on fences, render each fenced block in
 * a polished container with a language chip + inline copy button, and
 * render the rest as paragraphs with light markdown styling (headers,
 * bullets, bold/italic, inline code).
 *
 * We deliberately avoid a full markdown library — the dependency cost
 * isn't worth it for a chat widget, and the surface here is small.
 * Anyone who needs richer rendering can copy the reply.
 */
function MessageContent({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) {
  const segments = splitIntoSegments(content);
  return (
    <div className="space-y-2">
      {segments.map((seg, i) =>
        seg.kind === "code" ? (
          <CodeBlock key={i} code={seg.text} language={seg.language} />
        ) : (
          <ProseBlock key={i} text={seg.text} isUser={isUser} />
        ),
      )}
    </div>
  );
}

type Segment =
  | { kind: "prose"; text: string }
  | { kind: "code"; text: string; language: string };

/**
 * Split a message into alternating prose / code segments by walking the
 * triple-backtick fences. Anything inside the fence is `code`; the rest
 * is `prose`. Unmatched fences fall back to literal prose so we never
 * drop content.
 */
function splitIntoSegments(content: string): Segment[] {
  const out: Segment[] = [];
  const re = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      out.push({ kind: "prose", text: content.slice(lastIndex, m.index) });
    }
    out.push({ kind: "code", language: m[1] || "", text: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    out.push({ kind: "prose", text: content.slice(lastIndex) });
  }
  if (out.length === 0) out.push({ kind: "prose", text: content });
  return out;
}

/**
 * Render a fenced code block as a clean container: subtle border, mono
 * font, horizontal scroll for long lines, and a small header with a
 * language chip + per-block Copy button. The copy button copies the
 * code *without* the fence markers — that's what the user usually wants.
 */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = React.useState(false);
  const langLabel = language ? language.toUpperCase() : "CODE";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Same fallback path as the bubble Copy button.
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        /* give up silently */
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="not-prose my-1 overflow-hidden rounded-lg border border-gray-800/60 bg-[#0f172a] text-gray-100">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2.5 py-1">
        <span className="text-[10px] font-semibold tracking-wider text-gray-400">
          {langLabel}
        </span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? "Copied code" : "Copy code"}
          title={copied ? "Copied" : "Copy code"}
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
            "text-gray-300 hover:bg-white/10 hover:text-white",
            "focus:outline-none focus:ring-2 focus:ring-purple-400",
            "transition-colors",
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2 text-[12px] leading-relaxed font-mono whitespace-pre">
        {code.replace(/\n$/, "")}
      </pre>
    </div>
  );
}

/**
 * Render a prose segment with lightweight markdown styling:
 *   - split on blank lines into paragraphs
 *   - unordered lists (`- foo` / `* foo`) render as <ul>
 *   - ordered lists (`1. foo`) render as <ol>
 *   - headers (`#`, `##`, `###`) render as styled lines
 *   - `**bold**`, `*italic*`, and `` `inline code` `` get inline styling
 *
 * On user bubbles we strip markdown formatting (it's plain text from
 * the user) but keep line breaks and inline code so multi-line prompts
 * read naturally.
 */
function ProseBlock({ text, isUser }: { text: string; isUser: boolean }) {
  const blocks = text.split(/\n{2,}/g);
  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => (
        <ProseParagraph key={i} block={block} isUser={isUser} />
      ))}
    </div>
  );
}

function ProseParagraph({ block, isUser }: { block: string; isUser: boolean }) {
  const trimmed = block.trimEnd();
  if (!trimmed) return null;

  // Headings — only when the line starts with `#` and has no list marker.
  const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (heading && !isUser) {
    const level = heading[1].length;
    const cls =
      level === 1
        ? "text-sm font-bold text-gray-900 mt-1"
        : level === 2
          ? "text-[13px] font-semibold text-gray-900 mt-1"
          : "text-[12px] font-semibold text-gray-800 mt-0.5";
    return <div className={cls}>{renderInline(heading[2], isUser)}</div>;
  }

  // Unordered list — `- foo` / `* foo` lines.
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  const isUl =
    !isUser && lines.length > 0 && lines.every((l) => /^(?:- |\* )/.test(l));
  if (isUl) {
    const items = lines.map((l) => l.replace(/^(?:- |\* )/, "").trim());
    return (
      <ul className="list-disc pl-5 space-y-0.5 marker:text-gray-400">
        {items.map((it, i) => (
          <li key={i}>{renderInline(it, isUser)}</li>
        ))}
      </ul>
    );
  }

  // Ordered list — `1. foo` lines.
  const isOl =
    !isUser && lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l));
  if (isOl) {
    const items = lines.map((l) => l.replace(/^\d+\.\s/, "").trim());
    return (
      <ol className="list-decimal pl-5 space-y-0.5 marker:text-gray-400">
        {items.map((it, i) => (
          <li key={i}>{renderInline(it, isUser)}</li>
        ))}
      </ol>
    );
  }

  // Default paragraph — preserve single line breaks.
  return (
    <p className="whitespace-pre-wrap">
      {trimmed.split("\n").map((line, i, arr) => (
        <React.Fragment key={i}>
          {renderInline(line, isUser)}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  );
}

/**
 * Inline-level formatting: **bold**, *italic*, `inline code`.
 * Bold and italic are stripped on user bubbles (plain text), but
 * inline code stays because it's a useful visual marker even in
 * user-typed prompts.
 */
function renderInline(text: string, isUser: boolean): React.ReactNode {
  if (!text) return text;

  // First, split out inline code spans so we don't apply bold/italic
  // inside them. We tokenize on backticks: odd indices are code.
  const tokens = text.split(/(`[^`\n]+`)/g);
  return tokens.map((tok, i) => {
    if (i % 2 === 1) {
      const inner = tok.slice(1, -1);
      return (
        <code
          key={i}
          className={cn(
            "rounded px-1 py-0.5 font-mono text-[12px]",
            isUser
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-800 border border-gray-200/70",
          )}
        >
          {inner}
        </code>
      );
    }
    if (isUser) return tok;

    // For model prose, apply bold then italic. We do this in two passes
    // and flatten to a single ReactNode array per input segment so
    // React keys line up cleanly.
    const result: React.ReactNode[] = [];
    const bolded = tok.split(/(\*\*[^*\n]+\*\*)/g);
    bolded.forEach((seg, j) => {
      if (j % 2 === 1) {
        result.push(
          <strong key={`b-${i}-${j}`} className="font-semibold text-gray-900">
            {seg.slice(2, -2)}
          </strong>,
        );
        return;
      }
      // Non-bold segment — split into italics.
      const italicized = seg.split(/(\*[^*\n]+\*)/g);
      italicized.forEach((it, k) => {
        if (k % 2 === 1) {
          result.push(
            <em key={`i-${i}-${j}-${k}`} className="italic text-gray-800">
              {it.slice(1, -1)}
            </em>,
          );
        } else if (it) {
          result.push(it);
        }
      });
    });
    return result;
  });
}

/** "5:32 PM" — small, locale-aware time stamp for the bubble footer. */
function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
