"use client"

import { useState, useMemo, useEffect } from "react"
import { cn, formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, CheckCircle2, XCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { mapAuditLog } from "@/lib/transforms"
import type { AuditLog, Role } from "@/lib/types"

const STATUS_ICON = {
  success: <CheckCircle2 size={12} className="text-emerald-400" />,
  failed: <XCircle size={12} className="text-red-400" />,
  pending: <Clock size={12} className="text-amber-400" />,
}

const STATUS_STYLE = {
  success: "text-emerald-400",
  failed: "text-red-400",
  pending: "text-amber-400",
}

const ROLE_STYLE: Record<Role, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  operator: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  field_officer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warehouse_manager: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  finance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  operator: "Operator",
  field_officer: "Field",
  warehouse_manager: "Warehouse",
  finance: "Finance",
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    api.get("/api/audit-logs")
      .then((res) => {
        setAuditLogs((res.data as Record<string, unknown>[]).map(mapAuditLog))
      })
      .catch((err) => {
        setError(err.response?.data?.detail ?? "Failed to load audit logs.")
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => auditLogs.filter((log: AuditLog) => {
    const q = search.toLowerCase()
    return (
      (q === "" || log.user.includes(q) || log.action.toLowerCase().includes(q) || log.target.toLowerCase().includes(q) || log.ipAddress.includes(q)) &&
      (filterRole === "all" || log.role === filterRole) &&
      (filterStatus === "all" || log.status === filterStatus)
    )
  }), [auditLogs, search, filterRole, filterStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
        Loading audit logs…
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
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Audit Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Immutable record of all system actions and user activities</p>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {auditLogs.length} entries total
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search logs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs bg-input border-border" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-8 text-xs bg-input border-border w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All Roles</SelectItem>
            {(["admin", "operator", "field_officer", "warehouse_manager", "finance"] as Role[]).map((r) => (
              <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs bg-input border-border w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">All</SelectItem>
            <SelectItem value="success" className="text-xs">Success</SelectItem>
            <SelectItem value="failed" className="text-xs">Failed</SelectItem>
            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-border">
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">Timestamp</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">User</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">Role</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">Action</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">Target</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground py-2.5 px-3 h-auto">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log, idx) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.015 }}
                className="border-border hover:bg-secondary/30 transition-colors"
              >
                <TableCell className="px-3 py-2 font-mono text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatDate(log.timestamp)}
                </TableCell>
                <TableCell className="px-3 py-2 text-xs text-foreground max-w-36 truncate">{log.user}</TableCell>
                <TableCell className="px-3 py-2">
                  <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase", ROLE_STYLE[log.role])}>
                    {ROLE_LABELS[log.role]}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2 font-mono text-[10px] text-blue-300/80 whitespace-nowrap">{log.action}</TableCell>
                <TableCell className="px-3 py-2 text-xs text-foreground/70 max-w-56 truncate">{log.target}</TableCell>
                <TableCell className="px-3 py-2">
                  <span className={cn("flex items-center gap-1 text-[10px] font-semibold", STATUS_STYLE[log.status])}>
                    {STATUS_ICON[log.status]}
                    {log.status}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{log.ipAddress}</TableCell>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <TableCell colSpan={7} className="px-3 py-8 text-xs text-muted-foreground text-center">
                  No audit log entries found
                </TableCell>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
