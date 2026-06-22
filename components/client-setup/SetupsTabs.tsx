'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TruancyConfigurationEditor } from './TruancyConfigurationEditor'
import { ComponentConfigurationViewer } from './ComponentConfigurationViewer'

export function SetupsTabs() {
  const [activeTab, setActiveTab] = useState('truancy')

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
          <TabsTrigger value="component">Component Configuration</TabsTrigger>
          <TabsTrigger value="truancy">Truancy Configuration</TabsTrigger>
          <TabsTrigger value="setup">Setup Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="component" className="mt-6">
          <ComponentConfigurationViewer />
        </TabsContent>

        <TabsContent value="truancy" className="mt-6">
          <TruancyConfigurationEditor />
        </TabsContent>

        <TabsContent value="setup" className="mt-6">
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Setup Configuration coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
