'use client'

import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Download,
  Eye,
  Copy,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Search,
  Replace,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { JsonPreview } from './JsonPreview'

interface ComponentRecord {
  [key: string]: any
}

// All components from your ComponentConfiguration.json
const DEFAULT_COMPONENTS: ComponentRecord[] = [
  {

    "Title": "Warning Letter",
    "ClientID": 1,
    "WebPartID": "ABWPWL",
    "ActionType": "WL",
    "DisplayAcronym": "WN",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-letter/WL/Unexcused",
    "ActionTypeFilterCustom": "[ACTION TYPE] IN ('WL1','WL2','WL3','NOT1','NOT2','NOT3')",
    "SequenceNo": 1,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "InterventionType": "letters",
    "Claims": ["Director", "Principal", "CampusAttendanceOfficer", null, "SPUser"],
    "ShowRedYellowCountAsZero": 0,
    "Button": {
      "Print": { "Title": "Print", "Enabled": false },
      "Sent": { "Title": "Complete", "Enabled": false },
      "Email": { "Title": "Email", "Enabled": false }
    },
    "EmailContent": { "SecureDocEnabled": true },
    "SubActionTypes": [
      { "WL1": "Warning Letter 1" },
      { "WL2": "Warning Letter 2" },
      { "WL3": "Warning Letter 3" },
      { "NOT1": "NOT Letter 1" },
      { "NOT2": "NOT Letter 2" },
      { "NOT3": "NOT Letter 3" }
    ],
    "RADTitle": "Warning Letter"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd6d" },
    "Title": "Loss of Credit Warning Letter",
    "ClientID": 1,
    "WebPartID": "LOCWPWL",
    "ActionType": "LOCWL",
    "DisplayAcronym": "LOCWL",
    "MoreLink": "actionboard/intervention-letter/LOCWL/loc",
    "ActionTypeFilterCustom": "[Action Type] IN ('LOCWL','LOCWL1','LOCWL2')",
    "SequenceNo": 9,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "LOC",
    "LinkTitleNoMenu": "Loss of Credit Warning Letter",
    "LinkTitle": "Loss of Credit Warning Letter",
    "Claims": ["Principal", "Director", "SPUser", "CAmpusofficer"],
    "SubActionTypes": [
      { "LOCWL": "90% Warning Letter" },
      { "LOCWL1": "Loss of Credit Warning Letter 1" },
      { "LOCWL2": "Loss of Credit Warning Letter 2" }
    ]
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd7a" },
    "Title": "Excused Absences Letters",
    "ClientID": 1,
    "WebPartID": "CLWPEA",
    "ActionType": "EAL",
    "DisplayAcronym": "EAL",
    "DisplayInStudentProfile": 0,
    "MoreLink": "/actionboard/intervention-letter/EAL/excused",
    "ActionTypeFilterCustom": "[Action Type] IN ('EAL1','EAL2')",
    "SequenceNo": 1,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Excused",
    "LinkTitleNoMenu": "Excused Absences Letters",
    "LinkTitle": "Excused Absences Letters",
    "Claims": ["CampusOfficer", "Principal", "Director", "SPUser"],
    "SubActionTypes": [
      { "EAL1": "Excused Absences Letter 1" },
      { "EAL2": "Excused Absences Letter 2" }
    ],
    "ShowRedYellowCountAsZero": 0,
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX",
    "InterventionType": "letters"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd7d" },
    "Title": "Excessive Absences Warning Letter",
    "ClientID": 1,
    "WebPartID": "CLWPCAL",
    "ActionType": "CAL",
    "DisplayAcronym": "CAL",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-letter/CAL/chronic",
    "ActionTypeFilterCustom": "[ACTION TYPE] IN ('CAL1','CAL2')",
    "SequenceNo": 1,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Chronic",
    "LinkTitleNoMenu": "Chronic Absences Letter",
    "LinkTitle": "Chronic Absences Letter",
    "Claims": ["CampusOfficer", "Principal", "Director", "SPUser"],
    "SubActionTypes": [
      { "CAL1": "Excessive Absences Letter 1" },
      { "CAL2": "Excessive Absences Letter 2" }
    ],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX",
    "InterventionType": "letters",
    "EmailContent": { "SecureDocEnabled": true }
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd5c" },
    "Title": "Call Parent",
    "ClientID": 1,
    "WebPartID": "ABWPCP",
    "ActionType": "CG",
    "DisplayAcronym": "CG",
    "MoreLink": "actionboard/intervention-inputdetail/CG/Unexcused",
    "ActionTypeFilterCustom": "[Action Type] IN ('CP1','CP2')",
    "SequenceNo": 2,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "LinkTitleNoMenu": "Call Parent",
    "LinkTitle": "Call Parent",
    "InputDetailsTitle": "Call Details",
    "InterventionType": "Input",
    "Claims": ["CampusOfficer", "Principal", "Director", "SPUser"],
    "SubActionTypes": [
      { "CP1": "CAll Parent 1" },
      { "CP2": "CAll Parent 2" }
    ],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX",
    "InputComments": 1,
    "RADActionType": "CG",
    "Button": {
      "CheckList": { "Title": "Check List", "Enabled": true },
      "Concerns": { "Title": "Concerns", "Enabled": true }
    },
    "Communication": {
      "Email": { "Title": "Email", "Enabled": true },
      "Text": { "Title": "Text", "Enabled": true },
      "Dailer": { "Title": "Dailer", "Enabled": false }
    },
    "IsCompleteWithoutComments": false,
    "IsHideFileUpload": false
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd6c" },
    "Title": "Loss of Credit Letter",
    "ClientID": 1,
    "WebPartID": "LOCWPWL",
    "ActionType": "LOC",
    "DisplayAcronym": "LOC",
    "MoreLink": "actionboard/intervention-letter/LOC/loc",
    "ActionTypeFilterCustom": "[Action Type] IN ('LOC','LOCN1','LOCN2')",
    "SequenceNo": 10,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "LOC",
    "LinkTitleNoMenu": "Loss of Credit Letter",
    "LinkTitle": "Loss of Credit Letter",
    "Claims": ["CampusOfficer", "Principal", "Director", "SPUser"],
    "SubActionTypes": [
      { "LOC": "Loss of Credit Letter" },
      { "LOCN1": "Loss of Credit Letter 1" },
      { "LOCN2": "Loss of Credit Letter 2" }
    ],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd7b" },
    "Title": "Tardy Letters",
    "ClientID": 1,
    "WebPartID": "CLWPT",
    "ActionType": "TL",
    "DisplayAcronym": "TL",
    "DisplayInStudentProfile": 0,
    "MoreLink": "/Pages/CourtesyInterventionDetails.aspx?type=TL",
    "ActionTypeFilterCustom": "ACTIONTYPE IN ('TL')",
    "SequenceNo": 2,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Tardy",
    "LinkTitleNoMenu": "Tardy Letters",
    "LinkTitle": "Tardy Letters",
    "Claims": ["Principal", "Director"],
    "SubActionTypes": [{ "TL": "Tardy Letter" }],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd62" },
    "Title": "Home Visit",
    "ClientID": 1,
    "WebPartID": "ABWPHV",
    "ActionType": "HV",
    "DisplayAcronym": "HV",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-inputdetail/HV/Unexcused",
    "ActionTypeFilterCustom": "[ACTION TYPE] IN ('HV')",
    "SequenceNo": 3,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "InputDetailsTitle": "Visit Details",
    "SubActionTypes": [{ "HV": "Home Visit" }],
    "InterventionType": "Input",
    "Claims": ["CampusOfficer", "Principal", "Director", null, null, "SPUser"],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX",
    "InputComments": 1,
    "RADActionType": "Home Visit",
    "Button": {
      "CheckList": { "Title": "Check List", "Enabled": true },
      "Concerns": { "Title": "Concerns", "Enabled": true }
    },
    "Communication": {
      "Email": { "Title": "Email", "Enabled": false },
      "Text": { "Title": "Text", "Enabled": false }
    },
    "CustomizedLetter": { "Title": "Home Referal", "Enabled": true }
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd7e" },
    "Title": "Online Truancy Class",
    "ClientID": 1,
    "WebPartID": "ABWPSCHOTC",
    "ActionType": "OTC",
    "DisplayAcronym": "OTC",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-scheduleclass/OTC/Unexcused",
    "ActionTypeFilterCustom": "(([ACTION TYPE] IN ('OTC') AND IsScheduled = 'False'))",
    "SequenceNo": 7,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "LinkTitleNoMenu": "Online Truancy Class",
    "LinkTitle": "Online Truancy Class",
    "InterventionType": "Meeting",
    "Claims": ["CampusOfficer", "Principal", "Director", "SPUser"],
    "SubActionTypes": [{ "OTC": "Online Truancy Class" }],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX",
    "ShowRedYellowCountAsZero": 1
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd82" },
    "Title": "In-person Truancy Class Details",
    "ClientID": 1,
    "WebPartID": "ABWPTC1",
    "ActionType": "TC",
    "DisplayAcronym": "TCD",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-scheduledclasslist/TC/Unexcused",
    "ActionTypeFilterCustom": "(([ACTION TYPE] IN ('TC') AND (IsScheduled = 1 OR IsScheduled ='True' )) OR ([ACTION TYPE] IN ('OTC') AND (IsRescheduled = 0 OR IsRescheduled = 'False')))",
    "SequenceNo": 8,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "LinkTitleNoMenu": "OnlineTruancy Class Details",
    "LinkTitle": "On;ine Truancy Class Details",
    "InterventionType": "Meeting",
    "SubActionTypes": [{ "TC": "In-person Truancy Class Details" }],
    "Claims": ["CampusOfficer", "Principal", "Director", "SPUser"],
    "ShowRedYellowCountAsZero": 1,
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd5f" },
    "Title": "Refer To TO",
    "ClientID": 1,
    "WebPartID": "ABWPRTO",
    "ActionType": "RTO",
    "DisplayAcronym": "FC",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-file-complaint/RTO/Unexcused",
    "ActionTypeFilterCustom": "[ACTION TYPE] IN ('RTO')",
    "SequenceNo": 10,
    "SubActionTypes": [{ "RTO": "Refer To TO" }],
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "LinkTitleNoMenu": "File Complaint",
    "LinkTitle": "File Complaint",
    "Claims": ["CampusOfficer", "Director", "Principal", "CampusOfficerRole", "CampusAttendanceOfficer", "SPUser"],
    "HighlightForMultipleIntervention": 0,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX",
    "InTimeDays": 5
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd80" },
    "Title": "In-Person Truancy Class",
    "ClientID": 1,
    "WebPartID": "ABWPSCHTC2",
    "ActionType": "TC",
    "DisplayAcronym": "IPTC",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-scheduleclass/TC/Unexcused",
    "ActionTypeFilterCustom": "((ACTIONTYPE IN ('TC') AND IsScheduled = 'False') OR (ACTIONTYPE IN ('TC') AND IsRescheduled = 1))",
    "SequenceNo": 11,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "LinkTitleNoMenu": "In-Person Truancy Class",
    "LinkTitle": "In-Person Truancy Class",
    "Claims": ["Director", "Principal"],
    "SubActionTypes": [{ "TC": "In-Person Truancy Class" }],
    "ShowRedYellowCountAsZero": 0,
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX",
    "ScheduleAddress": "Truancy Office Denton ISD"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd81" },
    "Title": "In-Person Truancy Class Details",
    "ClientID": 1,
    "WebPartID": "ABWPTC3",
    "ActionType": "TC",
    "DisplayAcronym": "IPTCD",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-document-scheduledclass/TC/Unexcused",
    "ActionTypeFilterCustom": "((ACTIONTYPE IN ('TC') AND IsScheduled = 'True') OR (ACTIONTYPE IN ('TC') AND IsRescheduled = 0))",
    "SequenceNo": 12,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "LinkTitleNoMenu": "In-Person Truancy Class Details",
    "LinkTitle": "In-Person Truancy Class Details",
    "Claims": ["Director", "Principal"],
    "SubActionTypes": [{ "TC": "In-Person Truancy Class Details" }],
    "ShowRedYellowCountAsZero": 1,
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd5e" },
    "Title": "Administrator-Counselor Conference",
    "ClientID": 1,
    "WebPartID": "ABWPPP",
    "ActionType": "PPM",
    "DisplayAcronym": "ACC",
    "SequenceNo": 11,
    "LinkTitleNoMenu": "Administrator-Counselor Conference",
    "LinkTitle": "Administrator-Counselor Conference",
    "Claims": ["Principal", "Director"],
    "SubActionTypes": [{ "PPM": "Administrator-Counselor Conference" }],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX"
  },
  {
    "_id": { "$oid": "6662ebf38de2fc5de4c1a2cc" },
    "Title": "Schedule SARB",
    "ClientID": 1,
    "WebPartID": "ABWPSCHSARB",
    "ActionType": "SARB",
    "DisplayAcronym": "SARB",
    "DisplayInStudentProfile": 0,
    "MoreLink": "actionboard/intervention-parent-conference/SARB/Unexcused",
    "ActionTypeFilterCustom": "ACTIONTYPE IN ('SARB') AND IsScheduled = 'False'",
    "SequenceNo": 17,
    "IsDisplayedInActionBoardMenu": 1,
    "ActionBoardMenuType": "Unexcused",
    "InterventionType": "Meeting",
    "Claims": [],
    "SubActionTypes": [{ "SARB": "Schedule SARB" }],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX"
  },
  {
    "_id": { "$oid": "6515fa7ba945b7ba77f6cd61" },
    "Title": "SP-Student Conference",
    "ClientID": 1,
    "WebPartID": "ABWPST",
    "ActionType": "SPSTM",
    "DisplayAcronym": "SC",
    "DisplayInStudentProfile": 1,
    "SequenceNo": 13,
    "LinkTitleNoMenu": "Student Conference",
    "LinkTitle": "Student Conference",
    "Claims": ["Principal", "Director"],
    "SubActionTypes": [{ "STM": "Student Conference" }],
    "HighlightForMultipleIntervention": 1,
    "CoreIntervention": 0,
    "Abbreviation": "DISDTX"
  }
]

