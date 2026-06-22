'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface TruancyRecord {
  _id: { $oid: string }
  Title: string
  ClientID: number
  Period: string
  Action: string
  Category: string
  CampusType: string
  Role: string
  ChooseAction: string
  IsConsecutive: boolean
  TotalAbsences: string
  HighlightColor: string
  UserType: string
  Description: string
  CategoryTitle: string
  [key: string]: any
}

const defaultData: TruancyRecord[] = [
  {
    _id: { $oid: '66955387b1f772d2658f4420' },
    Title: '',
    ClientID: 1,
    Period: 'SchoolYear',
    Action: 'Truancy Warning Letter 1',
    Category: 'UnExcused Absence',
    CampusType: "'Elementary School'; 'Middle School'; 'High School'",
    Role: '',
    ChooseAction: 'Truancy Warning Letter 1:WL1',
    IsConsecutive: false,
    TotalAbsences: '',
    HighlightColor: '#b7effb',
    UserType: 'campus',
    Description: '',
    CategoryTitle: 'UnExcused Absence',
    FilterCriteriaTitle: '',
    FilterCriteria: '',
    FilterCriteriaForPeriodTitle: '',
    FilterCriteriaForPeriod: '',
    DependentInterventionsFilterCriteriaTitle: '',
    DependentInterventionsFilterCriteria: '',
    SortOrder: '',
    IsEnable: true,
    OccuranceNumber: 1,
    TrauncySequence: 3,
    GracePeriod: 3,
  },
]

