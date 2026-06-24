'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, Plus, Trash2, Copy, Lock, Unlock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SetupItem {
  id: string
  key: string
  value: string
  description: string
  type: 'fixed' | 'client-oriented'
  clientId?: string
}

export function SetupConfigurationEditor() {
  const { toast } = useToast()
  const [items, setItems] = useState<SetupItem[]>([
    {
      id: '1',
      key: 'SYSTEM_NAME',
      value: 'AttendancePlus',
      description: 'System name identifier',
      type: 'fixed',
    },
    {
      id: '2',
      key: 'API_ENDPOINT',
      value: 'https://api.example.com',
      description: 'Main API endpoint for requests',
      type: 'fixed',
    },
    {
      id: '3',
      key: 'DISTRICT_NAME',
      value: 'Lewisville ISD',
      description: 'District name configuration',
      type: 'client-oriented',
      clientId: 'lewisville_isd',
    },
  ])
  const [previewMode, setPreviewMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'fixed' | 'client-oriented'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleAddItem = () => {
    const newItem: SetupItem = {
      id: `setup_${Date.now()}`,
      key: '',
      value: '',
      description: '',
      type: 'client-oriented',
    }
    setItems([...items, newItem])
    setEditingId(newItem.id)
    toast({
      title: 'Success',
      description: 'New setup item created',
    })
  }

  const handleUpdateItem = (id: string, field: keyof SetupItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    setEditingId(null)
    toast({
      title: 'Success',
      description: 'Setup item deleted',
    })
  }

  const handleDuplicateItem = (id: string) => {
    const original = items.find(item => item.id === id)
    if (!original) return
    const duplicate: SetupItem = {
      ...original,
      id: `setup_${Date.now()}`,
    }
    setItems([...items, duplicate])
    toast({
      title: 'Success',
      description: 'Setup item duplicated',
    })
  }

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesSearch = item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const generateJSON = () => {
    const fixed: any = {}
    const clientOriented: any = {}

    items.forEach(item => {
      if (item.type === 'fixed') {
        fixed[item.key] = {
          value: item.value,
          description: item.description,
        }
      } else {
        if (!clientOriented[item.clientId || 'default']) {
          clientOriented[item.clientId || 'default'] = {}
        }
        clientOriented[item.clientId || 'default'][item.key] = {
          value: item.value,
          description: item.description,
        }
      }
    })

    return {
      TDPS_SETUP: {
        fixed_keys: fixed,
        client_oriented_keys: clientOriented,
        metadata: {
          generated_at: new Date().toISOString(),
          total_keys: items.length,
          fixed_count: items.filter(i => i.type === 'fixed').length,
          client_oriented_count: items.filter(i => i.type === 'client-oriented').length,
        }
      }
    }
  }

  const handleExportJSON = () => {
    const data = generateJSON()
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `setup-configuration-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Success',
      description: `Exported ${items.length} setup items`,
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950/80 backdrop-blur border-b border-slate-700/50 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Setup Configuration</h1>
            <p className="text-slate-400 text-sm">
              {previewMode 
                ? `Preview ${items.length} configuration items`
                : 'JSON Playground - Define fixed keys and client-oriented configurations'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <>
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant={previewMode ? 'default' : 'outline'}
                  className={previewMode ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!previewMode ? (
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="bg-slate-800/50 border-b border-slate-700/50 px-8 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex-1 flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by key, value, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Keys ({items.length})</option>
                    <option value="fixed">Fixed Keys ({items.filter(i => i.type === 'fixed').length})</option>
                    <option value="client-oriented">Client-Oriented ({items.filter(i => i.type === 'client-oriented').length})</option>
                  </select>
                </div>
                <Button
                  onClick={handleAddItem}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Key
                </Button>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-auto px-8 py-6">
              <div className="max-w-7xl mx-auto space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-lg">No setup items found</p>
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-all"
                    >
                      {editingId === item.id ? (
                        // Edit Mode
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Edit Configuration Item</h3>
                            <Button
                              onClick={() => setEditingId(null)}
                              variant="outline"
                              size="sm"
                              className="border-slate-600 text-slate-300"
                            >
                              Done
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-2">Key Name*</label>
                              <Input
                                value={item.key}
                                onChange={(e) => handleUpdateItem(item.id, 'key', e.target.value)}
                                placeholder="e.g., SYSTEM_NAME"
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-2">Value*</label>
                              <Input
                                value={item.value}
                                onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                                placeholder="e.g., AttendancePlus"
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">Description</label>
                            <textarea
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              placeholder="Explain what this configuration does..."
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-400 resize-none h-20"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-2">Key Type*</label>
                              <select
                                value={item.type}
                                onChange={(e) => handleUpdateItem(item.id, 'type', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                              >
                                <option value="fixed">Fixed (System-wide)</option>
                                <option value="client-oriented">Client-Oriented (District-specific)</option>
                              </select>
                            </div>
                            {item.type === 'client-oriented' && (
                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-2">Client ID</label>
                                <Input
                                  value={item.clientId || ''}
                                  onChange={(e) => handleUpdateItem(item.id, 'clientId', e.target.value)}
                                  placeholder="e.g., lewisville_isd"
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div
                          onClick={() => setEditingId(item.id)}
                          className="p-5 cursor-pointer hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-lg font-bold text-white font-mono">{item.key}</h4>
                                <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                                  item.type === 'fixed' 
                                    ? 'bg-amber-900/30 text-amber-300'
                                    : 'bg-blue-900/30 text-blue-300'
                                }`}>
                                  {item.type === 'fixed' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                  {item.type === 'fixed' ? 'Fixed' : 'Client-Oriented'}
                                </span>
                                {item.clientId && (
                                  <span className="text-xs bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded">
                                    {item.clientId}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-sm mt-2">{item.description}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDuplicateItem(item.id)
                                }}
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteItem(item.id)
                                }}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="bg-slate-700/50 px-3 py-2 rounded font-mono text-sm text-emerald-400 break-all">
                            {item.value}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          // JSON Preview
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto px-8 py-6">
              <div className="max-w-7xl mx-auto">
                <div className="bg-slate-950 border border-slate-700 rounded-lg p-6 h-full overflow-auto">
                  <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(generateJSON(), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
