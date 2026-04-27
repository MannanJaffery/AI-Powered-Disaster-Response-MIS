"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Siren, Users, AlertTriangle, Package, DollarSign, TrendingUp, Activity, Building2 } from "lucide-react"
import KPICard from "@/components/dashboard/KPICard"
import EmergencyFeed from "@/components/dashboard/EmergencyFeed"
import InventoryDonutChart from "@/components/dashboard/InventoryDonutChart"
import FinanceLineChart from "@/components/dashboard/FinanceLineChart"
import { incidents, inventory, financeData, hospitals } from "@/lib/data"
import { useRole } from "@/context/RoleContext"
import { cn } from "@/lib/utils"

const activeIncidents = incidents.filter((i) => i.status === "active" || i.status === "pending")
const criticalIncidents = incidents.filter((i) => i.severity === "critical")
const deployedTeams = incidents.filter((i) => i.assignedTeam !== null).length
const lowStockItems = inventory.filter((i) => i.quantity < i.minThreshold)

const totalDonations = financeData.reduce((s, d) => s + d.donations, 0)
const totalExpenses = financeData.reduce((s, d) => s + d.expenses, 0)
const remainingBudget = 5000000 - totalExpenses

export default function DashboardPage() {
  const { currentRole } = useRole()

  const defaultTab =
    currentRole === "warehouse_manager" ? "warehouse"
    : currentRole === "finance" ? "finance"
    : "operations"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Command Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live operational overview — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-5">
        <TabsList className="bg-card border border-border h-8 p-0.5">
          <TabsTrigger value="operations" className="text-xs h-7 px-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Emergency Operations
          </TabsTrigger>
          <TabsTrigger value="warehouse" className="text-xs h-7 px-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Warehouse
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs h-7 px-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Finance
          </TabsTrigger>
        </TabsList>

        {/* ─── Operations Tab ─── */}
        <TabsContent value="operations" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              title="Active Incidents"
              value={activeIncidents.length}
              subtitle={`${criticalIncidents.length} critical`}
              icon={<Siren size={16} />}
              accent="red"
              pulse={criticalIncidents.length > 0}
            />
            <KPICard
              title="Teams Deployed"
              value={deployedTeams}
              subtitle="of 10 teams"
              icon={<Users size={16} />}
              accent="amber"
              trend={{ value: 25, label: "vs yesterday" }}
            />
            <KPICard
              title="Critical Alerts"
              value={criticalIncidents.length}
              subtitle="require immediate action"
              icon={<AlertTriangle size={16} />}
              accent="red"
              pulse
            />
            <KPICard
              title="Total Casualties"
              value={incidents.reduce((s, i) => s + i.casualties, 0)}
              subtitle="reported across all incidents"
              icon={<Activity size={16} />}
              accent="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live feed */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Live Incident Feed</CardTitle>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <CardDescription className="text-xs">Real-time incoming alerts and status updates</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <EmergencyFeed />
              </CardContent>
            </Card>

            {/* Active incidents list */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Active Incidents</CardTitle>
                <CardDescription className="text-xs">{activeIncidents.length} ongoing events</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {activeIncidents.slice(0, 8).map((inc) => (
                    <div key={inc.id} className="flex items-start justify-between gap-3 p-2.5 rounded-md bg-secondary/40 hover:bg-secondary/70 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground">{inc.id}</span>
                          <SeverityBadge severity={inc.severity} />
                        </div>
                        <p className="text-xs text-foreground truncate">{inc.location}</p>
                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{inc.type.replace("_", " ")} · {inc.assignedTeam ?? "Unassigned"}</p>
                      </div>
                      <StatusBadge status={inc.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hospital quick view */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 size={14} className="text-muted-foreground" />
                Hospital Capacity Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {hospitals.slice(0, 4).map((h) => {
                  const pct = Math.round(((h.totalBeds - h.availableBeds) / h.totalBeds) * 100)
                  const isCritical = pct >= 90
                  return (
                    <div key={h.id} className={cn("p-3 rounded-md border", isCritical ? "border-red-500/30 bg-red-500/5" : "border-border bg-secondary/30")}>
                      <p className="text-xs font-medium text-foreground truncate mb-1">{h.name}</p>
                      <p className={cn("text-xl font-bold tabular-nums", isCritical ? "text-red-400" : "text-foreground")}>{pct}%</p>
                      <p className="text-[10px] text-muted-foreground">{h.availableBeds} beds free</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Warehouse Tab ─── */}
        <TabsContent value="warehouse" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Total SKUs" value={inventory.length} subtitle="across all warehouses" icon={<Package size={16} />} accent="blue" />
            <KPICard title="Low Stock" value={lowStockItems.length} subtitle="below minimum threshold" icon={<AlertTriangle size={16} />} accent="red" pulse={lowStockItems.length > 0} />
            <KPICard title="Critical Items" value={lowStockItems.filter(i => i.quantity < i.minThreshold * 0.5).length} subtitle="< 50% of threshold" icon={<Siren size={16} />} accent="red" />
            <KPICard title="Warehouses Active" value={4} subtitle="operational depots" icon={<Building2 size={16} />} accent="emerald" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Inventory Distribution</CardTitle>
                <CardDescription className="text-xs">Units by category across all depots</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <InventoryDonutChart />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Low Stock Alerts</CardTitle>
                <CardDescription className="text-xs">Items below minimum threshold</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {lowStockItems.map((item) => {
                    const pct = Math.round((item.quantity / item.minThreshold) * 100)
                    const isCritical = pct < 50
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground truncate mr-2">{item.name}</span>
                          <span className={cn("font-mono font-medium shrink-0", isCritical ? "text-red-400" : "text-amber-400")}>
                            {item.quantity}/{item.minThreshold} {item.unit}
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", isCritical ? "bg-red-500" : "bg-amber-500")}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Finance Tab ─── */}
        <TabsContent value="finance" className="space-y-5 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Total Donations" value={`$${(totalDonations / 1e6).toFixed(2)}M`} subtitle="this month" icon={<TrendingUp size={16} />} accent="emerald" />
            <KPICard title="Total Expenses" value={`$${(totalExpenses / 1e6).toFixed(2)}M`} subtitle="burn rate: $184K/day" icon={<DollarSign size={16} />} accent="amber" />
            <KPICard title="Remaining Budget" value={`$${(remainingBudget / 1e6).toFixed(2)}M`} subtitle="of $5M allocated" icon={<Activity size={16} />} accent={remainingBudget < 1000000 ? "red" : "blue"} />
            <KPICard title="Pending Approvals" value={3} subtitle="budget requests" icon={<AlertTriangle size={16} />} accent="amber" pulse />
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Donations vs Expenses — Last 14 Days</CardTitle>
              <CardDescription className="text-xs">Daily financial flow across all active disaster events</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <FinanceLineChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = {
    critical: "bg-red-500/15 text-red-400 border-red-500/25",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  }[severity] ?? "bg-secondary text-muted-foreground border-border"
  return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase", s)}>{severity}</span>
}

function StatusBadge({ status }: { status: string }) {
  const s = {
    active: "bg-red-500/15 text-red-400 border-red-500/25",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    contained: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  }[status] ?? "bg-secondary text-muted-foreground"
  return <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full border uppercase whitespace-nowrap", s)}>{status}</span>
}
