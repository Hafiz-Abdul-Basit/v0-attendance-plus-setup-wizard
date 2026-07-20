/**
 * Re-exports the menu types from the SWR hook so consumers can do
 * `import type { MenuItem, MenuDoc } from "@/components/app-menu/types"`
 * without reaching into the hooks directory.
 */
export type { MenuItem, MenuDoc, ActiveMenu } from "@/hooks/use-app-menu"