export function TruancyConfigurationEditor() {
  const [data, setData] = useState<TruancyRecord[]>(defaultData)
  const [editMode, setEditMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [templateMode, setTemplateMode] = useState(false)

  // Bulk edit fields
  const [bulkEdits, setBulkEdits] = useState<Partial<TruancyRecord>>({
    Period: '',
    Action: '',
    Category: '',
    HighlightColor: '',
    UserType: '',
    Description: '',
    CategoryTitle: '',
  })

  // Multi-template batch generation
  const [templates, setTemplates] = useState<Array<{
    id: string
    count: number
    Period: string
    Action: string
    Category: string
    CampusType: string
    ChooseAction: string
    IsConsecutive: boolean
    HighlightColor: string
    UserType: string
    Description: string
    CategoryTitle: string
    OccuranceNumber: number
    TrauncySequence: number
  }>>([])
  
  const [newTemplate, setNewTemplate] = useState({
    Period: 'SchoolYear',
    Action: 'Warning Letter 1',
    Category: 'Unexcused Absence',
    CampusType: "'Elementary School'; 'Middle School'; 'High School'",
    ChooseAction: 'Warning Letter 1:WL1',
    IsConsecutive: false,
    HighlightColor: '#fff297',
    UserType: 'campus',
    Description: 'Interventions to be proposed on 3 absences in school year',
    CategoryTitle: 'Unexcused Absence',
    OccuranceNumber: 1,
    TrauncySequence: 3,
    count: 5,
  })

  const changes = useMemo(() => {
    const changed: Record<string, number> = {}
    Object.keys(bulkEdits).forEach((key) => {
      if (bulkEdits[key as keyof TruancyRecord] !== '') {
        changed[key] = data.filter(
          (record) => record[key] !== bulkEdits[key as keyof TruancyRecord],
        ).length
      }
    })
    return changed
  }, [bulkEdits, data])

  const handleAddTemplate = () => {
    if (!newTemplate.Period || !newTemplate.Action) {
      toast.error('Period and Action are required')
      return
    }
    setTemplates([
      ...templates,
      { ...newTemplate, id: `template_${Date.now()}` }
    ])
    setNewTemplate({
      Period: 'SchoolYear',
      Action: '',
      Category: 'Unexcused Absence',
      CampusType: "'Elementary School'; 'Middle School'; 'High School'",
      ChooseAction: '',
      IsConsecutive: false,
      HighlightColor: '#fff297',
      UserType: 'campus',
      Description: '',
      CategoryTitle: 'Unexcused Absence',
      OccuranceNumber: 1,
      TrauncySequence: 3,
      count: 5,
    })
    toast.success('Template added')
  }

  const handleRemoveTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
    toast.success('Template removed')
  }

  const handleGenerateFromTemplates = () => {
    if (templates.length === 0) {
      toast.error('Add at least one template first')
      return
    }

    const generated: TruancyRecord[] = []
    let recordIndex = 0

    templates.forEach((template) => {
      for (let i = 0; i < template.count; i++) {
        const record: TruancyRecord = {
          _id: { $oid: `generated_${Date.now()}_${recordIndex}` },
          Title: '',
          ClientID: 1,
          Role: '',
          TotalAbsences: '',
          FilterCriteriaTitle: '',
          FilterCriteria: '',
          FilterCriteriaForPeriodTitle: '',
          FilterCriteriaForPeriod: '',
          DependentInterventionsFilterCriteriaTitle: '',
          DependentInterventionsFilterCriteria: '',
          SortOrder: '',
          IsEnable: true,
          GracePeriod: 3,
          Period: template.Period,
          Action: template.Action,
          Category: template.Category,
          CampusType: template.CampusType,
          ChooseAction: template.ChooseAction,
          IsConsecutive: template.IsConsecutive,
          HighlightColor: template.HighlightColor,
          UserType: template.UserType,
          Description: template.Description,
          CategoryTitle: template.CategoryTitle,
          OccuranceNumber: template.OccuranceNumber,
          TrauncySequence: template.TrauncySequence,
        }
        generated.push(record)
        recordIndex++
      }
    })

    setData(generated)
    setTemplateMode(false)
    toast.success(`Generated ${recordIndex} records from ${templates.length} templates`)
  }

  const handleBulkUpdate = () => {
    const updatedData = data.map((record) => {
      const updated = { ...record }
      Object.keys(bulkEdits).forEach((key) => {
        if (bulkEdits[key as keyof TruancyRecord] !== '') {
          updated[key as keyof TruancyRecord] =
            bulkEdits[key as keyof TruancyRecord]
        }
      })
      return updated
    })

    setData(updatedData)

    const totalChanges = Object.values(changes).reduce((a, b) => a + b, 0)
    toast.success(`Updated ${totalChanges} field(s) across ${updatedData.length} records`)
    setBulkEdits({
      Period: '',
      Action: '',
      Category: '',
      HighlightColor: '',
      UserType: '',
      Description: '',
      CategoryTitle: '',
    })
  }

  const handleExport = () => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `truancy-configuration-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Configuration exported successfully!')
  }

  const handleReset = () => {
    setData(defaultData)
    setBulkEdits({
      Period: '',
      Action: '',
      Category: '',
      HighlightColor: '',
      UserType: '',
      Description: '',
      CategoryTitle: '',
    })
    toast.info('Configuration reset to default')
  }

  return (
    <div className="p-8 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Configuration Manager
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {templateMode 
              ? 'Define properties once and generate multiple records'
              : 'Modify truancy configuration properties for all records at once. See real-time changes below.'
            }
          </p>
        </div>
        <Button
          onClick={() => setTemplateMode(!templateMode)}
          variant={templateMode ? 'default' : 'outline'}
          className={templateMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
        >
          {templateMode ? 'Back to Editor' : 'Use Template Generator'}
        </Button>
      </div>

      {/* Template Generator Mode */}
      {templateMode && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Multi-Template Batch Generator
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Define multiple property sets and generate different batches of records. Each template generates its own set of documents with unique properties.
            </p>
            
            <div className="space-y-6">
              {/* Added Templates List */}
              {templates.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Templates to Generate</h4>
                  <div className="space-y-2">
                    {templates.map((template, idx) => (
                      <div key={template.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-3 rounded border-l-4 border-blue-500">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            Template {idx + 1}: {template.Action}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {template.count} records | Occurrence: {template.OccuranceNumber} | Sequence: {template.TrauncySequence}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRemoveTemplate(template.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Total records to generate: {templates.reduce((sum, t) => sum + t.count, 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Template Input Form */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Add New Template</h4>
            
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Period</label>
                  <Input
                    value={newTemplate.Period}
                    onChange={(e) => setNewTemplate({ ...newTemplate, Period: e.target.value })}
                    placeholder="e.g., SchoolYear"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Action</label>
                  <Input
                    value={newTemplate.Action}
                    onChange={(e) => setNewTemplate({ ...newTemplate, Action: e.target.value })}
                    placeholder="e.g., Warning Letter 1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Category</label>
                  <Input
                    value={newTemplate.Category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, Category: e.target.value })}
                    placeholder="e.g., Unexcused Absence"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">ChooseAction</label>
                  <Input
                    value={newTemplate.ChooseAction}
                    onChange={(e) => setNewTemplate({ ...newTemplate, ChooseAction: e.target.value })}
                    placeholder="e.g., Warning Letter 1:WL1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">UserType</label>
                  <Input
                    value={newTemplate.UserType}
                    onChange={(e) => setNewTemplate({ ...newTemplate, UserType: e.target.value })}
                    placeholder="e.g., campus"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">HighlightColor</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newTemplate.HighlightColor}
                      onChange={(e) => setNewTemplate({ ...newTemplate, HighlightColor: e.target.value })}
                      className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                    <Input
                      value={newTemplate.HighlightColor}
                      onChange={(e) => setNewTemplate({ ...newTemplate, HighlightColor: e.target.value })}
                      placeholder="#fff297"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">CampusType</label>
                  <Input
                    value={newTemplate.CampusType}
                    onChange={(e) => setNewTemplate({ ...newTemplate, CampusType: e.target.value })}
                    placeholder="e.g., 'Elementary School'; 'Middle School'; 'High School'"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Description</label>
                  <Input
                    value={newTemplate.Description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, Description: e.target.value })}
                    placeholder="e.g., Interventions to be proposed on 3 absences in school year"
                    className="h-auto min-h-12 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">CategoryTitle</label>
                  <Input
                    value={newTemplate.CategoryTitle}
                    onChange={(e) => setNewTemplate({ ...newTemplate, CategoryTitle: e.target.value })}
                    placeholder="e.g., Unexcused Absence"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Count</label>
                  <Input
                    type="number"
                    min="1"
                    value={newTemplate.count}
                    onChange={(e) => setNewTemplate({ ...newTemplate, count: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="font-semibold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">OccuranceNumber</label>
                  <Input
                    type="number"
                    value={newTemplate.OccuranceNumber}
                    onChange={(e) => setNewTemplate({ ...newTemplate, OccuranceNumber: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">TrauncySequence</label>
                  <Input
                    type="number"
                    value={newTemplate.TrauncySequence}
                    onChange={(e) => setNewTemplate({ ...newTemplate, TrauncySequence: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddTemplate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              >
                Add This Template
              </Button>
              </div>
            </div>

            {templates.length > 0 && (
              <Button
                onClick={handleGenerateFromTemplates}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                Generate All {templates.reduce((sum, t) => sum + t.count, 0)} Records Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Regular Editor Mode */}
      {!templateMode && (

      {/* Controls */}
      <div className="flex gap-2 justify-end">
        <Button
          onClick={() => setEditMode(!editMode)}
          variant={editMode ? 'default' : 'outline'}
          className="gap-2"
        >
          <Edit2 className="w-4 h-4" />
          {editMode ? 'Hide Editor' : 'Show Editor'}
        </Button>
        <Button
          onClick={() => setPreviewMode(!previewMode)}
          variant={previewMode ? 'default' : 'outline'}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {previewMode ? 'Hide Preview' : 'Preview JSON'}
        </Button>
        <Button onClick={handleExport} className="gap-2 bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
      </div>

      {/* Editor Panel */}
      {editMode && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Bulk Update Fields</h3>
            <p className="text-sm text-slate-600 mb-4">
              Leave a field empty to skip it. Fields will be applied to all {data.length} records.
            </p>
          </div>

          {/* Grid of edit fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Period
                {changes['Period'] && (
                  <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {changes['Period']} changes
                  </span>
                )}
              </label>
              <Input
                placeholder="e.g., SchoolYear, 6 months"
                value={bulkEdits.Period || ''}
                onChange={(e) =>
                  setBulkEdits({ ...bulkEdits, Period: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Action
                {changes['Action'] && (
                  <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {changes['Action']} changes
                  </span>
                )}
              </label>
              <Input
                placeholder="e.g., Truancy Warning Letter 1"
                value={bulkEdits.Action || ''}
                onChange={(e) =>
                  setBulkEdits({ ...bulkEdits, Action: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
                {changes['Category'] && (
                  <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {changes['Category']} changes
                  </span>
                )}
              </label>
              <Input
                placeholder="e.g., UnExcused Absence"
                value={bulkEdits.Category || ''}
                onChange={(e) =>
                  setBulkEdits({ ...bulkEdits, Category: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>

            {/* HighlightColor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Highlight Color
                {changes['HighlightColor'] && (
                  <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {changes['HighlightColor']} changes
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={bulkEdits.HighlightColor || '#b7effb'}
                  onChange={(e) =>
                    setBulkEdits({
                      ...bulkEdits,
                      HighlightColor: e.target.value,
                    })
                  }
                  className="w-12 h-10"
                />
                <Input
                  placeholder="#b7effb"
                  value={bulkEdits.HighlightColor || ''}
                  onChange={(e) =>
                    setBulkEdits({
                      ...bulkEdits,
                      HighlightColor: e.target.value,
                    })
                  }
                  className="font-mono text-sm flex-1"
                />
              </div>
            </div>

            {/* UserType */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User Type
                {changes['UserType'] && (
                  <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {changes['UserType']} changes
                  </span>
                )}
              </label>
              <Input
                placeholder="e.g., campus"
                value={bulkEdits.UserType || ''}
                onChange={(e) =>
                  setBulkEdits({ ...bulkEdits, UserType: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
                {changes['Description'] && (
                  <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {changes['Description']} changes
                  </span>
                )}
              </label>
              <Input
                placeholder="Enter description"
                value={bulkEdits.Description || ''}
                onChange={(e) =>
                  setBulkEdits({
                    ...bulkEdits,
                    Description: e.target.value,
                  })
                }
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button
              onClick={handleReset}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Reset All
            </Button>
            <Button
              onClick={handleBulkUpdate}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={Object.values(bulkEdits).every((v) => v === '')}
            >
              Apply Changes to All Records
            </Button>
          </div>
        </div>
      )}

      {/* Records Summary */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Records ({data.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.map((record, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded border border-slate-200 text-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-slate-900">
                    {record.Action || '(No Action)'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Category: {record.Category} | Period: {record.Period}
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded border-2 flex-shrink-0"
                  style={{
                    backgroundColor: record.HighlightColor,
                    borderColor: record.HighlightColor,
                  }}
                  title={`Color: ${record.HighlightColor}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Preview */}
      {previewMode && (
        <div className="bg-slate-900 rounded-lg p-6 overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-3">JSON Preview</h3>
          <pre className="bg-slate-950 text-slate-100 p-4 rounded overflow-x-auto text-xs leading-relaxed max-h-96 overflow-y-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      )}
    </div>
  )
}
