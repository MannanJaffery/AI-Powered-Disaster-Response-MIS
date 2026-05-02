"use client"

import { useState, useMemo } from "react"
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
import { PackageCheck } from "lucide-react"
import api from "@/lib/api"

type FormValues = {
  quantity: string
}

interface Props {
  onReceived?: () => void
}

type WarehouseOption = { id: number; name: string }
type ResourceOption  = { id: number; name: string }

export default function ReceiveStockForm({ onReceived }: Props) {
  const [open,        setOpen]        = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [resourceId,  setResourceId]  = useState<number | null>(null)
  const [rawRows,     setRawRows]     = useState<Record<string, unknown>[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { quantity: "" } })

  const handleOpen = async (v: boolean) => {
    setOpen(v)
    if (v) {
      try {
        const res = await api.get("/api/inventory")
        setRawRows(res.data as Record<string, unknown>[])
      } catch {
        toast.error("Failed to load warehouse list.")
      }
      setWarehouseId(null)
      setResourceId(null)
    }
  }

  const warehouses: WarehouseOption[] = useMemo(() => {
    const seen = new Map<number, string>()
    for (const r of rawRows) {
      const id = Number(r.warehouse_id ?? 0)
      if (!seen.has(id)) seen.set(id, String(r.warehouse_name ?? ""))
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [rawRows])

  const resources: ResourceOption[] = useMemo(() => {
    if (warehouseId === null) return []
    return rawRows
      .filter((r) => Number(r.warehouse_id ?? 0) === warehouseId)
      .map((r) => ({ id: Number(r.resource_id ?? 0), name: String(r.resource_name ?? "") }))
  }, [rawRows, warehouseId])

  const onSubmit = async (data: FormValues) => {
    if (!warehouseId || !resourceId) {
      toast.error("Select a warehouse and resource.")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/api/inventory/receive", {
        warehouse_id: warehouseId,
        resource_id:  resourceId,
        quantity:     Number(data.quantity),
      })
      toast.success("Stock received", {
        description: `+${data.quantity} units added to inventory`,
      })
      reset()
      setOpen(false)
      onReceived?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to receive stock."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-border">
          <PackageCheck size={13} />
          Receive Stock
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <PackageCheck size={14} className="text-emerald-400" />
            Receive Stock
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Warehouse</Label>
            <Select onValueChange={(v) => { setWarehouseId(Number(v)); setResourceId(null) }}>
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
            <Select disabled={warehouseId === null} onValueChange={(v) => setResourceId(Number(v))}>
              <SelectTrigger className="bg-input border-border text-sm h-9">
                <SelectValue placeholder={warehouseId === null ? "Select warehouse first" : "Select resource…"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {resources.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)} className="text-sm">{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity Received</Label>
            <Input
              type="number"
              min={1}
              className="bg-input border-border text-sm h-9"
              placeholder="Units to add"
              {...register("quantity", {
                required: "Quantity is required",
                min: { value: 1, message: "Must be at least 1" },
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
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </span>
              ) : "Receive Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
