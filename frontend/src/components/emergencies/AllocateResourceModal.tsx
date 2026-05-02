"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PackagePlus } from "lucide-react"
import api from "@/lib/api"
import type { Incident } from "@/lib/types"

type RawInventoryRow = {
  warehouse_id: number
  warehouse_name: string
  resource_id: number
  resource_name: string
  resource_type: string
  unit: string
  quantity: number
}

type FormValues = {
  quantity: string
}

interface Props {
  incident: Incident
  onAllocated?: () => void
}

export default function AllocateResourceModal({ incident, onAllocated }: Props) {
  const [open,           setOpen]           = useState(false)
  const [inventory,      setInventory]      = useState<RawInventoryRow[]>([])
  const [invLoading,     setInvLoading]     = useState(false)
  const [warehouseId,    setWarehouseId]    = useState<number | null>(null)
  const [resourceId,     setResourceId]     = useState<number | null>(null)
  const [submitting,     setSubmitting]     = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { quantity: "" } })

  useEffect(() => {
    if (!open) return
    setInvLoading(true)
    setWarehouseId(null)
    setResourceId(null)
    api.get("/api/inventory")
      .then((res) => setInventory(res.data as RawInventoryRow[]))
      .catch(() => toast.error("Failed to load inventory."))
      .finally(() => setInvLoading(false))
  }, [open])

  const warehouses = useMemo(() => {
    const seen = new Map<number, string>()
    for (const row of inventory) {
      if (!seen.has(row.warehouse_id)) seen.set(row.warehouse_id, row.warehouse_name)
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [inventory])

  const resources = useMemo(() => {
    if (warehouseId === null) return []
    return inventory.filter((r) => r.warehouse_id === warehouseId)
  }, [inventory, warehouseId])

  const selectedResource = useMemo(
    () => resources.find((r) => r.resource_id === resourceId) ?? null,
    [resources, resourceId]
  )

  const onSubmit = async (data: FormValues) => {
    if (!warehouseId || !resourceId) {
      toast.error("Select a warehouse and resource.")
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/api/incidents/${incident.reportId}/allocate-resource`, {
        warehouse_id: warehouseId,
        resource_id:  resourceId,
        quantity:     Number(data.quantity),
      })
      toast.success("Resource allocated", {
        description: `${selectedResource?.resource_name ?? ""} → ${incident.id}`,
      })
      reset()
      setOpen(false)
      onAllocated?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to allocate resource."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-6 px-2 text-[10px] gap-1 bg-purple-500/15 hover:bg-purple-500/30 text-purple-400 border border-purple-500/25"
        >
          <PackagePlus size={11} />
          Allocate
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <PackagePlus size={14} className="text-purple-400" />
            Allocate Resource
            <span className="font-mono text-muted-foreground font-normal">{incident.id}</span>
          </DialogTitle>
        </DialogHeader>

        {invLoading ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin" />
            Loading inventory…
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Warehouse</Label>
              <Select
                onValueChange={(v) => {
                  setWarehouseId(Number(v))
                  setResourceId(null)
                }}
              >
                <SelectTrigger className="bg-input border-border text-sm h-9">
                  <SelectValue placeholder="Select warehouse…" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)} className="text-sm">{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Resource</Label>
              <Select
                disabled={warehouseId === null}
                onValueChange={(v) => setResourceId(Number(v))}
              >
                <SelectTrigger className="bg-input border-border text-sm h-9">
                  <SelectValue placeholder={warehouseId === null ? "Select warehouse first" : "Select resource…"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {resources.map((r) => (
                    <SelectItem key={r.resource_id} value={String(r.resource_id)} className="text-sm">
                      {r.resource_name} ({r.quantity} {r.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Quantity
                {selectedResource && (
                  <span className="normal-case ml-1 text-muted-foreground/60">
                    (max {selectedResource.quantity} {selectedResource.unit})
                  </span>
                )}
              </Label>
              <Input
                type="number"
                min={1}
                max={selectedResource?.quantity ?? undefined}
                className="bg-input border-border text-sm h-9"
                placeholder="Quantity to dispatch"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 1, message: "Must be at least 1" },
                  ...(selectedResource
                    ? { max: { value: selectedResource.quantity, message: `Max available: ${selectedResource.quantity}` } }
                    : {}),
                })}
              />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-border" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !warehouseId || !resourceId}
                className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white border-0"
              >
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Allocating…
                  </span>
                ) : "Allocate"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
