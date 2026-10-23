/**
 * QA sheet parser — pulls the QA-passed Azure task IDs out of the team's
 * "Client Upgrades" workbook (.xlsx), or a CSV export of its "Att Plus"
 * sheet (a CSV has a single sheet, so it is taken as "Att Plus").
 *
 * Only the "Att Plus" sheet is read, and only its "Azure Task No" column.
 * A cell may hold several IDs ("1038, 1047, 1053", "#1360", "1045 & 1046"),
 * so every whole number in the cell counts. Uses jszip (already a
 * dependency) and reads the XML directly — no spreadsheet library.
 */
import JSZip from "jszip"

export const QA_SHEET_NAME = "Att Plus"
export const QA_COLUMN_HEADER = "Azure Task No"
/** Rows scanned for the header before giving up. */
const HEADER_SCAN_ROWS = 15

export class QaSheetError extends Error {}

export interface ParsedQaSheet {
  taskIds: number[]
  /** Data rows (below the header) that held at least one ID. */
  rowCount: number
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
}

/** All `<t>` runs inside a fragment, joined (rich text keeps several runs). */
function textRuns(xml: string): string {
  let out = ""
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += decodeXml(m[1])
  return out
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`))
  return m ? m[1] : null
}

/** "C12" → "C" */
const colOf = (ref: string) => ref.replace(/\d+$/, "")

export async function parseQaSheet(data: ArrayBuffer | Uint8Array): Promise<ParsedQaSheet> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(data)
  } catch {
    throw new QaSheetError("This doesn't look like an .xlsx file.")
  }
  const read = async (path: string) => {
    const f = zip.file(path)
    return f ? f.async("string") : null
  }

  // 1. Find the "Att Plus" sheet and its XML path.
  const workbook = await read("xl/workbook.xml")
  const rels = await read("xl/_rels/workbook.xml.rels")
  if (!workbook || !rels) throw new QaSheetError("This doesn't look like an .xlsx file.")
  const sheets = [...workbook.matchAll(/<sheet\b[^>]*\/?>/g)].map((m) => ({
    name: decodeXml(attr(m[0], "name") ?? ""),
    rid: attr(m[0], "r:id"),
  }))
  const sheet = sheets.find((s) => norm(s.name) === norm(QA_SHEET_NAME))
  if (!sheet?.rid) {
    throw new QaSheetError(
      `No "${QA_SHEET_NAME}" sheet in this file. Sheets found: ${sheets.map((s) => s.name).join(", ") || "none"}.`,
    )
  }
  const rel = [...rels.matchAll(/<Relationship\b[^>]*\/?>/g)].map((m) => m[0]).find((t) => attr(t, "Id") === sheet.rid)
  const target = rel ? attr(rel, "Target") : null
  if (!target) throw new QaSheetError(`Couldn't open the "${QA_SHEET_NAME}" sheet.`)
  const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`
  const sheetXml = await read(sheetPath)
  if (!sheetXml) throw new QaSheetError(`Couldn't open the "${QA_SHEET_NAME}" sheet.`)

  // 2. Shared strings (most text cells point into this table).
  const sstXml = (await read("xl/sharedStrings.xml")) ?? ""
  const shared = [...sstXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textRuns(m[1]))

  const cellText = (cellXml: string, open: string): string => {
    const type = attr(open, "t")
    if (type === "inlineStr") return textRuns(cellXml)
    const v = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1]
    if (v == null) return ""
    if (type === "s") return shared[Number(v)] ?? ""
    return decodeXml(v)
  }

  // 3. Walk rows: find the header, then read that column below it.
  const rows = [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)]
  let column: string | null = null
  let headerRowIdx = -1
  const ids = new Set<number>()
  let rowCount = 0

  for (let i = 0; i < rows.length; i++) {
    const cells = [...rows[i][1].matchAll(/(<c\b[^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)]
    if (column == null) {
      if (i >= HEADER_SCAN_ROWS) break
      for (const c of cells) {
        const ref = attr(c[1], "r")
        if (ref && norm(cellText(c[2] ?? "", c[1])) === norm(QA_COLUMN_HEADER)) {
          column = colOf(ref)
          headerRowIdx = i
          break
        }
      }
      continue
    }
    if (i <= headerRowIdx) continue
    const cell = cells.find((c) => {
      const ref = attr(c[1], "r")
      return ref != null && colOf(ref) === column
    })
    if (!cell) continue
    if (collectIds(cellText(cell[2] ?? "", cell[1]), ids)) rowCount++
  }

  if (column == null) {
    throw new QaSheetError(`No "${QA_COLUMN_HEADER}" column header in the first ${HEADER_SCAN_ROWS} rows of "${QA_SHEET_NAME}".`)
  }
  if (ids.size === 0) {
    throw new QaSheetError(`The "${QA_COLUMN_HEADER}" column in "${QA_SHEET_NAME}" has no task IDs.`)
  }
  return { taskIds: [...ids].sort((a, b) => a - b), rowCount }
}

/** Add every whole number in a cell to `ids`; true if the cell held one. */
function collectIds(text: string, ids: Set<number>): boolean {
  let found = false
  for (const n of text.match(/\d+/g) ?? []) {
    const id = Number(n)
    if (Number.isSafeInteger(id) && id > 0 && id < 10_000_000) {
      ids.add(id)
      found = true
    }
  }
  return found
}

/**
 * Minimal RFC 4180 CSV reader: quoted fields may contain the delimiter,
 * line breaks and doubled quotes. The delimiter is "," unless the first
 * line has more ";" (Excel in some locales saves CSV with ";").
 */
function readCsv(text: string): string[][] {
  const src = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text) // drop a UTF-8 BOM
  const lineEnd = src.search(/\r?\n/)
  const firstLine = lineEnd === -1 ? src : src.slice(0, lineEnd)
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) {
      row.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else field += ch
  }
  if (field !== "" || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** IDs from a CSV export of the "Att Plus" sheet. */
export function parseQaCsv(text: string): ParsedQaSheet {
  const rows = readCsv(text)
  let column = -1
  let headerRow = -1
  for (let r = 0; r < Math.min(rows.length, HEADER_SCAN_ROWS) && column < 0; r++) {
    const c = rows[r].findIndex((cell) => norm(cell) === norm(QA_COLUMN_HEADER))
    if (c >= 0) {
      column = c
      headerRow = r
    }
  }
  if (column < 0) {
    throw new QaSheetError(`No "${QA_COLUMN_HEADER}" column header in the first ${HEADER_SCAN_ROWS} rows of this CSV.`)
  }
  const ids = new Set<number>()
  let rowCount = 0
  for (let r = headerRow + 1; r < rows.length; r++) {
    if (collectIds(rows[r][column] ?? "", ids)) rowCount++
  }
  if (ids.size === 0) throw new QaSheetError(`The "${QA_COLUMN_HEADER}" column in this CSV has no task IDs.`)
  return { taskIds: [...ids].sort((a, b) => a - b), rowCount }
}

/** Parse an uploaded QA file by its extension (.xlsx or .csv). */
export async function parseQaFile(fileName: string, data: ArrayBuffer): Promise<ParsedQaSheet> {
  if (/\.csv$/i.test(fileName)) return parseQaCsv(new TextDecoder("utf-8").decode(data))
  return parseQaSheet(data)
}