export function ComponentConfigurationViewer() {
  const { toast } = useToast()
  const [components, setComponents] = useState<ComponentRecord[]>(DEFAULT_COMPONENTS)
  const [previewMode, setPreviewMode] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  // ---------- search & replace ----------
  const [findValue, setFindValue] = useState('')
  const [replaceValue, setReplaceValue] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Comma-separated needles. Typing `WL1,WL2,WL3` and replacing with
   * `CG1,CG2,CG3` does a pairwise substitution in one pass. Empty
   * entries (extra commas) are dropped; trailing/leading whitespace is
   * trimmed. A single value with no commas still works (one needle).
   */
  const findNeedles = useMemo(
    () =>
      findValue
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    [findValue],
  )
  const replaceValues = useMemo(
    () =>
      replaceValue
        .split(',')
        .map((s) => s.trim()),
    [replaceValue],
  )
  /** Resolved replacement for needle index `i` (missing tail → ''). */
  const replacementFor = (i: number) => replaceValues[i] ?? ''

  /**
   * Walk a value recursively, collecting every string occurrence along
   * with a stable `path` ("components[3].SubActionTypes[0].WL1") so the
   * "Find next" button can jump to the matching card.
   *
   * Each match carries the needle index it matched against so the
   * confirm dialog can show per-needle counts ("WL1: 5, WL2: 2, WL3: 1").
   * Numbers / booleans are intentionally not searched (see plan).
   */
  interface MatchHit {
    compIndex: number
    path: string
    /** Original value at this location (always a string for matches). */
    value: string
    /** Index into `findNeedles` so we know which needle hit. */
    needleIdx: number
    /** String[] segments of the path inside the component (top-level keys). */
    pathKeys: string[]
  }

  const matches = useMemo<MatchHit[]>(() => {
    if (findNeedles.length === 0) return []
    const out: MatchHit[] = []

    const isWordChar = (c: string) => /[A-Za-z0-9_]/.test(c)
    /** Returns the index of the first needle that matches `hay`, or -1. */
    const firstNeedleIndex = (hay: string): number => {
      const src = matchCase ? hay : hay.toLowerCase()
      for (let n = 0; n < findNeedles.length; n++) {
        const ndl = matchCase ? findNeedles[n] : findNeedles[n].toLowerCase()
        if (ndl.length === 0) continue
        let i = 0
        while (i <= src.length - ndl.length) {
          const at = src.indexOf(ndl, i)
          if (at === -1) break
          if (wholeWord) {
            const before = at === 0 ? '' : src[at - 1]
            const after = at + ndl.length >= src.length ? '' : src[at + ndl.length]
            if ((before === '' || !isWordChar(before)) && (after === '' || !isWordChar(after))) {
              return n
            }
            i = at + 1
          } else {
            return n
          }
        }
      }
      return -1
    }

    const recurse = (compIdx: number, node: any, pathKeys: string[]) => {
      if (node === null || node === undefined) return
      if (typeof node === 'string') {
        const idx = firstNeedleIndex(node)
        if (idx >= 0) {
          out.push({
            compIndex: compIdx,
            path: `components[${compIdx}]${pathKeys.length ? '.' + pathKeys.join('.') : ''}`,
            value: node,
            needleIdx: idx,
            pathKeys,
          })
        }
        return
      }
      if (Array.isArray(node)) {
        node.forEach((item, i) => recurse(compIdx, item, [...pathKeys, `[${i}]`]))
        return
      }
      if (typeof node === 'object') {
        for (const k of Object.keys(node)) {
          if (typeof k === 'string') {
            const idx = firstNeedleIndex(k)
            if (idx >= 0) {
              out.push({
                compIndex: compIdx,
                path: `components[${compIdx}].${[...pathKeys, k].filter(Boolean).join('.')}`,
                value: k,
                needleIdx: idx,
                pathKeys: [...pathKeys, k],
              })
            }
          }
        }
        for (const [k, v] of Object.entries(node)) {
          recurse(compIdx, v, [...pathKeys, k])
        }
      }
    }

    components.forEach((c, idx) => recurse(idx, c, []))
    return out
  }, [components, findNeedles, matchCase, wholeWord])

  const matchCountByComponent = useMemo(() => {
    const m = new Map<number, number>()
    matches.forEach((hit) => m.set(hit.compIndex, (m.get(hit.compIndex) ?? 0) + 1))
    return m
  }, [matches])

  const matchCountByNeedle = useMemo(() => {
    const m = new Map<number, number>()
    matches.forEach((hit) => m.set(hit.needleIdx, (m.get(hit.needleIdx) ?? 0) + 1))
    return m
  }, [matches])

  const pulseCard = (id: string) => {
    setHighlightedId(id)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightedId(null), 1500)
  }

  const handleFindNext = () => {
    if (matches.length === 0) {
      toast({ title: 'No matches', description: 'Try a different search term.', variant: 'destructive' })
      return
    }
    const expandedIdx = components.findIndex((c) => getComponentId(components.indexOf(c)) === expandedId)
    const startFrom = expandedIdx === -1 ? -1 : expandedIdx
    const next = matches.find((m) => m.compIndex > startFrom) ?? matches[0]
    const targetId = getComponentId(next.compIndex)
    setExpandedId(targetId)
    pulseCard(targetId)
    requestAnimationFrame(() => {
      document
        .getElementById(`comp-card-${targetId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  /**
   * Apply every needle/replacement pair (in order) to a single string,
   * preserving the original runtime type. If `value` isn't a string we
   * leave it alone — that way a numeric `SequenceNo: 1` is never
   * rewritten by a search for "1".
   */
  const replaceInString = (hay: string): { next: string; replaced: number } => {
    if (findNeedles.length === 0) return { next: hay, replaced: 0 }
    let count = 0
    const src = matchCase ? hay : hay.toLowerCase()
    const isWordChar = (c: string) => /[A-Za-z0-9_]/.test(c)

    let result = ''
    let cursor = 0
    let i = 0

    // We walk the string once. At each index we check needles in order
    // and take the first match. Ties go to the earlier needle.
    while (i < hay.length) {
      let matched = false
      for (let n = 0; n < findNeedles.length; n++) {
        const ndl = matchCase ? findNeedles[n] : findNeedles[n].toLowerCase()
        if (ndl.length === 0) continue
        if (i + ndl.length > src.length) continue
        if (src.substr(i, ndl.length) !== ndl) continue
        if (wholeWord) {
          const before = i === 0 ? '' : src[i - 1]
          const after = i + ndl.length >= src.length ? '' : src[i + ndl.length]
          if (!((before === '' || !isWordChar(before)) && (after === '' || !isWordChar(after)))) {
            continue
          }
        }
        // matched needle n at position i
        result += hay.slice(cursor, i) + replacementFor(n)
        cursor = i + ndl.length
        count++
        i = cursor
        matched = true
        break
      }
      if (!matched) i++
    }
    result += hay.slice(cursor)
    return { next: result, replaced: count }
  }

  const performReplaceAll = () => {
    if (findNeedles.length === 0 || matches.length === 0) {
      setConfirmOpen(false)
      return
    }
    let totalReplaced = 0
    let componentsTouched = 0

    const rewrite = (node: any): any => {
      if (typeof node === 'string') {
        const { next, replaced } = replaceInString(node)
        totalReplaced += replaced
        return replaced > 0 ? next : node
      }
      if (Array.isArray(node)) {
        let changed = false
        const out = node.map((item) => {
          const r = rewrite(item)
          if (r !== item) changed = true
          return r
        })
        if (changed) componentsTouched++
        return out
      }
      if (node && typeof node === 'object') {
        let changed = false
        const out: Record<string, any> = {}
        for (const [k, v] of Object.entries(node)) {
          const { next: newKey, replaced: kReplaced } = replaceInString(k)
          totalReplaced += kReplaced
          const r = rewrite(v)
          if (newKey !== k || r !== v) changed = true
          out[newKey] = r
        }
        if (changed) componentsTouched++
        return out
      }
      return node
    }

    const next = components.map((c) => rewrite(c))
    setComponents(next)
    setConfirmOpen(false)
    toast({
      title: 'Replaced',
      description: `${totalReplaced} occurrence${totalReplaced !== 1 ? 's' : ''} across ${componentsTouched} component${componentsTouched !== 1 ? 's' : ''}.`,
    })
  }

  const handleLoadJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      const data = Array.isArray(parsed) ? parsed : [parsed]
      setComponents(data)
      setJsonInput('')
      setShowUpload(false)
      toast({
        title: 'Success',
        description: `Loaded ${data.length} components`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid JSON format',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicate = (index: number) => {
    const original = components[index]
    if (!original) return
    const duplicate = JSON.parse(JSON.stringify(original))
    // Drop _id entirely — Mongo assigns a real ObjectId when this is
    // inserted. A fake string like `${Date.now()}_dup` isn't a valid
    // ObjectId and would break inserts/queries downstream.
    delete duplicate._id
    setComponents([...components, duplicate])
    toast({
      title: 'Success',
      description: 'Component duplicated',
    })
  }

  const handleDelete = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
    setEditingId(null)
    toast({
      title: 'Success',
      description: 'Component deleted',
    })
  }

  const handleUpdateField = (index: number, field: string, value: any) => {
    const updated = [...components]
    updated[index] = { ...updated[index], [field]: value }
    setComponents(updated)
  }

  const handleExportJSON = () => {
    if (components.length === 0) {
      toast({
        title: 'Error',
        description: 'No components to export',
        variant: 'destructive',
      })
      return
    }
    const dataStr = JSON.stringify(components, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `component-configuration-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Success',
      description: `Exported ${components.length} components`,
    })
  }

  const getComponentId = (index: number) => {
    const comp = components[index]
    return comp._id?.$oid || comp.id || `comp_${index}`
  }

  const renderFieldInput = (value: any, onChangeCallback: (val: any) => void) => {
    if (typeof value === 'boolean') {
      return (
        <select
          value={value ? 'true' : 'false'}
          onChange={(e) => onChangeCallback(e.target.value === 'true')}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
        >
          <option value="false">False</option>
          <option value="true">True</option>
        </select>
      )
    } else if (typeof value === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChangeCallback(parseFloat(e.target.value) || 0)}
        />
      )
    } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      return (
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onChangeCallback(JSON.parse(e.target.value))
            } catch {
              // Keep original on parse error
            }
          }}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono h-20 resize-none"
        />
      )
    }
    return (
      <Input
        value={value || ''}
        onChange={(e) => onChangeCallback(e.target.value)}
      />
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col flex-1 min-h-0 gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Component Configuration Manager
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {components.length} component{components.length !== 1 ? 's' : ''} loaded
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setShowUpload(!showUpload)}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload JSON
          </Button>
          {components.length > 0 && (
            <>
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant={previewMode ? 'default' : 'outline'}
                className={previewMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button
                onClick={handleExportJSON}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
            </>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Load Component Configuration JSON
          </h3>
          <div className="space-y-4">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON array or object here..."
              className="w-full h-48 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleLoadJSON}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Load Components
              </Button>
              <Button
                onClick={() => setJsonInput('')}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- search & replace bar ---------- */}
      {components.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Smart Search & Replace
            </h3>
            <span className="text-xs text-slate-500">
              comma-separated needles supported (e.g. WL1,WL2,WL3)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Find</label>
              <Input
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="e.g. WL1,WL2,WL3"
                className="h-9 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Replace with</label>
              <Input
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                placeholder="e.g. CG1,CG2,CG3"
                className="h-9 text-sm font-mono"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 h-9">
              <label className="flex items-center gap-1 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="accent-blue-600"
                />
                <span>Match case</span>
              </label>
              <label className="flex items-center gap-1 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="accent-blue-600"
                />
                <span>Whole word</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleFindNext}
                disabled={findNeedles.length === 0 || matches.length === 0}
                className="gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                Find next
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={findNeedles.length === 0 || matches.length === 0}
                className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Replace className="w-3.5 h-3.5" />
                Replace all
              </Button>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
            {findNeedles.length === 0
              ? 'Type one or more comma-separated values to search (e.g. WL1,WL2,WL3).'
              : matches.length === 0
                ? 'No matches.'
                : (() => {
                    const perNeedle = findNeedles
                      .map((ndl, i) => `${ndl}: ${matchCountByNeedle.get(i) ?? 0}`)
                      .join(', ')
                    const compWord =
                      matchCountByComponent.size !== 1 ? 's' : ''
                    const matchWord = matches.length !== 1 ? 'es' : ''
                    return `${matches.length} match${matchWord} (${perNeedle}) across ${matchCountByComponent.size} component${compWord}.`
                  })()}
          </div>
        </div>
      )}

      {/* ---------- confirm dialog ---------- */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace across the entire configuration?</DialogTitle>
            <DialogDescription>
              <p className="mb-2">
                This will rewrite <strong>{matches.length}</strong> occurrence
                {matches.length !== 1 ? 's' : ''} across{' '}
                <strong>{matchCountByComponent.size}</strong> component
                {matchCountByComponent.size !== 1 ? 's' : ''}. Numeric and
                boolean fields are not touched.
              </p>
              <ul className="text-xs space-y-1 mt-2 max-h-40 overflow-y-auto">
                {findNeedles.map((ndl, i) => (
                  <li key={`${ndl}-${i}`}>
                    <code className="px-1 py-0.5 bg-slate-100 rounded">{ndl}</code>
                    {' → '}
                    <code className="px-1 py-0.5 bg-slate-100 rounded">
                      {replacementFor(i) || '(empty)'}
                    </code>
                    <span className="text-slate-400 ml-2">
                      ({matchCountByNeedle.get(i) ?? 0} match
                      {(matchCountByNeedle.get(i) ?? 0) !== 1 ? 'es' : ''})
                    </span>
                  </li>
                ))}
              </ul>
              {findNeedles.length > replaceValues.filter((v) => v.length > 0).length &&
                (() => {
                  const missing = findNeedles.length - replaceValues.length
                  return (
                    <p className="text-amber-600 text-xs mt-2">
                      ⚠ {missing} needle{missing !== 1 ? 's have' : ' has'} no
                      matching replacement — they'll be cleared to empty.
                    </p>
                  )
                })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={performReplaceAll}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Replace all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!previewMode && components.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {components.map((component, idx) => {
            const componentId = getComponentId(idx)
            const isExpanded = expandedId === componentId
            const isEditing = editingId === componentId

            return (
              <div
                id={`comp-card-${componentId}`}
                key={componentId}
                className={cn(
                  "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow",
                  highlightedId === componentId && "ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-50",
                )}
              >
                {/* Header */}
                <div
                  className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 p-4 cursor-pointer hover:opacity-90 transition flex items-center justify-between border-b border-slate-200 dark:border-slate-700"
                  onClick={() => setExpandedId(isExpanded ? null : componentId)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                      {component.Title || `Component ${idx + 1}`}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      ActionType: <span className="font-mono font-semibold">{component.ActionType}</span> | WebPartID: <span className="font-mono">{component.WebPartID}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(isEditing ? null : componentId)
                      }}
                      className="text-xs"
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(idx)
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(idx)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <button
                      className="p-1 text-slate-600 dark:text-slate-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                    {isEditing ? (
                      <div className="space-y-6">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Edit Component Fields</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(component).map(([field, value]) => (
                            <div key={field}>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 truncate" title={field}>
                                {field}
                              </label>
                              {renderFieldInput(value, (newVal) => handleUpdateField(idx, field, newVal))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {Object.entries(component).map(([field, value]) => (
                          <div key={field} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-200 dark:border-slate-600">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 truncate" title={field}>
                              {field}
                            </p>
                            <p className="text-sm text-slate-900 dark:text-white font-mono break-words max-h-16 overflow-auto text-xs">
                              {typeof value === 'object'
                                ? JSON.stringify(value, null, 1).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                                : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {previewMode && components.length > 0 && (
        <JsonPreview
          data={components}
          title="Component Configuration JSON"
          filename={`component-configuration-${new Date().toISOString().split('T')[0]}.json`}
        />
      )}
    </div>
  )
}