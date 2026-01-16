"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function ESignSetupGuide() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F7") {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">E-Sign Setup Guide</h1>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Step 1: IIS Configuration */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: IIS Configuration</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Site 1: SecureDoc</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>
                    <strong>URL:</strong> example
                  </li>
                  <li>
                    <strong>Port:</strong> 443
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Site 2: eSignature</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>
                    <strong>Host:</strong> Main URL
                  </li>
                  <li>
                    <strong>Port:</strong> 6001
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Step 2: File System Setup */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2: File System Setup</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Root Folder:</strong> EsignatureSuite
              </p>
              <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm text-gray-600 space-y-1">
                <div>EsignatureSuite/</div>
                <div className="ml-4">├── ChatAttachments/</div>
                <div className="ml-8">└── [ClientAbbrev]/</div>
                <div className="ml-4">├── PDFSignDocuments/</div>
                <div className="ml-8">└── [ClientAbbrev]/</div>
                <div className="ml-4">├── PDFSignWordDocument/</div>
                <div className="ml-8">└── [ClientAbbrev]/</div>
                <div className="ml-4">├── SecurePDFOutBox/</div>
                <div className="ml-8">└── [ClientAbbrev]/</div>
                <div className="ml-4">└── SecureWordDocumentOutBox/</div>
                <div className="ml-8">└── [ClientAbbrev]/</div>
              </div>
              <p className="text-xs text-gray-600 mt-3 italic">
                Note: Replace [ClientAbbrev] with client abbreviation (e.g., DISDTX)
              </p>
            </div>
          </section>

          {/* Step 3: Database */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 3: Database Setup</h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Required Database:</strong> ESIGNATURE
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Create a dedicated database named "ESIGNATURE" for all e-signature operations.
              </p>
            </div>
          </section>

          {/* Step 4: App Settings */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 4: App Settings (JSON)</h2>
            <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
              <pre className="font-mono text-xs text-gray-700">{`{
  "EsignConfig": {
    "JwtConfigIssuer": "your-issuer",
    "JwtConfigSecret": "your-secret-key",
    "eSignBaseURL": "https://yourdomain.com",
    "ClientAbbrev": "DISDTX"
  }
}`}</pre>
            </div>
            <p className="text-xs text-red-600 mt-2 font-semibold">
              ⚠️ Important: Update client-specific secret, Key, and IV values before deployment.
            </p>
          </section>

          {/* Step 5: Utility Pathing */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 5: Utility Pathing</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">SECUREDOC Utility:</p>
                <p className="text-xs text-gray-600">
                  Update URLs and file paths to match your deployment environment.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">ESIGNATURE Utility:</p>
                <p className="text-xs text-gray-600">
                  Update URLs and file paths to match your deployment environment.
                </p>
              </div>
            </div>
          </section>

          {/* Step 6: SendLetterQConsumer Project */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 6: SendLetterQConsumer Project</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Folder Requirements:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• HTMLBodyTemplates</li>
                  <li>• HTMLTextBodyTemplates</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2 italic">Files must match ActionType names</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Configuration:</h3>
                <div className="bg-white p-3 rounded border border-gray-200 font-mono text-xs text-gray-600 space-y-1">
                  <div>
                    <strong>ActionTypes:</strong>
                  </div>
                  <div className="ml-2">• wl1, wl, wl2</div>
                  <div className="ml-2">• cal, eal</div>
                  <div className="ml-2">• dawl</div>
                  <div className="ml-2">• locwl, locpp</div>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t pt-6">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 rounded">F7</kbd> to toggle this guide
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
