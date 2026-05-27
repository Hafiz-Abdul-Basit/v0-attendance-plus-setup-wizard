'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Globe } from 'lucide-react'

interface ClientFormProps {
  initialName?: string
  initialMainUrl?: string
  initialGatewayUrl?: string
  initialDocsUrl?: string
  onSubmit: (data: {
    name: string
    mainUrl: string
    gatewayUrl: string
    docsUrl: string
  }) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function ClientForm({
  initialName = '',
  initialMainUrl = '',
  initialGatewayUrl = '',
  initialDocsUrl = '',
  onSubmit,
  onCancel,
  isLoading = false,
}: ClientFormProps) {
  const [name, setName] = useState(initialName)
  const [mainUrl, setMainUrl] = useState(initialMainUrl)
  const [gatewayUrl, setGatewayUrl] = useState(initialGatewayUrl)
  const [docsUrl, setDocsUrl] = useState(initialDocsUrl)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Client name is required'
    }
    if (!mainUrl.trim()) {
      newErrors.mainUrl = 'Main URL is required'
    } else if (!isValidUrl(mainUrl)) {
      newErrors.mainUrl = 'Please enter a valid URL'
    }
    if (!gatewayUrl.trim()) {
      newErrors.gatewayUrl = 'Gateway URL is required'
    } else if (!isValidUrl(gatewayUrl)) {
      newErrors.gatewayUrl = 'Please enter a valid URL'
    }
    if (!docsUrl.trim()) {
      newErrors.docsUrl = 'Docs URL is required'
    } else if (!isValidUrl(docsUrl)) {
      newErrors.docsUrl = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        name: name.trim(),
        mainUrl: mainUrl.trim(),
        gatewayUrl: gatewayUrl.trim(),
        docsUrl: docsUrl.trim(),
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Add New Client</h1>
          <p className="text-slate-600 dark:text-slate-400">Configure your client's deployment URLs</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 space-y-6">
          
          {/* Client Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Client Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme School District"
              disabled={isLoading}
              className={`h-11 text-base border-2 transition-colors ${
                errors.name
                  ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
            />
            {errors.name && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              The display name for this client in your dashboard
            </p>
          </div>

          {/* Main URL Field */}
          <div>
            <label htmlFor="mainUrl" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Main Application URL
            </label>
            <div className="relative">
              <Input
                id="mainUrl"
                type="text"
                value={mainUrl}
                onChange={(e) => setMainUrl(e.target.value)}
                placeholder="e.g., acme.raaweek12.com or https://acme.raaweek12.com"
                disabled={isLoading}
                className={`h-11 text-base border-2 transition-colors ${
                  errors.mainUrl
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                    : mainUrl && !errors.mainUrl
                    ? 'border-green-300 dark:border-green-700 focus:ring-green-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {mainUrl && !errors.mainUrl && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.mainUrl && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.mainUrl}</p>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Primary application endpoint
            </p>
          </div>

          {/* Gateway URL Field */}
          <div>
            <label htmlFor="gatewayUrl" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              API Gateway URL
            </label>
            <div className="relative">
              <Input
                id="gatewayUrl"
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                placeholder="e.g., apigateway.acme.raaweek12.com"
                disabled={isLoading}
                className={`h-11 text-base border-2 transition-colors ${
                  errors.gatewayUrl
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                    : gatewayUrl && !errors.gatewayUrl
                    ? 'border-green-300 dark:border-green-700 focus:ring-green-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {gatewayUrl && !errors.gatewayUrl && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.gatewayUrl && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.gatewayUrl}</p>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              API gateway or backend service endpoint
            </p>
          </div>

          {/* Docs URL Field */}
          <div>
            <label htmlFor="docsUrl" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              SecureDoc / Docs URL
            </label>
            <div className="relative">
              <Input
                id="docsUrl"
                type="text"
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
                placeholder="e.g., acmedocs.raaweek12.com or securedoc.acme.com"
                disabled={isLoading}
                className={`h-11 text-base border-2 transition-colors ${
                  errors.docsUrl
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                    : docsUrl && !errors.docsUrl
                    ? 'border-green-300 dark:border-green-700 focus:ring-green-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {docsUrl && !errors.docsUrl && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.docsUrl && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.docsUrl}</p>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Document management or SecureDoc service endpoint
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Create Client'
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 h-11 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-base rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-semibold">Need help?</span> Make sure all URLs are accessible from your server and include the protocol (http:// or https://)
          </p>
        </div>
      </div>
    </div>
  )
}
