"use client"

import ApprovalQueue from "@/components/resources/ApprovalQueue"
import { approvalRequests } from "@/lib/data"

const pendingCount = approvalRequests.filter((r) => r.status === "pending").length
const approvedCount = approvalRequests.filter((r) => r.status === "approved").length

export default function ResourcesPage() {
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
        </div>
      </div>

      <div className="max-w-3xl">
        <ApprovalQueue />
      </div>
    </div>
  )
}
