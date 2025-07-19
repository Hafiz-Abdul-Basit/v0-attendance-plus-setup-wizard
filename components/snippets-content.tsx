"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import {
  Code2,
  Database,
  Settings,
  Terminal,
  FileText,
  Users,
  Shield,
  UserPlus,
  Key,
  BookOpen,
  Search,
  X,
  Copy,
  Globe,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/** ----------------------------------------------------------------
 *  Snippet metadata
 *  ---------------------------------------------------------------- */
interface Snippet {
  id: string
  title: string
  description: string
  category: string
  icon: React.ElementType
  color: string
  filePath: string
}

export const snippets: Snippet[] = [
  {
    id: "frontend-webconfig",
    title: "Frontend Web.config",
    description: "Angular routing configuration for IIS",
    category: "Configuration",
    icon: FileText,
    color: "bg-blue-500",
    filePath: "/snippets/frontend-webconfig.xml",
  },
  {
    id: "backend-webconfig",
    title: "Backend Web.config",
    description: "ASP.NET Core API configuration for IIS",
    category: "Configuration",
    icon: Settings,
    color: "bg-green-500",
    filePath: "/snippets/backend-webconfig.xml",
  },
  {
    id: "mongodb-replica",
    title: "MongoDB Replica Set",
    description: "Essential MongoDB shell commands",
    category: "Database",
    icon: Database,
    color: "bg-emerald-500",
    filePath: "/snippets/mongodb-replica.sh",
  },
  {
    id: "mongodb-backup-restore",
    title: "MongoDB Backup & Restore",
    description: "Commands for backing up and restoring MongoDB databases",
    category: "Database",
    icon: Database,
    color: "bg-yellow-600",
    filePath: "/snippets/mongodb-backup-restore.sh",
  },
  {
    id: "angular-dev",
    title: "Angular Development",
    description: "High-memory serve command",
    category: "Development",
    icon: Code2,
    color: "bg-purple-500",
    filePath: "/snippets/angular-dev.sh",
  },
  {
    id: "powershell-iis",
    title: "PowerShell IIS Commands",
    description: "Useful IIS management commands",
    category: "Administration",
    icon: Terminal,
    color: "bg-indigo-500",
    filePath: "/snippets/powershell-iis.ps1",
  },
  {
    id: "sql-server-common-queries",
    title: "SQL Server Common Queries",
    description: "Essential SQL commands for database operations",
    category: "Database",
    icon: Database,
    color: "bg-orange-500",
    filePath: "/snippets/sql-server-common-queries.sql",
  },
  {
    id: "user-roles-setup",
    title: "Step 1: Setup User Roles",
    description: "Initialize AspNetRoles for AttendancePlus system",
    category: "Security",
    icon: Shield,
    color: "bg-red-500",
    filePath: "/snippets/user-roles-setup.sql",
  },
  {
    id: "user-creation",
    title: "Step 2: Create New User",
    description: "Create new user account with basic information",
    category: "Security",
    icon: UserPlus,
    color: "bg-pink-500",
    filePath: "/snippets/user-creation.sql",
  },
  {
    id: "admin-user-creation",
    title: "Admin User Creation",
    description: "Complete admin user setup with roles and TDPS configuration",
    category: "Security",
    icon: UserPlus,
    color: "bg-indigo-600",
    filePath: "/snippets/admin-user-creation.sql",
  },
  {
    id: "user-claims",
    title: "Step 3: Configure User Claims",
    description: "Setup user claims and role assignments",
    category: "Security",
    icon: Key,
    color: "bg-teal-500",
    filePath: "/snippets/user-claims.sql",
  },
  {
    id: "campus-assignment",
    title: "Step 4: Campus Assignment",
    description: "Assign user to campus and configure filters",
    category: "Security",
    icon: Users,
    color: "bg-cyan-500",
    filePath: "/snippets/campus-assignment.sql",
  },
  {
    id: "database-sync",
    title: "Step 5: Database Synchronization",
    description: "Sync user data and configure table structures",
    category: "Database",
    icon: Database,
    color: "bg-violet-500",
    filePath: "/snippets/database-sync.sql",
  },
  {
    id: "tdps-truncate-tables",
    title: "TDPS: Truncate Tables",
    description: "Truncate all data tables in the TDPS database.",
    category: "Database",
    icon: Database,
    color: "bg-red-700",
    filePath: "/snippets/tdps-truncate-tables.sql",
  },
  {
    id: "tdps-client-dependent-select",
    title: "TDPS: Client-Dependent Tables",
    description: "Select queries for TDPS tables that depend on client information.",
    category: "Database",
    icon: Database,
    color: "bg-blue-700",
    filePath: "/snippets/tdps-client-dependent-select.sql",
  },
  {
    id: "tdps-generic-select",
    title: "TDPS: Generic Tables",
    description: "Select queries for TDPS tables with generic data, not client-specific.",
    category: "Database",
    icon: Database,
    color: "bg-green-700",
    filePath: "/snippets/tdps-generic-select.sql",
  },
  {
    id: "identitydb-truncate-tables",
    title: "IdentityDB: Truncate Tables",
    description: "Truncate all data tables in the IdentityDB database.",
    category: "Database",
    icon: Database,
    color: "bg-red-700",
    filePath: "/snippets/identitydb-truncate-tables.sql",
  },
  {
    id: "identitydb-generic-select",
    title: "IdentityDB: Generic Tables",
    description: "Select queries for IdentityDB tables with generic data.",
    category: "Database",
    icon: Database,
    color: "bg-green-700",
    filePath: "/snippets/identitydb-generic-select.sql",
  },
  {
    id: "esign-truncate-tables",
    title: "Esign: Truncate Tables",
    description: "Truncate all data tables in the Esign database.",
    category: "Database",
    icon: Database,
    color: "bg-red-700",
    filePath: "/snippets/esign-truncate-tables.sql",
  },
  {
    id: "esign-client-dependent-select",
    title: "Esign: Client-Dependent Tables",
    description: "Select queries for Esign tables that depend on client information.",
    category: "Database",
    icon: Database,
    color: "bg-blue-700",
    filePath: "/snippets/esign-client-dependent-select.sql",
  },
  {
    id: "message-center-truncate-tables",
    title: "Message Center: Truncate Tables",
    description: "Truncate all data tables in the Message Center database.",
    category: "Database",
    icon: Database,
    color: "bg-red-700",
    filePath: "/snippets/message-center-truncate-tables.sql",
  },
  {
    id: "history-tables-select",
    title: "History Tables: Select All",
    description: "Select queries for all history-related tables across databases.",
    category: "Database",
    icon: Database,
    color: "bg-gray-700",
    filePath: "/snippets/history-tables-select.sql",
  },
  {
    id: "period-skipped-properties",
    title: "Period Skipped Table Properties",
    description: "C# properties for the Period Skipped table.",
    category: "Development",
    icon: Code2,
    color: "bg-blue-600",
    filePath: "/snippets/period-skipped-table-properties.cs",
  },
  {
    id: "latest-bookmarks",
    title: "Latest Bookmarks",
    description: "A comprehensive list of available bookmarks for templates.",
    category: "Documentation",
    icon: BookOpen,
    color: "bg-purple-600",
    filePath: "/snippets/latest-bookmarks.txt",
  },
  {
    id: "abdul-basit-apps",
    title: "Abdul Basit Apps",
    description: "Collection of useful web applications and tools developed by Abdul Basit",
    category: "Tools",
    icon: Globe,
    color: "bg-gradient-to-r from-blue-600 to-purple-600",
    filePath: "/snippets/abdul-basit-apps.txt",
  },
]

