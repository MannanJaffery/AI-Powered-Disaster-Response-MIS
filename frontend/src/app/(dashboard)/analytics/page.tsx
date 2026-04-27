"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { responseTimeByRegion, incidentsByType, incidents, teams } from "@/lib/data"
import { formatDate } from "@/lib/utils"

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={p.color ? { color: p.color } : {}} className="text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}{typeof p.value === "number" && label?.includes("min") ? " min" : ""}</span>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length
  const avgCasualties = (incidents.reduce((s, i) => s + i.casualties, 0) / incidents.length).toFixed(1)
  const teamUtilization = Math.round((teams.filter((t) => t.status !== "available").length / teams.length) * 100)

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
          { label: "Avg Casualties", value: avgCasualties, color: "text-amber-400" },
          { label: "Team Utilization", value: `${teamUtilization}%`, color: teamUtilization > 80 ? "text-red-400" : "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response time by region */}
        <Card className="bg-card border-border">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Avg Response Time by Region</CardTitle>
            <CardDescription className="text-xs">Minutes from incident report to first team on-site</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={responseTimeByRegion} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} unit=" min" />
                <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgMinutes" name="Avg Minutes" radius={[0, 3, 3, 0]}>
                  {responseTimeByRegion.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.avgMinutes > 45 ? "#ef4444" : entry.avgMinutes > 30 ? "#f59e0b" : "#10b981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Incidents by type pie */}
        <Card className="bg-card border-border">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Incidents by Disaster Type</CardTitle>
            <CardDescription className="text-xs">Distribution of {incidents.length} recorded events</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
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
              const count = incidents.filter((i) => i.severity === sev).length
              const pct = Math.round((count / incidents.length) * 100)
              const colors = {
                critical: { bg: "bg-red-500", text: "text-red-400", badge: "bg-red-500/15 border-red-500/25" },
                high: { bg: "bg-orange-500", text: "text-orange-400", badge: "bg-orange-500/15 border-orange-500/25" },
                medium: { bg: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-500/15 border-amber-500/25" },
                low: { bg: "bg-blue-500", text: "text-blue-400", badge: "bg-blue-500/15 border-blue-500/25" },
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
    </div>
  )
}
