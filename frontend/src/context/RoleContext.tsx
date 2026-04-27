"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Role } from "@/lib/types"

interface RoleContextValue {
  currentRole: Role
  setCurrentRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("admin")
  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used inside RoleProvider")
  return ctx
}
