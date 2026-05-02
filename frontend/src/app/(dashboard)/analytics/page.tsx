"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import api from "@/lib/api"
import { mapEmergency, mapTeam, mapResponseTime } from "@/lib/transforms"
import type { Incident, Team } from "@/lib/types"

type IncidentSummaryRow = { disaster_type: string; severity_level: string; count: number }
type ResourceUtilRow    = { warehouse_name: string; resource_type: string; total_qty: number }

const DISASTER_COLORS: Record<string, string> = {
  flood: "#3b82f6",
  earthquake: "#ef4444",
  fire: "#f97316",
  hurricane: "#8b5cf6",
  landslide: "#f59e0b",
  explosion: "#ef4444",
  biological: "#10b981",
  other: "#94a3b8",
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={p.color ? { color: p.color } : {}} className="text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}{typeof p.value === "number" && String(label).includes("min") ? " min" : ""}</span>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [incidents,       setIncidents]       = useState<Incident[]>([])
  const [teams,           setTeams]           = useState<Team[]>([])
  const [responseTime,    setResponseTime]    = useState<{ region: string; avgMinutes: number }[]>([])
  const [incidentSummary, setIncidentSummary] = useState<IncidentSummaryRow[]>([])
  const [resourceUtil,    setResourceUtil]    = useState<ResourceUtilRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [incRes, teamRes, rtRes, sumRes, utilRes] = await Promise.allSettled([
        api.get("/api/incidents"),
        api.get("/api/teams"),
        api.get("/api/reports/response-time"),
        api.get("/api/reports/incident-summary"),
        api.get("/api/reports/resource-utilization"),
      ])
      if (incRes.status  === "fulfilled") setIncidents((incRes.value.data as Record<string, unknown>[]).map(mapEmergency))
      if (teamRes.status === "fulfilled") setTeams((teamRes.value.data as Record<string, unknown>[]).map(mapTeam))
      if (rtRes.status   === "fulfilled") setResponseTime(mapResponseTime(rtRes.value.data as Record<string, unknown>[]))
      if (sumRes.status  === "fulfilled") setIncidentSummary(sumRes.value.data as IncidentSummaryRow[])
      if (utilRes.status === "fulfilled") setResourceUtil(utilRes.value.data as ResourceUtilRow[])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const resolvedCount = useMemo(() => incidents.filter((i: Incident) => i.status === "resolved").length, [incidents])
  const criticalCount = useMemo(() => incidents.filter((i: Incident) => i.severity === "critical").length, [incidents])
  const teamUtilization = useMemo(() => {
    if (!teams.length) return 0
    return Math.round((teams.filter((t: Team) => t.status !== "available").length / teams.length) * 100)
  }, [teams])

  const incidentsByType = useMemo(() => {
    const byType = new Map<string, number>()
    for (const inc of incidents) {
      byType.set(inc.type, (byType.get(inc.type) ?? 0) + 1)
    }
    return Array.from(byType.entries()).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: DISASTER_COLORS[type] ?? "#94a3b8",
    }))
  }, [incidents])

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const inc of incidents) {
      if (inc.severity in counts) counts[inc.severity]++
    }
    return counts
  }, [incidents])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
        Loading analytics…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">MIS Analytics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Operational metrics, response performance, and incident analysis</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Incidents", value: incidents.length, color: "text-foreground" },
          { label: "Resolved", value: resolvedCount, color: "text-emerald-400" },
          { label: "Critical", value: criticalCount, color: "text-red-400" },
          { label: "Team Utilization", value: `${teamUtilization}%`, color: teamUtilization > 80 ? "text-red-400" : "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response time by disaster type */}
        <Card className="bg-card border-border">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Avg Response Time by Disaster Type</CardTitle>
            <CardDescription className="text-xs">Minutes from incident report to first team on-site</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {responseTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={responseTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit=" min" />
                  <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgMinutes" name="Avg Minutes" radius={[0, 3, 3, 0]}>
                    {responseTime.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.avgMinutes > 45 ? "#ef4444" : entry.avgMinutes > 30 ? "#f59e0b" : "#10b981"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-xs text-muted-foreground">No response time data</div>
            )}
          </CardContent>
        </Card>

        {/* Incidents by type pie */}
        <Card className="bg-card border-border">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Incidents by Disaster Type</CardTitle>
            <CardDescription className="text-xs">Distribution of {incidents.length} recorded events</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {incidentsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={incidentsByType} cx="50%" cy="45%" outerRadius={80} paddingAngle={3} dataKey="count" nameKey="type">
                    {incidentsByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      return (
                        <div className="bg-popover border border-border rounded-md px-3 py-2 text-xs shadow-xl">
                          <p className="font-medium text-foreground">{d.name}</p>
                          <p className="text-muted-foreground">{d.value} incidents</p>
                        </div>
                      )
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-xs text-muted-foreground">No incident data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Severity breakdown */}
      <Card className="bg-card border-border">
        <CardHeader className="pt-4 pb-2 px-4">
          <CardTitle className="text-sm font-semibold">Incident Severity Breakdown</CardTitle>
          <CardDescription className="text-xs">Current distribution across all active and resolved events</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-5">
          <div className="grid grid-cols-4 gap-4">
            {(["critical", "high", "medium", "low"] as const).map((sev) => {
              const count = severityCounts[sev] ?? 0
              const total = incidents.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const colors = {
                critical: { badge: "bg-red-500/15 border-red-500/25", text: "text-red-400" },
                high: { badge: "bg-orange-500/15 border-orange-500/25", text: "text-orange-400" },
                medium: { badge: "bg-amber-500/15 border-amber-500/25", text: "text-amber-400" },
                low: { badge: "bg-blue-500/15 border-blue-500/25", text: "text-blue-400" },
              }[sev]
              return (
                <div key={sev} className={`p-3 rounded-lg border ${colors.badge} text-center`}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{sev}</p>
                  <p className={`text-2xl font-bold tabular-nums ${colors.text}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% of total</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Incident Summary: type × severity matrix (from /api/reports/incident-summary) */}
      <IncidentSummaryChart data={incidentSummary} />

      {/* Resource Utilization (from /api/reports/resource-utilization) */}
      <ResourceUtilChart data={resourceUtil} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Incident Summary grouped bar chart
// ---------------------------------------------------------------------------
const SEV_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#f59e0b",
  Low:      "#3b82f6",
}

function IncidentSummaryChart({ data }: { data: IncidentSummaryRow[] }) {
  const chartData = useMemo(() => {
    const byType = new Map<string, Record<string, number>>()
    for (const row of data) {
      const t = String(row.disaster_type ?? "")
      if (!byType.has(t)) byType.set(t, {})
      byType.get(t)![String(row.severity_level ?? "")] = Number(row.count ?? 0)
    }
    return Array.from(byType.entries()).map(([type, sevMap]) => ({ type, ...sevMap }))
  }, [data])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pt-4 pb-2 px-4">
        <CardTitle className="text-sm font-semibold">Incident Summary by Type &amp; Severity</CardTitle>
        <CardDescription className="text-xs">Active and pending incidents grouped by disaster type and severity level</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
              {Object.keys(SEV_COLORS).map((sev) => (
                <Bar key={sev} dataKey={sev} name={sev} fill={SEV_COLORS[sev]} radius={[2, 2, 0, 0]} maxBarSize={18} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[260px] text-xs text-muted-foreground">No summary data</div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Resource Utilization horizontal bar chart
// ---------------------------------------------------------------------------
const RTYPE_COLORS: Record<string, string> = {
  Food:      "#10b981",
  Water:     "#3b82f6",
  Medicine:  "#f59e0b",
  Equipment: "#8b5cf6",
  Shelter:   "#06b6d4",
}

function ResourceUtilChart({ data }: { data: ResourceUtilRow[] }) {
  const chartData = useMemo(() => {
    const byType = new Map<string, number>()
    for (const row of data) {
      const t = String(row.resource_type ?? "Other")
      byType.set(t, (byType.get(t) ?? 0) + Number(row.total_qty ?? 0))
    }
    return Array.from(byType.entries())
      .map(([resource_type, total_qty]) => ({ resource_type, total_qty }))
      .sort((a, b) => b.total_qty - a.total_qty)
  }, [data])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pt-4 pb-2 px-4">
        <CardTitle className="text-sm font-semibold">Resource Utilization by Category</CardTitle>
        <CardDescription className="text-xs">Total stock quantities across all warehouses by resource type</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="resource_type" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_qty" name="Total Qty" radius={[0, 3, 3, 0]} maxBarSize={22}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={RTYPE_COLORS[entry.resource_type] ?? "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No utilization data</div>
        )}
      </CardContent>
    </Card>
  )
}
