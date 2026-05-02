"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RefreshCw } from "lucide-react"
import api from "@/lib/api"
import type { Team } from "@/lib/types"

interface Props {
  team: Team
  onUpdated?: () => void
}

const STATUSES = ["Available", "Assigned", "Busy", "Completed"] as const

export default function UpdateTeamStatusModal({ team, onUpdated }: Props) {
  const [open,       setOpen]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected,   setSelected]   = useState("Available")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.patch(`/api/teams/${team.teamId}/status`, { status: selected })
      toast.success("Team status updated", {
        description: `${team.name} → ${selected}`,
      })
      setOpen(false)
      onUpdated?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to update status."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground">
          <RefreshCw size={10} />
          Status
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw size={13} className="text-amber-400" />
            Update Team Status
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="text-xs text-muted-foreground mb-1">
            Team: <span className="text-foreground font-medium">{team.name}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">New Status</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="bg-input border-border text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-border" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs">
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </span>
              ) : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
