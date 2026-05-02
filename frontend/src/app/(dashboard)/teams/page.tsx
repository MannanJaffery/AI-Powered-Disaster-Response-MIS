"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import TeamCard from "@/components/teams/TeamCard"
import HospitalPanel from "@/components/teams/HospitalPanel"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import api from "@/lib/api"
import { mapTeam, mapHospital } from "@/lib/transforms"
import type { Team, Hospital, TeamStatus, TeamType } from "@/lib/types"

export default function TeamsPage() {
  // 1. Add mounted state to prevent SSR hydration mismatches
  const [isMounted, setIsMounted] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | TeamStatus>("all")
  const [filterType, setFilterType] = useState<"all" | TeamType>("all")

  const fetchAll = useCallback(async () => {
    const [teamsRes, hosRes] = await Promise.allSettled([
      api.get("/api/teams"),
      api.get("/api/hospitals/status"),
    ])
    if (teamsRes.status === "fulfilled")
      setTeams((teamsRes.value.data as Record<string, unknown>[]).map(mapTeam))
    else setError("Failed to load teams.")
    if (hosRes.status === "fulfilled")
      setHospitals((hosRes.value.data as Record<string, unknown>[]).map(mapHospital))
    setLoading(false)
  }, [])

  useEffect(() => {
    setIsMounted(true)
    fetchAll()
  }, [fetchAll])

  const filtered = useMemo(() => teams.filter((t: Team) => {
    const q = search.toLowerCase()
    return (
      (q === "" || t.name.toLowerCase().includes(q) || t.lead.toLowerCase().includes(q) || t.location.toLowerCase().includes(q)) &&
      (filterStatus === "all" || t.status === filterStatus) &&
      (filterType === "all" || t.type === filterType)
    )
  }), [teams, search, filterStatus, filterType])

  const available = useMemo(() => teams.filter((t: Team) => t.status === "available").length, [teams])
  const assigned = useMemo(() => teams.filter((t: Team) => t.status === "assigned").length, [teams])
  const busy = useMemo(() => teams.filter((t: Team) => t.status === "busy").length, [teams])

  // 3. Return null during Server-Side Rendering to ensure HTML matches
  if (!isMounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
        Loading teams…
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
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Rescue Teams & Hospitals</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Field unit coordination and medical facility capacity</p>
      </div>

      <Tabs defaultValue="teams" className="space-y-5">
        <TabsList className="bg-card border border-border h-8 p-0.5">
          <TabsTrigger value="teams" className="text-xs h-7 px-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Rescue Teams ({teams.length})
          </TabsTrigger>
          <TabsTrigger value="hospitals" className="text-xs h-7 px-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Hospital Capacity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-0 space-y-4">
          {/* Status summary */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />{available} Available
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />{assigned} Assigned
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />{busy} Busy
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-input border-border"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="h-8 text-xs bg-input border-border w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                {["available", "assigned", "busy", "offline"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="h-8 text-xs bg-input border-border w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                {[["medical", "Medical"], ["fire", "Fire & Rescue"], ["search_rescue", "Search & Rescue"], ["logistics", "Logistics"], ["hazmat", "HazMat"]].map(([v, l]) => (
                  <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((team, i) => (
              <TeamCard key={team.id} team={team} index={i} onUpdated={fetchAll} />
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground col-span-full text-center py-8">No teams match your filters</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hospitals" className="mt-0">
          <div className="max-w-2xl">
            <HospitalPanel hospitals={hospitals} onRefresh={fetchAll} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}