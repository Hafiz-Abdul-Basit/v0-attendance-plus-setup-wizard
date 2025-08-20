"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  BookOpen,
  Settings,
  FolderTree,
  Trash2,
  Save,
  Download,
  Upload,
  Edit3,
  Eye,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Undo,
  Redo,
  Plus,
  FileText,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

// Guide types
const GUIDE_TYPES = [
  {
    id: "client-setup",
    title: "Client Setup Guide",
    description: "Complete guide for setting up new client environments",
    icon: Settings,
    color: "bg-blue-600",
    defaultContent: `# Client Setup Guide

## Overview
This guide will walk you through setting up a new client environment for AttendancePlus.

## Prerequisites
- Windows Server 2019 or later
- SQL Server 2019 or later
- IIS 10 or later
- .NET 8 Runtime

## Step 1: Database Setup
1. Create new database for the client
2. Run migration scripts
3. Configure connection strings

## Step 2: Application Configuration
1. Deploy application files
2. Configure IIS
3. Set up SSL certificates

## Step 3: User Setup
1. Create admin user
2. Configure roles and permissions
3. Set up campus assignments

## Step 4: Testing
1. Test login functionality
2. Verify database connectivity
3. Check all modules

## Troubleshooting
Common issues and solutions...`,
  },
  {
    id: "folder-structure",
    title: "Folder Structure Guide",
    description: "Standard folder structure and organization guidelines",
    icon: FolderTree,
    color: "bg-green-600",
    defaultContent: `# Folder Structure Guide

## Project Structure
\`\`\`
AttendancePlus/
├── src/
│   ├── Frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── assets/
│   │   │   └── environments/
│   │   └── dist/
│   ├── Backend/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Data/
│   └── Database/
│       ├── Scripts/
│       ├── Migrations/
│       └── Backups/
├── docs/
├── tests/
└── deployment/
    ├── IIS/
    ├── Scripts/
    └── Configs/
\`\`\`

## Frontend Structure
- **src/app/**: Main application components
- **src/assets/**: Static files (images, fonts, etc.)
- **src/environments/**: Environment configurations

## Backend Structure
- **Controllers/**: API controllers
- **Models/**: Data models and DTOs
- **Services/**: Business logic services
- **Data/**: Database context and repositories

## Database Structure
- **Scripts/**: SQL scripts for setup
- **Migrations/**: Database migration files
- **Backups/**: Database backup files

## Deployment Structure
- **IIS/**: IIS configuration files
- **Scripts/**: Deployment scripts
- **Configs/**: Configuration templates`,
  },
  {
    id: "cleanup-guide",
    title: "Cleanup Guide",
    description: "System cleanup and maintenance procedures",
    icon: Trash2,
    color: "bg-red-600",
    defaultContent: `# Cleanup Guide

## Database Cleanup

### Log Table Cleanup
\`\`\`sql
-- Clean logs older than 30 days
DELETE FROM SystemLogs 
WHERE CreatedDate < DATEADD(day, -30, GETDATE())

-- Clean audit logs older than 90 days
DELETE FROM AuditLogs 
WHERE CreatedDate < DATEADD(day, -90, GETDATE())
\`\`\`

### Temporary Data Cleanup
\`\`\`sql
-- Clean temporary attendance data
DELETE FROM TempAttendance 
WHERE ProcessedDate IS NOT NULL 
AND ProcessedDate < DATEADD(day, -7, GETDATE())

-- Clean expired sessions
DELETE FROM UserSessions 
WHERE ExpiryDate < GETDATE()
\`\`\`

## File System Cleanup

### Log Files
- Clean IIS logs older than 30 days
- Clean application logs older than 60 days
- Archive important logs before deletion

### Temporary Files
- Clean temp upload folders
- Remove old backup files
- Clear cache directories

### Commands
\`\`\`bash
# Clean old log files
find /var/log -name "*.log" -mtime +30 -delete

# Clean temp directories
rm -rf /tmp/uploads/*
rm -rf /var/cache/app/*
\`\`\`

## Maintenance Schedule
- **Daily**: Clean temp files and expired sessions
- **Weekly**: Clean old logs and audit trails
- **Monthly**: Archive important data and clean old backups
- **Quarterly**: Full system cleanup and optimization

## Monitoring
Set up automated scripts to monitor:
- Disk space usage
- Database size growth
- Log file sizes
- System performance metrics`,
  },
]

// Rich text editor toolbar
function EditorToolbar({ onAction }: { onAction: (action: string, value?: string) => void }) {
  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button size="sm" variant="ghost" onClick={() => onAction("undo")} className="h-8 w-8 p-0" title="Undo">
          <Undo className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("redo")} className="h-8 w-8 p-0" title="Redo">
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button size="sm" variant="ghost" onClick={() => onAction("bold")} className="h-8 w-8 p-0" title="Bold">
          <Bold className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("italic")} className="h-8 w-8 p-0" title="Italic">
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAction("underline")}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAction("insertUnorderedList")}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAction("insertOrderedList")}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const url = prompt("Enter URL:")
            if (url) onAction("createLink", url)
          }}
          className="h-8 w-8 p-0"
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAction("insertHTML", "<code></code>")}
          className="h-8 w-8 p-0"
          title="Code"
        >
          <Code className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAction("formatBlock", "blockquote")}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <select
          onChange={(e) => onAction("formatBlock", e.target.value)}
          className="h-8 px-2 text-sm border border-gray-300 rounded"
          defaultValue=""
        >
          <option value="">Format</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="p">Paragraph</option>
        </select>
      </div>
    </div>
  )
}

