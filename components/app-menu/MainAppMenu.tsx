"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileJson,
  LayoutGrid,
  Menu,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAppMenu, type ActiveMenu, type MenuItem } from "@/hooks/use-app-menu"
import { MenuTree } from "./MenuTree"
import { MenuNavbar } from "./MenuNavbar"
import { MenuUploader } from "./MenuUploader"
import { MenuViewSwitcher, type MenuView } from "./MenuViewSwitcher"
import {
  MenuRowEditor,
  draftFromItem,
  parseClaims,
  type MenuRowDraft,
} from "./MenuRowEditor"

function formatRelative(input?: string | Date | null): string {
  if (!input) return ""
  const d = typeof input === "string" ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ""
  const diffMs = d.getTime() - Date.now()
  const absSec = Math.round(Math.abs(diffMs) / 1000)
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), "second")
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60_000), "minute")
  if (absSec < 86_400) return rtf.format(Math.round(diffMs / 3_600_000), "hour")
  if (absSec < 604_800) return rtf.format(Math.round(diffMs / 86_400_000), "day")
  return rtf.format(Math.round(diffMs / 604_800_000), "week")
}

function countItems(items: MenuItem[]): number {
  let n = 0
  const walk = (xs: MenuItem[]) => {
    for (const x of xs) {
      n++
      if (x.Children && x.Children.length > 0) walk(x.Children)
    }
  }
  walk(items)
  return n
}

type PathOp = (
  item: MenuItem | null,
  parentChildren: MenuItem[] | null,
  indexInParent: number,
) => MenuItem | MenuItem[] | null

function updateByKeyPath(
  items: MenuItem[],
  keyPath: string,
  op: PathOp,
): MenuItem[] {
  const segments = keyPath.split("/").map((s) => parseInt(s, 10))
  if (segments.some((n) => Number.isNaN(n))) return items
  const clone = (xs: MenuItem[]): MenuItem[] =>
    xs.map((x) => ({ ...x, Children: x.Children ? clone(x.Children) : undefined }))
  const next = clone(items)
  let cur: MenuItem[] = next
  for (let i = 0; i < segments.length; i++) {
    const idx = segments[i]
    if (idx < 0 || idx >= cur.length) return items
    if (i === segments.length - 1) {
      const result = op(cur[idx], cur, idx)
      if (result === null) {
        cur.splice(idx, 1)
      } else if (Array.isArray(result)) {
        cur.splice(idx, 1, ...result)
      } else {
        cur[idx] = result
      }
      return next
    }
    cur = cur[idx].Children ?? []
  }
  return next
}

function applyDraftToItem(item: MenuItem, draft: MenuRowDraft): MenuItem {
  return {
    ...item,
    Name: draft.Name.trim(),
    DisplayName: draft.DisplayName.trim() || null,
    routerLink: draft.routerLink.trim() || null,
    Claims: parseClaims(draft.ClaimsText),
    Count: draft.CountText.trim()
      ? /^\d+$/.test(draft.CountText.trim())
        ? Number(draft.CountText.trim())
        : draft.CountText.trim()
      : null,
  }
}

function newItemFromDraft(draft: MenuRowDraft): MenuItem {
  return {
    Name: draft.Name.trim(),
    DisplayName: draft.DisplayName.trim() || null,
    routerLink: draft.routerLink.trim() || null,
    Claims: parseClaims(draft.ClaimsText),
    Count: draft.CountText.trim()
      ? /^\d+$/.test(draft.CountText.trim())
        ? Number(draft.CountText.trim())
        : draft.CountText.trim()
      : null,
    Children: [],
  }
}

function menuFilename(menu: ActiveMenu | null, suffix = "menu"): string {
  const base = (menu?.name ?? suffix)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const stamp = new Date().toISOString().slice(0, 10)
  return `${base || suffix}-${stamp}.json`
}

