"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, Search, Code, FileText, Download } from "lucide-react"
import { toast } from "sonner"
import { StepContent } from "@/components/step-content"
import { SnippetsContent, snippets } from "@/components/snippets-content"
import { InteractiveGuides } from "@/components/interactive-guides"
import { ClientSetupAgent } from "@/components/ClientSetupAgent"
import logo from "../public/Develop by Abdul Basit.png"
import Image from "next/image"

const sections = [
  { id: "browser", title: "Browser Installation", number: 1 },
  { id: "iis", title: "IIS Setup", number: 2 },
  { id: "dotnet", title: ".NET Installation", number: 3 },
  { id: "rabbitmq", title: "RabbitMQ Setup", number: 4 },
  { id: "mongodb", title: "MongoDB Installation", number: 5 },
  { id: "sqlserver", title: "SQL Server Setup", number: 6 },
  { id: "webapi", title: "Web API Deployment", number: 7 },
  { id: "angular", title: "Angular Build", number: 8 },
]

// Search data for global search functionality
const searchData = [
  // Browser Installation
  {
    section: "browser",
    step: "browser-1",
    title: "Download Google Chrome",
    content: "browser chrome download install compatibility",
    type: "step",
  },

  // IIS Setup
  {
    section: "iis",
    step: "iis-1",
    title: "Enable IIS Features",
    content: "iis features enable powershell server manager web server role application development aspnet",
    type: "step",
  },
  {
    section: "iis",
    step: "iis-2",
    title: "Configure Port Bindings",
    content: "port bindings iis sites intervention analysis administration court identity gateway",
    type: "step",
  },
  {
    section: "iis",
    step: "iis-3",
    title: "Configure Application Pools",
    content: "application pools iis no managed code localsystem identity",
    type: "step",
  },

  // .NET Installation
  {
    section: "dotnet",
    step: "dotnet-1",
    title: "Download .NET 8",
    content: "dotnet 8 sdk hosting bundle download install",
    type: "step",
  },
  {
    section: "dotnet",
    step: "dotnet-2",
    title: "Verify Installation",
    content: "dotnet version verify installation runtime check",
    type: "step",
  },

  // RabbitMQ Setup
  {
    section: "rabbitmq",
    step: "rabbitmq-1",
    title: "Install Erlang",
    content: "erlang install rabbitmq prerequisite",
    type: "step",
  },
  {
    section: "rabbitmq",
    step: "rabbitmq-2",
    title: "Install RabbitMQ",
    content: "rabbitmq server install message broker",
    type: "step",
  },
  {
    section: "rabbitmq",
    step: "rabbitmq-3",
    title: "Enable Management Plugin",
    content: "rabbitmq management plugin enable web interface",
    type: "step",
  },
  {
    section: "rabbitmq",
    step: "rabbitmq-4",
    title: "Restart RabbitMQ Server",
    content: "rabbitmq restart server service",
    type: "step",
  },
  {
    section: "rabbitmq",
    step: "rabbitmq-5",
    title: "Access Management Interface",
    content: "rabbitmq management interface localhost 15672 guest credentials",
    type: "step",
  },

  // MongoDB Installation
  {
    section: "mongodb",
    step: "mongodb-1",
    title: "Download MongoDB Components",
    content: "mongodb server compass shell tools download",
    type: "step",
  },
  {
    section: "mongodb",
    step: "mongodb-2",
    title: "Configure Replica Set",
    content: "mongodb replica set configuration yaml mongod.cfg",
    type: "step",
  },
  {
    section: "mongodb",
    step: "mongodb-3",
    title: "Initialize Replica Set",
    content: "mongodb replica set initialize mongosh rs.initiate",
    type: "step",
  },
  {
    section: "mongodb",
    step: "mongodb-5",
    title: "Configure Document Paths",
    content: "mongodb document paths storage raawee directory",
    type: "step",
  },

  // SQL Server Setup
  {
    section: "sqlserver",
    step: "sqlserver-1",
    title: "Download SQL Server",
    content: "sql server download ssms management studio",
    type: "step",
  },
  {
    section: "sqlserver",
    step: "sqlserver-2",
    title: "Install SQL Server",
    content: "sql server install database engine features mixed mode",
    type: "step",
  },
  {
    section: "sqlserver",
    step: "sqlserver-3",
    title: "Configure SQL Server",
    content: "sql server configure tcp ip protocol enable",
    type: "step",
  },
  {
    section: "sqlserver",
    step: "sqlserver-4",
    title: "Create AttendancePlus Database",
    content: "sql server database create attendanceplus user login",
    type: "step",
  },

  // Web API Deployment
  {
    section: "webapi",
    step: "webapi-1",
    title: "Prepare API Files",
    content: "api files extract prepare solution directory ports",
    type: "step",
  },
  {
    section: "webapi",
    step: "webapi-2",
    title: "Deploy to IIS",
    content: "api deploy iis application pools websites",
    type: "step",
  },
  {
    section: "webapi",
    step: "webapi-3",
    title: "Configure Connection Strings",
    content: "api connection strings appsettings.json configuration",
    type: "step",
  },
  {
    section: "webapi",
    step: "webapi-4",
    title: "Test API Services",
    content: "api test services swagger endpoints",
    type: "step",
  },

  // Snippets
  {
    section: "snippets",
    step: "frontend-webconfig",
    title: "Frontend Web.config",
    content: "angular routing configuration iis web.config rewrite rules",
    type: "snippet",
  },
  {
    section: "snippets",
    step: "backend-webconfig",
    title: "Backend Web.config",
    content: "aspnet core api configuration iis web.config hosting",
    type: "snippet",
  },
  {
    section: "snippets",
    step: "mongodb-replica",
    title: "MongoDB Replica Set",
    content: "mongodb shell commands replica set initialize status",
    type: "snippet",
  },
  {
    section: "snippets",
    step: "angular-dev",
    title: "Angular Development",
    content: "angular serve memory allocation node max_old_space_size",
    type: "snippet",
  },
  {
    section: "snippets",
    step: "powershell-iis",
    title: "PowerShell IIS Commands",
    content: "powershell iis commands webadministration restart",
    type: "step",
  },
  {
    section: "snippets",
    step: "sql-queries",
    title: "SQL Server Common Queries",
    content: "sql server queries select update delete backup restore",
    type: "snippet",
  },
  {
    section: "snippets",
    step: "user-roles",
    title: "AttendancePlus User Roles",
    content: "aspnet roles insert campus officer admin principal",
    type: "snippet",
  },
  {
    section: "snippets",
    step: "user-creation",
    title: "User Creation & Configuration",
    content: "user creation configuration claims campus assignments",
    type: "step",
  },
]

