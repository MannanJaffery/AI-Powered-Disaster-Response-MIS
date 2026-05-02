"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { cn, formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, AlertTriangle } from "lucide-react"
import InventoryDonutChart from "@/components/dashboard/InventoryDonutChart"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { mapInventoryItems, mapInventoryByCategory, mapInventoryAlert, mapAllocationRecord } from "@/lib/transforms"
import type { InventoryItem, InventoryAlert, AllocationRecord } from "@/lib/types"
import { useAuth } from "@/context/AuthContext"
import ReceiveStockForm from "@/components/inventory/ReceiveStockForm"
import AllocationTracker from "@/components/inventory/AllocationTracker"

const ALERT_COLORS: Record<string, string> = {
  "Out of Stock": "bg-red-500/15 text-red-400 border-red-500/25",
  Critical:       "bg-orange-500/15 text-orange-400 border-orange-500/25",
  Low:            "bg-amber-500/15 text-amber-400 border-amber-500/25",
}

export default function InventoryPage() {
  const { uiRole } = useAuth()
  const canManage  = uiRole === "admin" || uiRole === "warehouse_manager"
  const canViewAlloc = uiRole === "admin" || uiRole === "warehouse_manager" || uiRole === "field_officer"

  const [inventory,    setInventory]    = useState<InventoryItem[]>([])
  const [alerts,       setAlerts]       = useState<InventoryAlert[]>([])
  const [allocations,  setAllocations]  = useState<AllocationRecord[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState("")
  const [filterCat,    setFilterCat]    = useState("all")
  const [filterAlert,  setFilterAlert]  = useState("all")

  const fetchAll = useCallback(async () => {
    const fetches: Promise<void>[] = [
      api.get("/api/inventory")
        .then((res) => setInventory(mapInventoryItems(res.data as Record<string, unknown>[])))
        .catch(() => setError("Failed to load inventory.")),
    ]
    if (canManage) {
      fetches.push(
        api.get("/api/inventory/alerts")
          .then((res) => setAlerts((res.data as Record<string, unknown>[]).map(mapInventoryAlert)))
          .catch(() => {})
      )
    }
    if (canViewAlloc) {
      fetches.push(
        api.get("/api/inventory/allocations")
          .then((res) => setAllocations((res.data as Record<string, unknown>[]).map(mapAllocationRecord)))
          .catch(() => {})
      )
    }
    await Promise.all(fetches)
    setLoading(false)
  }, [canManage, canViewAlloc])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = useMemo(() => inventory.filter((item) => {
    const q = search.toLowerCase()
    const isLow = item.quantity < item.minThreshold
    return (
      (q === "" || item.name.toLowerCase().includes(q) || item.category.includes(q)) &&
      (filterCat === "all" || item.category === filterCat) &&
      (filterAlert === "all" || (filterAlert === "low" && isLow) || (filterAlert === "ok" && !isLow))
    )
  }), [inventory, search, filterCat, filterAlert])

  const lowCount      = useMemo(() => inventory.filter((i) => i.quantity < i.minThreshold).length, [inventory])
  const criticalCount = useMemo(() => inventory.filter((i) => i.quantity < i.minThreshold * 0.5).length, [inventory])
  const categoryData  = useMemo(() => mapInventoryByCategory(inventory), [inventory])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
        Loading inventory…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Resource Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Stock levels, thresholds, and warehouse distribution</p>
        </div>
        {canManage && <ReceiveStockForm onReceived={fetchAll} />}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total SKUs",     value: inventory.length,   color: "text-foreground" },
          { label: "Low Stock",      value: lowCount,            color: "text-amber-400" },
          { label: "Critical Stock", value: criticalCount,       color: "text-red-400" },
          { label: "Categories",     value: categoryData.length, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-2xl font-bold tabular-nums mt-0.5", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <InventoryDonutChart data={categoryData} />
          </CardContent>
        </Card>

        {/* Alerts section — server-driven when available, fallback to client-side */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-400" />
              {alerts.length > 0 ? `Stock Alerts (${alerts.length})` : `Low Stock Alerts (${lowCount})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {alerts.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-medium truncate">{a.resourceName}</p>
                      <p className="text-[10px] text-muted-foreground">{a.warehouseName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {a.currentQuantity} / {a.threshold} {a.unit}
                      </span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", ALERT_COLORS[a.alertLevel] ?? "text-muted-foreground border-border")}>
                        {a.alertLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {inventory.filter((i) => i.quantity < i.minThreshold).map((item) => {
                  const pct = Math.round((item.quantity / item.minThreshold) * 100)
                  const isCrit = pct < 50
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between items-start text-xs gap-2">
                        <div className="min-w-0">
                          <span className="text-foreground truncate block">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate block">{item.location}</span>
                        </div>
                        <span className={cn("font-mono font-medium shrink-0 pt-0.5", isCrit ? "text-red-400" : "text-amber-400")}>
                          {item.quantity.toLocaleString()} / {item.minThreshold.toLocaleString()} {item.unit}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                          className={cn("h-full rounded-full", isCrit ? "bg-red-500" : "bg-amber-500")}
                        />
                      </div>
                    </div>
                  )
                })}
                {lowCount === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">All items above threshold</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search inventory…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs bg-input border-border" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-8 text-xs bg-input border-border w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
            {["food", "water", "medicine", "equipment", "shelter"].map((c) => (
              <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAlert} onValueChange={setFilterAlert}>
          <SelectTrigger className="h-8 text-xs bg-input border-border w-36">
            <SelectValue placeholder="Alert Filter" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Items</SelectItem>
            <SelectItem value="low" className="text-xs">Low Stock Only</SelectItem>
            <SelectItem value="ok" className="text-xs">In-Stock Only</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-border">
              {["Item", "Category", "Quantity", "Min Threshold", "Status", "Location", "Updated"].map((h) => (
                <TableHead key={h} className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, idx) => {
              const isLow  = item.quantity < item.minThreshold
              const isCrit = item.quantity < item.minThreshold * 0.5
              return (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-border hover:bg-secondary/40 transition-colors">
                  <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">{item.name}</TableCell>
                  <TableCell className="px-3 py-2.5 text-xs capitalize text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="px-3 py-2.5 text-xs tabular-nums font-mono text-foreground">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                  <TableCell className="px-3 py-2.5 text-xs tabular-nums font-mono text-muted-foreground">{item.minThreshold.toLocaleString()}</TableCell>
                  <TableCell className="px-3 py-2.5">
                    {isLow ? (
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", isCrit ? "bg-red-500/15 text-red-400 border-red-500/25" : "bg-amber-500/15 text-amber-400 border-amber-500/25")}>
                        {isCrit ? "Critical" : "Low"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase bg-emerald-500/15 text-emerald-400 border-emerald-500/25">OK</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{item.location}</TableCell>
                  <TableCell className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">{formatDate(item.lastUpdated)}</TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Allocation Tracker */}
      {canViewAlloc && (
        <AllocationTracker allocations={allocations} onRefresh={fetchAll} />
      )}
    </div>
  )
}
