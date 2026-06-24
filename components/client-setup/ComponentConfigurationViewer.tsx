'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, Copy, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ComponentRecord {
  [key: string]: any
}

export function ComponentConfigurationViewer() {
  const { toast } = useToast()
  const [components, setComponents] = useState<ComponentRecord[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const [showUpload, setShowUpload] = useState(true)

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
    if (duplicate._id?.$oid) {
      duplicate._id.$oid = `${Date.now()}_dup`
    }
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

  const getAllKeys = () => {
    const keys = new Set<string>()
    components.forEach(c => {
      Object.keys(c).forEach(k => keys.add(k))
    })
    return Array.from(keys).sort()
  }

  const getComponentId = (index: number) => {
    const comp = components[index]
    return comp._id?.$oid || comp.id || `comp_${index}`
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Component Configuration
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {previewMode
              ? `Preview ${components.length} component${components.length !== 1 ? 's' : ''}`
              : 'Load JSON, edit all fields, duplicate objects, and export'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {components.length > 0 && (
            <>
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant={previewMode ? 'default' : 'outline'}
                className={previewMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Back to Editor' : 'Preview JSON'}
              </Button>
              <Button
                onClick={handleExportJSON}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {!previewMode ? (
        <>
          {/* JSON Upload Section */}
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

          {/* Components List */}
          {components.length > 0 && (
            <div className="space-y-6">
              {components.map((component, idx) => {
                const componentId = getComponentId(idx)
                const isExpanded = expandedId === componentId
                const isEditing = editingId === componentId
                const allKeys = getAllKeys()

                return (
                  <div
                    key={componentId}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                  >
                    {/* Card Header */}
                    <div
                      className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 cursor-pointer hover:opacity-90 transition flex items-center justify-between border-b border-slate-200 dark:border-slate-700"
                      onClick={() => setExpandedId(isExpanded ? null : componentId)}
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                          {component.Title || component.ActionType || `Component ${idx + 1}`}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          ID: {componentId} | {allKeys.length} fields
                        </p>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(isEditing ? null : componentId)}
                        >
                          {isEditing ? 'Done' : 'Edit'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicate(idx)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(idx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700 p-6">
                        {isEditing ? (
                          <div className="space-y-6">
                            <h4 className="font-semibold text-slate-900 dark:text-white">Edit All Fields</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {allKeys.map(field => (
                                <div key={field}>
                                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                    {field}
                                  </label>
                                  {typeof component[field] === 'boolean' ? (
                                    <select
                                      value={component[field] ? 'true' : 'false'}
                                      onChange={(e) =>
                                        handleUpdateField(idx, field, e.target.value === 'true')
                                      }
                                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                    >
                                      <option value="true">True</option>
                                      <option value="false">False</option>
                                    </select>
                                  ) : typeof component[field] === 'number' ? (
                                    <Input
                                      type="number"
                                      value={component[field]}
                                      onChange={(e) =>
                                        handleUpdateField(idx, field, parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  ) : Array.isArray(component[field]) ? (
                                    <textarea
                                      value={JSON.stringify(component[field], null, 2)}
                                      onChange={(e) => {
                                        try {
                                          handleUpdateField(idx, field, JSON.parse(e.target.value))
                                        } catch {
                                          // Keep original on parse error
                                        }
                                      }}
                                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono h-24 resize-none"
                                    />
                                  ) : typeof component[field] === 'object' && component[field] !== null ? (
                                    <textarea
                                      value={JSON.stringify(component[field], null, 2)}
                                      onChange={(e) => {
                                        try {
                                          handleUpdateField(idx, field, JSON.parse(e.target.value))
                                        } catch {
                                          // Keep original on parse error
                                        }
                                      }}
                                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono h-24 resize-none"
                                    />
                                  ) : (
                                    <Input
                                      value={component[field] || ''}
                                      onChange={(e) => handleUpdateField(idx, field, e.target.value)}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allKeys.map(field => (
                              <div key={field} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-200 dark:border-slate-600">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  {field}
                                </p>
                                <p className="text-sm text-slate-900 dark:text-white font-mono break-words max-h-20 overflow-auto">
                                  {typeof component[field] === 'object'
                                    ? JSON.stringify(component[field], null, 2)
                                    : String(component[field])}
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
        </>
      ) : (
        // JSON Preview
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded overflow-auto max-h-96 text-xs text-slate-900 dark:text-slate-100 font-mono">
            {JSON.stringify(components, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
