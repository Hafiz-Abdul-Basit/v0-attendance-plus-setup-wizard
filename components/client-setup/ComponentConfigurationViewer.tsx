'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, Copy, Trash2, Edit2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ComponentConfig {
  _id: { $oid: string }
  Title: string
  ClientID: number
  WebPartID: string
  ActionType: string
  DisplayAcronym: string
  DisplayInStudentProfile: number
  MoreLink: string
  ActionTypeFilterCustom: string
  SequenceNo: number
  IsDisplayedInActionBoardMenu: number
  ActionBoardMenuType: string
  LinkTitleNoMenu: string
  LinkTitle: string
  InterventionType: string
  Claims: string[]
  ShowRedYellowCountAsZero?: number
  Button?: Record<string, { Title: string; Enabled: boolean }>
  EmailContent?: Record<string, any>
  Abbreviation: string
  SubActionTypes: Record<string, string>[]
  [key: string]: any
}

const defaultComponent: ComponentConfig = {
  _id: { $oid: '' },
  Title: '',
  ClientID: 1,
  WebPartID: '',
  ActionType: '',
  DisplayAcronym: '',
  DisplayInStudentProfile: 0,
  MoreLink: '',
  ActionTypeFilterCustom: '',
  SequenceNo: 1,
  IsDisplayedInActionBoardMenu: 1,
  ActionBoardMenuType: 'Unexcused',
  LinkTitleNoMenu: '',
  LinkTitle: '',
  InterventionType: '',
  Claims: [],
  Abbreviation: 'LISDTX',
  SubActionTypes: [],
}

const sampleComponents: ComponentConfig[] = [
  {
    _id: { $oid: '6515fa7ba945b7ba77f6cd5d' },
    Title: 'Warning Notice (Required)',
    ClientID: 1,
    WebPartID: 'ABWPWL',
    ActionType: 'WL',
    DisplayAcronym: 'WL',
    DisplayInStudentProfile: 0,
    MoreLink: 'actionboard/intervention-letter/WL1/Unexcused',
    ActionTypeFilterCustom: "[ACTION TYPE] IN ('WL1','WL2')",
    SequenceNo: 1,
    IsDisplayedInActionBoardMenu: 1,
    ActionBoardMenuType: 'Unexcused',
    LinkTitleNoMenu: 'Warning Notice',
    LinkTitle: 'Warning Notice',
    InterventionType: 'letters',
    Claims: [
      'CampusOfficer',
      'AttendanceOfficer',
      'CampusAttendanceOfficer',
      'assistantprincipal',
      'SPUser',
    ],
    ShowRedYellowCountAsZero: 0,
    Button: {
      Print: { Title: 'Print', Enabled: true },
      Sent: { Title: 'Sent', Enabled: true },
      Email: { Title: 'Email', Enabled: false },
    },
    EmailContent: { SecureDocEnabled: true },
    Abbreviation: 'LISDTX',
    SubActionTypes: [
      { WL1: 'Truancy Warning Letter 1' },
      { WL2: 'Truancy Warning Letter 2' },
    ],
  },
]

export function ComponentConfigurationViewer() {
  const { toast } = useToast()
  const [components, setComponents] = useState<ComponentConfig[]>(sampleComponents)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDuplicate = (component: ComponentConfig) => {
    const newId = `generated_${Date.now()}`
    const newComponent = {
      ...JSON.parse(JSON.stringify(component)),
      _id: { $oid: newId },
    }
    setComponents([...components, newComponent])
    toast({
      title: 'Success',
      description: 'Component duplicated',
    })
  }

  const handleDelete = (id: string) => {
    setComponents(components.filter(c => c._id.$oid !== id))
    setEditingId(null)
    toast({
      title: 'Success',
      description: 'Component deleted',
    })
  }

  const handleUpdate = (id: string, field: string, value: any) => {
    setComponents(
      components.map(c =>
        c._id.$oid === id ? { ...c, [field]: value } : c
      )
    )
  }

  const handleExportJSON = () => {
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
              : 'Edit, duplicate, and manage component configurations'
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
        <div className="space-y-6">
          {components.map((component) => (
            <div
              key={component._id.$oid}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-opacity-75 transition"
                onClick={() => setExpandedId(expandedId === component._id.$oid ? null : component._id.$oid)}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    {component.Title || 'Untitled Component'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Type: <span className="font-mono font-semibold">{component.ActionType}</span> | WebPartID: <span className="font-mono">{component.WebPartID}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(editingId === component._id.$oid ? null : component._id.$oid)
                    }}
                  >
                    {editingId === component._id.$oid ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(component)
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(component._id.$oid)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === component._id.$oid && (
                <div className="p-6 space-y-6">
                  {/* Edit Mode */}
                  {editingId === component._id.$oid && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-700 space-y-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Edit Component</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Title</label>
                          <Input
                            value={component.Title}
                            onChange={(e) => handleUpdate(component._id.$oid, 'Title', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">ActionType</label>
                          <Input
                            value={component.ActionType}
                            onChange={(e) => handleUpdate(component._id.$oid, 'ActionType', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">DisplayAcronym</label>
                          <Input
                            value={component.DisplayAcronym}
                            onChange={(e) => handleUpdate(component._id.$oid, 'DisplayAcronym', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">WebPartID</label>
                          <Input
                            value={component.WebPartID}
                            onChange={(e) => handleUpdate(component._id.$oid, 'WebPartID', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">SequenceNo</label>
                          <Input
                            type="number"
                            value={component.SequenceNo}
                            onChange={(e) => handleUpdate(component._id.$oid, 'SequenceNo', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">ActionBoardMenuType</label>
                          <Input
                            value={component.ActionBoardMenuType}
                            onChange={(e) => handleUpdate(component._id.$oid, 'ActionBoardMenuType', e.target.value)}
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">LinkTitle</label>
                          <Input
                            value={component.LinkTitle}
                            onChange={(e) => handleUpdate(component._id.$oid, 'LinkTitle', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">InterventionType</label>
                          <Input
                            value={component.InterventionType}
                            onChange={(e) => handleUpdate(component._id.$oid, 'InterventionType', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Mode */}
                  {editingId !== component._id.$oid && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">ActionType</p>
                        <p className="text-slate-900 dark:text-white font-mono">{component.ActionType}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">DisplayAcronym</p>
                        <p className="text-slate-900 dark:text-white font-mono">{component.DisplayAcronym}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">WebPartID</p>
                        <p className="text-slate-900 dark:text-white font-mono">{component.WebPartID}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">SequenceNo</p>
                        <p className="text-slate-900 dark:text-white font-mono">{component.SequenceNo}</p>
                      </div>
                      <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900 p-3 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">LinkTitle</p>
                        <p className="text-slate-900 dark:text-white">{component.LinkTitle}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
