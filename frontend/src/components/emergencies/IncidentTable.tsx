"use client"

import { useState, useMemo } from "react"
import { incidents as rawIncidents } from "@/lib/data"
import type { Incident, Severity, IncidentStatus } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Eye, Edit2, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"

const SEV_STYLE: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/25",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/25",
}

const STATUS_STYLE: Record<IncidentStatus, string> = {
  active: "bg-red-500/15 text-red-400 border-red-500/25",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  contained: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
}

type SortKey = keyof Pick<Incident, "id" | "type" | "severity" | "status" | "location" | "reportedAt" | "casualties">
type SortDir = "asc" | "desc"

export default function IncidentTable() {
  const [search, setSearch] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "reportedAt", dir: "desc" })
  const [selected, setSelected] = useState<Incident | null>(null)
  const [localIncidents, setLocalIncidents] = useState<Incident[]>(rawIncidents)

  const filtered = useMemo(() => {
    let d = localIncidents.filter((i) => {
      const q = search.toLowerCase()
      return (
        (q === "" || i.id.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.type.includes(q)) &&
        (filterSeverity === "all" || i.severity === filterSeverity) &&
        (filterStatus === "all" || i.status === filterStatus)
      )
    })

    d.sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      const cmp = typeof av === "number" ? (av - (bv as number)) : String(av).localeCompare(String(bv))
      return sort.dir === "asc" ? cmp : -cmp
    })

    return d
  }, [localIncidents, search, filterSeverity, filterStatus, sort])

  const handleSort = (key: SortKey) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))
  }

  const SortIcon = ({ colKey }: { colKey: SortKey }) =>
    sort.key === colKey
      ? sort.dir === "asc" ? <ChevronUp size={12} className="text-accent-foreground" /> : <ChevronDown size={12} className="text-accent-foreground" />
      : <ChevronsUpDown size={12} className="text-muted-foreground/50" />

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, location, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-input border-border"
          />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="h-8 text-xs bg-input border-border w-36">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Severities</SelectItem>
            {["critical", "high", "medium", "low"].map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs bg-input border-border w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            {["active", "pending", "contained", "resolved"].map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} incidents</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-border">
              {(["id", "type", "location", "severity", "status", "casualties", "reportedAt"] as SortKey[]).map((col) => (
                <TableHead
                  key={col}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer select-none py-2.5 px-3 h-auto"
                  onClick={() => handleSort(col)}
                >
                  <span className="flex items-center gap-1">
                    {col === "reportedAt" ? "Reported" : col}
                    <SortIcon colKey={col} />
                  </span>
                </TableHead>
              ))}
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">Team</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inc, idx) => (
              <motion.tr
                key={inc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="border-border hover:bg-secondary/40 transition-colors"
              >
                <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{inc.id}</TableCell>
                <TableCell className="px-3 py-2.5 text-xs capitalize text-foreground">{inc.type.replace("_", " ")}</TableCell>
                <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-44">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{inc.location}</span>
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", SEV_STYLE[inc.severity])}>
                    {inc.severity}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase", STATUS_STYLE[inc.status])}>
                    {inc.status}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs tabular-nums text-foreground">{inc.casualties}</TableCell>
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{formatDate(inc.reportedAt)}</TableCell>
                <TableCell className="px-3 py-2.5 text-xs text-foreground">
                  {inc.assignedTeam ? (
                    <span className="text-blue-400">{inc.assignedTeam}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setSelected(inc)}>
                      <Eye size={12} />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              Incident Detail
              {selected && <span className="font-mono text-muted-foreground font-normal">{selected.id}</span>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-xs mt-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" value={selected.type.replace("_", " ")} />
                <Field label="Status">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase", STATUS_STYLE[selected.status])}>
                    {selected.status}
                  </span>
                </Field>
                <Field label="Severity">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", SEV_STYLE[selected.severity])}>
                    {selected.severity}
                  </span>
                </Field>
                <Field label="Casualties" value={String(selected.casualties)} />
                <Field label="Assigned Team" value={selected.assignedTeam ?? "Unassigned"} />
                <Field label="Reported" value={formatDate(selected.reportedAt)} />
              </div>
              <Field label="Location" value={selected.location} />
              <Field label="Description" value={selected.description} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {children ?? <p className="text-xs text-foreground capitalize">{value}</p>}
    </div>
  )
}
