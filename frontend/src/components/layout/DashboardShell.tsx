"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuToggle={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
