"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  ArrowLeft,
  ImageIcon,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

// Guide types with more comprehensive content
const GUIDE_TYPES = [
  {
    id: "client-setup",
    title: "Client Setup Guide",
    description: "Complete guide for setting up new client environments",
    icon: Settings,
    color: "bg-blue-600",
    defaultContent: `<h1>Client Setup Guide</h1>

<h2>Overview</h2>
<p>This comprehensive guide will walk you through setting up a new client environment for AttendancePlus. Follow each step carefully to ensure a successful deployment.</p>

<h2>Prerequisites</h2>
<ul>
<li>Windows Server 2019 or later</li>
<li>SQL Server 2019 or later</li>
<li>IIS 10 or later</li>
<li>.NET 8 Runtime</li>
<li>Administrative access to the server</li>
</ul>

<h2>Step 1: Database Setup</h2>
<ol>
<li>Create new database for the client</li>
<li>Run migration scripts</li>
<li>Configure connection strings</li>
<li>Set up backup procedures</li>
</ol>

<blockquote>
<p><strong>Important:</strong> Always backup existing databases before making changes.</p>
</blockquote>

<h2>Step 2: Application Configuration</h2>
<ol>
<li>Deploy application files to the server</li>
<li>Configure IIS application pools</li>
<li>Set up SSL certificates</li>
<li>Configure environment variables</li>
</ol>

<h2>Step 3: User Setup</h2>
<ol>
<li>Create admin user account</li>
<li>Configure roles and permissions</li>
<li>Set up campus assignments</li>
<li>Test user authentication</li>
</ol>

<h2>Step 4: Testing</h2>
<ol>
<li>Test login functionality</li>
<li>Verify database connectivity</li>
<li>Check all modules and features</li>
<li>Perform load testing</li>
</ol>

<h2>Troubleshooting</h2>
<p>Common issues and their solutions:</p>
<ul>
<li><strong>Connection timeout:</strong> Check firewall settings and connection strings</li>
<li><strong>Authentication errors:</strong> Verify user permissions and role assignments</li>
<li><strong>Performance issues:</strong> Review database indexes and query optimization</li>
</ul>`,
  },
  {
    id: "folder-structure",
    title: "Folder Structure Guide",
    description: "Standard folder structure and organization guidelines",
    icon: FolderTree,
    color: "bg-green-600",
    defaultContent: `<h1>Folder Structure Guide</h1>

<h2>Project Structure Overview</h2>
<p>This guide outlines the standard folder structure for AttendancePlus projects to ensure consistency across all deployments.</p>

<h2>Main Project Structure</h2>
<pre><code>AttendancePlus/
├── src/
│   ├── Frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── guards/
│   │   │   ├── assets/
│   │   │   │   ├── images/
│   │   │   │   ├── styles/
│   │   │   │   └── fonts/
│   │   │   └── environments/
│   │   └── dist/
│   ├── Backend/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Data/
│   │   │   ├── Context/
│   │   │   ├── Repositories/
│   │   │   └── Migrations/
│   │   └── Configuration/
│   └── Database/
│       ├── Scripts/
│       ├── Migrations/
│       ├── Backups/
│       └── Documentation/
├── docs/
│   ├── api/
│   ├── user-guides/
│   └── technical/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── deployment/
    ├── IIS/
    ├── Scripts/
    ├── Configs/
    └── Docker/
</code></pre>

<h2>Frontend Structure Details</h2>
<ul>
<li><strong>src/app/:</strong> Main application components and modules</li>
<li><strong>src/assets/:</strong> Static files including images, fonts, and global styles</li>
<li><strong>src/environments/:</strong> Environment-specific configurations</li>
</ul>

<h2>Backend Structure Details</h2>
<ul>
<li><strong>Controllers/:</strong> API controllers handling HTTP requests</li>
<li><strong>Models/:</strong> Data models and DTOs</li>
<li><strong>Services/:</strong> Business logic and service layer</li>
<li><strong>Data/:</strong> Database context, repositories, and migrations</li>
</ul>

<h2>Best Practices</h2>
<ol>
<li>Keep related files together in logical folders</li>
<li>Use consistent naming conventions</li>
<li>Separate concerns (UI, business logic, data access)</li>
<li>Maintain clear documentation for each folder's purpose</li>
</ol>`,
  },
  {
    id: "cleanup-guide",
    title: "Cleanup Guide",
    description: "System cleanup and maintenance procedures",
    icon: Trash2,
    color: "bg-red-600",
    defaultContent: `<h1>System Cleanup Guide</h1>

<h2>Database Cleanup Procedures</h2>

<h3>Log Table Cleanup</h3>
<pre><code>-- Clean logs older than 30 days
DELETE FROM SystemLogs 
WHERE CreatedDate < DATEADD(day, -30, GETDATE())

-- Clean audit logs older than 90 days
DELETE FROM AuditLogs 
WHERE CreatedDate < DATEADD(day, -90, GETDATE())
</code></pre>

<h3>Temporary Data Cleanup</h3>
<pre><code>-- Clean temporary attendance data
DELETE FROM TempAttendance 
WHERE ProcessedDate IS NOT NULL 
AND ProcessedDate < DATEADD(day, -7, GETDATE())

-- Clean expired sessions
DELETE FROM UserSessions 
WHERE ExpiryDate < GETDATE()
</code></pre>

<h2>File System Cleanup</h2>

<h3>Log Files</h3>
<ul>
<li>Clean IIS logs older than 30 days</li>
<li>Clean application logs older than 60 days</li>
<li>Archive important logs before deletion</li>
</ul>

<h3>Temporary Files</h3>
<ul>
<li>Clean temp upload folders</li>
<li>Remove old backup files</li>
<li>Clear cache directories</li>
</ul>

<h3>Cleanup Commands</h3>
<pre><code># Clean old log files
find /var/log -name "*.log" -mtime +30 -delete

# Clean temp directories
rm -rf /tmp/uploads/*
rm -rf /var/cache/app/*

# Windows PowerShell cleanup
Get-ChildItem "C:\Temp" -Recurse | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item -Force -Recurse
</code></pre>

<h2>Maintenance Schedule</h2>
<table border="1">
<tr><th>Frequency</th><th>Task</th><th>Description</th></tr>
<tr><td>Daily</td><td>Temp Files</td><td>Clean temporary files and expired sessions</td></tr>
<tr><td>Weekly</td><td>Logs</td><td>Clean old logs and audit trails</td></tr>
<tr><td>Monthly</td><td>Archives</td><td>Archive important data and clean old backups</td></tr>
<tr><td>Quarterly</td><td>Full Cleanup</td><td>Complete system cleanup and optimization</td></tr>
</table>

<h2>Monitoring and Alerts</h2>
<p>Set up automated scripts to monitor:</p>
<ul>
<li>Disk space usage (alert when > 80%)</li>
<li>Database size growth</li>
<li>Log file sizes</li>
<li>System performance metrics</li>
</ul>

<blockquote>
<p><strong>Warning:</strong> Always test cleanup procedures in a development environment first!</p>
</blockquote>`,
  },
]

