'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, FileText, Terminal, Zap, Shield, Clock, Eye, EyeOff } from 'lucide-react'
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
  const [expandAllSections, setExpandAllSections] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

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

  const toggleExpandAll = () => {
    const newState = !expandAllSections
    setExpandAllSections(newState)
    
    const sections = script.split('# ===== ').filter((s) => s.trim())
    const newExpandedSections: Record<string, boolean> = {}
    
    sections.forEach((_, idx) => {
      newExpandedSections[`section-${idx}`] = newState
    })
    
    setExpandedSections(newExpandedSections)
  }

  const copySectionToClipboard = (sectionText: string, sectionName: string) => {
    navigator.clipboard.writeText(sectionText)
    setCopiedSection(sectionName)
    toast.success(`${sectionName} copied!`)
    setTimeout(() => setCopiedSection(null), 2000)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Complete Script Preview</h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
              {sections.length} sections
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleExpandAll}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {expandAllSections ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Expand All
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}
            >
              {showLineNumbers ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-black rounded-lg overflow-hidden border border-slate-700 dark:border-slate-800 shadow-lg">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <p className="text-xs text-slate-300 font-mono">PowerShell Setup Script - {client.name}</p>
            </div>
            <span className="text-xs text-slate-400">Lines: {script.split('\n').length}</span>
          </div>

          <div className="space-y-0 max-h-[600px] overflow-y-auto font-mono text-xs text-slate-300">
            {sections.map((section, idx) => {
              const sectionId = `section-${idx}`
              const isExpanded = expandedSections[sectionId]
              const title = section.split('\n')[0].trim()
              const lineCount = section.split('\n').length

              return (
                <div key={sectionId} className="border-b border-slate-700/50 last:border-b-0">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-sm text-slate-200 truncate">{title}</span>
                      <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded ml-auto flex-shrink-0">
                        {lineCount} lines
                      </span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="bg-slate-950/50 border-t border-slate-700/50">
                      <div className="px-4 py-3 max-h-80 overflow-y-auto">
                        <div className="flex items-start gap-4">
                          {showLineNumbers && (
                            <div className="text-slate-600 select-none flex-shrink-0">
                              {section.split('\n').map((_, lineIdx) => (
                                <div key={lineIdx} className="h-5 leading-5">
                                  {lineIdx + 1}
                                </div>
                              ))}
                            </div>
                          )}
                          <pre className="text-xs whitespace-pre-wrap break-words text-slate-300 flex-1">
                            {section}
                          </pre>
                          <Button
                            onClick={() => copySectionToClipboard(section, title)}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            title="Copy section"
                          >
                            <Copy className={`w-4 h-4 ${copiedSection === title ? 'text-green-500' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
          <Zap className="w-4 h-4" />
          <span>All {sections.length} installation sections are included. Expand each to view detailed commands.</span>
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

        {/* Advanced Features */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Advanced Deployment Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Execution Logging
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All script execution is logged to a file. Check the logs directory for detailed installation records.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Error Handling
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Script includes automatic error handling and will stop on critical failures to prevent partial installations.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                Configuration Backup
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Existing configurations are automatically backed up before modifications are made.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Health Checks
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Post-installation health checks verify all services are running and responsive.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Reference - Common Issues</h4>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-slate-900 dark:text-white">Script won't execute?</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Run: <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded text-slate-900 dark:text-slate-100">Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser</code></p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-900 dark:text-white">Script hangs?</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Wait 5-10 minutes for services to fully start. Check Event Viewer for errors if it still hangs.</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-900 dark:text-white">URLs not responding?</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Verify IIS is running, check Windows Firewall rules, and ensure bindings are correctly configured.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
