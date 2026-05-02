"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import IncidentTable from "@/components/emergencies/IncidentTable"
import ReportingForm from "@/components/emergencies/ReportingForm"
import api from "@/lib/api"
import { mapEmergency } from "@/lib/transforms"
import type { Incident } from "@/lib/types"

export default function EmergenciesPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get("/api/incidents")
      .then((res) => setIncidents((res.data as Record<string, unknown>[]).map(mapEmergency)))
      .catch((err) => setError(err.response?.data?.detail ?? "Failed to load incidents."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  const activeCount   = useMemo(() => incidents.filter((i) => i.status === "active").length,   [incidents])
  const criticalCount = useMemo(() => incidents.filter((i) => i.severity === "critical").length, [incidents])
  const pendingCount  = useMemo(() => incidents.filter((i) => i.status === "pending").length,  [incidents])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Incident Command</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time emergency tracking and management</p>
        </div>
        <ReportingForm onCreated={fetchIncidents} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <StatPill label="Total"    value={loading ? "…" : incidents.length} color="text-foreground" />
        <StatPill label="Active"   value={loading ? "…" : activeCount}      color="text-red-400" />
        <StatPill label="Critical" value={loading ? "…" : criticalCount}    color="text-red-500" />
        <StatPill label="Pending"  value={loading ? "…" : pendingCount}     color="text-amber-400" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
          <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
          Loading incidents…
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      ) : (
        <IncidentTable incidents={incidents} onRefresh={fetchIncidents} />
      )}
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}
