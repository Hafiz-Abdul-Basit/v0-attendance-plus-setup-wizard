"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import type { CustomSnippet } from "@/lib/indexeddb"
import { toast } from "sonner"

interface SnippetEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  snippet?: CustomSnippet | null
  onSave: (snippet: Omit<CustomSnippet, "id" | "createdAt" | "updatedAt" | "isCustom">) => Promise<void>
  mode: "create" | "edit"
}

const CATEGORIES = [
  "IIS & Web Server",
  "MongoDB",
  "SQL Server",
  "Development",
  "User Management",
  "Documentation",
  "Custom",
]

const LANGUAGES = [
  "XML",
  "Shell",
  "SQL",
  "JavaScript",
  "TypeScript",
  "Python",
  "PowerShell",
  "Markdown",
  "JSON",
  "YAML",
  "Text",
]

const ICONS = [
  "FileText",
  "Code2",
  "Database",
  "Server",
  "Settings",
  "Terminal",
  "Users",
  "Shield",
  "Key",
  "BookOpen",
  "File",
  "FolderOpen",
]

const COLORS = [
  "bg-blue-600",
  "bg-green-600",
  "bg-red-600",
  "bg-orange-600",
  "bg-purple-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-cyan-600",
  "bg-amber-600",
]

export function SnippetEditorDialog({ open, onOpenChange, snippet, onSave, mode }: SnippetEditorDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("Custom")
  const [language, setLanguage] = useState("Text")
  const [icon, setIcon] = useState("FileText")
  const [color, setColor] = useState("bg-blue-600")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Load snippet data when editing
  useEffect(() => {
    if (snippet && mode === "edit") {
      setTitle(snippet.title)
      setDescription(snippet.description)
      setContent(snippet.content)
      setCategory(snippet.category)
      setLanguage(snippet.language)
      setIcon(snippet.icon)
      setColor(snippet.color)
      setTags(snippet.tags)
    } else {
      // Reset form for create mode
      setTitle("")
      setDescription("")
      setContent("")
      setCategory("Custom")
      setLanguage("Text")
      setIcon("FileText")
      setColor("bg-blue-600")
      setTags([])
    }
  }, [snippet, mode, open])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!content.trim()) {
      toast.error("Please enter content")
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category,
        language,
        icon,
        color,
        tags,
        lastUsed: new Date(),
      })
      onOpenChange(false)
      toast.success(mode === "create" ? "Snippet created successfully!" : "Snippet updated successfully!")
    } catch (error) {
      console.error("[v0] Error saving snippet:", error)
      toast.error("Failed to save snippet")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Snippet" : "Edit Snippet"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter snippet title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the snippet"
              rows={2}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your code or text here..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {/* Category and Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Icon and Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((ic) => (
                    <SelectItem key={ic} value={ic}>
                      {ic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((col) => (
                    <SelectItem key={col} value={col}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${col}`} />
                        {col.replace("bg-", "").replace("-600", "")}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag and press Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : mode === "create" ? "Create Snippet" : "Update Snippet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
