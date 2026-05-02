"use client"

import type { ReactNode } from "react"
import { useAuth } from "./AuthContext"
import type { Role } from "@/lib/types"

interface RoleContextValue {
  currentRole: Role
  setCurrentRole: (role: Role) => void
}

export function RoleProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useRole(): RoleContextValue {
  const { uiRole, setUiRole } = useAuth()
  return { currentRole: uiRole, setCurrentRole: setUiRole }
}
