"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import FinanceLineChart from "@/components/dashboard/FinanceLineChart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, ScrollText } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { mapFinanceRecords, mapBudgetByEvent, mapTransactionList } from "@/lib/transforms"
import type { FinanceRecord, BudgetEvent, FinancialTransaction } from "@/lib/types"
import TransactionForm from "@/components/finance/TransactionForm"
import TransactionAuditModal from "@/components/finance/TransactionAuditModal"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

const CustomBarTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

const TX_STATUS_COLORS: Record<string, string> = {
  Approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Pending:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Rejected: "bg-red-500/15 text-red-400 border-red-500/25",
}

export default function FinancePage() {
  const { uiRole } = useAuth()
  const [rawTx,   setRawTx]   = useState<Record<string, unknown>[]>([])
  const [balance, setBalance] = useState<{ total_donations?: number; total_expenses?: number; net_balance?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [auditTx, setAuditTx] = useState<FinancialTransaction | null>(null)
  const [auditOpen, setAuditOpen] = useState(false)

  const fetchAll = useCallback(async () => {
    const [txRes, balRes] = await Promise.allSettled([
      api.get("/api/financials"),
      api.get("/api/reports/financial-balance"),
    ])
    if (txRes.status === "fulfilled") setRawTx(txRes.value.data as Record<string, unknown>[])
    else setError("Failed to load financial data.")
    if (balRes.status === "fulfilled") {
      const rows = balRes.value.data as Record<string, unknown>[]
      if (rows.length) setBalance(rows[0] as typeof balance)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const financeRecords = useMemo<FinanceRecord[]>(() => mapFinanceRecords(rawTx), [rawTx])
  const budgetByEvent  = useMemo<BudgetEvent[]>(() => mapBudgetByEvent(rawTx), [rawTx])
  const txList         = useMemo<FinancialTransaction[]>(() => mapTransactionList(rawTx), [rawTx])

  const canViewAudit = uiRole === "admin" || uiRole === "finance"

  const totalDonations = balance?.total_donations ?? 0
  const totalExpenses = balance?.total_expenses ?? 0
  const surplus = balance?.net_balance ?? 0
  const totalBudget = totalDonations
  const budgetUsed = budgetByEvent.reduce((s, b) => s + b.spent, 0)
  const budgetRemaining = totalBudget - budgetUsed
  const budgetPct = totalBudget > 0 ? Math.round((budgetUsed / totalBudget) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
        Loading financial data…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Financial Operations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Donations, expenditure, and disaster budget tracking</p>
        </div>
        <TransactionForm onCreated={fetchAll} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Donations", value: formatCurrency(totalDonations), icon: <TrendingUp size={14} />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Total Expenses", value: formatCurrency(totalExpenses), icon: <TrendingDown size={14} />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { label: "Net Balance", value: formatCurrency(surplus), icon: <DollarSign size={14} />, color: surplus >= 0 ? "text-emerald-400" : "text-red-400", bg: surplus >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20" },
          { label: "Budget Remaining", value: formatCurrency(budgetRemaining), icon: <AlertTriangle size={14} />, color: budgetRemaining < 0 ? "text-red-400" : "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={cn("bg-card rounded-lg border px-4 py-3 flex items-start justify-between", s.bg)}>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={cn("text-xl font-bold tabular-nums mt-1", s.color)}>{s.value}</p>
            </div>
            <span className={s.color}>{s.icon}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Donations vs Expenses — Daily</CardTitle>
            <CardDescription className="text-xs">Last 14 days cash flow</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FinanceLineChart data={financeRecords} />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Budget Allocation by Event</CardTitle>
            <CardDescription className="text-xs">Allocated vs spent per disaster event</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {budgetByEvent.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={budgetByEvent} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="event" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="allocated" name="Allocated" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.5} />
                  <Bar dataKey="spent" name="Spent" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No budget data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall budget progress */}
      <Card className="bg-card border-border">
        <CardHeader className="pt-4 pb-2 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Overall Budget Status</CardTitle>
            <span className={cn("text-sm font-bold tabular-nums", budgetPct > 80 ? "text-red-400" : "text-foreground")}>{budgetPct}% used</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-5">
          <div className="h-3 bg-secondary rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetPct, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn("h-full rounded-full", budgetPct > 80 ? "bg-red-500" : budgetPct > 60 ? "bg-amber-500" : "bg-emerald-500")}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted-foreground">Total Donations</p><p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(totalBudget)}</p></div>
            <div><p className="text-xs text-muted-foreground">Spent</p><p className="text-sm font-bold text-red-400 tabular-nums">{formatCurrency(budgetUsed)}</p></div>
            <div><p className="text-xs text-muted-foreground">Remaining</p><p className={cn("text-sm font-bold tabular-nums", budgetRemaining < 0 ? "text-red-400" : "text-emerald-400")}>{formatCurrency(budgetRemaining)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-card border-border">
        <CardHeader className="pt-4 pb-2 px-4">
          <CardTitle className="text-sm font-semibold">Transaction History</CardTitle>
          <CardDescription className="text-xs">{txList.length} transactions recorded</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {txList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Type", "Amount", "Currency", "Status", "Date", "Recorded By", ""].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx) => (
                    <tr key={tx.transactionId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">TX-{tx.transactionId}</td>
                      <td className="px-4 py-2.5 text-foreground">{tx.transactionType}</td>
                      <td className="px-4 py-2.5 tabular-nums text-foreground">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{tx.currency}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${TX_STATUS_COLORS[tx.status] ?? "text-muted-foreground border-border"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{tx.recordedBy}</td>
                      <td className="px-4 py-2.5">
                        {canViewAudit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1"
                            onClick={() => { setAuditTx(tx); setAuditOpen(true) }}
                          >
                            <ScrollText size={11} />
                            Audit
                          </Button>
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

      <TransactionAuditModal
        transaction={auditTx}
        open={auditOpen}
        onOpenChange={setAuditOpen}
      />
    </div>
  )
}
