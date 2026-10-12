"use client"

/**
 * AzureTaskDeliveriesDialog — team-wide, read-only "when did each client
 * last get a pack?" list. Opened from an icon in the Azure Tasks header;
 * shows only client name + date (no user, no task count) with a search.
 * Each user's own history stays in the Export history tab.
 */

import * as React from "react"
import { History, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useClientDeliveries } from "@/hooks/use-azure-clients"

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? "1 month ago" : `${months} months ago`
}

export function AzureTaskDeliveriesDialog() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const { deliveries, error, isLoading } = useClientDeliveries(open)

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? deliveries.filter((d) => d.name.toLowerCase().includes(q)) : deliveries
  }, [deliveries, query])

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Last delivery per client"
        title="Last delivery per client (everyone)"
        className="h-9 w-9 shrink-0"
      >
        <History className="w-4 h-4" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setQuery("")
        }}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Last delivery per client
            </DialogTitle>
            <DialogDescription>
              When each client last got an Export Pack, from anyone on the team. Read-only.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients…"
                aria-label="Search clients"
                autoFocus
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
          <div className="max-h-[55vh] overflow-y-auto az-task-scroller border-t border-gray-100">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
              </div>
            ) : error ? (
              <div className="py-10 text-center text-sm text-red-600">{error}</div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                {deliveries.length === 0 ? "No packs have been exported yet." : "No clients match."}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {rows.map((d) => (
                  <li key={d.name} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                    <span className="font-medium text-gray-900 truncate">{d.name}</span>
                    <span className="text-right shrink-0">
                      <span className="block text-gray-800">{fmtDate(d.lastAt)}</span>
                      <span className="block text-[11px] text-gray-400">{ago(d.lastAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
