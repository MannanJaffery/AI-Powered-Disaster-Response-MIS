"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardShell from "@/components/layout/DashboardShell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("drms_token") : null
    if (!token) {
      router.replace("/auth")
    }
  }, [router])

  return <DashboardShell>{children}</DashboardShell>
}
