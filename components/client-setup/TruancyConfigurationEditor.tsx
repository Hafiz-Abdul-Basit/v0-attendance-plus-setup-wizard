'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, Edit2, Plus, Trash2 } from 'lucide-react'
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
  FilterCriteriaTitle: string
  FilterCriteria: string
  FilterCriteriaForPeriodTitle: string
  FilterCriteriaForPeriod: string
  DependentInterventionsFilterCriteriaTitle: string
  DependentInterventionsFilterCriteria: string
  SortOrder: string
  IsEnable: boolean
  OccuranceNumber: number
  TrauncySequence: number
  GracePeriod: number
}

interface RecordVariation {
  Action: string
  ChooseAction: string
  Period: string
  OccuranceNumber: number
  TrauncySequence: number
  HighlightColor?: string
  CampusType?: string
  GracePeriod?: number
}

export function TruancyConfigurationEditor() {
  const [mode, setMode] = useState<'base' | 'builder'>('base')
  const [baseProperties, setBaseProperties] = useState({
    Category: 'UnExcused Absence',
    CategoryTitle: 'UnExcused Absence',
    CampusType: "'Elementary School'; 'Middle School'; 'High School'",
    HighlightColor: '#b7effb',
    UserType: 'campus',
    IsConsecutive: false,
    GracePeriod: 3,
    Description: '',
    Role: '',
    TotalAbsences: '',
  })

  const [variations, setVariations] = useState<RecordVariation[]>([
    {
      Action: 'Truancy Warning Letter 1',
      ChooseAction: 'Truancy Warning Letter 1:WL1',
      Period: 'SchoolYear',
      OccuranceNumber: 1,
      TrauncySequence: 3,
    },
    {
      Action: 'Parent Conference',
      ChooseAction: 'Parent Conference:PTM',
      Period: 'SchoolYear',
      OccuranceNumber: 2,
      TrauncySequence: 4,
    },
  ])

  const [newVariation, setNewVariation] = useState<RecordVariation>({
    Action: '',
    ChooseAction: '',
    Period: 'SchoolYear',
    OccuranceNumber: 1,
    TrauncySequence: 3,
  })

  const [previewMode, setPreviewMode] = useState(false)
  const [data, setData] = useState<TruancyRecord[]>([])

  const generateRecords = () => {
    if (variations.length === 0) {
      toast.error('Add at least one variation')
      return
    }

    const generated: TruancyRecord[] = variations.map((variation, idx) => ({
      _id: { $oid: `generated_${Date.now()}_${idx}` },
      Title: '',
      ClientID: 1,
      Period: variation.Period,
      Action: variation.Action,
      Category: baseProperties.Category,
      CampusType: variation.CampusType || baseProperties.CampusType,
      Role: baseProperties.Role,
      ChooseAction: variation.ChooseAction,
      IsConsecutive: baseProperties.IsConsecutive,
      TotalAbsences: baseProperties.TotalAbsences,
      HighlightColor: variation.HighlightColor || baseProperties.HighlightColor,
      UserType: baseProperties.UserType,
      Description: baseProperties.Description,
      CategoryTitle: baseProperties.CategoryTitle,
      FilterCriteriaTitle: '',
      FilterCriteria: '',
      FilterCriteriaForPeriodTitle: '',
      FilterCriteriaForPeriod: '',
      DependentInterventionsFilterCriteriaTitle: '',
      DependentInterventionsFilterCriteria: '',
      SortOrder: '',
      IsEnable: true,
      OccuranceNumber: variation.OccuranceNumber,
      TrauncySequence: variation.TrauncySequence,
      GracePeriod: variation.GracePeriod !== undefined ? variation.GracePeriod : baseProperties.GracePeriod,
    }))

    setData(generated)
    setMode('base')
    toast.success(`Generated ${generated.length} records`)
  }

  const addVariation = () => {
    if (!newVariation.Action || !newVariation.ChooseAction) {
      toast.error('Action and ChooseAction are required')
      return
    }
    setVariations([...variations, { ...newVariation }])
    setNewVariation({
      Action: '',
      ChooseAction: '',
      Period: 'SchoolYear',
      OccuranceNumber: 1,
      TrauncySequence: 3,
    })
    toast.success('Variation added')
  }

  const removeVariation = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx))
    toast.success('Variation removed')
  }

  const exportJSON = () => {
    if (data.length === 0) {
      toast.error('Generate records first')
      return
    }
    const json = JSON.stringify(data, null, 2)
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json))
    element.setAttribute('download', `truancy-configuration-${new Date().toISOString().split('T')[0]}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('JSON exported')
  }

  return (
    <div className="w-full h-full p-8 max-w-7xl mx-auto space-y-8 bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Truancy Configuration Builder
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Define base properties once, then add unique variations per record
          </p>
        </div>
      </div>

      {/* Base Properties Section */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Base Properties (Applied to All Records)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Category</label>
            <Input
              value={baseProperties.Category}
              onChange={(e) => setBaseProperties({ ...baseProperties, Category: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">CategoryTitle</label>
            <Input
              value={baseProperties.CategoryTitle}
              onChange={(e) => setBaseProperties({ ...baseProperties, CategoryTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">UserType</label>
            <Input
              value={baseProperties.UserType}
              onChange={(e) => setBaseProperties({ ...baseProperties, UserType: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">CampusType</label>
            <Input
              value={baseProperties.CampusType}
              onChange={(e) => setBaseProperties({ ...baseProperties, CampusType: e.target.value })}
              placeholder="e.g., 'Elementary School'; 'Middle School'; 'High School'"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Default HighlightColor</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={baseProperties.HighlightColor}
                onChange={(e) => setBaseProperties({ ...baseProperties, HighlightColor: e.target.value })}
                className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <Input
                value={baseProperties.HighlightColor}
                onChange={(e) => setBaseProperties({ ...baseProperties, HighlightColor: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Default GracePeriod</label>
            <Input
              type="number"
              value={baseProperties.GracePeriod}
              onChange={(e) => setBaseProperties({ ...baseProperties, GracePeriod: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Description</label>
            <Input
              value={baseProperties.Description}
              onChange={(e) => setBaseProperties({ ...baseProperties, Description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Variations Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Record Variations</h3>
        
        {/* Current Variations */}
        {variations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">ChooseAction</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Period</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Occurrence</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Sequence</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Color</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {variations.map((variation, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{variation.Action}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-mono text-xs">{variation.ChooseAction}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{variation.Period}</td>
                    <td className="px-4 py-3 text-center text-slate-900 dark:text-white font-semibold">{variation.OccuranceNumber}</td>
                    <td className="px-4 py-3 text-center text-slate-900 dark:text-white font-semibold">{variation.TrauncySequence}</td>
                    <td className="px-4 py-3">
                      <div
                        className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600"
                        style={{ backgroundColor: variation.HighlightColor || baseProperties.HighlightColor }}
                        title={variation.HighlightColor || baseProperties.HighlightColor}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeVariation(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add New Variation */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-white">Add New Variation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Action*</label>
              <Input
                value={newVariation.Action}
                onChange={(e) => setNewVariation({ ...newVariation, Action: e.target.value })}
                placeholder="e.g., Truancy Warning Letter 1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">ChooseAction*</label>
              <Input
                value={newVariation.ChooseAction}
                onChange={(e) => setNewVariation({ ...newVariation, ChooseAction: e.target.value })}
                placeholder="e.g., Truancy Warning Letter 1:WL1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Period</label>
              <Input
                value={newVariation.Period}
                onChange={(e) => setNewVariation({ ...newVariation, Period: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Occurrence Number</label>
              <Input
                type="number"
                value={newVariation.OccuranceNumber}
                onChange={(e) => setNewVariation({ ...newVariation, OccuranceNumber: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Sequence</label>
              <Input
                type="number"
                value={newVariation.TrauncySequence}
                onChange={(e) => setNewVariation({ ...newVariation, TrauncySequence: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Color (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newVariation.HighlightColor || baseProperties.HighlightColor}
                  onChange={(e) => setNewVariation({ ...newVariation, HighlightColor: e.target.value })}
                  className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <Input
                  value={newVariation.HighlightColor || baseProperties.HighlightColor}
                  onChange={(e) => setNewVariation({ ...newVariation, HighlightColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={addVariation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variation
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={generateRecords}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
        >
          Generate {variations.length} Records
        </Button>
        {data.length > 0 && (
          <>
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? 'Hide' : 'Preview'} JSON
            </Button>
            <Button
              onClick={exportJSON}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
          </>
        )}
      </div>

      {/* JSON Preview */}
      {previewMode && data.length > 0 && (
        <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {/* Records Summary */}
      {data.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            ✓ Generated {data.length} records successfully. Ready to export!
          </p>
        </div>
      )}
    </div>
  )
}
