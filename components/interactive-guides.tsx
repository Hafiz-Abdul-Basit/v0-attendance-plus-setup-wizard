"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  BookOpen,
  Lightbulb,
  Play,
  Zap,
  Layers,
  MousePointer,
  Sparkles,
  Database,
  Server,
  Code,
  Users,
  Shield,
  Globe,
  Lock,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Drag and Drop Playground Component
function DragDropPlayground() {
  const [droppedItems, setDroppedItems] = useState<
    Array<{ id: string; type: string; x: number; y: number; content: string }>
  >([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const playgroundRef = useRef<HTMLDivElement>(null)

  const availableItems = [
    { id: "iis", type: "server", content: "IIS Web Server", icon: Server, color: "bg-blue-500" },
    { id: "database", type: "database", content: "SQL Server", icon: Database, color: "bg-red-500" },
    { id: "mongodb", type: "database", content: "MongoDB", icon: Database, color: "bg-green-500" },
    { id: "api", type: "code", content: "Web API", icon: Code, color: "bg-purple-500" },
    { id: "frontend", type: "code", content: "Angular App", icon: Globe, color: "bg-orange-500" },
    { id: "auth", type: "security", content: "Authentication", icon: Shield, color: "bg-indigo-500" },
  ]

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem || !playgroundRef.current) return

    const rect = playgroundRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const item = availableItems.find((i) => i.id === draggedItem)
    if (item) {
      const newItem = {
        id: `${item.id}-${Date.now()}`,
        type: item.type,
        x: Math.max(0, Math.min(x - 50, rect.width - 100)),
        y: Math.max(0, Math.min(y - 25, rect.height - 50)),
        content: item.content,
      }
      setDroppedItems((prev) => [...prev, newItem])
      toast.success(`Added ${item.content} to playground!`)
    }
    setDraggedItem(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }

  const removeItem = (id: string) => {
    setDroppedItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clearPlayground = () => {
    setDroppedItems([])
    toast.success("Playground cleared!")
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Architecture Playground</h3>
              <p className="text-sm text-gray-600">Drag components to design your system architecture</p>
            </div>
          </div>
          <Button
            onClick={clearPlayground}
            variant="outline"
            size="sm"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex h-96">
        {/* Component Library */}
        <div className="w-64 p-4 border-r border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Components
          </h4>
          <div className="space-y-2">
            {availableItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className={`${item.color} text-white p-3 rounded-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-transform shadow-md`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.content}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Playground Area */}
        <div className="flex-1 relative">
          <div
            ref={playgroundRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          >
            {droppedItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MousePointer className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Drop components here</p>
                  <p className="text-sm">Drag items from the left to build your architecture</p>
                </div>
              </div>
            )}

            {droppedItems.map((item) => {
              const originalItem = availableItems.find((i) => i.type === item.type)
              const Icon = originalItem?.icon || Code
              const color = originalItem?.color || "bg-gray-500"

              return (
                <div
                  key={item.id}
                  className={`absolute ${color} text-white p-2 rounded-lg shadow-lg cursor-move group hover:scale-110 transition-transform`}
                  style={{ left: item.x, top: item.y }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{item.content}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 ml-1 hover:bg-white/20 rounded p-0.5 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Interactive Guide Card Component
function GuideCard({
  title,
  description,
  icon: Icon,
  color,
  children,
  isExpanded,
  onToggle,
}: {
  title: string
  description: string
  icon: any
  color: string
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className={`p-6 ${color} cursor-pointer`} onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-white/80 text-sm">{description}</p>
            </div>
          </div>
          <div className="text-white">
            {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {isExpanded && <div className="p-6 border-t border-gray-200">{children}</div>}
    </div>
  )
}

export function InteractiveGuides() {
  const [expandedGuide, setExpandedGuide] = useState<string | null>("architecture")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleGuide = (guideId: string) => {
    setExpandedGuide(expandedGuide === guideId ? null : guideId)
  }

  const toggleFavorite = (guideId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(guideId)) {
      newFavorites.delete(guideId)
      toast.success("Removed from favorites")
    } else {
      newFavorites.add(guideId)
      toast.success("Added to favorites")
    }
    setFavorites(newFavorites)
  }

  const guides = [
    {
      id: "architecture",
      title: "System Architecture",
      description: "Interactive system design and component relationships",
      icon: Layers,
      color: "bg-gradient-to-r from-blue-600 to-indigo-600",
      content: <DragDropPlayground />,
    },
    {
      id: "database",
      title: "Database Design",
      description: "Visual database schema and relationship builder",
      icon: Database,
      color: "bg-gradient-to-r from-green-600 to-emerald-600",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                SQL Server Setup
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Install SQL Server 2019+</li>
                <li>• Configure Mixed Mode Authentication</li>
                <li>• Create AttendancePlus Database</li>
                <li>• Set up backup strategy</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                MongoDB Configuration
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Install MongoDB Community</li>
                <li>• Configure Replica Set</li>
                <li>• Set up document collections</li>
                <li>• Configure indexes</li>
              </ul>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2">Connection String Examples</h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
              <div>SQL Server: Server=localhost;Database=AttendancePlus;Trusted_Connection=true;</div>
              <div className="mt-2">MongoDB: mongodb://localhost:27017/attendanceplus?replicaSet=rs0</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "deployment",
      title: "Deployment Guide",
      description: "Step-by-step deployment with best practices",
      icon: Server,
      color: "bg-gradient-to-r from-purple-600 to-pink-600",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-lg flex items-center justify-center mx-auto mb-3">
                <Server className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-purple-900">IIS Setup</h4>
              <p className="text-sm text-purple-700 mt-1">Configure web server</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-xl">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-lg flex items-center justify-center mx-auto mb-3">
                <Code className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-pink-900">API Deployment</h4>
              <p className="text-sm text-pink-700 mt-1">Deploy backend services</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-xl">
              <div className="w-12 h-12 bg-indigo-500 text-white rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-indigo-900">Frontend Build</h4>
              <p className="text-sm text-indigo-700 mt-1">Angular application</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Quick Deployment Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Install .NET 8 Hosting Bundle</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Configure IIS Application Pools</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Set up SSL certificates</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Configure port bindings</span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Update connection strings</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Test API endpoints</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Verify database connectivity</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Configure logging</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "security",
      title: "Security Configuration",
      description: "Authentication, authorization, and security best practices",
      icon: Shield,
      color: "bg-gradient-to-r from-red-600 to-orange-600",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Authentication Setup
              </h4>
              <div className="space-y-2 text-sm text-red-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Configure ASP.NET Identity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Set up JWT tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Configure password policies</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Enable two-factor authentication</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Role Management
              </h4>
              <div className="space-y-2 text-sm text-orange-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Create user roles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Assign permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Configure claims</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Set up campus assignments</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-xl">
            <h4 className="text-white font-semibold mb-2">Security Headers Configuration</h4>
            <pre className="text-xs overflow-x-auto">
              {`<httpProtocol>
  <customHeaders>
    <add name="X-Content-Type-Options" value="nosniff" />
    <add name="X-Frame-Options" value="DENY" />
    <add name="X-XSS-Protection" value="1; mode=block" />
    <add name="Strict-Transport-Security" value="max-age=31536000" />
  </customHeaders>
</httpProtocol>`}
            </pre>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-900">Interactive Guides</h1>
            <p className="text-gray-600">Hands-on learning with drag & drop playground</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Interactive Components</span>
          </div>
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-teal-500" />
            <span>Drag & Drop Playground</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-500" />
            <span>Best Practices</span>
          </div>
        </div>
      </div>

      {/* Interactive Guides */}
      <div className="space-y-6">
        {guides.map((guide) => (
          <GuideCard
            key={guide.id}
            title={guide.title}
            description={guide.description}
            icon={guide.icon}
            color={guide.color}
            isExpanded={expandedGuide === guide.id}
            onToggle={() => toggleGuide(guide.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorite(guide.id)}
                  className={`gap-2 ${
                    favorites.has(guide.id)
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favorites.has(guide.id) ? "fill-current" : ""}`} />
                  {favorites.has(guide.id) ? "Favorited" : "Add to Favorites"}
                </Button>
              </div>
              <div className="text-xs text-gray-500">Click and interact with the components below</div>
            </div>
            {guide.content}
          </GuideCard>
        ))}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Pro Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">🎯 Architecture Planning</h4>
            <p className="text-sm text-blue-800">
              Use the drag & drop playground to visualize your system before implementation.
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">🔒 Security First</h4>
            <p className="text-sm text-purple-800">
              Always configure security headers and authentication before going live.
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-pink-200">
            <h4 className="font-semibold text-pink-900 mb-2">📊 Monitor Performance</h4>
            <p className="text-sm text-pink-800">Set up logging and monitoring from day one to catch issues early.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
