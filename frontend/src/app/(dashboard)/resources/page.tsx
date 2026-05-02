"use client"

import { useState, useEffect, useCallback } from "react"
import ApprovalQueue from "@/components/resources/ApprovalQueue"
import SubmitApprovalForm from "@/components/resources/SubmitApprovalForm"
import api from "@/lib/api"
import { mapApproval } from "@/lib/transforms"
import type { ApprovalRequest } from "@/lib/types"

export default function ResourcesPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApprovals = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get("/api/approvals")
      .then((res) => setApprovals((res.data as Record<string, unknown>[]).map(mapApproval)))
      .catch((err) => setError(err.response?.data?.detail ?? "Failed to load approvals."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  const pendingCount = approvals.filter((r) => r.status === "pending").length
  const approvedCount = approvals.filter((r) => r.status === "approved").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        <span className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin mr-2" />
        Loading approvals…
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
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Approval Workflows</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Resource requests, team deployments, and budget authorizations</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-amber-400 font-medium">{pendingCount} pending</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-emerald-400 font-medium">{approvedCount} approved</span>
          <SubmitApprovalForm onCreated={fetchApprovals} />
        </div>
      </div>

      <div className="max-w-3xl">
        <ApprovalQueue approvals={approvals} onRefresh={fetchApprovals} />
      </div>
    </div>
  )
}
