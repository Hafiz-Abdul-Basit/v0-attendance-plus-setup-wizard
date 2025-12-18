"use client"

import { useState } from "react"
import { X, Download, FileSpreadsheet, Plus, Trash2, Table } from "lucide-react"
import { toast } from "sonner"

interface InteractiveTableModalProps {
  isOpen: boolean
  onClose: () => void
  snippet: any
}

export function InteractiveTableModal({ isOpen, onClose, snippet }: InteractiveTableModalProps) {
  const [tableData, setTableData] = useState(snippet.tableData || [])
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  if (!isOpen) return null

  const downloadAsCSV = () => {
    const headers = Object.keys(tableData[0] || {})
    const csvContent = [
      headers.join(","),
      ...tableData.map((row: any) => headers.map((header) => `"${row[header]}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "user-management-template.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV downloaded successfully!")
  }

  const downloadAsExcel = () => {
    const headers = Object.keys(tableData[0] || {})
    const csvContent = [
      headers.join("\t"),
      ...tableData.map((row: any) => headers.map((header) => row[header]).join("\t")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "user-management-template.xlsx"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Excel file downloaded successfully!")
  }

  const addNewRow = () => {
    const newRow = Object.keys(tableData[0] || {}).reduce((acc, key) => {
      acc[key] = ""
      return acc
    }, {} as any)
    setTableData([...tableData, newRow])
    toast.success("New row added")
  }

  const deleteRow = (index: number) => {
    setTableData(tableData.filter((_: any, i: number) => i !== index))
    toast.success("Row deleted")
  }

  const startEdit = (rowIndex: number, colKey: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, col: colKey })
    setEditValue(String(currentValue))
  }

  const saveEdit = () => {
    if (editingCell) {
      const newData = [...tableData]
      newData[editingCell.row][editingCell.col] = editValue
      setTableData(newData)
      setEditingCell(null)
      setEditValue("")
      toast.success("Cell updated")
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  if (!tableData.length) return null

  const headers = Object.keys(tableData[0])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl flex items-center justify-center">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{snippet.title}</h2>
              <p className="text-gray-600">{snippet.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadAsExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel
            </button>
            <button
              onClick={downloadAsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row: any, rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500">{rowIndex + 1}</td>
                    {headers.map((header) => (
                      <td key={header} className="px-4 py-3 text-sm">
                        {editingCell?.row === rowIndex && editingCell?.col === header ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit()
                                if (e.key === "Escape") cancelEdit()
                              }}
                              autoFocus
                            />
                            <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                              ✓
                            </button>
                            <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                            onClick={() => startEdit(rowIndex, header, row[header])}
                          >
                            {row[header] || <span className="text-gray-400 italic">Click to edit</span>}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={addNewRow}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Row
            </button>
            <div className="text-sm text-gray-600">
              {tableData.length} rows • Click any cell to edit • Use Enter to save, Escape to cancel
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
