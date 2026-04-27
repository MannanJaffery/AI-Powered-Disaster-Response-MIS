"use client"

import { useState, useMemo } from "react"
import { inventory, inventoryByCategory } from "@/lib/data"
import { cn, formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, AlertTriangle, Package } from "lucide-react"
import InventoryDonutChart from "@/components/dashboard/InventoryDonutChart"
import { motion } from "framer-motion"

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("all")
  const [filterAlert, setFilterAlert] = useState("all")

  const filtered = useMemo(() => inventory.filter((item) => {
    const q = search.toLowerCase()
    const isLow = item.quantity < item.minThreshold
    return (
      (q === "" || item.name.toLowerCase().includes(q) || item.category.includes(q)) &&
      (filterCat === "all" || item.category === filterCat) &&
      (filterAlert === "all" || (filterAlert === "low" && isLow) || (filterAlert === "ok" && !isLow))
    )
  }), [search, filterCat, filterAlert])

  const lowCount = inventory.filter((i) => i.quantity < i.minThreshold).length
  const criticalCount = inventory.filter((i) => i.quantity < i.minThreshold * 0.5).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Resource Inventory</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Stock levels, thresholds, and warehouse distribution</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total SKUs", value: inventory.length, color: "text-foreground" },
          { label: "Low Stock", value: lowCount, color: "text-amber-400" },
          { label: "Critical Stock", value: criticalCount, color: "text-red-400" },
          { label: "Categories", value: 5, color: "text-blue-400" },
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
            <InventoryDonutChart />
          </CardContent>
        </Card>

        {/* Low stock summary */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-400" />
              Low Stock Alerts ({lowCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {inventory.filter((i) => i.quantity < i.minThreshold).map((item) => {
                const pct = Math.round((item.quantity / item.minThreshold) * 100)
                const isCrit = pct < 50
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground truncate mr-2">{item.name}</span>
                      <span className={cn("font-mono font-medium shrink-0", isCrit ? "text-red-400" : "text-amber-400")}>
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
            </div>
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
              const isLow = item.quantity < item.minThreshold
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
    </div>
  )
}
