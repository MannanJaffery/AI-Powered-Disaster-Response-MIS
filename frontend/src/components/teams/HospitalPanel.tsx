"use client"

import { motion } from "framer-motion"
import { Phone, MapPin, UserCheck, AlertCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hospital } from "@/lib/types"
import { useAuth } from "@/context/AuthContext"
import UpdateCapacityModal from "@/components/teams/UpdateCapacityModal"
import AssignPatientForm from "@/components/teams/AssignPatientForm"

interface Props {
  hospitals: Hospital[]
  onRefresh?: () => void
}

function HospitalCard({ hospital, onRefresh, canManage }: { hospital: Hospital; onRefresh?: () => void; canManage: boolean }) {
  const occupied = hospital.totalBeds - hospital.availableBeds
  const pct = hospital.totalBeds > 0
    ? Math.round((occupied / hospital.totalBeds) * 100)
    : 0
  const isCritical = pct >= 90
  const isWarning  = pct >= 75

  const admitted  = hospital.admittedPatients ?? 0
  const critical  = hospital.criticalCases    ?? 0
  const serious   = hospital.seriousCases     ?? 0
  const hasPatientData = hospital.admittedPatients != null

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-3.5 rounded-lg border transition-all",
        isCritical ? "border-red-500/30 bg-red-500/5" : "border-border bg-secondary/30"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-foreground truncate">{hospital.name}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={9} className="text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">{hospital.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canManage && <UpdateCapacityModal hospital={hospital} onUpdated={onRefresh} />}
          <div className="text-right">
            <p className={cn("text-lg font-bold tabular-nums leading-none",
              isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-foreground"
            )}>
              {pct}%
            </p>
            <p className="text-[9px] text-muted-foreground">capacity</p>
          </div>
        </div>
      </div>

      {/* Capacity progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full",
            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
      </div>

      {/* Bed stats */}
      <div className="grid grid-cols-3 gap-1 text-center mb-3">
        <BedStat label="Total"     value={hospital.totalBeds} />
        <BedStat label="Available" value={hospital.availableBeds}
          highlight={hospital.availableBeds < 20 ? "red" : undefined} />
        <BedStat label="Occupied"  value={occupied} />
      </div>

      {/* Patient admission stats — shown when data comes from /api/hospitals/status */}
      {hasPatientData && (
        <div className="pt-2.5 border-t border-border/50">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Activity size={9} />
            Live Patient Status
          </p>
          <div className="grid grid-cols-3 gap-1">
            <PatientStat
              label="Admitted"
              value={admitted}
              icon={<UserCheck size={9} />}
              color="text-blue-400"
            />
            <PatientStat
              label="Critical"
              value={critical}
              icon={<AlertCircle size={9} />}
              color={critical > 0 ? "text-red-400" : "text-muted-foreground"}
              pulse={critical > 0}
            />
            <PatientStat
              label="Serious"
              value={serious}
              icon={<AlertCircle size={9} />}
              color={serious > 0 ? "text-orange-400" : "text-muted-foreground"}
            />
          </div>
        </div>
      )}

      {/* Contact */}
      {hospital.contact && (
        <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
          <a
            href={`tel:${hospital.contact}`}
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Phone size={9} />
            {hospital.contact}
          </a>
        </div>
      )}
    </motion.div>
  )
}

function BedStat({ label, value, highlight }: { label: string; value: number; highlight?: "red" }) {
  return (
    <div>
      <p className={cn("text-sm font-bold tabular-nums", highlight === "red" ? "text-red-400" : "text-foreground")}>
        {value}
      </p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  )
}

function PatientStat({ label, value, icon, color, pulse }: {
  label: string; value: number; icon: React.ReactNode; color: string; pulse?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={cn("flex items-center gap-0.5", color)}>
        {pulse && value > 0 && <span className="w-1 h-1 rounded-full bg-current animate-pulse" />}
        {icon}
        <span className="text-sm font-bold tabular-nums">{value}</span>
      </div>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  )
}

export default function HospitalPanel({ hospitals, onRefresh }: Props) {
  const { uiRole } = useAuth()
  const canManage = uiRole === "admin" || uiRole === "field_officer"
  const canAssign = uiRole === "admin" || uiRole === "operator" || uiRole === "field_officer"

  if (!hospitals.length) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        No hospital data available
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {canAssign && (
        <div className="flex justify-end pb-1">
          <AssignPatientForm onAssigned={onRefresh} />
        </div>
      )}
      {hospitals.map((h) => (
        <HospitalCard key={h.id} hospital={h} onRefresh={onRefresh} canManage={canManage} />
      ))}
    </div>
  )
}
