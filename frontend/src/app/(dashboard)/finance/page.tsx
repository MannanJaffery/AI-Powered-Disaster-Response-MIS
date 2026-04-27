"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { financeData, budgetByEvent } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import FinanceLineChart from "@/components/dashboard/FinanceLineChart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const totalDonations = financeData.reduce((s, d) => s + d.donations, 0)
const totalExpenses = financeData.reduce((s, d) => s + d.expenses, 0)
const surplus = totalDonations - totalExpenses
const totalBudget = 5_000_000
const budgetUsed = budgetByEvent.reduce((s, b) => s + b.spent, 0)
const budgetRemaining = totalBudget - budgetUsed

const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

export default function FinancePage() {
  const budgetPct = Math.round((budgetUsed / totalBudget) * 100)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Financial Operations</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Donations, expenditure, and disaster budget tracking</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Donations", value: formatCurrency(totalDonations), icon: <TrendingUp size={14} />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Total Expenses", value: formatCurrency(totalExpenses), icon: <TrendingDown size={14} />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { label: "Net Surplus", value: formatCurrency(surplus), icon: <DollarSign size={14} />, color: surplus > 0 ? "text-emerald-400" : "text-red-400", bg: surplus > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20" },
          { label: "Budget Remaining", value: formatCurrency(budgetRemaining), icon: <AlertTriangle size={14} />, color: budgetRemaining < 1_000_000 ? "text-red-400" : "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
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
            <FinanceLineChart />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pt-4 pb-2 px-4">
            <CardTitle className="text-sm font-semibold">Budget Allocation by Event</CardTitle>
            <CardDescription className="text-xs">Allocated vs spent per disaster event</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
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
              animate={{ width: `${budgetPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn("h-full rounded-full", budgetPct > 80 ? "bg-red-500" : budgetPct > 60 ? "bg-amber-500" : "bg-emerald-500")}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted-foreground">Total Budget</p><p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(totalBudget)}</p></div>
            <div><p className="text-xs text-muted-foreground">Spent</p><p className="text-sm font-bold text-red-400 tabular-nums">{formatCurrency(budgetUsed)}</p></div>
            <div><p className="text-xs text-muted-foreground">Remaining</p><p className={cn("text-sm font-bold tabular-nums", budgetRemaining < 1_000_000 ? "text-red-400" : "text-emerald-400")}>{formatCurrency(budgetRemaining)}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