// Rich text editor component
function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}: {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = content
    }
  }, [content, isPreview])

  const handleAction = (action: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand(action, false, value)
      handleContentChange()
    }
  }

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain")
    document.execCommand("insertHTML", false, text)
    handleContentChange()
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
        <EditorToolbar onAction={handleAction} />
        <Button size="sm" variant="ghost" onClick={() => setIsPreview(!isPreview)} className="gap-2">
          {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {isPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {isPreview ? (
        <div className="p-4 min-h-[400px] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onPaste={handlePaste}
          className="p-4 min-h-[400px] outline-none prose prose-sm max-w-none"
          style={{ whiteSpace: "pre-wrap" }}
          data-placeholder={placeholder}
        />
      )}
    </div>
  )
}

// Guide editor modal
function GuideEditor({
  guide,
  isOpen,
  onClose,
  onSave,
}: {
  guide: any
  isOpen: boolean
  onClose: () => void
  onSave: (content: string) => void
}) {
  const [content, setContent] = useState(guide?.defaultContent || "")
  const [title, setTitle] = useState(guide?.title || "")

  useEffect(() => {
    if (guide) {
      setContent(guide.defaultContent || "")
      setTitle(guide.title || "")
    }
  }, [guide])

  const handleSave = () => {
    onSave(content)
    toast.success("Guide saved successfully!")
  }

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Guide exported successfully!")
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setContent(content)
        toast.success("Content imported successfully!")
      }
      reader.readAsText(file)
    }
  }

  if (!guide) return null

  const Icon = guide.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${guide.color} text-white shadow-lg`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none w-full"
              />
              <p className="text-sm text-gray-600 mt-1">{guide.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" accept=".html,.txt,.md" onChange={handleImport} className="hidden" id="import-file" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById("import-file")?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 p-6">
          <RichTextEditor content={content} onChange={setContent} placeholder="Start writing your guide..." />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function InteractiveGuides() {
  const [selectedGuide, setSelectedGuide] = useState<any>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [guides, setGuides] = useState(GUIDE_TYPES)

  const openGuide = (guide: any) => {
    setSelectedGuide(guide)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    setSelectedGuide(null)
  }

  const saveGuide = (content: string) => {
    if (selectedGuide) {
      setGuides(guides.map((guide) => (guide.id === selectedGuide.id ? { ...guide, defaultContent: content } : guide)))
    }
  }

  const createNewGuide = () => {
    const title = prompt("Enter guide title:")
    if (title) {
      const newGuide = {
        id: `custom-${Date.now()}`,
        title,
        description: "Custom guide",
        icon: FileText,
        color: "bg-gray-600",
        defaultContent: `# ${title}\n\nStart writing your guide here...`,
      }
      setGuides([...guides, newGuide])
      openGuide(newGuide)
    }
  }

  const deleteGuide = (guideId: string) => {
    if (confirm("Are you sure you want to delete this guide?")) {
      setGuides(guides.filter((guide) => guide.id !== guideId))
      toast.success("Guide deleted successfully!")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 Interactive Setup Guides</h2>
              <p className="text-gray-700">
                Create, edit, and manage comprehensive setup guides with rich text editing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={createNewGuide} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />
              New Guide
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center border border-indigo-200">
            <div className="text-lg font-bold text-indigo-600">{guides.length}</div>
            <div className="text-xs text-gray-600">Total Guides</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center border border-purple-200">
            <div className="text-lg font-bold text-purple-600">
              {guides.filter((g) => g.id.startsWith("custom-")).length}
            </div>
            <div className="text-xs text-gray-600">Custom Guides</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center border border-pink-200">
            <div className="text-lg font-bold text-pink-600">{GUIDE_TYPES.length}</div>
            <div className="text-xs text-gray-600">Default Guides</div>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide) => {
          const Icon = guide.icon
          const isCustom = guide.id.startsWith("custom-")

          return (
            <Card
              key={guide.id}
              className="border-2 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group"
              onClick={() => openGuide(guide)}
            >
              <CardHeader className={`${guide.color} text-white rounded-t-lg relative`}>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="w-6 h-6" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{guide.title}</h3>
                    <p className="text-sm opacity-90 font-normal">{guide.description}</p>
                  </div>
                  {isCustom && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteGuide(guide.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Edit3 className="w-4 h-4" />
                    <span>Click to edit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCustom && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Custom</span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Rich Text</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span>Word paste support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Rich formatting</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Download className="w-4 h-4 text-purple-500" />
                    <span>Export & Import</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    className="w-full gap-2 group-hover:bg-purple-600 group-hover:text-white transition-colors bg-transparent"
                    variant="outline"
                  >
                    <Edit3 className="w-4 h-4" />
                    Open Editor
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Guide Editor Modal */}
      <GuideEditor guide={selectedGuide} isOpen={isEditorOpen} onClose={closeEditor} onSave={saveGuide} />

      {/* Features Section */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Editor Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Rich Text Editing</h4>
            <p className="text-sm text-blue-800">Full WYSIWYG editor with formatting tools, lists, links, and more.</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">📋 Word Paste Support</h4>
            <p className="text-sm text-purple-800">
              Paste content directly from Microsoft Word with formatting preserved.
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-pink-200">
            <h4 className="font-semibold text-pink-900 mb-2">💾 Import & Export</h4>
            <p className="text-sm text-pink-800">Export guides as HTML or import from external files.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
