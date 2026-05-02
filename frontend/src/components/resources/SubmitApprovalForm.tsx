"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import api from "@/lib/api"

type FormValues = {
  request_type: string
  reference_id: string
  notes: string
}

interface Props {
  onCreated?: () => void
}

export default function SubmitApprovalForm({ onCreated }: Props) {
  const [open,       setOpen]       = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { request_type: "", reference_id: "", notes: "" },
  })

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      await api.post("/api/approvals/submit", {
        request_type: data.request_type.trim(),
        reference_id: Number(data.reference_id),
        notes:        data.notes.trim(),
      })
      toast.success("Approval request submitted", {
        description: `${data.request_type} — ref #${data.reference_id}`,
      })
      reset()
      setOpen(false)
      onCreated?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to submit request."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-border">
          <PlusCircle size={13} />
          Submit Request
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <PlusCircle size={14} className="text-amber-400" />
            Submit Approval Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Request Type</Label>
            <Input
              className="bg-input border-border text-sm h-9"
              placeholder="e.g. EquipmentDispatch, EvacuationOrder"
              {...register("request_type", { required: "Request type is required" })}
            />
            {errors.request_type && <p className="text-xs text-destructive">{errors.request_type.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Reference ID</Label>
            <Input
              type="number"
              min={1}
              className="bg-input border-border text-sm h-9"
              placeholder="Related record ID (e.g. allocation or incident ID)"
              {...register("reference_id", {
                required: "Reference ID is required",
                min: { value: 1, message: "Must be a positive number" },
              })}
            />
            {errors.reference_id && <p className="text-xs text-destructive">{errors.reference_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes / Justification</Label>
            <textarea
              {...register("notes", {
                required: "Notes are required",
                minLength: { value: 10, message: "Please provide at least 10 characters" },
              })}
              rows={3}
              className="w-full bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Describe the reason for this request…"
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-border" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs">
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting…
                </span>
              ) : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
