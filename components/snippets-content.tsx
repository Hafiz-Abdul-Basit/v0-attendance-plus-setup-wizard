"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useEffect } from "react"
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
  Folder,
  FolderOpen,
  Server,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Star,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SnippetForm } from "@/components/snippet-form"
import { type Snippet, defaultFolders } from "@/types/snippet"

// Icon mapping for dynamic icons
const iconMap: Record<string, ReactElement> = {
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
  Globe,
  Server,
  Wrench,
  Star,
}

/** Props from the parent wizard */
interface SnippetsContentProps {
  filteredSnippetId?: string | null
  onClearFilter?: () => void
}

export function SnippetsContent({ filteredSnippetId, onClearFilter }: SnippetsContentProps) {
  // State management
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [selectedSnippetCode, setSelectedSnippetCode] = useState<string | null>(null)
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)

  // Load snippets from MongoDB
  const loadSnippets = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedFolder) params.append("category", selectedFolder)
      if (localSearchQuery.trim()) params.append("search", localSearchQuery.trim())

      const response = await fetch(`/api/snippets?${params}`)
      if (!response.ok) throw new Error("Failed to fetch snippets")

      const data = await response.json()
      setSnippets(data)
    } catch (error) {
      console.error("Error loading snippets:", error)
      toast.error("Failed to load snippets")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load and when filters change
  useEffect(() => {
    loadSnippets()
  }, [selectedFolder, localSearchQuery])

  // Migrate existing snippets (run once)
  const migrateSnippets = async () => {
    try {
      const response = await fetch("/api/snippets/migrate", { method: "POST" })
      const result = await response.json()
      if (result.count > 0) {
        toast.success(`Migrated ${result.count} snippets to database`)
        loadSnippets()
      }
    } catch (error) {
      console.error("Migration error:", error)
    }
  }

  // Run migration on first load
  useEffect(() => {
    migrateSnippets()
  }, [])

  /** ------------------------------------------------------------
   *  Helpers
   *  ------------------------------------------------------------ */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!", {
      style: { background: "#10b981", color: "white", border: "none" },
    })
  }

  /** Get snippet list, filtering by parent-supplied id */
  const filteredSnippets = (() => {
    if (filteredSnippetId) {
      return snippets.filter((s) => s.id === filteredSnippetId)
    }
    return snippets
  })()

  /** Load snippet content and open modal */
  const handleSnippetClick = async (snippet: Snippet) => {
    setCurrentSnippet(snippet)
    setSelectedSnippetCode(snippet.content)
    setIsSnippetModalOpen(true)
  }

  /** Handle snippet creation/editing */
  const handleSnippetSave = (savedSnippet: Snippet) => {
    setSnippets((prev) => {
      const existing = prev.find((s) => s._id === savedSnippet._id)
      if (existing) {
        return prev.map((s) => (s._id === savedSnippet._id ? savedSnippet : s))
      } else {
        return [savedSnippet, ...prev]
      }
    })
    setIsFormOpen(false)
    setEditingSnippet(null)
  }

  /** Handle snippet deletion */
  const handleDeleteSnippet = async (snippet: Snippet) => {
    if (!confirm(`Are you sure you want to delete "${snippet.title}"?`)) return

    try {
      const response = await fetch(`/api/snippets/${snippet._id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete snippet")

      setSnippets((prev) => prev.filter((s) => s._id !== snippet._id))
      toast.success("Snippet deleted successfully")
    } catch (error) {
      console.error("Error deleting snippet:", error)
      toast.error("Failed to delete snippet")
    }
  }

  /** Open edit form */
  const handleEditSnippet = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setIsFormOpen(true)
  }

  // Get folder statistics
  const getFolderStats = (folderName: string) => {
    return snippets.filter((s) => s.category === folderName).length
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
            <h3 className="font-semibold text-purple-900 mb-1">Dynamic Snippet Management</h3>
            <p className="text-sm text-purple-700">
              Create, edit, and organize your snippets. All changes are saved to MongoDB Atlas.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingSnippet(null)
              setIsFormOpen(true)
            }}
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Snippet
          </Button>
        </div>
      </div>

      {/* Folder Navigation */}
      {!filteredSnippetId && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Folder className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Browse by Category</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {Object.entries(defaultFolders).map(([folderName, folderInfo]) => {
              const FolderIcon = iconMap[folderInfo.icon] || FileText
              const count = getFolderStats(folderName)
              const isSelected = selectedFolder === folderName

              return (
                <button
                  key={folderName}
                  onClick={() => setSelectedFolder(isSelected ? null : folderName)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? "border-purple-300 bg-purple-50 shadow-lg scale-[1.02]"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-25 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg ${folderInfo.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}
                    >
                      {isSelected ? <FolderOpen className="w-5 h-5" /> : <FolderIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-semibold transition-colors ${isSelected ? "text-purple-900" : "text-gray-900 group-hover:text-purple-700"}`}
                      >
                        {folderName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            isSelected ? "bg-purple-200 text-purple-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {count} snippet{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{folderInfo.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      {!filteredSnippetId && (
        <div className="flex items-center gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <Input
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder={selectedFolder ? `Search in ${selectedFolder}...` : "Search snippets..."}
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

          {/* Clear Folder Filter */}
          {selectedFolder && (
            <Button
              variant="outline"
              onClick={() => setSelectedFolder(null)}
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <X className="w-4 h-4" />
              Clear Filter
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading snippets...</p>
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredSnippetId
              ? `Showing filtered snippet`
              : selectedFolder
                ? `${filteredSnippets.length} snippet${filteredSnippets.length !== 1 ? "s" : ""} in ${selectedFolder}`
                : localSearchQuery.trim()
                  ? `${filteredSnippets.length} snippet${filteredSnippets.length !== 1 ? "s" : ""} found`
                  : `${snippets.length} code snippets available`}
          </p>
        </div>
      )}

      {/* Snippets Grid */}
      {!isLoading && filteredSnippets.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSnippets.map((snip) => {
            const Icon = iconMap[snip.icon] || FileText
            return (
              <div
                key={snip._id}
                className="group relative cursor-pointer rounded-xl border-2 border-gray-200 hover:border-purple-300 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-52 flex flex-col hover:scale-[1.02] transform"
              >
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditSnippet(snip)
                    }}
                    className="h-8 w-8 hover:bg-blue-100 text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSnippet(snip)
                    }}
                    className="h-8 w-8 hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div onClick={() => handleSnippetClick(snip)} className="flex-1">
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
                        <span className="text-xs text-gray-400">{snip.language}</span>
                        <Copy className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No snippets found</p>
          <p className="text-gray-400 text-sm mt-2">
            {selectedFolder
              ? `No snippets found in ${selectedFolder} folder`
              : "Try adjusting your search terms or create a new snippet"}
          </p>
          <Button
            onClick={() => {
              setEditingSnippet(null)
              setIsFormOpen(true)
            }}
            className="mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Snippet
          </Button>
        </div>
      ) : null}

      {/* Snippet Form Modal */}
      <SnippetForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingSnippet(null)
        }}
        snippet={editingSnippet}
        onSave={handleSnippetSave}
      />

      {/* Snippet View Modal */}
      {currentSnippet && (
        <Dialog open={isSnippetModalOpen} onOpenChange={setIsSnippetModalOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${currentSnippet.color} text-white shadow-lg`}
                >
                  {React.createElement(iconMap[currentSnippet.icon] || FileText, { className: "h-5 w-5" })}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{currentSnippet.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{currentSnippet.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {currentSnippet.category}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSnippet(currentSnippet)}
                    className="gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
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
                  <span className="text-gray-400 text-xs">{currentSnippet.language}</span>
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

// Export the snippets array for backward compatibility
export const snippets: any[] = []