function buildMenuPayloadString(
  menuJson: unknown,
  draftItems: MenuItem[] | null,
): string {
  const payload = {
    ...((menuJson as Record<string, unknown>) ?? {}),
    MenuItems: draftItems ?? [],
  }
  return JSON.stringify(payload, null, 2)
}

export function MainAppMenu() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"
  const canSee = isAdmin || Boolean(session?.user?.canSeeAppMenu)
  const { menu, isLoading, saveJson, refresh } = useAppMenu()
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [view, setView] = React.useState<MenuView>("tree")
  const [jsonPreviewOpen, setJsonPreviewOpen] = React.useState(false)

  const [editingKeyPath, setEditingKeyPath] = React.useState<string | null>(null)
  const [addingUnder, setAddingUnder] = React.useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  const [draftItems, setDraftItems] = React.useState<MenuItem[] | null>(null)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setDraftItems(menu?.json?.MenuItems ?? null)
    setHydrated(true)
  }, [menu?.id])

  const items = (hydrated ? draftItems : menu?.json?.MenuItems) ?? []
  const total = React.useMemo(() => countItems(items), [items])

  const previewJsonText = React.useMemo(
    () => buildMenuPayloadString(menu?.json, draftItems),
    [items, menu?.json, draftItems],
  )

  const [dirty, setDirty] = React.useState(false)
  React.useEffect(() => { setDirty(false) }, [menu?.id])
  const markDirty = React.useCallback(() => setDirty(true), [])

  const applyEdit = (keyPath: string, draft: MenuRowDraft) => {
    setDraftItems((cur) => {
      if (!cur) return cur
      return updateByKeyPath(cur, keyPath, (item) =>
        item ? applyDraftToItem(item, draft) : null,
      )
    })
    setEditingKeyPath(null)
    markDirty()
  }
  const applyAdd = (parentKeyPath: string, draft: MenuRowDraft) => {
    const newItem = newItemFromDraft(draft)
    setDraftItems((cur) => {
      if (!cur) return cur
      if (parentKeyPath === "") return [...cur, newItem]
      return updateByKeyPath(cur, parentKeyPath, (item) =>
        item ? { ...item, Children: [...(item.Children ?? []), newItem] } : null,
      )
    })
    setAddingUnder(null)
    markDirty()
  }
  const applyDelete = (keyPath: string) => {
    setDraftItems((cur) => {
      if (!cur) return cur
      return updateByKeyPath(cur, keyPath, () => null)
    })
    setPendingDelete(null)
    markDirty()
  }

  const revertDraft = () => {
    setDraftItems(menu?.json?.MenuItems ?? null)
    setDirty(false)
    toast.success("Reverted local changes")
  }

  const applyToServer = async () => {
    if (!menu) return
    setSaving(true)
    try {
      await saveJson({ ...menu.json, MenuItems: draftItems ?? [] })
      setDirty(false)
      toast.success("Changes applied to database")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const downloadJson = () => {
    const text = previewJsonText
    const blob = new Blob([text], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = menuFilename(menu, "app-menu")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Menu JSON downloaded")
  }

  const copyJson = async () => {
    const text = previewJsonText
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Menu JSON copied to clipboard")
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand("copy")
        toast.success("Menu JSON copied to clipboard")
      } catch {
        toast.error("Could not copy — use Download instead")
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  const onEdit = (keyPath: string) => {
    setEditingKeyPath(keyPath)
    setAddingUnder(null)
  }
  const onDelete = (keyPath: string) => {
    setPendingDelete(keyPath)
  }
  const onAddChild = (parentKeyPath: string) => {
    setAddingUnder(parentKeyPath)
    setEditingKeyPath(null)
  }
  const onAddTopLevel = () => {
    setAddingUnder("")
    setEditingKeyPath(null)
  }

  const pendingDeleteItem = pendingDelete
    ? resolveItem(items, pendingDelete)
    : null
  const pendingDeleteLabel = pendingDeleteItem
    ? pendingDeleteItem.DisplayName || pendingDeleteItem.Name
    : ""

  if (!canSee) {
    return (
      <div className="w-full min-w-0 px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <FileJson className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Main App Menu is restricted
          </h2>
          <p className="text-sm text-gray-600">
            Your admin has not granted access to the Main App Menu. Ask them
            to enable it from the Admin Panel &rarr; Users tab.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 px-6 py-6">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg flex-shrink-0">
            <FileJson className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                Main App Menu
              </h1>
              {dirty && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  title="You have local changes that haven't been applied to the database"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600 mt-0.5">
              {menu ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 font-semibold">
                    <FileJson className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[260px]" title={menu.name}>
                      {menu.name}
                    </span>
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Updated {formatRelative(menu.updated_at)}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="inline-flex items-center gap-1">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {total} item{total !== 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">No menu uploaded</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {menu && (
            <MenuViewSwitcher
              value={view}
              onChange={setView}
              options={[
                { value: "tree", label: "Tree", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                { value: "navbar", label: "Navbar preview", icon: <Menu className="w-3.5 h-3.5" /> },
              ]}
            />
          )}
          {menu && (
            <Button
              onClick={copyJson}
              disabled={saving}
              variant="outline"
              className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Copy className="w-4 h-4" />
              Copy JSON
            </Button>
          )}
          {menu && (
            <Button
              onClick={downloadJson}
              disabled={saving}
              variant="outline"
              className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={() => setUploadOpen(true)}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
              disabled={saving}
            >
              <Upload className="w-4 h-4" />
              Upload new menu
            </Button>
          )}
        </div>
      </div>

      {/* Sticky apply bar */}
      {isAdmin && menu && dirty && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-sm text-amber-900 flex-1 min-w-0">
            <span className="font-semibold">You have local changes.</span>{" "}
            <span className="text-amber-800/80">
              Apply to save them to the database, or Download / Copy the JSON.
            </span>
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={revertDraft}
            disabled={saving}
            className="h-8 text-xs gap-1 border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            Revert
          </Button>
          <Button
            size="sm"
            onClick={applyToServer}
            disabled={saving}
            className="h-8 text-xs gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
          >
            {saving ? (
              "Applying…"
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Apply to database
              </>
            )}
          </Button>
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <MenuSkeleton />
      ) : !menu ? (
        <EmptyState isAdmin={isAdmin} onUpload={() => setUploadOpen(true)} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800 text-center">
          The active menu has no <code className="font-mono">MenuItems</code> array,
          or the array is empty.
        </div>
      ) : view === "tree" ? (
        <div className="space-y-3">
          <MenuTree
            items={items}
            onEdit={isAdmin ? onEdit : undefined}
            onDelete={isAdmin ? onDelete : undefined}
            onAddChild={isAdmin ? onAddChild : undefined}
            onAddTopLevel={isAdmin ? onAddTopLevel : undefined}
            onDownloadJson={canSee ? downloadJson : undefined}
            onCopyJson={canSee ? copyJson : undefined}
          />
          {!isAdmin && (
            <p className="text-xs text-gray-500 px-1">
              You can browse and export this menu (Copy / Download JSON). Ask an
              admin if you need to change items in the database.
            </p>
          )}
        </div>
      ) : (
        /* 
         * NAVBAR PREVIEW — CRITICAL: no overflow-hidden here!
         * The dropdown portals escape to document.body, but the navbar
         * itself must not be clipped by any ancestor container.
         */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Live preview of your current {dirty ? "draft" : "menu"}. Switch to the Tree tab to edit.
            </span>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setJsonPreviewOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
              aria-expanded={jsonPreviewOpen}
              aria-controls="menu-json-preview"
            >
              {jsonPreviewOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <FileJson className="w-3.5 h-3.5" />
              {jsonPreviewOpen ? "Hide JSON" : "Preview JSON"}
            </button>
          </div>

          {/* 
            KEY FIX: The navbar preview is wrapped in a container that
            does NOT use overflow-hidden. The dropdowns use fixed
            positioning portaled to document.body, so they naturally
            escape this container. We add a subtle border and shadow
            to make it look like a real navbar in a page.
          */}
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
            <MenuNavbar items={items} brand={menu.name} />
          </div>

          {jsonPreviewOpen && (
            <div
              id="menu-json-preview"
              className="rounded-2xl border border-indigo-200/70 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/60">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FileJson className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold text-gray-800">Menu JSON</span>
                  <span className="text-gray-400">·</span>
                  <span>
                    This is exactly what <span className="font-semibold">Copy JSON</span> and{" "}
                    <span className="font-semibold">Download JSON</span> produce — it updates
                    live as you edit the tree.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyJson}
                    disabled={saving}
                    className="h-7 text-[11px] gap-1 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadJson}
                    disabled={saving}
                    className="h-7 text-[11px] gap-1 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </div>
              <pre
                className="m-0 max-h-[420px] overflow-auto bg-slate-950 text-slate-100 text-[12px] leading-relaxed p-4 font-mono"
                aria-label="Live menu JSON preview"
              >
                <code>{previewJsonText}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {isAdmin && (editingKeyPath || addingUnder !== null) && (
        <div className="mt-4 rounded-xl border-2 border-indigo-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {editingKeyPath ? "Edit item" : "Add new item"}
          </h3>
          <MenuRowEditor
            mode={editingKeyPath ? "edit" : "create"}
            initial={
              editingKeyPath
                ? draftFromItem(resolveItem(items, editingKeyPath))
                : undefined
            }
            onSave={(draft) => {
              if (editingKeyPath) return applyEdit(editingKeyPath, draft)
              if (addingUnder !== null) return applyAdd(addingUnder, draft)
            }}
            onCancel={() => {
              setEditingKeyPath(null)
              setAddingUnder(null)
            }}
          />
        </div>
      )}

      {isAdmin && pendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete this item?</h3>
                <p className="text-sm text-gray-600">
                  "{pendingDeleteLabel}" and all its children will be removed.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingDelete(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => applyDelete(pendingDelete)}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <MenuUploader
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploaded={() => {
            toast.success("Refreshing menu…")
            refresh()
          }}
        />
      )}
    </div>
  )
}

function resolveItem(items: MenuItem[], keyPath: string): MenuItem | null {
  const segments = keyPath.split("/").map((s) => parseInt(s, 10))
  if (segments.some((n) => Number.isNaN(n))) return null
  let cur: MenuItem | undefined = items[segments[0]]
  for (let i = 1; i < segments.length; i++) {
    if (!cur) return null
    cur = cur.Children?.[segments[i]]
  }
  return cur ?? null
}

function MenuSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="rounded-xl border border-gray-200 bg-white p-3 h-14 animate-pulse" />
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-2"
            style={{ paddingLeft: `${(i % 3) * 24 + 12}px` }}
          >
            <div className="h-4 w-4 rounded bg-gray-100 animate-pulse" />
            <div className="h-7 w-7 rounded-md bg-indigo-100 animate-pulse" />
            <div
              className="h-3 rounded bg-gray-100 animate-pulse"
              style={{ width: `${40 + ((i * 17) % 30)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({
  isAdmin,
  onUpload,
}: {
  isAdmin: boolean
  onUpload: () => void
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-4">
        <FileJson className="w-7 h-7 text-indigo-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">No menu uploaded yet</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto">
        {isAdmin
          ? "Upload a NextPremium menu JSON to get started. The previous active menu (if any) will be archived."
          : "An admin has not uploaded a menu yet. Check back later."}
      </p>
      {isAdmin && (
        <Button
          onClick={onUpload}
          className="mt-4 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
        >
          <Upload className="w-4 h-4" />
          Upload the first menu
        </Button>
      )}
    </div>
  )
}

export type { ActiveMenu }