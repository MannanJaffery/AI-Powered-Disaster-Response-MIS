"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import api from "@/lib/api"
import { DB_ROLE_MAP } from "@/lib/transforms"
import type { Role } from "@/lib/types"

export interface AuthUser {
  email: string
  name: string
  dbRole: string
  role: Role
}

interface AuthCtx {
  user: AuthUser | null
  token: string | null
  uiRole: Role
  setUiRole: (role: Role) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

function loadFromStorage(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null }
  try {
    const token = localStorage.getItem("drms_token")
    const userStr = localStorage.getItem("drms_user")
    if (token && userStr) {
      return { token, user: JSON.parse(userStr) as AuthUser }
    }
  } catch {
    // corrupted storage
  }
  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage()
  const [user, setUser] = useState<AuthUser | null>(initial.user)
  const [token, setToken] = useState<string | null>(initial.token)
  const [uiRole, setUiRole] = useState<Role>(initial.user?.role ?? "admin")

  const login = useCallback(async (email: string, password: string) => {
    console.log("Login function entereed");
    const res = await api.post("/login", { email, password })
    console.log("Login function left");
    const data = res.data as {
      access_token: string
      user: { email: string; name: string; role: string }
    }
    const authUser: AuthUser = {
      email: data.user.email,
      name: data.user.name,
      dbRole: data.user.role,
      role: DB_ROLE_MAP[data.user.role] ?? "operator",
    }
    localStorage.setItem("drms_token", data.access_token)
    localStorage.setItem("drms_user", JSON.stringify(authUser))
    setToken(data.access_token)
    setUser(authUser)
    setUiRole(authUser.role)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("drms_token")
    localStorage.removeItem("drms_user")
    setToken(null)
    setUser(null)
    setUiRole("admin")
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, uiRole, setUiRole, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
