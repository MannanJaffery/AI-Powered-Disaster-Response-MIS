"use client"

import { useState } from "react"
import { approvalRequests } from "@/lib/data"
import type { ApprovalRequest, ApprovalStatus } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { Check, X, Clock, Banknote, Users, Package, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

const TYPE_ICONS = {
  resource_deployment: <Package size={13} />,
  team_dispatch: <Users size={13} />,
  budget_release: <Banknote size={13} />,
  evacuation_order: <Megaphone size={13} />,
}

const TYPE_LABELS = {
  resource_deployment: "Resource Deployment",
  team_dispatch: "Team Dispatch",
  budget_release: "Budget Release",
  evacuation_order: "Evacuation Order",
}

const SEV_STYLE: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/25",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/25",
}

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  rejected: "bg-red-500/15 text-red-400 border-red-500/25",
}

export default function ApprovalQueue() {
  const [requests, setRequests] = useState(approvalRequests)
  const [filter, setFilter] = useState<"all" | ApprovalStatus>("all")

  const update = (id: string, status: "approved" | "rejected") => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    const req = requests.find((r) => r.id === id)
    if (status === "approved") {
      toast.success("Request approved", { description: `${req?.id} — ${TYPE_LABELS[req!.type]}` })
    } else {
      toast.error("Request rejected", { description: `${req?.id} has been rejected` })
    }
  }

  const filtered = requests.filter((r) => filter === "all" || r.status === filter)
  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-all capitalize",
              filter === f
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
            )}
          >
            {f === "all" ? `All (${requests.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${requests.filter((r) => r.status === f).length})`}
          </button>
        ))}
        {pendingCount > 0 && (
          <span className="ml-auto text-xs text-amber-400 flex items-center gap-1.5">
            <Clock size={11} />
            {pendingCount} awaiting action
          </span>
        )}
      </div>

      {/* Request list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.map((req) => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                req.status === "pending" ? "bg-card border-border" : "bg-secondary/20 border-border/50"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-md border shrink-0 mt-0.5", SEV_STYLE[req.priority])}>
                  {TYPE_ICONS[req.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{TYPE_LABELS[req.type]}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase", SEV_STYLE[req.priority])}>
                      {req.priority}
                    </span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border uppercase", STATUS_STYLE[req.status])}>
                      {req.status}
                    </span>
                    {req.value && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {req.value}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-foreground/80 leading-relaxed mb-1.5">{req.description}</p>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>By: <span className="text-foreground/70">{req.requestedBy}</span></span>
                    <span>·</span>
                    <span className="tabular-nums">{formatDate(req.requestedAt)}</span>
                    <span className="font-mono text-muted-foreground/60">{req.id}</span>
                  </div>
                </div>

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/25"
                      onClick={() => update(req.id, "approved")}
                      title="Approve"
                    >
                      <Check size={14} />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/25"
                      onClick={() => update(req.id, "rejected")}
                      title="Reject"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
