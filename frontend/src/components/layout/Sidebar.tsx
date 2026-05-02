"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Siren,
  Users,
  Package,
  Building2,
  DollarSign,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/context/RoleContext"
import type { Role } from "@/lib/types"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: Role[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["admin", "operator", "field_officer", "warehouse_manager", "finance"] },
  { label: "Emergencies", href: "/emergencies", icon: <Siren size={18} />, roles: ["admin", "operator"] },
  { label: "Teams", href: "/teams", icon: <Users size={18} />, roles: ["admin", "operator", "field_officer"] },
  { label: "Inventory", href: "/inventory", icon: <Package size={18} />, roles: ["admin", "warehouse_manager"] },
  { label: "Hospitals", href: "/teams#hospitals", icon: <Building2 size={18} />, roles: ["admin", "operator", "field_officer"] },
  { label: "Finance", href: "/finance", icon: <DollarSign size={18} />, roles: ["admin", "finance"] },
  { label: "Resources", href: "/resources", icon: <Layers size={18} />, roles: ["admin", "operator", "warehouse_manager"] },
  { label: "Analytics", href: "/analytics", icon: <Activity size={18} />, roles: ["admin", "operator", "finance"] },
  { label: "Audit Logs", href: "/audit", icon: <FileText size={18} />, roles: ["admin"] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { currentRole } = useRole()
  
  // 1. Add mounted state
  const [isMounted, setIsMounted] = useState(false)

  // 2. Set to true once the component has mounted on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const visible = navItems.filter((item) => item.roles.includes(currentRole))

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-card border-r border-border overflow-hidden shrink-0"
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-14 px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-red-500/20 border border-red-500/30 shrink-0">
            <Shield size={14} className="text-red-400" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="text-xs font-bold tracking-widest text-foreground uppercase whitespace-nowrap"
              >
                DRMS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {/* 3. Only render the role-filtered links IF the client has mounted */}
        {isMounted && visible.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href.split("#")[0]))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-all duration-150",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  )
}