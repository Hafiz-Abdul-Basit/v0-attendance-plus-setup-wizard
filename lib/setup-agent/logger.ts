/**
 * Server-side logger for the Setup Agent.
 *
 * Mirrors the project's existing `console.*` style — every other module in
 * `lib/azure-devops/` logs via `console.warn` / `console.error`. We follow
 * the same convention but add a small `SetupLogger` wrapper that:
 *   - prefixes every line with `[Setup]`
 *   - scrubs the Azure DevOps PAT (and a few related secrets) from every
 *     log message so they never leak to the server console or downstream
 *     consumers
 *   - supports a pluggable sink so the orchestrator can collect entries
 *     for the UI without forking the logging primitives
 *
 * This module is server-only (`server-only` marker) because the secret
 * scrubbing helpers assume server-side configuration exists.
 */

import "server-only"

import type { LogLevel, SetupLogEntry, SetupStepId } from "./types"

const SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Azure DevOps PAT — base64 of ":pat". Length varies; match a long base64
  // blob that follows an `Authorization: Basic …` or `pat=` token.
  {
    pattern: /Basic\s+[A-Za-z0-9+/=]{20,}/g,
    replacement: "Basic [REDACTED]",
  },
  {
    pattern: /pat=[A-Za-z0-9]{20,}/gi,
    replacement: "pat=[REDACTED]",
  },
  // Common password-shaped key/value pairs in env dumps or error messages.
  {
    pattern: /(password|passwd|pwd)\s*[:=]\s*"?[^"\s,;}]+"?/gi,
    replacement: "$1=[REDACTED]",
  },
  // Connection-string passwords (mongodb://user:pass@host, sqlserver pwd=…)
  {
    pattern: /(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/gi,
    replacement: "$1[REDACTED]$2",
  },
]

/** Redact secrets from a string. Idempotent — safe to call multiple times. */
export function scrubSecrets(input: string): string {
  if (!input) return input
  let out = input
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

/** A sink receives every log entry the orchestrator emits. */
export interface SetupLogSink {
  (entry: SetupLogEntry): void
}

/**
 * In-memory ring-buffer sink. Capped at MAX_ENTRIES so a long run cannot
 * grow unbounded — older entries are dropped (FIFO).
 */
export class MemoryLogSink {
  private buffer: SetupLogEntry[] = []
  readonly maxEntries: number

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries
  }

  push(entry: SetupLogEntry): void {
    this.buffer.push(entry)
    if (this.buffer.length > this.maxEntries) {
      this.buffer.splice(0, this.buffer.length - this.maxEntries)
    }
  }

  snapshot(): SetupLogEntry[] {
    return [...this.buffer]
  }

  clear(): void {
    this.buffer.length = 0
  }
}

/** A logger bound to a single run + step. */
export class SetupLogger {
  private readonly sink: SetupLogSink
  private readonly step: SetupStepId
  private readonly runId: string

  constructor(sink: SetupLogSink, runId: string, step: SetupStepId) {
    this.sink = sink
    this.runId = runId
    this.step = step
  }

  info(message: string): void {
    this.emit("info", message)
  }

  warn(message: string): void {
    this.emit("warn", message)
  }

  error(message: string): void {
    this.emit("error", message)
  }

  debug(message: string): void {
    this.emit("debug", message)
  }

  private emit(level: LogLevel, rawMessage: string): void {
    const message = scrubSecrets(rawMessage)
    const entry: SetupLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      step: this.step,
      message,
    }
    // Forward to the sink (orchestrator uses this to build UI state).
    this.sink(entry)
    // Also emit to the server console so logs survive a crash that wipes
    // the in-memory ring buffer. Format matches the project's `[Setup]`
    // prefix style called for in the task spec.
    const prefix = `[Setup][${this.runId}][${this.step}]`
    const line = `${prefix} ${message}`
    if (level === "error") console.error(line)
    else if (level === "warn") console.warn(line)
    else console.log(line)
  }
}

/** Default run-id factory — short and sortable. */
export function generateRunId(): string {
  const now = new Date()
  return `${now.toISOString().replace(/[:.]/g, "-")}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}
