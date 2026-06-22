'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export function ComponentConfigurationViewer() {
  const handleExport = () => {
    toast.info('Component Configuration export feature coming soon')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Component Configuration
          </h3>
          <p className="text-slate-600 mb-6">
            Manage and configure system components for your clients
          </p>
          <Button onClick={handleExport} className="gap-2" disabled>
            <Download className="w-4 h-4" />
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  )
}
