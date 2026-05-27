'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, ChevronDown, ChevronUp } from 'lucide-react'
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
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{client.name}</h2>
            <p className="text-sm text-muted-foreground">
              PowerShell Setup Script
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={copyToClipboard} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
          <Button onClick={downloadScript}>
            <Download className="w-4 h-4 mr-2" />
            Download .ps1
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
        {sections.slice(0, 3).map((section, idx) => {
          const sectionId = `section-${idx}`
          const isExpanded = expandedSections[sectionId]
          const title = section.split('\n')[0].trim()

          return (
            <div key={sectionId} className="border rounded">
              <button
                onClick={() => toggleSection(sectionId)}
                className="w-full p-2 flex items-center justify-between hover:bg-accent transition-colors"
              >
                <span className="font-semibold">{title}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {isExpanded && (
                <div className="p-2 border-t bg-background max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {section}
                  </pre>
                </div>
              )}
            </div>
          )
        })}

        {sections.length > 3 && (
          <div className="text-center text-muted-foreground text-xs py-2">
            ... and {sections.length - 3} more sections
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
        <p className="font-semibold text-yellow-900 mb-1">Before Running:</p>
        <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
          <li>Run PowerShell as Administrator</li>
          <li>Review the script contents</li>
          <li>Update any placeholder values (passwords, certificates)</li>
          <li>Ensure all required URLs are accessible</li>
          <li>Have the SSL certificate ready (.pfx file)</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <p className="font-semibold text-blue-900 mb-1">Instructions:</p>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Download the script and save to your server</li>
          <li>Open PowerShell as Administrator</li>
          <li>
            Run:{' '}
            <code className="bg-white px-1 rounded">
              Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
            </code>
          </li>
          <li>
            Execute the script:{' '}
            <code className="bg-white px-1 rounded">
              .\\{client.name.replace(/\s+/g, '_')}_setup.ps1
            </code>
          </li>
          <li>Monitor the output for any errors or warnings</li>
          <li>Restart the server when prompted</li>
        </ol>
      </div>
    </div>
  )
}
