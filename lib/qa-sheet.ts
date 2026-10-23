/**
 * QA sheet parser — pulls the QA-passed Azure task IDs out of the team's
 * "Client Upgrades" workbook (.xlsx).
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
    const nums = cellText(cell[2] ?? "", cell[1]).match(/\d+/g) ?? []
    let found = false
    for (const n of nums) {
      const id = Number(n)
      if (Number.isSafeInteger(id) && id > 0 && id < 10_000_000) {
        ids.add(id)
        found = true
      }
    }
    if (found) rowCount++
  }

  if (column == null) {
    throw new QaSheetError(`No "${QA_COLUMN_HEADER}" column header in the first ${HEADER_SCAN_ROWS} rows of "${QA_SHEET_NAME}".`)
  }
  if (ids.size === 0) {
    throw new QaSheetError(`The "${QA_COLUMN_HEADER}" column in "${QA_SHEET_NAME}" has no task IDs.`)
  }
  return { taskIds: [...ids].sort((a, b) => a - b), rowCount }
}
