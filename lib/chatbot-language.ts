/**
 * Lightweight language detection + supported-locale helper for the
 * chatbot widget.
 *
 * Why a tiny helper instead of a library:
 *   - We only support two languages right now (English + Urdu).
 *   - We don't need full CLD3-grade accuracy — the heuristic is
 *     "any Urdu-script character" → Urdu, otherwise English.
 *   - Avoiding a dependency keeps the widget bundle small.
 *
 * Browser SpeechRecognition only supports a fixed set of BCP-47
 * locale tags, and quality varies. We pick the best-supported tag
 * for each language here, and the widget falls back to the user's
 * browser language if neither matches.
 */

/** Languages the user can pick from in the chat header. */
export type ChatLanguage = "en" | "ur"

/**
 * Best-supported BCP-47 tag for each language. Order matters when
 * multiple regions are listed — the first is what we request; the
 * rest are accepted but lower priority.
 */
export const SUPPORTED_LANGS: Record<
  ChatLanguage,
  { label: string; nativeLabel: string; bcp47: string[] }
> = {
  en: {
    label: "English",
    nativeLabel: "English",
    bcp47: ["en-US", "en-GB", "en"],
  },
  ur: {
    label: "Urdu",
    // Native name in Urdu script so the toggle reads naturally
    // when the UI is RTL.
    nativeLabel: "اردو",
    bcp47: ["ur-PK", "ur-IN", "ur"],
  },
}

/**
 * Detect the language of a free-form message by looking at its
 * Unicode character classes. Returns "ur" if the message contains
 * any character in the Urdu/Arabic script block (U+0600-U+06FF)
 * — Urdu and Arabic share the same script, but we treat any Arabic-
 * block text as Urdu since that's the user's stated preference for
 * this widget. Returns "en" otherwise.
 *
 * The check is intentionally inclusive: a single Urdu character
 * flips the language, because the user might mix scripts ("Please
 * search for X — یہ ٹھیک ہے").
 */
export function detectLanguage(text: string): ChatLanguage {
  if (!text) return "en"
  // Arabic / Urdu script block. Includes Arabic letters, Urdu
  // specific letters (ے، ٹ، ڈ etc.), and Persian extensions.
  const urduArabicRe = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/
  return urduArabicRe.test(text) ? "ur" : "en"
}

/**
 * Pick the best BCP-47 tag for `recognition.lang`. We accept any
 * browser-reported locale and try to map it to one of our supported
 * languages; if neither matches, we fall back to the language code
 * itself (e.g. "en", "ur") which the browser usually accepts.
 */
export function resolveRecognitionLang(
  preferred: ChatLanguage,
  browserLocale?: string,
): string {
  const supported = SUPPORTED_LANGS[preferred].bcp47
  // Honor a user-set preferred language first.
  if (preferred === "en") return supported[0]
  if (preferred === "ur") return supported[0]
  // Browser locale match — pick the first supported tag that's a
  // prefix of the browser's locale.
  if (browserLocale) {
    const lower = browserLocale.toLowerCase()
    for (const tag of supported) {
      if (lower.startsWith(tag.toLowerCase())) return tag
    }
  }
  return supported[0]
}