export function InstallationWizard() {
  const [activeSection, setActiveSection] = useState("iis")
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    "browser-1": true,
  })
  const [showSnippets, setShowSnippets] = useState(true) // Default to showing Snippets
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof searchData>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [showModernSearch, setShowModernSearch] = useState(false)
  const [modernSearchQuery, setModernSearchQuery] = useState("")
  const [modernSearchResults, setModernSearchResults] = useState<typeof searchData>([])

  // New state for snippet filtering
  const [snippetFilter, setSnippetFilter] = useState<string>("")
  const [filteredSnippetId, setFilteredSnippetId] = useState<string | null>(null)

  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [showGuides, setShowGuides] = useState(false) // New state for Guides
  const [showSetupAgent, setShowSetupAgent] = useState(false) // New state for Setup Agent

  const exportProgress = () => {
    const completedSections = sections.filter((s) => getSectionProgress(s.id).percentage === 100)
    const report = {
      timestamp: new Date().toISOString(),
      overallProgress: overallProgress,
      completedSteps: completedStepsCount,
      totalSteps: totalSteps,
      completedSections: completedSections.map((s) => s.title),
      pendingSections: sections.filter((s) => getSectionProgress(s.id).percentage < 100).map((s) => s.title),
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendanceplus-installation-progress-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Progress exported successfully!")
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Handle modern search modal navigation
      if (showModernSearch) {
        if (event.key === "ArrowDown") {
          event.preventDefault()
          setSelectedResultIndex((prev) => (prev < modernSearchResults.length - 1 ? prev + 1 : 0))
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : modernSearchResults.length - 1))
        } else if (event.key === "Enter") {
          event.preventDefault()
          if (modernSearchResults[selectedResultIndex]) {
            handleModernSearchResultClick(modernSearchResults[selectedResultIndex])
          }
        } else if (event.key === "Escape") {
          setShowModernSearch(false)
          setModernSearchQuery("")
          setModernSearchResults([])
          setSelectedResultIndex(0)
        }
        return
      }

      // FN key to toggle modern search popup
      if (event.key === "F6") {
        event.preventDefault()
        setShowModernSearch(true)
        setModernSearchQuery("")
        setSelectedResultIndex(0)

        // Show default snippets immediately
        const defaultSnippets = [
          {
            section: "snippets",
            step: "frontend-webconfig",
            title: "Frontend Web.config",
            content: "Angular routing configuration for IIS",
            type: "snippet" as const,
          },
          {
            section: "snippets",
            step: "backend-webconfig",
            title: "Backend Web.config",
            content: "ASP.NET Core API configuration for IIS",
            type: "snippet" as const,
          },
          {
            section: "snippets",
            step: "mongodb-replica",
            title: "MongoDB Replica Set",
            content: "Essential MongoDB shell commands",
            type: "snippet" as const,
          },
          {
            section: "snippets",
            step: "user-roles-setup",
            title: "Setup User Roles",
            content: "Initialize AspNetRoles for AttendancePlus system",
            type: "snippet" as const,
          },
          {
            section: "snippets",
            step: "sql-server-common-queries",
            title: "SQL Server Common Queries",
            content: "Essential SQL commands for database operations",
            type: "snippet" as const,
          },
          {
            section: "snippets",
            step: "abdul-basit-apps",
            title: "Abdul Basit Apps",
            content: "Collection of useful web applications and tools",
            type: "snippet" as const,
          },
        ]
        setModernSearchResults(defaultSnippets)

        // Focus search input after modal opens
        setTimeout(() => {
          const searchInput = document.getElementById("modern-search-input")
          searchInput?.focus()
        }, 100)
      }

      // Ctrl/Cmd + number keys (1-9) for quick snippet access with filtering
      if ((event.ctrlKey || event.metaKey) && event.key >= "1" && event.key <= "9") {
        event.preventDefault()
        const snippetIndex = Number.parseInt(event.key) - 1
        if (snippetIndex < snippets.length) {
          const selectedSnippet = snippets[snippetIndex]
          setShowSnippets(true)
          setShowGuides(false) // Close guides when filtering snippets
          setShowSearch(false)
          setSearchQuery("")
          setFilteredSnippetId(selectedSnippet.id)
          setSnippetFilter(selectedSnippet.title)
          toast.success(`Filtered to: ${selectedSnippet.title}`, {
            style: {
              background: "#8b5cf6",
              color: "white",
              border: "none",
            },
          })
        }
      }

      // Ctrl/Cmd + H for help
      if ((event.ctrlKey || event.metaKey) && event.key === "h") {
        event.preventDefault()
        setShowHelp(true)
      }

      // Escape to close modals and clear filters
      if (event.key === "Escape") {
        if (showModernSearch) {
          setShowModernSearch(false)
          setModernSearchQuery("")
          setModernSearchResults([])
          setSelectedResultIndex(0)
        }
        if (showSnippets) {
          // Clear filter when escaping from snippets
          setFilteredSnippetId(null)
          setSnippetFilter("")
        }
        if (showGuides) setShowGuides(false) // Close guides when escaping
        if (showHelp) setShowHelp(false)
        if (showSearch) {
          setShowSearch(false)
          setSearchQuery("")
        }
      }
    },
    [showSnippets, showHelp, showSearch, showModernSearch, modernSearchResults, selectedResultIndex, showGuides],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  const toggleStepCompletion = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === "") {
      setSearchResults([])
      setShowSearch(false)
      return
    }

    const results = searchData.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase()),
    )
    setSearchResults(results)
    setShowSearch(true)
  }

  const handleSearchResultClick = (result: (typeof searchData)[0]) => {
    if (result.type === "snippet") {
      setShowSnippets(true)
      setShowGuides(false) // Close guides when selecting a snippet
      // Set filter to show only this snippet
      setFilteredSnippetId(result.step)
      setSnippetFilter(result.title)
    } else {
      setShowSnippets(false)
      setShowGuides(false) // Close guides when selecting an installation step
      setActiveSection(result.section)
      // Clear snippet filters when going to installation steps
      setFilteredSnippetId(null)
      setSnippetFilter("")
    }
    setShowSearch(false)
    setSearchQuery("")
  }

  const getSectionProgress = (sectionId: string) => {
    const sectionSteps = Object.keys(completedSteps).filter((key) => key.startsWith(sectionId))
    const completedCount = sectionSteps.filter((key) => completedSteps[key]).length

    // Fixed step counts for each section
    if (sectionId === "browser")
      return {
        completed: completedCount,
        total: 1,
        percentage: Math.round((completedCount / 1) * 100),
      }
    if (sectionId === "iis")
      return {
        completed: completedCount,
        total: 3,
        percentage: Math.round((completedCount / 3) * 100),
      }
    if (sectionId === "dotnet")
      return {
        completed: completedCount,
        total: 2,
        percentage: Math.round((completedCount / 2) * 100),
      }
    if (sectionId === "rabbitmq")
      return {
        completed: completedCount,
        total: 5,
        percentage: Math.round((completedCount / 5) * 100),
      }
    if (sectionId === "mongodb")
      return {
        completed: completedCount,
        total: 5,
        percentage: Math.round((completedCount / 5) * 100),
      }
    if (sectionId === "sqlserver")
      return {
        completed: completedCount,
        total: 4,
        percentage: Math.round((completedCount / 4) * 100),
      }
    if (sectionId === "webapi")
      return {
        completed: completedCount,
        total: 4,
        percentage: Math.round((completedCount / 4) * 100),
      }
    if (sectionId === "angular")
      return {
        completed: completedCount,
        total: 3,
        percentage: Math.round((completedCount / 3) * 100),
      }

    return { completed: 0, total: 1, percentage: 0 }
  }

  const activeStep = sections.find((s) => s.id === activeSection)

  const totalSteps = sections.reduce((acc, section) => {
    const progress = getSectionProgress(section.id)
    return acc + progress.total
  }, 0)

  const completedStepsCount = sections.reduce((acc, section) => {
    const progress = getSectionProgress(section.id)
    return acc + progress.completed
  }, 0)

  const overallProgress = Math.round((completedStepsCount / totalSteps) * 100)

  const goToNextSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id)
    }
  }

  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id)
    }
  }

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId)
    setShowSnippets(false) // Exit snippets view when navigating to a section
    setShowGuides(false) // Exit guides view when navigating to a section
    // Clear snippet filters when navigating to installation steps
    setFilteredSnippetId(null)
    setSnippetFilter("")
  }

  const handleModernSearch = (query: string) => {
    setModernSearchQuery(query)
    setSelectedResultIndex(0) // Reset selection when search changes

    if (query.trim() === "") {
      // Show popular/default snippets when no search query
      const defaultSnippets = [
        {
          section: "snippets",
          step: "frontend-webconfig",
          title: "Frontend Web.config",
          content: "Angular routing configuration for IIS",
          type: "snippet" as const,
        },
        {
          section: "snippets",
          step: "backend-webconfig",
          title: "Backend Web.config",
          content: "ASP.NET Core API configuration for IIS",
          type: "snippet" as const,
        },
        {
          section: "snippets",
          step: "mongodb-replica",
          title: "MongoDB Replica Set",
          content: "Essential MongoDB shell commands",
          type: "snippet" as const,
        },
        {
          section: "snippets",
          step: "user-roles-setup",
          title: "Setup User Roles",
          content: "Initialize AspNetRoles for AttendancePlus system",
          type: "snippet" as const,
        },
        {
          section: "snippets",
          step: "sql-server-common-queries",
          title: "SQL Server Common Queries",
          content: "Essential SQL commands for database operations",
          type: "snippet" as const,
        },
        {
          section: "snippets",
          step: "abdul-basit-apps",
          title: "Abdul Basit Apps",
          content: "Collection of useful web applications and tools",
          type: "snippet" as const,
        },
      ]
      setModernSearchResults(defaultSnippets)
      return
    }

    // Search in both installation steps and snippets
    const stepResults = searchData.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase()),
    )

    const snippetResults = snippets
      .map((snippet) => ({
        section: "snippets",
        step: snippet.id,
        title: snippet.title,
        content: snippet.description,
        type: "snippet" as const,
      }))
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.content.toLowerCase().includes(query.toLowerCase()),
      )

    setModernSearchResults([...stepResults, ...snippetResults])
  }

  const handleModernSearchResultClick = (result: any) => {
    if (result.type === "snippet") {
      setShowSnippets(true)
      setShowGuides(false) // Exit guides view when selecting a snippet
      // Set filter to show only this snippet
      setFilteredSnippetId(result.step)
      setSnippetFilter(result.title)
    } else {
      setShowSnippets(false)
      setShowGuides(false) // Exit guides view when selecting an installation step
      setActiveSection(result.section)
      // Clear snippet filters when going to installation steps
      setFilteredSnippetId(null)
      setSnippetFilter("")
    }
    setShowModernSearch(false)
    setModernSearchQuery("")
    setModernSearchResults([])
  }

  const clearSnippetFilter = () => {
    setFilteredSnippetId(null)
    setSnippetFilter("")
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Fixed Sidebar - Only shown when not viewing Snippets, Guides, or Setup Agent */}
      {!showSnippets && !showGuides && !showSetupAgent && (
        <aside className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col fixed left-0 top-0 h-full z-10">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-lg">
                A
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Abdul Basit Snippets</h2>
                <p className="text-sm text-gray-600">Code & Configuration Hub</p>
              </div>
            </div>

            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search steps & snippets..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border-gray-200 focus:border-blue-300 focus:ring-blue-200 bg-white"
              />

              {/* Search Results Dropdown */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            result.type === "snippet" ? "bg-purple-500" : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{result.title}</div>
                          <div className="text-xs text-gray-500 capitalize">
                            {result.type === "snippet"
                              ? "Code Snippet"
                              : `${sections.find((s) => s.id === result.section)?.title || result.section}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {showSearch && searchResults.length === 0 && searchQuery.trim() !== "" && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500 text-sm">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Sections */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-3">
              {sections.map((section) => {
                const progress = getSectionProgress(section.id)
                const isActive = activeSection === section.id && !showSnippets && !showGuides
                const isCompleted = progress.percentage === 100

                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md transform scale-[1.02]"
                        : "hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                          isCompleted
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                            : isActive
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                              : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                        }`}
                      >
                        {isCompleted ? "✓" : section.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm ${isActive ? "text-blue-900" : "text-gray-900"}`}>
                          {section.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">
                          {progress.completed} of {progress.total} completed
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ease-out ${
                                isCompleted
                                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                  : "bg-gradient-to-r from-blue-400 to-indigo-500"
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-5 h-5 text-blue-500 transition-transform duration-200 group-hover:translate-x-1" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center mb-3">
              Press <kbd className="px-1.5 py-0.5 bg-white rounded text-xs">F6</kbd> for quick search
            </div>
            <Button
              onClick={exportProgress}
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export Progress
            </Button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 ${!showSnippets && !showGuides && !showSetupAgent ? "ml-80" : "ml-0"} flex flex-col h-screen overflow-hidden`}
      >
        {/* Fixed Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Image src={logo || "/placeholder.svg"} alt="Abdul Basit Logo" width={200} height={50} />
            </div>

            <div className="flex items-center gap-4">
              {/* Setup Agent Button */}
              <Button
                onClick={() => {
                  setShowSetupAgent(!showSetupAgent)
                  setShowSnippets(false)
                  setShowGuides(false)
                }}
                variant={showSetupAgent ? "default" : "outline"}
                className={`gap-2 ${
                  showSetupAgent
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    : "border-green-200 text-green-700 hover:bg-green-50"
                }`}
              >
                <Code className="w-4 h-4" />
                {showSetupAgent ? "View Installation Steps" : "Setup Agent"}
              </Button>

              {/* View Snippets Button */}
              <Button
                onClick={() => {
                  setShowSnippets(!showSnippets)
                  setShowGuides(false) // Close guides when opening snippets
                  setShowSetupAgent(false) // Close setup agent when opening snippets
                  if (!showSnippets) {
                    setFilteredSnippetId(null)
                    setSnippetFilter("")
                  }
                }}
                variant={showSnippets ? "default" : "outline"}
                className={`gap-2 ${
                  showSnippets
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                    : "border-purple-200 text-purple-700 hover:bg-purple-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                {showSnippets ? "View Installation Steps" : "View Snippets"}
              </Button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
          <div className="p-8">
            <div className="max-w-[95rem] mx-auto">
              {/* Progress Header */}
              {/* Progress Header - Only show for installation steps, not snippets, guides, or setup agent */}
              {!showSnippets && !showGuides && !showSetupAgent && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                      {activeStep?.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl font-bold text-gray-900">{activeStep?.title}</h1>
                      <p className="text-gray-500 mt-1">
                        Step {activeStep?.number} of {sections.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{overallProgress}%</div>
                      <div className="text-sm text-gray-500">Overall Progress</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>
                      {completedStepsCount} of {totalSteps} steps completed
                    </span>
                    <span>
                      {sections.filter((s) => getSectionProgress(s.id).percentage === 100).length} of {sections.length}{" "}
                      sections complete
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              {showSetupAgent ? (
                <ClientSetupAgent />
              ) : showGuides ? (
                <InteractiveGuides />
              ) : showSnippets ? (
                <SnippetsContent filteredSnippetId={filteredSnippetId} onClearFilter={clearSnippetFilter} />
              ) : (
                <StepContent
                  activeSection={activeSection}
                  completedSteps={completedSteps}
                  onToggleStep={toggleStepCompletion}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Keyboard Shortcuts</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowHelp(false)} className="h-8 w-8 p-0">
                ×
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>Open Search</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F6</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Quick Snippet Filter</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+1-9</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Show Help</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+H</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Clear Filter/Close</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 <strong>Tip:</strong> Use F6 to search and filter snippets, or Ctrl+1-9 to quickly filter to specific
                snippets!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Search Popup */}
      {showModernSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="modern-search-input"
                  type="text"
                  placeholder="Search installation steps & snippets..."
                  value={modernSearchQuery}
                  onChange={(e) => handleModernSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-lg border-0 focus:outline-none focus:ring-0"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {modernSearchResults.length > 0 ? (
                <div className="p-2">
                  {!modernSearchQuery.trim() && (
                    <div className="px-4 py-2 text-sm font-medium text-gray-500 border-b border-gray-100">
                      Popular Snippets
                    </div>
                  )}
                  {modernSearchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleModernSearchResultClick(result)}
                      className={`w-full text-left p-4 rounded-lg transition-colors group ${
                        index === selectedResultIndex
                          ? "bg-blue-50 border-2 border-blue-200"
                          : "hover:bg-gray-50 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            result.type === "snippet" ? "bg-purple-500" : "bg-blue-500"
                          } text-white`}
                        >
                          {result.type === "snippet" ? (
                            <Code className="w-5 h-5" />
                          ) : (
                            <div className="text-sm font-bold">
                              {sections.find((s) => s.id === result.section)?.number || "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-semibold transition-colors ${
                              index === selectedResultIndex
                                ? "text-blue-700"
                                : "text-gray-900 group-hover:text-blue-600"
                            }`}
                          >
                            {result.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {result.type === "snippet"
                              ? "Code Snippet"
                              : `${sections.find((s) => s.id === result.section)?.title || result.section}`}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 line-clamp-2">{result.content}</div>
                        </div>
                        <ChevronRight
                          className={`w-5 h-5 transition-colors ${
                            index === selectedResultIndex ? "text-blue-500" : "text-gray-400 group-hover:text-blue-500"
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Search AttendancePlus Installation</p>
                  <p className="text-sm">Find installation steps, code snippets, and configuration files</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">IIS Setup</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">MongoDB</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">SQL Server</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">Web.config</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">Bookmarks</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded text-xs">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded text-xs">Enter</kbd>
                  Select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded text-xs">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
