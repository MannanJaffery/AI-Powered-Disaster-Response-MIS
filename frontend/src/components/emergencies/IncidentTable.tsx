"use client"

import { useState, useMemo } from "react"
import type { Incident, Severity, IncidentStatus } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Eye, MapPin, CheckCircle2, UserPlus, ShieldCheck } from "lucide-react"
import AllocateResourceModal from "@/components/emergencies/AllocateResourceModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"

interface AvailableTeam {
  team_id: number
  team_name: string
  team_type: string
  team_size: number
  city: string
  district: string
}

interface Props {
  incidents: Incident[]
  onRefresh: () => void
}

const SEV_STYLE: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/25",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  low:      "bg-blue-500/15 text-blue-400 border-blue-500/25",
}

const STATUS_STYLE: Record<IncidentStatus, string> = {
  active:    "bg-red-500/15 text-red-400 border-red-500/25",
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  approved:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  contained: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  resolved:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
}

type SortKey = keyof Pick<Incident, "id" | "type" | "severity" | "status" | "location" | "reportedAt" | "casualties">
type SortDir = "asc" | "desc"

export default function IncidentTable({ incidents, onRefresh }: Props) {
  const { uiRole } = useAuth()
  const canManage   = uiRole === "admin" || uiRole === "operator"
  const canAllocate = uiRole === "admin" || uiRole === "warehouse_manager"

  const [search,         setSearch]         = useState("")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus,   setFilterStatus]   = useState("all")
  const [sort,           setSort]           = useState<{ key: SortKey; dir: SortDir }>({ key: "reportedAt", dir: "desc" })
  const [selected,       setSelected]       = useState<Incident | null>(null)

  const [assigningInc,   setAssigningInc]   = useState<Incident | null>(null)
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([])
  const [teamsLoading,   setTeamsLoading]   = useState(false)
  const [actionLoading,  setActionLoading]  = useState<string | null>(null)

  const apiError = (err: unknown) =>
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Action failed."

  const handleApprove = async (inc: Incident) => {
    setActionLoading(inc.id)
    try {
      await api.patch(`/api/incidents/${inc.reportId}/approve`)
      toast.success("Incident approved", { description: inc.id })
      onRefresh()
    } catch (err) { toast.error(apiError(err)) }
    finally { setActionLoading(null) }
  }

  const openAssignModal = async (inc: Incident) => {
    setAssigningInc(inc)
    setAvailableTeams([])
    setTeamsLoading(true)
    try {
      const res = await api.get("/api/teams/available")
      setAvailableTeams(res.data as AvailableTeam[])
    } catch { toast.error("Failed to load available teams.") }
    finally { setTeamsLoading(false) }
  }

  const handleAssignTeam = async (teamId: number) => {
    if (!assigningInc) return
    setActionLoading(assigningInc.id)
    try {
      await api.post(`/api/incidents/${assigningInc.reportId}/assign-team`, { team_id: teamId })
      toast.success("Team assigned", { description: assigningInc.id })
      setAssigningInc(null)
      onRefresh()
    } catch (err) { toast.error(apiError(err)) }
    finally { setActionLoading(null) }
  }

  const handleResolve = async (inc: Incident) => {
    setActionLoading(inc.id)
    try {
      await api.patch(`/api/incidents/${inc.reportId}/resolve`)
      toast.success("Incident resolved", { description: inc.id })
      onRefresh()
    } catch (err) { toast.error(apiError(err)) }
    finally { setActionLoading(null) }
  }

  const filtered = useMemo(() => {
    let d = incidents.filter((i) => {
      const q = search.toLowerCase()
      return (
        (q === "" || i.id.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.type.includes(q)) &&
        (filterSeverity === "all" || i.severity === filterSeverity) &&
        (filterStatus   === "all" || i.status   === filterStatus)
      )
    })
    d = d.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv))
      return sort.dir === "asc" ? cmp : -cmp
    })
    return d
  }, [incidents, search, filterSeverity, filterStatus, sort])

  const handleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))

  const SortIcon = ({ colKey }: { colKey: SortKey }) =>
    sort.key === colKey
      ? sort.dir === "asc"
        ? <ChevronUp size={12} className="text-accent-foreground" />
        : <ChevronDown size={12} className="text-accent-foreground" />
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
            {["critical","high","medium","low"].map((s) => (
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
            {["pending","approved","active","resolved","contained"].map((s) => (
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
              {(["id","type","location","severity","status","casualties","reportedAt"] as SortKey[]).map((col) => (
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-xs text-muted-foreground">No incidents found</td>
              </tr>
            ) : (
              filtered.map((inc, idx) => {
                const isActing = actionLoading === inc.id
                return (
                  <motion.tr
                    key={inc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-border hover:bg-secondary/40 transition-colors"
                  >
                    <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{inc.id}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs capitalize text-foreground">{inc.type.replace("_"," ")}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-44">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{inc.location}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", SEV_STYLE[inc.severity] ?? "bg-secondary text-muted-foreground border-border")}>
                        {inc.severity}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase", STATUS_STYLE[inc.status] ?? "bg-secondary text-muted-foreground border-border")}>
                        {inc.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs tabular-nums text-foreground">{inc.casualties}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{formatDate(inc.reportedAt)}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs">
                      {inc.assignedTeam
                        ? <span className="text-blue-400">{inc.assignedTeam}</span>
                        : <span className="text-muted-foreground italic">Unassigned</span>}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canAllocate && (inc.status === "active" || inc.status === "approved") && (
                          <AllocateResourceModal incident={inc} onAllocated={onRefresh} />
                        )}
                        {canManage && (
                          <>
                            {inc.status === "pending" && (
                              <Button
                                size="sm"
                                disabled={isActing}
                                onClick={() => handleApprove(inc)}
                                className="h-6 px-2 text-[10px] gap-1 bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 border border-blue-500/25"
                              >
                                {isActing ? <span className="w-2.5 h-2.5 rounded-full border border-blue-400/40 border-t-blue-400 animate-spin" /> : <ShieldCheck size={11} />}
                                Approve
                              </Button>
                            )}
                            {inc.status === "approved" && (
                              <Button
                                size="sm"
                                disabled={isActing}
                                onClick={() => openAssignModal(inc)}
                                className="h-6 px-2 text-[10px] gap-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border border-amber-500/25"
                              >
                                {isActing ? <span className="w-2.5 h-2.5 rounded-full border border-amber-400/40 border-t-amber-400 animate-spin" /> : <UserPlus size={11} />}
                                Assign
                              </Button>
                            )}
                            {inc.status === "active" && (
                              <Button
                                size="sm"
                                disabled={isActing}
                                onClick={() => handleResolve(inc)}
                                className="h-6 px-2 text-[10px] gap-1 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/25"
                              >
                                {isActing ? <span className="w-2.5 h-2.5 rounded-full border border-emerald-400/40 border-t-emerald-400 animate-spin" /> : <CheckCircle2 size={11} />}
                                Resolve
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelected(inc)}
                        >
                          <Eye size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })
            )}
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
                <Field label="Type"          value={selected.type.replace("_"," ")} />
                <Field label="Status">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase", STATUS_STYLE[selected.status])}>{selected.status}</span>
                </Field>
                <Field label="Severity">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", SEV_STYLE[selected.severity])}>{selected.severity}</span>
                </Field>
                <Field label="Casualties"    value={String(selected.casualties)} />
                <Field label="Assigned Team" value={selected.assignedTeam ?? "Unassigned"} />
                <Field label="Reported"      value={formatDate(selected.reportedAt)} />
              </div>
              <Field label="Location"    value={selected.location} />
              <Field label="Description" value={selected.description} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Team dialog */}
      <Dialog open={!!assigningInc} onOpenChange={(o) => { if (!o) setAssigningInc(null) }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus size={14} className="text-amber-400" />
              Assign Team
              {assigningInc && <span className="font-mono text-muted-foreground font-normal">{assigningInc.id}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {teamsLoading ? (
              <div className="flex items-center justify-center py-10 text-xs text-muted-foreground gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin" />
                Loading available teams…
              </div>
            ) : availableTeams.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">No teams are currently available.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {availableTeams.map((team) => (
                  <button
                    key={team.team_id}
                    onClick={() => handleAssignTeam(team.team_id)}
                    disabled={actionLoading === assigningInc?.id}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/60 active:bg-secondary transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{team.team_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                          {team.team_type} · {team.city}{team.district ? `, ${team.district}` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{team.team_size} members</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
