"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ScrollText } from "lucide-react"
import api from "@/lib/api"
import type { FinancialTransaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

// Matches backend: approvals query returns these columns
type ApprovalEntry = {
  request_id:  number
  status:      string
  notes:       string
  requested_at: string
  reviewed_at:  string | null
  reviewed_by:  string | null
}

// Matches backend: audit_trail query returns these columns
type AuditEntry = {
  log_id:    number
  action:    string
  old_value: string | null
  new_value: string | null
  logged_at: string
  ip_address: string | null
  user_name:  string | null
  role_name:  string | null
}

// Backend returns { transaction, approvals, audit_trail }
type AuditData = {
  transaction: Record<string, unknown>
  approvals:   ApprovalEntry[]
  audit_trail: AuditEntry[]
}

type Tab = "transaction" | "approvals" | "audit"

interface Props {
  transaction: FinancialTransaction | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

const STATUS_COLORS: Record<string, string> = {
  Approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Pending:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Rejected: "bg-red-500/15 text-red-400 border-red-500/25",
}

export default function TransactionAuditModal({ transaction, open, onOpenChange }: Props) {
  const [tab,     setTab]     = useState<Tab>("transaction")
  const [data,    setData]    = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!open || !transaction) return
    setLoading(true)
    setError(null)
    setData(null)
    setTab("transaction")
    api.get(`/api/financials/${transaction.transactionId}/audit`)
      .then((res) => setData(res.data as AuditData))
      .catch((err) => setError(err?.response?.data?.detail ?? "Failed to load audit data."))
      .finally(() => setLoading(false))
  }, [open, transaction])

  const tabs: { id: Tab; label: string }[] = [
    { id: "transaction", label: "Transaction" },
    { id: "approvals",   label: `Approvals${data ? ` (${data.approvals.length})` : ""}` },
    { id: "audit",       label: `Audit Trail${data ? ` (${data.audit_trail.length})` : ""}` },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <ScrollText size={14} className="text-blue-400" />
            Transaction Audit — TX-{transaction?.transactionId}
          </DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-border -mx-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mt-1">
          {loading && (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
              Loading…
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-400 m-2">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {tab === "transaction" && (
                <div className="space-y-0 p-1">
                  <Row label="Transaction ID"  value={`TX-${transaction!.transactionId}`} />
                  <Row label="Type"            value={transaction!.transactionType} />
                  <Row label="Amount"          value={`${transaction!.currency} ${formatCurrency(transaction!.amount)}`} />
                  <Row label="Status"
                    value={
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", STATUS_COLORS[transaction!.status] ?? "text-muted-foreground border-border")}>
                        {transaction!.status}
                      </span>
                    }
                  />
                  <Row label="Date"        value={new Date(transaction!.transactionDate).toLocaleString()} />
                  <Row label="Recorded By" value={transaction!.recordedBy} />
                  {transaction!.donorName   && <Row label="Donor"       value={transaction!.donorName} />}
                  {transaction!.description && <Row label="Description" value={transaction!.description} />}
                </div>
              )}

              {tab === "approvals" && (
                <div className="space-y-2 p-1">
                  {data.approvals.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No approval requests linked.</p>
                  ) : (
                    data.approvals.map((a) => (
                      <div key={a.request_id} className="bg-secondary/30 rounded-md border border-border p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">APR-{String(a.request_id).padStart(3, "0")}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", STATUS_COLORS[a.status] ?? "text-muted-foreground border-border")}>
                            {a.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Requested: {new Date(a.requested_at).toLocaleString()}</p>
                        {a.reviewed_by  && <p className="text-[11px] text-muted-foreground">Reviewed by: {a.reviewed_by}</p>}
                        {a.reviewed_at  && <p className="text-[11px] text-muted-foreground">Reviewed at: {new Date(a.reviewed_at).toLocaleString()}</p>}
                        {a.notes        && <p className="text-[11px] text-foreground/70 italic mt-1">{a.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "audit" && (
                <div className="space-y-2 p-1">
                  {data.audit_trail.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No audit entries found.</p>
                  ) : (
                    data.audit_trail.map((l) => (
                      <div key={l.log_id} className="bg-secondary/30 rounded-md border border-border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-muted-foreground">{new Date(l.logged_at).toLocaleString()}</span>
                          {l.ip_address && <span className="text-[10px] text-muted-foreground">{l.ip_address}</span>}
                        </div>
                        <p className="text-xs text-foreground font-medium">{l.action}</p>
                        {(l.user_name || l.role_name) && (
                          <p className="text-[11px] text-muted-foreground">
                            {[l.user_name, l.role_name].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {(l.old_value || l.new_value) && (
                          <div className="mt-1 space-y-0.5">
                            {l.old_value && <p className="text-[10px] text-red-400/80">Before: {l.old_value}</p>}
                            {l.new_value && <p className="text-[10px] text-emerald-400/80">After: {l.new_value}</p>}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-1 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground text-right">{value}</span>
    </div>
  )
}
