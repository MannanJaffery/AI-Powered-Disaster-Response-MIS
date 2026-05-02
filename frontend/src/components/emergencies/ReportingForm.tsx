"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Siren } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"
import type { DisasterType, Severity } from "@/lib/types"

interface Location {
  location_id: number
  city: string
  district: string
  province: string
}

type FormValues = {
  location_id: string
  type: DisasterType
  severity: Severity
  description: string
  reportedAt: string
}

const SEVERITY_STYLES: Record<Severity, string> = {
  low:      "border-blue-500/40 bg-blue-500/10 text-blue-400",
  medium:   "border-amber-500/40 bg-amber-500/10 text-amber-400",
  high:     "border-orange-500/40 bg-orange-500/10 text-orange-400",
  critical: "border-red-500/40 bg-red-500/10 text-red-400",
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface Props {
  onCreated?: () => void
}

export default function ReportingForm({ onCreated }: Props) {
  const { user } = useAuth()
  const [open, setOpen]           = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [locations, setLocations]  = useState<Location[]>([])

  useEffect(() => {
    if (open && locations.length === 0) {
      api.get("/api/locations")
        .then((res) => setLocations(res.data as Location[]))
        .catch(() => toast.error("Failed to load locations."))
    }
  }, [open, locations.length])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      location_id: "",
      type: "earthquake",
      severity: "medium",
      description: "",
      reportedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const severity = watch("severity")

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      await api.post("/api/incidents", {
        location_id:   Number(data.location_id),
        disaster_type: cap(data.type),
        severity_level: cap(data.severity),
        description:   data.description,
        reported_by:   user?.name ?? "Anonymous",
        reported_at:   data.reportedAt || undefined,
      })
      toast.success("Incident reported", {
        description: `${cap(data.type)} — ${cap(data.severity)} severity`,
      })
      reset()
      setOpen(false)
      onCreated?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to report incident."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
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
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Location</Label>
            <Select onValueChange={(v) => setValue("location_id", v)}>
              <SelectTrigger className="bg-input border-border text-sm h-9">
                <SelectValue placeholder="Select a location…" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {locations.map((l) => (
                  <SelectItem key={l.location_id} value={String(l.location_id)} className="text-sm">
                    {l.city}, {l.district} — {l.province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("location_id", { required: "Location is required" })} />
            {errors.location_id && <p className="text-xs text-destructive">{errors.location_id.message}</p>}
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
                  {(["earthquake","flood","fire","hurricane","landslide","explosion","biological","other"] as DisasterType[]).map((t) => (
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
              {(["low","medium","high","critical"] as Severity[]).map((s) => (
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
            <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0">
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting…
                </span>
              ) : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
