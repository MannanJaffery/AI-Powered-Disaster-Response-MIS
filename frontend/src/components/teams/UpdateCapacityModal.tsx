"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BedDouble } from "lucide-react"
import api from "@/lib/api"
import type { Hospital } from "@/lib/types"

type FormValues = {
  available_beds: string
  total_beds: string
}

interface Props {
  hospital: Hospital
  onUpdated?: () => void
}

export default function UpdateCapacityModal({ hospital, onUpdated }: Props) {
  const [open,       setOpen]       = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      available_beds: String(hospital.availableBeds),
      total_beds:     String(hospital.totalBeds),
    },
  })

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      const payload: Record<string, number> = {
        available_beds: Number(data.available_beds),
      }
      if (data.total_beds) payload.total_beds = Number(data.total_beds)

      await api.patch(`/api/hospitals/${hospital.hospitalId}/capacity`, payload)
      toast.success("Hospital capacity updated", {
        description: `${hospital.name} — ${data.available_beds} beds available`,
      })
      reset()
      setOpen(false)
      onUpdated?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to update capacity."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground">
          <BedDouble size={10} />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <BedDouble size={13} className="text-blue-400" />
            Update Bed Capacity
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="text-xs text-muted-foreground mb-1">
            Hospital: <span className="text-foreground font-medium">{hospital.name}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Beds <span className="normal-case text-muted-foreground/60">(optional — current: {hospital.totalBeds})</span>
            </Label>
            <Input
              type="number"
              min={1}
              className="bg-input border-border text-sm h-9"
              {...register("total_beds")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Available Beds <span className="normal-case">(required — max: {hospital.totalBeds})</span>
            </Label>
            <Input
              type="number"
              min={0}
              className="bg-input border-border text-sm h-9"
              {...register("available_beds", {
                required: "Required",
                min: { value: 0, message: "Cannot be negative" },
                validate: (val) => {
                  const total = getValues("total_beds")
                  const totalNum = total ? Number(total) : hospital.totalBeds
                  return Number(val) <= totalNum || `Cannot exceed total beds (${totalNum})`
                },
              })}
            />
            {errors.available_beds && <p className="text-xs text-destructive">{errors.available_beds.message}</p>}
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
