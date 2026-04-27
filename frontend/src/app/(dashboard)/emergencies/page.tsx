"use client"

import IncidentTable from "@/components/emergencies/IncidentTable"
import ReportingForm from "@/components/emergencies/ReportingForm"
import { incidents } from "@/lib/data"

const activeCount = incidents.filter((i) => i.status === "active").length
const criticalCount = incidents.filter((i) => i.severity === "critical").length
const pendingCount = incidents.filter((i) => i.status === "pending").length

export default function EmergenciesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Incident Command</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time emergency tracking and management</p>
        </div>
        <ReportingForm />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <StatPill label="Total" value={incidents.length} color="text-foreground" />
        <StatPill label="Active" value={activeCount} color="text-red-400" />
        <StatPill label="Critical" value={criticalCount} color="text-red-500" />
        <StatPill label="Pending" value={pendingCount} color="text-amber-400" />
      </div>

      <IncidentTable />
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}
