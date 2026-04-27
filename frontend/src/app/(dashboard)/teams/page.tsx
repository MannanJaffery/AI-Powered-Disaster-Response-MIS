"use client"

import { useState } from "react"
import { teams } from "@/lib/data"
import TeamCard from "@/components/teams/TeamCard"
import HospitalPanel from "@/components/teams/HospitalPanel"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import type { TeamStatus, TeamType } from "@/lib/types"

export default function TeamsPage() {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | TeamStatus>("all")
  const [filterType, setFilterType] = useState<"all" | TeamType>("all")

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase()
    return (
      (q === "" || t.name.toLowerCase().includes(q) || t.lead.toLowerCase().includes(q) || t.location.toLowerCase().includes(q)) &&
      (filterStatus === "all" || t.status === filterStatus) &&
      (filterType === "all" || t.type === filterType)
    )
  })

  const available = teams.filter((t) => t.status === "available").length
  const assigned = teams.filter((t) => t.status === "assigned").length
  const busy = teams.filter((t) => t.status === "busy").length

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
              <TeamCard key={team.id} team={team} index={i} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hospitals" className="mt-0">
          <div className="max-w-2xl">
            <HospitalPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
