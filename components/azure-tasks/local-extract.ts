/**
 * Local (no-AI) extraction — the safety net used when Gemini cannot answer
 * (quota used up, key without access, network…). It finds the common,
 * well-formed patterns with regular expressions:
 *
 *   keys : "Add Key in MongoDB (Setup Configuration) Key: Name: false"
 *          "Mongo key in Setup Parameters and Global Parametrs:Name="value""
 *   SQL  : CREATE/ALTER TABLE|PROC|FUNCTION|VIEW|TRIGGER|INDEX … (until GO / next DDL)
 *          SELECT … FROM, UPDATE … SET, INSERT INTO, DELETE FROM, EXEC … (until blank line)
 *
 * It is less clever than Gemini (it will miss free-form wording), so the
 * export marks such tasks in deployment-checklist.txt and _errors.txt.
 */

import type { KeyChange, SqlKind, SqlScript } from "./export-pack"

export interface LocalInput {
  id: number
  title: string
  description?: string
  comments?: Array<{ text: string }>
}

const normTarget = (t: string): string =>
  /mongo/i.test(t) ? "MongoDB" : /appsettings|app\s*settings/i.test(t) ? "appsettings.json" : /web\.config/i.test(t) ? "web.config" : t.trim()

const KEY_A =
  /\b(add|added|update|updated|remove|delete|set|change)\b[^\n]*?\bkeys?\b[^\n]*?\b(?:in|to|on|inside)\s+(MongoDB|Mongo|appsettings(?:\.json)?|app\s*settings|web\.config|config)\b\s*(?:\(([^)]*)\))?[^\n]*?\bKey\s*:\s*([A-Za-z_][\w.\-]*)\s*[:=]\s*([^\n]+)/i

const KEY_B =
  /\b(mongo(?:db)?|appsettings(?:\.json)?)\s+keys?\s+(?:in|to|on)\s+([^:\n]+?)\s*:\s*([A-Za-z_][\w.\-]*)\s*=\s*([^\n]+)/i

function actionOf(verb: string): KeyChange["action"] {
  const v = verb.toLowerCase()
  if (v.startsWith("add")) return "add"
  if (v.startsWith("remove") || v.startsWith("delete")) return "remove"
  if (v.startsWith("update") || v.startsWith("set") || v.startsWith("change")) return "update"
  return "other"
}

const DDL_START =
  /^\s*(?:CREATE|ALTER)\s+(?:OR\s+ALTER\s+)?(?:UNIQUE\s+)?(?:(?:NON)?CLUSTERED\s+)?(TABLE|PROC(?:EDURE)?|FUNCTION|VIEW|TRIGGER|INDEX)\b/i
const DML_START = /^\s*(SELECT\b|INSERT\s+INTO\b|UPDATE\s+[\[\w."#@]+|DELETE\s+FROM\b|EXEC(?:UTE)?\s+[\[\w."#@]+|MERGE\b)/
const GO_LINE = /^\s*GO\s*;?\s*$/i
const OBJECT_NAME = /(?:TABLE|PROC(?:EDURE)?|FUNCTION|VIEW|TRIGGER|INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?([\[\]\w."#@]+(?:\.[\[\]\w."]+)*)/i

function sqlBlocks(text: string): Array<{ kind: SqlKind; name: string; sql: string }> {
  const lines = text.replace(/\r/g, "").split("\n")
  const out: Array<{ kind: SqlKind; name: string; sql: string }> = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const ddl = DDL_START.exec(line)
    if (ddl) {
      const start = i
      i++
      while (i < lines.length && !GO_LINE.test(lines[i]) && !DDL_START.test(lines[i])) i++
      const sql = lines.slice(start, i).join("\n").trim()
      const what = ddl[1].toUpperCase()
      const isCreate = /^\s*CREATE/i.test(line)
      const kind: SqlKind =
        what === "TABLE" ? (isCreate ? "table" : "script")
        : what.startsWith("PROC") ? "stored_procedure"
        : what === "FUNCTION" ? "function"
        : what === "VIEW" ? "view"
        : what === "TRIGGER" ? "trigger"
        : "index"
      if (sql.length > 12) out.push({ kind, name: OBJECT_NAME.exec(line)?.[1] ?? "", sql })
      if (i < lines.length && GO_LINE.test(lines[i])) i++
      continue
    }
    if (DML_START.test(line)) {
      const start = i
      i++
      while (i < lines.length && lines[i].trim() !== "" && !DDL_START.test(lines[i])) i++
      const sql = lines.slice(start, i).join("\n").trim()
      const head = sql.slice(0, 8).toUpperCase()
      const valid =
        (head.startsWith("SELECT") && /\bFROM\b/i.test(sql)) ||
        (head.startsWith("UPDATE") && /\bSET\b/i.test(sql)) ||
        head.startsWith("INSERT") ||
        head.startsWith("DELETE") ||
        head.startsWith("EXEC") ||
        head.startsWith("MERGE")
      if (valid && sql.length > 12) {
        out.push({ kind: head.startsWith("SELECT") ? "query" : "script", name: "", sql })
      }
      continue
    }
    i++
  }
  return out
}

export function localExtract(tasks: LocalInput[]): { changes: KeyChange[]; sql: SqlScript[] } {
  const changes: KeyChange[] = []
  const sql: SqlScript[] = []
  for (const t of tasks) {
    const pieces: Array<{ text: string; source: "description" | "comment" }> = []
    if (t.description) pieces.push({ text: t.description, source: "description" })
    for (const c of t.comments ?? []) if (c.text) pieces.push({ text: c.text, source: "comment" })
    for (const p of pieces) {
      // "Key:" at the end of a line, value on the next one → join them.
      const text = p.text.replace(/Key\s*:\s*\n\s*/gi, "Key: ")
      for (const line of text.split("\n")) {
        const a = KEY_A.exec(line)
        if (a) {
          changes.push({
            taskId: t.id, taskTitle: t.title, action: actionOf(a[1]), target: normTarget(a[2]),
            location: (a[3] ?? "").trim(), key: a[4].trim(), value: a[5].trim(), note: line.trim().slice(0, 200), source: p.source,
          })
          continue
        }
        const b = KEY_B.exec(line)
        if (b) {
          changes.push({
            taskId: t.id, taskTitle: t.title, action: "other", target: normTarget(b[1]),
            location: b[2].trim(), key: b[3].trim(), value: b[4].trim(), note: line.trim().slice(0, 200), source: p.source,
          })
        }
      }
      for (const blk of sqlBlocks(p.text)) {
        sql.push({ taskId: t.id, taskTitle: t.title, kind: blk.kind, name: blk.name, sql: blk.sql, source: p.source })
      }
    }
  }
  return { changes, sql }
}
