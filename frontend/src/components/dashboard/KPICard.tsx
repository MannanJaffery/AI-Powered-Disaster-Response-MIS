"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: { value: number; label: string }
  accent?: "red" | "amber" | "emerald" | "blue" | "purple"
  pulse?: boolean
}

const ACCENT_STYLES = {
  red: { bg: "bg-red-500/10", border: "border-red-500/20", icon: "text-red-400", badge: "bg-red-500/15 text-red-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400", badge: "bg-amber-500/15 text-amber-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400", badge: "bg-blue-500/15 text-blue-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", badge: "bg-purple-500/15 text-purple-400" },
}

export default function KPICard({ title, value, subtitle, icon, trend, accent = "blue", pulse = false }: KPICardProps) {
  const styles = ACCENT_STYLES[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("relative bg-card backdrop-blur-sm rounded-2xl border p-4 overflow-hidden hover:shadow-md transition-shadow", styles.border)}
    >
      {/* Subtle background glow */}
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -translate-y-6 translate-x-6", styles.bg)} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
            {pulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-1", trend.value >= 0 ? "text-red-400" : "text-emerald-400")}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>

        <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg border shrink-0", styles.bg, styles.border)}>
          <span className={styles.icon}>{icon}</span>
        </div>
      </div>
    </motion.div>
  )
}
