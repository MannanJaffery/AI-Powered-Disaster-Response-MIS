"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, LogOut, User, Sun, Moon, Home } from "lucide-react"
import { useRole } from "@/context/RoleContext"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import type { Role } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "operator", label: "Emergency Operator" },
  { value: "field_officer", label: "Field Officer" },
  { value: "warehouse_manager", label: "Warehouse Manager" },
  { value: "finance", label: "Finance Officer" },
]

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  operator: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  field_officer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warehouse_manager: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  finance: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
}

interface TopbarProps {
  onMenuToggle: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { currentRole } = useRole()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const currentRoleLabel = ROLES.find((r) => r.value === currentRole)?.label ?? currentRole

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b border-border glass-strong shrink-0">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
        >
          <Menu size={18} />
        </button>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest hidden sm:block">
          Command Center
        </span>
      </div>

      {/* Right: theme + alerts + role switcher + user */}
      <div className="flex items-center gap-2 justify-end min-w-[200px]">
        {isMounted && (
          <>
            {/* Home link */}
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl">
                <Home size={16} />
              </Button>
            </Link>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            {/* Alert bell */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground rounded-xl">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </Button>

            {/* Role display */}
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border ${ROLE_COLORS[currentRole]}`}
            >
              {currentRoleLabel}
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-xl">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border rounded-xl">
                <DropdownMenuLabel className="text-xs">
                  <p className="font-medium text-foreground">{user?.name ?? "User"}</p>
                  <p className="text-muted-foreground font-normal truncate">{user?.email ?? ""}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs text-destructive cursor-pointer rounded-lg"
                >
                  <LogOut size={13} />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  )
}