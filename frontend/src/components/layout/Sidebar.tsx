"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  LogOut
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useRole } from "@/context/RoleContext"
import { useAuth } from "@/context/AuthContext"
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
  const { logout } = useAuth()
  const router = useRouter()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Safely check that currentRole exists before filtering to prevent crashes
  const visible = navItems.filter((item) => currentRole && item.roles.includes(currentRole))

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full glass-strong overflow-hidden shrink-0"
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl gradient-primary shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap"
              >
                DRMS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
        {isMounted && visible.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href.split("#")[0]))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "gradient-primary text-white font-medium shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
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

      {/* Logout & Collapse toggle */}
      <div className="border-t border-border p-2.5 shrink-0 space-y-1">
        <button
          onClick={() => {
            logout()
            // Router is safely called inside an event handler
            router.push("/auth")
          }}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl p-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title="Sign Out"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="truncate font-medium">Sign Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  )
}