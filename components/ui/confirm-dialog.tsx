"use client"

/**
 * ConfirmDialog — generic confirmation dialog built on the project's
 * existing Radix `dialog.tsx` primitives.
 *
 * Replace ad-hoc `window.confirm()` calls with a styled, non-blocking
 * dialog that matches the rest of the UI. Supports:
 *  - destructive styling (red confirm button via Button's `destructive` variant)
 *  - a `busy` flag that swaps the confirm label for a spinner while the
 *    parent action is in flight (so the user can't double-fire)
 *  - controlled open state lifted to the parent (so the parent can show
 *    the dialog conditionally per-row)
 *
 * Pair with `useState<RowType | null>(null)` in the consumer:
 *   const [pending, setPending] = useState<UserRow | null>(null)
 *   <Button onClick={() => setPending(user)}>Delete</Button>
 *   <ConfirmDialog
 *     open={pending !== null}
 *     onOpenChange={(o) => { if (!o) setPending(null) }}
 *     title={`Delete ${pending?.email}?`}
 *     destructive
 *     onConfirm={async () => { await doDelete(pending); setPending(null) }}
 *   />
 */
import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Red destructive confirm button. */
  destructive?: boolean
  /** Disables the confirm button and shows a spinner. */
  busy?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">{description}</div>
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
