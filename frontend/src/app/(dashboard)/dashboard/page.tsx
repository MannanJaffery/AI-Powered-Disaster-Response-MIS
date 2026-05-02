"use client"

import { useEffect, useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Siren, Users, AlertTriangle, Package, DollarSign, TrendingUp, Activity, Building2 } from "lucide-react"
import KPICard from "@/components/dashboard/KPICard"
import EmergencyFeed from "@/components/dashboard/EmergencyFeed"
import InventoryDonutChart from "@/components/dashboard/InventoryDonutChart"
import FinanceLineChart from "@/components/dashboard/FinanceLineChart"
import { useRole } from "@/context/RoleContext"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import {
  mapEmergency,
  mapInventoryItems,
  mapInventoryByCategory,
  mapFinanceRecords,
  mapHospital,
  emergencyToFeedItem,
} from "@/lib/transforms"
import type { Incident, InventoryItem, FinanceRecord, Hospital } from "@/lib/types"

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
      <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
      Loading…
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = ({
    critical: "bg-red-500/15 text-red-400 border-red-500/25",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  } as Record<string, string>)[severity] ?? "bg-secondary text-muted-foreground border-border"
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase", s)}>
      {severity}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = ({
    active: "bg-red-500/15 text-red-400 border-red-500/25",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    contained: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  } as Record<string, string>)[status] ?? "bg-secondary text-muted-foreground"
  return (
    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full border uppercase whitespace-nowrap", s)}>
      {status}
    </span>
  )
}

export default function DashboardPage() {
  const { currentRole } = useRole()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [financials, setFinancials] = useState<Record<string, unknown>[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [balance, setBalance] = useState<{ total_donations?: number; total_expenses?: number; net_balance?: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [incRes, invRes, finRes, hosRes, balRes] = await Promise.allSettled([
        api.get("/api/emergencies"),
        api.get("/api/inventory"),
        api.get("/api/financials"),
        api.get("/api/hospitals"),
        api.get("/api/reports/financial-balance"),
      ])
      if (incRes.status === "fulfilled") setIncidents((incRes.value.data as Record<string, unknown>[]).map(mapEmergency))
      if (invRes.status === "fulfilled") setInventory(mapInventoryItems(invRes.value.data as Record<string, unknown>[]))
      if (finRes.status === "fulfilled") setFinancials(finRes.value.data as Record<string, unknown>[])
      if (hosRes.status === "fulfilled") setHospitals((hosRes.value.data as Record<string, unknown>[]).map(mapHospital))
      if (balRes.status === "fulfilled") {
        const rows = balRes.value.data as Record<string, unknown>[]
        if (rows.length) setBalance(rows[0] as typeof balance)
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  const activeIncidents = useMemo(() => incidents.filter((i) => i.status === "active" || i.status === "pending"), [incidents])
  const criticalIncidents = useMemo(() => incidents.filter((i) => i.severity === "critical"), [incidents])
  const lowStockItems = useMemo(() => inventory.filter((i) => i.quantity < i.minThreshold), [inventory])
  const financeRecords = useMemo(() => mapFinanceRecords(financials), [financials])
  const categoryData = useMemo(() => mapInventoryByCategory(inventory), [inventory])
  const feedItems = useMemo(() => incidents.slice(0, 10).map(emergencyToFeedItem), [incidents])

  const totalDonations = balance?.total_donations ?? 0
  const totalExpenses = balance?.total_expenses ?? 0
  const netBalance = balance?.net_balance ?? 0

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
            Live operational overview —{" "}
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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
          {loading ? <LoadingState /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard title="Active Incidents" value={activeIncidents.length} subtitle={`${criticalIncidents.length} critical`} icon={<Siren size={16} />} accent="red" pulse={criticalIncidents.length > 0} />
                <KPICard title="Teams Deployed" value={incidents.filter((i) => i.assignedTeam).length} subtitle="assigned teams" icon={<Users size={16} />} accent="amber" />
                <KPICard title="Critical Alerts" value={criticalIncidents.length} subtitle="require immediate action" icon={<AlertTriangle size={16} />} accent="red" pulse />
                <KPICard title="Total Incidents" value={incidents.length} subtitle="active + pending" icon={<Activity size={16} />} accent="purple" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <EmergencyFeed items={feedItems} />
                  </CardContent>
                </Card>

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
                            <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                              {inc.type.replace("_", " ")} · {inc.assignedTeam ?? "Unassigned"}
                            </p>
                          </div>
                          <StatusBadge status={inc.status} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                      const pct = h.totalBeds > 0 ? Math.round(((h.totalBeds - h.availableBeds) / h.totalBeds) * 100) : 0
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
            </>
          )}
        </TabsContent>

        {/* ─── Warehouse Tab ─── */}
        <TabsContent value="warehouse" className="space-y-5 mt-0">
          {loading ? <LoadingState /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard title="Total SKUs" value={inventory.length} subtitle="across all warehouses" icon={<Package size={16} />} accent="blue" />
                <KPICard title="Low Stock" value={lowStockItems.length} subtitle="below minimum threshold" icon={<AlertTriangle size={16} />} accent="red" pulse={lowStockItems.length > 0} />
                <KPICard title="Critical Items" value={lowStockItems.filter((i) => i.quantity < i.minThreshold * 0.5).length} subtitle="< 50% of threshold" icon={<Siren size={16} />} accent="red" />
                <KPICard title="Warehouses Active" value={4} subtitle="operational depots" icon={<Building2 size={16} />} accent="emerald" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold">Inventory Distribution</CardTitle>
                    <CardDescription className="text-xs">Units by category across all depots</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <InventoryDonutChart data={categoryData} />
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
                              <div className={cn("h-full rounded-full transition-all", isCritical ? "bg-red-500" : "bg-amber-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ─── Finance Tab ─── */}
        <TabsContent value="finance" className="space-y-5 mt-0">
          {loading ? <LoadingState /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard title="Total Donations" value={`PKR ${(totalDonations / 1e6).toFixed(2)}M`} subtitle="approved donations" icon={<TrendingUp size={16} />} accent="emerald" />
                <KPICard title="Total Expenses" value={`PKR ${(totalExpenses / 1e6).toFixed(2)}M`} subtitle="approved expenses" icon={<DollarSign size={16} />} accent="amber" />
                <KPICard title="Net Balance" value={`PKR ${(netBalance / 1e6).toFixed(2)}M`} subtitle="donations minus expenses" icon={<Activity size={16} />} accent={netBalance >= 0 ? "blue" : "red"} />
                <KPICard title="Transactions" value={financials.length} subtitle="total records" icon={<AlertTriangle size={16} />} accent="amber" />
              </div>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">Donations vs Expenses — Daily</CardTitle>
                  <CardDescription className="text-xs">Financial flow across all active disaster events</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <FinanceLineChart data={financeRecords} />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
