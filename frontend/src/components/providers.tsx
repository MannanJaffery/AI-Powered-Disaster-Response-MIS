"use client"

import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "sonner"
import type { ReactNode } from "react"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0d1526",
            border: "1px solid #1e293b",
            color: "#e2e8f0",
          },
        }}
      />
    </AuthProvider>
  )
}