// Advanced Rich Text Editor with image support
function AdvancedRichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}: {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px;" />`
        document.execCommand("insertHTML", false, imageHtml)
        handleContentChange()
        toast.success("Image inserted successfully!")
      }
      reader.readAsDataURL(file)
    }
  }

  const insertTable = () => {
    const tableHtml = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Header 1</th>
          <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Header 2</th>
          <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Header 3</th>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
        </tr>
      </table>
    `
    document.execCommand("insertHTML", false, tableHtml)
    handleContentChange()
  }

  const getViewModeClass = () => {
    switch (viewMode) {
      case "mobile":
        return "max-w-sm mx-auto"
      case "tablet":
        return "max-w-2xl mx-auto"
      default:
        return "w-full"
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Advanced Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50">
        {/* Main Toolbar */}
        <div className="flex items-center gap-1 p-2 flex-wrap">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button size="sm" variant="ghost" onClick={() => handleAction("undo")} className="h-8 w-8 p-0" title="Undo">
              <Undo className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleAction("redo")} className="h-8 w-8 p-0" title="Redo">
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <select
              onChange={(e) => handleAction("formatBlock", e.target.value)}
              className="h-8 px-2 text-sm border border-gray-300 rounded"
              defaultValue=""
            >
              <option value="">Format</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="p">Paragraph</option>
            </select>
            <Button size="sm" variant="ghost" onClick={() => handleAction("bold")} className="h-8 w-8 p-0" title="Bold">
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("italic")}
              className="h-8 w-8 p-0"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("underline")}
              className="h-8 w-8 p-0"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("insertUnorderedList")}
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("insertOrderedList")}
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("justifyLeft")}
              className="h-8 w-8 p-0"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("justifyCenter")}
              className="h-8 w-8 p-0"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("justifyRight")}
              className="h-8 w-8 p-0"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Insert Elements */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const url = prompt("Enter URL:")
                if (url) handleAction("createLink", url)
              }}
              className="h-8 w-8 p-0"
              title="Insert Link"
            >
              <Link className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={insertTable} className="h-8 w-8 p-0" title="Insert Table">
              <Table className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("insertHTML", "<code></code>")}
              className="h-8 w-8 p-0"
              title="Code"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("formatBlock", "blockquote")}
              className="h-8 w-8 p-0"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 border border-gray-300 rounded">
              <Button
                size="sm"
                variant={viewMode === "desktop" ? "default" : "ghost"}
                onClick={() => setViewMode("desktop")}
                className="h-8 w-8 p-0"
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "tablet" ? "default" : "ghost"}
                onClick={() => setViewMode("tablet")}
                className="h-8 w-8 p-0"
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "mobile" ? "default" : "ghost"}
                onClick={() => setViewMode("mobile")}
                className="h-8 w-8 p-0"
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setIsPreview(!isPreview)} className="gap-2">
              {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className={`transition-all duration-300 ${getViewModeClass()}`}>
        {isPreview ? (
          <div
            className="p-6 min-h-[500px] max-h-[600px] overflow-y-auto custom-scrollbar prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onPaste={handlePaste}
            className="p-6 min-h-[500px] max-h-[600px] overflow-y-auto custom-scrollbar outline-none prose prose-sm max-w-none rich-editor"
            style={{ whiteSpace: "pre-wrap" }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Hidden file input for image uploads */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  )
}

export default function GuidesPage() {
  const router = useRouter()
  const [guides, setGuides] = useState(GUIDE_TYPES)
  const [selectedGuide, setSelectedGuide] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")

  const openGuide = (guide: any) => {
    setSelectedGuide(guide)
    setContent(guide.defaultContent || "")
    setTitle(guide.title || "")
    setIsEditing(true)
  }

  const closeEditor = () => {
    setIsEditing(false)
    setSelectedGuide(null)
    setContent("")
    setTitle("")
  }

  const saveGuide = () => {
    if (selectedGuide) {
      setGuides(
        guides.map((guide) => (guide.id === selectedGuide.id ? { ...guide, defaultContent: content, title } : guide)),
      )
      toast.success("Guide saved successfully!")
    }
  }

  const exportGuide = () => {
    const blob = new Blob([content], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Guide exported successfully!")
  }

  const importGuide = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const createNewGuide = () => {
    const title = prompt("Enter guide title:")
    if (title) {
      const newGuide = {
        id: `custom-${Date.now()}`,
        title,
        description: "Custom guide",
        icon: FileText,
        color: "bg-gray-600",
        defaultContent: `<h1>${title}</h1>\n\n<p>Start writing your guide here...</p>`,
      }
      setGuides([...guides, newGuide])
      openGuide(newGuide)
    }
  }

  const deleteGuide = (guideId: string) => {
    if (confirm("Are you sure you want to delete this guide?")) {
      setGuides(guides.filter((guide) => guide.id !== guideId))
      if (selectedGuide?.id === guideId) {
        closeEditor()
      }
      toast.success("Guide deleted successfully!")
    }
  }

  if (isEditing && selectedGuide) {
    const Icon = selectedGuide.icon

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={closeEditor} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Guides
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${selectedGuide.color} text-white flex items-center justify-center`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-semibold bg-transparent border-none outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" accept=".html,.txt,.md" onChange={importGuide} className="hidden" id="import-file" />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("import-file")?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" onClick={exportGuide} className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button onClick={saveGuide} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdvancedRichTextEditor content={content} onChange={setContent} placeholder="Start writing your guide..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Wizard
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Interactive Setup Guides</h1>
              </div>
            </div>
            <Button onClick={createNewGuide} className="gap-2">
              <Plus className="w-4 h-4" />
              New Guide
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Guides</p>
                  <p className="text-2xl font-bold text-gray-900">{guides.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Custom Guides</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {guides.filter((g) => g.id.startsWith("custom-")).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Features</p>
                  <p className="text-2xl font-bold text-gray-900">Rich Editor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => {
            const Icon = guide.icon
            const isCustom = guide.id.startsWith("custom-")

            return (
              <Card
                key={guide.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
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
                      <ImageIcon className="w-4 h-4 text-green-500" />
                      <span>Image support</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Table className="w-4 h-4 text-blue-500" />
                      <span>Table insertion</span>
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

        {/* Features Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span>Advanced Editor Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Type className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Rich Text Formatting</h4>
                  <p className="text-sm text-gray-600">Full WYSIWYG editor with advanced formatting options</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Image Support</h4>
                  <p className="text-sm text-gray-600">Upload and insert images directly into your guides</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Monitor className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Responsive Preview</h4>
                  <p className="text-sm text-gray-600">Preview your content on desktop, tablet, and mobile</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Download className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Import & Export</h4>
                  <p className="text-sm text-gray-600">Import from Word documents and export as HTML</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
