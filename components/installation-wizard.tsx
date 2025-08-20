"use client"

import type React from "react"
import { useState } from "react"

const InstallationWizard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"setup" | "snippets" | "guides">("snippets")

  // ** rest of code here **/

  return <div>{/* Wizard UI components */}</div>
}

export default InstallationWizard
