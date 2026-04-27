"use client"

import { motion } from "framer-motion"
import { MapPin, Users, UserCheck, Clock } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import type { Team, TeamStatus, TeamType } from "@/lib/types"

const STATUS_STYLES: Record<TeamStatus, { badge: string; dot: string; label: string }> = {
  available: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400", label: "Available" },
  assigned: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/25", dot: "bg-amber-400 animate-pulse", label: "Assigned" },
  busy: { badge: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400 animate-pulse", label: "Busy" },
  offline: { badge: "bg-secondary text-muted-foreground border-border", dot: "bg-muted-foreground", label: "Offline" },
}

const TYPE_LABELS: Record<TeamType, string> = {
  medical: "Medical",
  fire: "Fire & Rescue",
  search_rescue: "Search & Rescue",
  logistics: "Logistics",
  hazmat: "HazMat",
}

const TYPE_COLORS: Record<TeamType, string> = {
  medical: "text-blue-400",
  fire: "text-orange-400",
  search_rescue: "text-amber-400",
  logistics: "text-purple-400",
  hazmat: "text-red-400",
}

interface TeamCardProps {
  team: Team
  index: number
}

export default function TeamCard({ team, index }: TeamCardProps) {
  const status = STATUS_STYLES[team.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="bg-card border border-border rounded-lg p-4 hover:border-border/80 hover:bg-card/80 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
          <p className={cn("text-xs font-medium mt-0.5", TYPE_COLORS[team.type])}>
            {TYPE_LABELS[team.type]}
          </p>
        </div>
        <span className={cn("flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border uppercase", status.badge)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{team.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users size={11} className="shrink-0" />
          <span>{team.members} members</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserCheck size={11} className="shrink-0" />
          <span className="truncate">{team.lead}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={11} className="shrink-0" />
          <span className="tabular-nums">{formatDate(team.lastUpdate)}</span>
        </div>
      </div>

      {/* Assigned incident */}
      {team.assignedIncidentId && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Assigned Incident</p>
          <p className="text-xs font-mono text-amber-400 mt-0.5">{team.assignedIncidentId}</p>
        </div>
      )}
    </motion.div>
  )
}
