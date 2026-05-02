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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import api from "@/lib/api"

type FormValues = {
  patient_name: string
  age:          string
}

type AssignResponse = {
  hospital_name?: string
  remaining_beds?: number
}

interface Props {
  onAssigned?: () => void
}

const CONDITIONS = ["Stable", "Serious", "Critical"] as const

export default function AssignPatientForm({ onAssigned }: Props) {
  const [open,       setOpen]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [condition,  setCondition]  = useState("Stable")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { patient_name: "", age: "" },
  })

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        patient_name: data.patient_name.trim(),
        condition,                              // from local state — always valid
      }
      if (data.age) payload.age = Number(data.age)

      const res = await api.post("/api/hospitals/assign-patient", payload)
      const result = res.data as AssignResponse
      toast.success("Patient assigned", {
        description: `Assigned to ${result.hospital_name ?? "hospital"} · ${result.remaining_beds ?? "?"} beds remaining`,
      })
      reset()
      setCondition("Stable")
      setOpen(false)
      onAssigned?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to assign patient."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-border">
          <UserPlus size={13} />
          Assign Patient
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus size={14} className="text-emerald-400" />
            Assign Patient to Hospital
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Patient Name</Label>
            <Input
              className="bg-input border-border text-sm h-9"
              placeholder="Full name"
              {...register("patient_name", { required: "Patient name is required" })}
            />
            {errors.patient_name && <p className="text-xs text-destructive">{errors.patient_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="bg-input border-border text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Age <span className="normal-case text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              type="number"
              min={0}
              max={150}
              className="bg-input border-border text-sm h-9"
              placeholder="Patient age"
              {...register("age")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-border" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0">
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Assigning…
                </span>
              ) : "Assign Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
