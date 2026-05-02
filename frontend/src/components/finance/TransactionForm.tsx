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
import { Banknote } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"

type TxType = "Donation" | "Expense" | "Procurement"

type FormValues = {
  amount:      string
  description: string
  currency:    string
  donor_name:  string
  report_id:   string
}

interface Props {
  onCreated?: () => void
}

export default function TransactionForm({ onCreated }: Props) {
  // All hooks MUST be called unconditionally before any early return
  const { uiRole } = useAuth()
  const [open,       setOpen]   = useState(false)
  const [submitting, setSubmit] = useState(false)
  const [txType,     setTxType] = useState<TxType>("Donation")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      amount:      "",
      description: "",
      currency:    "PKR",
      donor_name:  "",
      report_id:   "",
    },
  })

  // Role guard AFTER hooks
  const canRecord = uiRole === "admin" || uiRole === "finance"
  if (!canRecord) return null

  const onSubmit = async (data: FormValues) => {
    setSubmit(true)
    try {
      const payload: Record<string, unknown> = {
        transaction_type: txType,           // taken from local state, always valid
        amount:           Number(data.amount),
        currency:         data.currency || "PKR",
        description:      data.description || undefined,
      }
      if (txType === "Donation" && data.donor_name)
        payload.donor_name = data.donor_name
      if (data.report_id)
        payload.report_id = Number(data.report_id)

      const res = await api.post("/api/financials/transaction", payload)
      const txId = (res.data as { transaction_id?: number }).transaction_id
      toast.success("Transaction recorded", {
        description: `${txType} · PKR ${Number(data.amount).toLocaleString()} · TX-${txId} sent for approval`,
      })
      reset()
      setTxType("Donation")
      setOpen(false)
      onCreated?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to record transaction."
      toast.error(msg)
    } finally {
      setSubmit(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0">
          <Banknote size={13} />
          Record Transaction
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Banknote size={14} className="text-emerald-400" />
            Record Financial Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Type — controlled via local state, not registered in RHF */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Transaction Type</Label>
            <Select
              value={txType}
              onValueChange={(v) => setTxType(v as TxType)}
            >
              <SelectTrigger className="bg-input border-border text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {(["Donation", "Expense", "Procurement"] as TxType[]).map((t) => (
                  <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Amount</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                className="bg-input border-border text-sm h-9"
                placeholder="0.00"
                {...register("amount", {
                  required: "Amount is required",
                  min: { value: 0.01, message: "Must be positive" },
                })}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Currency</Label>
              <Input
                className="bg-input border-border text-sm h-9"
                {...register("currency")}
              />
            </div>
          </div>

          {/* Donor name (Donation only) */}
          {txType === "Donation" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Donor Name <span className="normal-case text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                className="bg-input border-border text-sm h-9"
                placeholder="Organisation or individual name"
                {...register("donor_name")}
              />
            </div>
          )}

          {/* Linked incident (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Linked Incident ID <span className="normal-case text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              type="number"
              min={1}
              className="bg-input border-border text-sm h-9"
              placeholder="Incident report ID"
              {...register("report_id")}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Description <span className="normal-case text-muted-foreground/60">(optional)</span>
            </Label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Brief description of this transaction…"
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
                  Saving…
                </span>
              ) : "Record Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
