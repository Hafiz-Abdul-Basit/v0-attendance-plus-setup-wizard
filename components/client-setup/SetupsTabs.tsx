'use client'

import { useState } from 'react'
import { TruancyConfigurationEditor } from './TruancyConfigurationEditor'
import { ComponentConfigurationViewer } from './ComponentConfigurationViewer'

export function SetupsTabs() {
  const [activeTab, setActiveTab] = useState('component')

  const tabs = [
    { id: 'component', label: 'Component Configuration' },
    { id: 'truancy', label: 'Truancy Configuration' },
    { id: 'setup', label: 'Setup Configuration' },
  ]

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-950">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {/* Component Configuration */}
        {activeTab === 'component' && (
          <div className="w-full h-full">
            <ComponentConfigurationViewer />
          </div>
        )}

        {/* Truancy Configuration */}
        {activeTab === 'truancy' && (
          <div className="w-full h-full">
            <TruancyConfigurationEditor />
          </div>
        )}

        {/* Setup Configuration */}
        {activeTab === 'setup' && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-lg font-semibold">Setup Configuration</p>
            <p className="text-sm mt-2">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
