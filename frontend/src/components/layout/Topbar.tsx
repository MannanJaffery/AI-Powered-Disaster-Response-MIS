"use client"

import { Bell, Menu, LogOut, User, ChevronDown } from "lucide-react"
import { useRole } from "@/context/RoleContext"
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
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "operator", label: "Emergency Operator" },
  { value: "field_officer", label: "Field Officer" },
  { value: "warehouse_manager", label: "Warehouse Manager" },
  { value: "finance", label: "Finance Officer" },
]

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-red-500/15 text-red-400 border-red-500/20",
  operator: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  field_officer: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  warehouse_manager: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  finance: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
}

interface TopbarProps {
  onMenuToggle: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { currentRole, setCurrentRole } = useRole()
  const currentRoleLabel = ROLES.find((r) => r.value === currentRole)?.label ?? currentRole

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card shrink-0">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Menu size={18} />
        </button>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
          DRMS — Command Center
        </span>
      </div>

      {/* Right: alerts + role switcher + user */}
      <div className="flex items-center gap-2">
        {/* Alert bell */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </Button>

        {/* Role switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${ROLE_COLORS[currentRole]}`}>
              {currentRoleLabel}
              <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-popover border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            {ROLES.map((role) => (
              <DropdownMenuItem
                key={role.value}
                onClick={() => setCurrentRole(role.value)}
                className={`text-xs cursor-pointer ${currentRole === role.value ? "bg-accent" : ""}`}
              >
                {role.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <User size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-popover border-border">
            <DropdownMenuLabel className="text-xs">
              <p className="font-medium text-foreground">Admin User</p>
              <p className="text-muted-foreground font-normal">admin@drms.gov</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild>
              <Link href="/login" className="flex items-center gap-2 text-xs text-destructive cursor-pointer">
                <LogOut size={13} />
                Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
