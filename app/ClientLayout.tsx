"use client"

import type React from "react"
import { ESignSetupGuide } from "@/components/esign-setup-guide"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ESignSetupGuide />
    </>
  )
}