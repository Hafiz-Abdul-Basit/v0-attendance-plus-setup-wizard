'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState as useStateType } from 'react'

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Client Name</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Acme School District"
          className="mt-1"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Main URL</label>
        <Input
          type="text"
          value={mainUrl}
          onChange={(e) => setMainUrl(e.target.value)}
          placeholder="e.g., acme.raaweek12.com or https://acme.raaweek12.com"
          className="mt-1"
          disabled={isLoading}
        />
        {errors.mainUrl && (
          <p className="text-xs text-destructive mt-1">{errors.mainUrl}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Main application URL
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Gateway URL</label>
        <Input
          type="text"
          value={gatewayUrl}
          onChange={(e) => setGatewayUrl(e.target.value)}
          placeholder="e.g., apigatewyacme.raaweek12.com"
          className="mt-1"
          disabled={isLoading}
        />
        {errors.gatewayUrl && (
          <p className="text-xs text-destructive mt-1">{errors.gatewayUrl}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          API Gateway URL
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Docs/SecureDoc URL</label>
        <Input
          type="text"
          value={docsUrl}
          onChange={(e) => setDocsUrl(e.target.value)}
          placeholder="e.g., acmedocs.raaweek12.com"
          className="mt-1"
          disabled={isLoading}
        />
        {errors.docsUrl && (
          <p className="text-xs text-destructive mt-1">{errors.docsUrl}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          SecureDoc or documentation URL
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Client'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
