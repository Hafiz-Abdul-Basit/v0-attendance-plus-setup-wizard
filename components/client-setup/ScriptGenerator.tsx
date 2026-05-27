'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, FileText, Terminal } from 'lucide-react'
import { toast } from 'sonner'
import {
  generateFullScript,
  ClientInfo as ScriptClientInfo,
} from '@/utils/scriptTemplates'
import { ClientSetup } from '@/utils/clientSetupStorage'

interface ScriptGeneratorProps {
  client: ClientSetup
  onBack: () => void
}

export function ScriptGenerator({
  client,
  onBack,
}: ScriptGeneratorProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({})

  const clientInfo: ScriptClientInfo = {
    name: client.name,
    mainUrl: client.mainUrl,
    gatewayUrl: client.gatewayUrl,
    docsUrl: client.docsUrl,
  }

  const script = generateFullScript(clientInfo, client.selectedInstallations)

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script)
    toast.success('Script copied to clipboard!')
  }

  const downloadScript = () => {
    const element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(script)
    )
    element.setAttribute(
      'download',
      `${client.name.replace(/\s+/g, '_')}_setup.ps1`
    )
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Script downloaded!')
  }

  const sections = script.split('# ===== ').filter((s) => s.trim())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{client.name}</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Auto-generated PowerShell Setup Script
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="border-slate-300 dark:border-slate-700">
          ← Back to Client
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={copyToClipboard} variant="outline" className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
          <Copy className="w-4 h-4" />
          Copy to Clipboard
        </Button>
        <Button onClick={downloadScript} className="gap-2 bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4" />
          Download .ps1
        </Button>
      </div>

      {/* Script Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Script Preview</h3>
        </div>
        <div className="bg-slate-900 dark:bg-black rounded-lg overflow-hidden border border-slate-700 dark:border-slate-800">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <p className="text-xs text-slate-400 font-mono">PowerShell Setup Script</p>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto font-mono text-xs text-slate-300">
            {sections.slice(0, 3).map((section, idx) => {
              const sectionId = `section-${idx}`
              const isExpanded = expandedSections[sectionId]
              const title = section.split('\n')[0].trim()

              return (
                <div key={sectionId} className="border-b border-slate-700 last:border-b-0">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="font-semibold text-sm text-slate-200">{title}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 py-3 bg-slate-950 max-h-64 overflow-y-auto border-t border-slate-700">
                      <pre className="text-xs whitespace-pre-wrap break-words text-slate-300">
                        {section}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}

            {sections.length > 3 && (
              <div className="text-center text-slate-500 text-xs py-3 border-t border-slate-700">
                ... and {sections.length - 3} more sections
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="space-y-4">
        {/* Prerequisites */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Before Running the Script:</p>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                <li>Run PowerShell as Administrator on the target server</li>
                <li>Review and verify all script contents</li>
                <li>Update placeholder values (passwords, certificates, IP addresses)</li>
                <li>Ensure all URLs are accessible from the server</li>
                <li>Have your SSL certificate ready (.pfx file)</li>
                <li>Ensure sufficient disk space for installations</li>
                <li>Backup current configurations before running</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Step-by-Step Execution:</p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                <li>Download the script using the button above</li>
                <li>Transfer the file to your Windows Server</li>
                <li>Open PowerShell as Administrator</li>
                <li>
                  Run this command first:
                  <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded mt-2 font-mono text-xs text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-blue-800">
                    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
                  </div>
                </li>
                <li>
                  Then execute the script:
                  <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded mt-2 font-mono text-xs text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-blue-800">
                    .\\{client.name.replace(/\s+/g, '_')}_setup.ps1
                  </div>
                </li>
                <li>Monitor the console output for progress and any errors</li>
                <li>Allow the script to complete - some steps may take several minutes</li>
                <li>Restart the server when the script indicates it's necessary</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Success Criteria */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100 mb-2">Verify Installation Success:</p>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                <li>No error messages in the PowerShell output</li>
                <li>IIS Manager shows new website and application pool</li>
                <li>All required Windows features appear in Control Panel</li>
                <li>Services are running (IIS, MongoDB, RabbitMQ, SQL Server)</li>
                <li>URLs respond without SSL warnings (with installed certificates)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
