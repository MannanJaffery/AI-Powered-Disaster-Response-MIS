"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCheck } from "lucide-react"
import api from "@/lib/api"
import type { AllocationRecord } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  allocations: AllocationRecord[]
  onRefresh?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  Dispatched: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Consumed:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
}

export default function AllocationTracker({ allocations, onRefresh }: Props) {
  const [markingId,  setMarkingId]  = useState<number | null>(null)
  const [quantities, setQuantities] = useState<Record<number, string>>({})

  const handleMarkConsumed = async (a: AllocationRecord) => {
    setMarkingId(a.allocationId)
    try {
      const qty = quantities[a.allocationId]
        ? Number(quantities[a.allocationId])
        : a.quantityDispatched

      await api.patch(`/api/inventory/allocations/${a.allocationId}/status`, {
        status:            "Consumed",
        quantity_consumed: qty,
      })
      toast.success("Allocation marked consumed", {
        description: `${a.resourceName} — ${qty} ${a.unit}`,
      })
      onRefresh?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to update allocation."
      toast.error(msg)
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pt-4 pb-2 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCheck size={13} className="text-blue-400" />
          Allocation Tracker
        </CardTitle>
        <CardDescription className="text-xs">Dispatched and consumed resource allocations</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {allocations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No allocations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Incident", "Warehouse", "Resource", "Dispatched", "Consumed", "Status", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.allocationId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{a.incidentLabel}</td>
                    <td className="px-4 py-2.5 text-foreground">{a.warehouseName}</td>
                    <td className="px-4 py-2.5 text-foreground">
                      {a.resourceName}
                      <span className="ml-1 text-muted-foreground capitalize">({a.resourceType})</span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground">{a.quantityDispatched} {a.unit}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {a.quantityConsumed > 0 ? `${a.quantityConsumed} ${a.unit}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", STATUS_COLORS[a.status] ?? "text-muted-foreground border-border")}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(a.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      {a.status === "Dispatched" && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={1}
                            max={a.quantityDispatched}
                            placeholder={String(a.quantityDispatched)}
                            value={quantities[a.allocationId] ?? ""}
                            onChange={(e) => setQuantities((q) => ({ ...q, [a.allocationId]: e.target.value }))}
                            className="h-6 w-20 text-[10px] bg-input border-border px-1.5"
                          />
                          <Button
                            size="sm"
                            disabled={markingId === a.allocationId}
                            onClick={() => handleMarkConsumed(a)}
                            className="h-6 px-2 text-[10px] gap-1 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/25"
                          >
                            {markingId === a.allocationId
                              ? <span className="w-2.5 h-2.5 rounded-full border border-emerald-400/40 border-t-emerald-400 animate-spin" />
                              : <CheckCheck size={10} />}
                            Consumed
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
