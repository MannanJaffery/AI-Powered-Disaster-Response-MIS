"use client"

import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Siren } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { DisasterType, Severity } from "@/lib/types"

type FormValues = {
  location: string
  type: DisasterType
  severity: Severity
  casualties: string
  description: string
  reportedAt: string
}

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  critical: "border-red-500/40 bg-red-500/10 text-red-400",
}

export default function ReportingForm() {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      location: "",
      type: "earthquake",
      severity: "medium",
      casualties: "0",
      description: "",
      reportedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const severity = watch("severity")

  const onSubmit = (data: FormValues) => {
    const numCasualties = Math.max(0, parseInt(data.casualties || "0", 10) || 0)
    toast.success("Incident reported successfully", {
      description: `${data.type.toUpperCase()} at ${data.location} — Severity: ${data.severity}, Casualties: ${numCasualties}`,
    })
    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0">
          <Siren size={13} />
          Report Incident
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Siren size={14} className="text-red-400" />
            New Incident Report
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Location / Zone</Label>
            <Input
              placeholder="e.g. Northern District, Sector 4"
              className="bg-input border-border text-sm h-9"
              {...register("location", { required: "Location is required", minLength: { value: 3, message: "Must be at least 3 characters" } })}
            />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>

          {/* Type + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Disaster Type</Label>
              <Select defaultValue="earthquake" onValueChange={(v) => setValue("type", v as DisasterType)}>
                <SelectTrigger className="bg-input border-border text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {(["earthquake", "flood", "fire", "hurricane", "landslide", "explosion", "biological", "other"] as DisasterType[]).map((t) => (
                    <SelectItem key={t} value={t} className="text-sm capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date / Time</Label>
              <Input
                type="datetime-local"
                className="bg-input border-border text-sm h-9"
                {...register("reportedAt", { required: "Date/time is required" })}
              />
              {errors.reportedAt && <p className="text-xs text-destructive">{errors.reportedAt.message}</p>}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Severity Level</Label>
            <RadioGroup
              defaultValue="medium"
              onValueChange={(v) => setValue("severity", v as Severity)}
              className="grid grid-cols-4 gap-2"
            >
              {(["low", "medium", "high", "critical"] as Severity[]).map((s) => (
                <div key={s} className="relative">
                  <RadioGroupItem value={s} id={`sev-${s}`} className="sr-only" />
                  <Label
                    htmlFor={`sev-${s}`}
                    className={cn(
                      "flex items-center justify-center rounded-md border px-2 py-2 text-xs font-semibold uppercase cursor-pointer transition-all",
                      SEVERITY_STYLES[s],
                      severity === s ? "ring-1 ring-current opacity-100" : "opacity-60"
                    )}
                  >
                    {s}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Casualties */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Reported Casualties</Label>
            <Input
              type="number"
              min={0}
              max={9999}
              className="bg-input border-border text-sm h-9 w-32"
              {...register("casualties", {
                validate: (v) => {
                  const n = parseInt(v, 10)
                  if (isNaN(n) || n < 0) return "Must be 0 or more"
                  if (n > 9999) return "Max 9999"
                  return true
                },
              })}
            />
            {errors.casualties && <p className="text-xs text-destructive">{errors.casualties.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Incident Description</Label>
            <textarea
              {...register("description", {
                required: "Description is required",
                minLength: { value: 10, message: "Please provide at least 10 characters" },
              })}
              rows={3}
              className="w-full bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Describe the incident, affected area, and immediate needs…"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-border" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0">
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