/** Props from the parent wizard */
interface SnippetsContentProps {
  filteredSnippetId?: string | null
  onClearFilter?: () => void
}

export function SnippetsContent({ filteredSnippetId, onClearFilter }: SnippetsContentProps) {
  // local UI state
  const [selectedSnippetCode, setSelectedSnippetCode] = useState<string | null>(null)
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState("")

  /** ------------------------------------------------------------
   *  Helpers
   *  ------------------------------------------------------------ */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!", {
      style: { background: "#10b981", color: "white", border: "none" },
    })
  }

  /** Get snippet list, filtering by parent-supplied id or local search */
  const filteredSnippets = (() => {
    let list = snippets
    if (filteredSnippetId) {
      return snippets.filter((s) => s.id === filteredSnippetId)
    }
    if (localSearchQuery.trim()) {
      const q = localSearchQuery.toLowerCase()
      list = snippets.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q),
      )
    }
    return list
  })()

  /** Load snippet source and open modal */
  const handleSnippetClick = async (snippet: Snippet) => {
    setCurrentSnippet(snippet)
    setIsSnippetModalOpen(true)

    try {
      if (snippet.id === "latest-bookmarks") {
        // hard-coded huge string truncated for brevity
        const bigString = `<<ACTIVEISD>>
<<ABSENCESDATE>>
<<ACTIONTYPE>>
<<ACTIVESEMESTER>>
<<ALLABSENCESCOUNT>>
<<ALLABSENCESCOUNTFROMINTDATE>>
<<ALLABSENCESCOUNTTILLLETTERPRINTED>>
<<ALLABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>
<<ALLABSENCESDATES>>
<<ALLABSENCESDATESFROMINTDATE>>
<<ALLABSENCESDATESTILLLETTERPRINTED>>
<<ALLABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>
<<ALLFULLABSENCESCOUNT>>
<<ALLFULLABSENCESCOUNTFROMINTDATE>>
<<ALLFULLABSENCESDATES>>
<<ALLFULLABSENCESDATESBULLETS>>
<<ALLABSENCESDATESBULLETS>>
<<ALLFULLABSENCESDATESFROMINTDATE>>
<<ASSISTANTPRINCIPALNAME>>
<<ATTENDANCEOFFICERNAME>>
<<ATTENDANCEOFFICERNAMEASCURRENTUSER>>
<<ATTENDANCERATE>>
<<AVGSPEEDDAYS>>
<<CAMPUSSTATE>>
<<CAMPUSTYPE>>
<<CAMPUSZIPCODE>>
<<CAMPUSID>>
<<CREATEDDATE>>
<<CAMPUSCITYSTATEZIP>>
<<CAMPUSCOMPLETEADDRESS>>
<<CAMPUSEMAILADDRESS>>
<<CAMPUSADDRESS>>
<<CAMPUSNAME>>
<<CAMPUSPHONENO>>
<<CURRENTDATEWITHMONTHNAMEANDDASH>>
<<CURRENTDATEWITHMONTHNAMEANDSLASH>>
<<CURRENTDATEWITHMONTHNAMEANDSPACE>>
<<CURRENTDATEWITHMONTHNUMBER>>
<<CURRENTFORMATTEDDATE>>
<<CURRENTUSERNAME>>
<<CAUSENUMBER>>
<<COURTACTIONVALIDITY>>
<<CAMPUSSTARTTIME>>
<<CONFERENCEROOMANDCAMPUSADDRESS>>
<<CONFERENCELOCATION>>
<<CONFERENCEROOM>>
<<DATEOFBIRTH>>
<<DAYSENROLLED>>
<<DAYSPRESENT>>
<<EXABSENCESCOUNT>>
<<EXABSENCESCOUNTFROMINTDATE>>
<<EXABSENCESCOUNTTILLLETTERPRINTED>>
<<EXABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>
<<EXABSENCESDATES>>
<<EXABSENCESDATESFROMINTDATE>>
<<EXABSENCESDATESTILLLETTERPRINTED>>
<<EXABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>
<<EXFULLABSENCESCOUNT>>
<<EXFULLABSENCESCOUNTFROMINTDATE>>
<<EXFULLABSENCESDATES>>
<<EXFULLABSENCESDATESFROMINTDATE>>
<<EXABSENCESCOUNTINWORDS>>
<<EXFULLABSENCESDATESBULLETS>>
<<EXABSENCESDATESBULLETS>>
<<ENROLLMENTDATE>>
<<FIRSTCONTACTNAME>>
<<FIRSTCONTACTPHONE>>
<<FIRSTWLDATE>>
<<GRADEABSENCESSUMMARYENGLISH>>
<<GUARDIANZIPCODE>>
<<GRADE>>
<<GUARDIANADDRESS>>
<<GUARDIANDOB>>
<<GUARDIANEMAIL>>
<<GUARDIANGENDER-1>>
<<GUARDIANNAME>>
<<GUARDIANRELATIONSHIP>>
<<GUARDIANHOMELANGUAGE>>
<<HEARINGDATE>>
<<LASTABSENCEDATE>>
<<LASTSCHOOLYEAR>>
<<LOSSEXCUSEDINSTRUCTIONSHOURS>>
<<LOSSINSTRUCTIONSHOURS>>
<<LOSSUNEXCUSEDINSTRUCTIONSHOURS>>
<<LYABSENCESCOUNT>>
<<LYEXCCOUNT>>
<<LYGRADE>>
<<LYLT30>>
<<LYMT30>>
<<LYSUSPENSIONCOUNT>>
<<LYTARDYCOUNT>>
<<LYUNEXCOUNT>>
<<MONITERINGDATEEND>>
<<MONITERINGDATESTART>>
<<MODIFIEDDATE>>
<<MONTHNAME>>
<<NOTICEDATE>>
<<PARENTEMAILADDRESS>>
<<PARENTPHONENUMBER>>
<<PARENTCITY>>
<<PARENTCITYSTATEZIP>>
<<PARENTCURRENTADDRESS>>
<<PARENTORCURRENTADDRESS>>
<<PARENTORCURRENTCITYSTATEZIP>>
<<PARENTFIRSTANDLASTNAME>>
<<PARENTFIRSTNAME>>
<<PARENTFULLADDRESS>>
<<PARENTFULLNAME>>
<<PARENTNAME>>
<<PARENTLASTANDFIRSTNAME>>
<<PARENTLASTNAME>>
<<PARENTMIDDLENAME>>
<<PARENTPHONENO>>
<<PARENTSTATE>>
<<PARENTZIPCODE>>
<<PRINCIPALNAME>>
<<PICPHONE>>
<<PICSPECIALIST>>
<<REQUESTATTENDACEOFFICERNAME>>
<<REQUESTFORMDATE>>
<<STUDENTID>>
<<STUDENTNAME>>
<<STUDENTCURRENTADDRESS>>
<<STUDENTSOCIALSECURITYNO>>
<<STUDENTCURRENTCITYSTATEZIP>>
<<STUDENTDATEOFBIRTH>>
<<STUDENTFIRSTANDLASTNAME>>
<<STUDENTFIRSTNAME>>
<<STUDENTFULLNAME>>
<<STUDENTGENDER>>
<<STUDENTAGE>>
<<STUDENTGRADE>>
<<STUDENTLASTANDFIRSTNAME>>
<<STUDENTLASTNAME>>
<<STUDENTMIDDLENAME>>
<<STUDENTNAMEANDID>>
<<STUDENTPHONENUMBER>>
<<STUDENTRACE>>
<<SCHOOLDISTRICT>>
<<STUDENTZIPCODE>>
<<SARTDATE>>
<<SCHOOLYEAR>>
<<SECONDCONTACTNAME>>
<<SECONDCONTACTPHONE>>
<<SECONDNOTLETTERDATE>>
<<SCHEDULEDDATE>>
<<SCHEDULEDDATEWITHMONTHNAMEANDSPACE>>
<<SCHEDULEDTIME>>
<<SCHEDULEDMONTH>>
<<TODAYSDATE>>
<<USERNAME>>
<<UNXABSENCESCOUNT>>
<<UNXABSENCESCOUNTFROMINTDATE>>
<<UNXABSENCESCOUNTTILLLETTERPRINTED>>
<<UNXABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>
<<UNXABSENCESDATES>>
<<UNXABSENCESDATESFROMINTDATE>>
<<UNXABSENCESDATESTILLLETTERPRINTED>>
<<UNXABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>
<<UNXFULLABSENCESCOUNT>>
<<UNXFULLABSENCESCOUNTFROMINTDATE>>
<<UNXFULLABSENCESDATES>>
<<UNXFULLABSENCESDATESFROMINTDATE>>
<<UNXFULLABSENCESDATESBULLETS>>
<<UNXABSENCESDATESBULLETS>>`
        setSelectedSnippetCode(bigString)
        return
      }

      if (snippet.id === "abdul-basit-apps") {
        const appsContent = `# Abdul Basit Apps - Useful Web Tools

## 🛠️ JSON Kit
**URL:** https://jsonkit.vercel.app/
**Description:** A comprehensive JSON toolkit for developers
- JSON formatter and validator
- JSON to various format converters
- JSON schema generator
- JSON path finder and more

## 📋 AttendancePlus Setup Guide
**URL:** https://attendance-plus-setup-guide.vercel.app/
**Description:** Complete installation wizard for AttendancePlus System
- Step-by-step installation guide
- Configuration snippets
- Troubleshooting tips
- Progress tracking

## 🕵️ Route JSON Detective
**URL:** https://route-json-detective-abdul.lovable.app/
**Description:** Advanced JSON analysis and debugging tool
- Deep JSON structure analysis
- Route mapping and visualization
- JSON diff and comparison
- API response debugging

---

## 🚀 Quick Access Links

Copy and paste these URLs for quick access:

\`\`\`
https://jsonkit.vercel.app/
https://attendance-plus-setup-guide.vercel.app/
https://route-json-detective-abdul.lovable.app/
\`\`\`

## 💡 Tips
- Bookmark these tools for daily development tasks
- JSON Kit is perfect for API development and testing
- Use the Setup Guide for enterprise deployments
- Route Detective helps with complex JSON debugging

**Developed by Abdul Basit** 🎯`
        setSelectedSnippetCode(appsContent)
        return
      }

      const res = await fetch(snippet.filePath)
      if (!res.ok) throw new Error("Fetch failed")
      const code = await res.text()
      setSelectedSnippetCode(code)
    } catch {
      toast.error("Failed to load snippet.")
      setSelectedSnippetCode("Error loading snippet.")
    }
  }

  /** ------------------------------------------------------------
   *  Render
   *  ------------------------------------------------------------ */
  return (
    <div>
      {/* Shortcuts Note */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold">⌨️</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 mb-1">Quick Access Shortcuts</h3>
            <p className="text-sm text-purple-700">
              Press{" "}
              <kbd className="px-2 py-1 bg-white border border-purple-200 rounded text-xs font-mono">Ctrl+1-9</kbd> to
              quickly filter snippets, or{" "}
              <kbd className="px-2 py-1 bg-white border border-purple-200 rounded text-xs font-mono">Ctrl+K</kbd> for
              advanced search
            </p>
          </div>
        </div>
      </div>
      {/* --- local search (disabled when parent filter applied) --- */}
      {!filteredSnippetId && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <Input
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search snippets…"
            className="pl-10 pr-8 border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          />
          {localSearchQuery && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocalSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-purple-100 text-purple-500"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* ---- stats / filter label ---- */}
      {filteredSnippetId && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
            Showing: {snippets.find((s) => s.id === filteredSnippetId)?.title}
          </span>
          {onClearFilter && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearFilter}
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
            >
              Clear Filter
            </Button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredSnippetId
            ? `Showing filtered snippet`
            : localSearchQuery.trim()
              ? `${filteredSnippets.length} snippet${filteredSnippets.length !== 1 ? "s" : ""} found`
              : `${snippets.length} code snippets available`}
        </p>
      </div>

      {/* ---- snippets grid ---- */}
      {filteredSnippets.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSnippets.map((snip) => {
            const Icon = snip.icon
            const idx = snippets.findIndex((s) => s.id === snip.id)
            return (
              <div
                key={snip.id}
                onClick={() => handleSnippetClick(snip)}
                className="group relative cursor-pointer rounded-xl border-2 border-gray-200 hover:border-purple-300 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-52 flex flex-col hover:scale-[1.02] transform"
              >
                {/* Keyboard shortcut indicator */}
                {idx < 9 && (
                  <span className="absolute top-3 right-3 h-6 w-6 rounded-md bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 text-center text-xs leading-6 text-purple-700 font-mono font-bold">
                    {idx + 1}
                  </span>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${snip.color} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {snip.title}
                    </h3>
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {snip.category}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 flex-1 line-clamp-3 mb-4">{snip.description}</p>

                <div className="mt-auto pt-4 border-t border-purple-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="text-purple-600 font-medium">Click to view & copy</span>
                    <div className="flex items-center gap-2">
                      {idx < 9 && (
                        <kbd className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                          Ctrl+{idx + 1}
                        </kbd>
                      )}
                      <Copy className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No snippets found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>
        </div>
      )}

      {/* ---- Improved Modal ---- */}
      {currentSnippet && (
        <Dialog open={isSnippetModalOpen} onOpenChange={setIsSnippetModalOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${currentSnippet.color} text-white shadow-lg`}
                >
                  <currentSnippet.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{currentSnippet.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{currentSnippet.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {currentSnippet.category}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="relative flex-1 overflow-hidden">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => selectedSnippetCode && copyToClipboard(selectedSnippetCode)}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0"
                  disabled={!selectedSnippetCode}
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>
              </div>

              <div className="bg-gray-900 rounded-lg overflow-hidden h-[60vh]">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-gray-400 text-sm font-mono ml-2">{currentSnippet.title}</span>
                  </div>
                </div>

                <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedSnippetCode || (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                        Loading code...
                      </div>
                    )}
                  </pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
