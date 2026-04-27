"use client"

import { motion } from "framer-motion"
import { Phone, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { hospitals } from "@/lib/data"
import type { Hospital } from "@/lib/types"

function CapacityBar({ hospital }: { hospital: Hospital }) {
  const pct = Math.round(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100)
  const isCritical = pct >= 90
  const isWarning = pct >= 75

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("p-3.5 rounded-lg border transition-all", isCritical ? "border-red-500/30 bg-red-500/5" : "border-border bg-secondary/30")}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-foreground truncate">{hospital.name}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={9} className="text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">{hospital.location}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-lg font-bold tabular-nums leading-none", isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-foreground")}>
            {pct}%
          </p>
          <p className="text-[9px] text-muted-foreground">capacity</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={isCritical ? { animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" } : undefined}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1 text-center">
        <Stat label="Total" value={hospital.totalBeds} />
        <Stat label="Free" value={hospital.availableBeds} highlight={hospital.availableBeds < 20 ? "red" : undefined} />
        <Stat label="ICU" value={hospital.icuBeds} />
        <Stat label="ICU Free" value={hospital.availableIcuBeds} highlight={hospital.availableIcuBeds < 5 ? "red" : undefined} />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">{hospital.distanceKm} km away</span>
        <a href={`tel:${hospital.contact}`} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
          <Phone size={9} />
          {hospital.contact}
        </a>
      </div>
    </motion.div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: "red" }) {
  return (
    <div>
      <p className={cn("text-sm font-bold tabular-nums", highlight === "red" ? "text-red-400" : "text-foreground")}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  )
}

export default function HospitalPanel() {
  return (
    <div className="space-y-2.5">
      {hospitals.map((h) => (
        <CapacityBar key={h.id} hospital={h} />
      ))}
    </div>
  )
}
