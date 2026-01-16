"use client"

import type React from "react"
import { Toaster } from "@/components/ui/sonner"
import { ESignSetupGuide } from "@/components/esign-setup-guide"
import { ThemeProvider } from "@/components/theme-provider"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <>
        {children}
        <Toaster />
        <ESignSetupGuide />
      </>
    </ThemeProvider>
  )
}
