import type {
  Incident,
  Team,
  Hospital,
  InventoryItem,
  InventoryAlert,
  FinancialTransaction,
  AllocationRecord,
  FinanceRecord,
  BudgetEvent,
  AuditLog,
  ApprovalRequest,
  Severity,
  IncidentStatus,
  TeamType,
  TeamStatus,
  Role,
  DisasterType,
} from "./types"

const CATEGORY_COLORS: Record<string, string> = {
  food: "#10b981",
  water: "#3b82f6",
  medicine: "#f59e0b",
  equipment: "#8b5cf6",
  shelter: "#06b6d4",
}

const DISASTER_COLORS: Record<string, string> = {
  Flood: "#3b82f6",
  Earthquake: "#ef4444",
  Fire: "#f97316",
  Hurricane: "#8b5cf6",
  Landslide: "#f59e0b",
  Explosion: "#ef4444",
  Biological: "#10b981",
  Other: "#94a3b8",
}

export const DB_ROLE_MAP: Record<string, Role> = {
  Administrator: "admin",
  "Emergency Operator": "operator",
  "Field Officer": "field_officer",
  "Warehouse Manager": "warehouse_manager",
  "Finance Officer": "finance",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEmergency(e: Record<string, any>): Incident {
  const numId = Number(e.report_id ?? 0)
  return {
    id: `INC-${String(numId).padStart(3, "0")}`,
    reportId: numId,
    type: String(e.disaster_type ?? "").toLowerCase() as DisasterType,
    location: [e.city, e.district].filter(Boolean).join(", "),
    severity: String(e.severity_level ?? "low").toLowerCase() as Severity,
    status: String(e.status ?? "pending").toLowerCase() as IncidentStatus,
    assignedTeam: null,
    reportedAt: String(e.reported_at ?? ""),
    casualties: 0,
    description: String(e.description ?? ""),
  }
}

const TEAM_TYPE_MAP: Record<string, TeamType> = {
  Medical: "medical",
  Fire: "fire",
  Rescue: "search_rescue",
  Search: "search_rescue",
}

const TEAM_STATUS_MAP: Record<string, TeamStatus> = {
  Available: "available",
  Assigned: "assigned",
  Busy: "busy",
  Completed: "offline",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTeam(t: Record<string, any>): Team {
  const numId = Number(t.team_id ?? 0)
  return {
    id: `TEAM-${String(numId).padStart(3, "0")}`,
    teamId: numId,
    name: String(t.team_name ?? ""),
    type: TEAM_TYPE_MAP[String(t.team_type ?? "")] ?? "logistics",
    status: TEAM_STATUS_MAP[String(t.availability ?? "")] ?? "offline",
    location: [t.city, t.district].filter(Boolean).join(", "),
    members: Number(t.team_size ?? 0),
    lead: "",
    assignedIncidentId: t.current_assignment
      ? `INC-${String(t.current_assignment).padStart(3, "0")}`
      : null,
    lastUpdate: new Date().toISOString(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHospital(h: Record<string, any>): Hospital {
  const numId = Number(h.hospital_id ?? 0)
  return {
    id: `HOS-${String(numId).padStart(3, "0")}`,
    hospitalId: numId,
    name: String(h.hospital_name ?? ""),
    location: [h.city, h.district].filter(Boolean).join(", "),
    totalBeds: Number(h.total_beds ?? 0),
    availableBeds: Number(h.available_beds ?? 0),
    icuBeds: 0,
    availableIcuBeds: 0,
    distanceKm: 0,
    contact: String(h.contact_number ?? ""),
    admittedPatients: h.admitted_patients != null ? Number(h.admitted_patients) : undefined,
    criticalCases:    h.critical_cases    != null ? Number(h.critical_cases)    : undefined,
    seriousCases:     h.serious_cases     != null ? Number(h.serious_cases)     : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInventoryItems(rows: Record<string, any>[]): InventoryItem[] {
  const map = new Map<number, InventoryItem & { warehouseCount: number }>()
  for (const row of rows) {
    const resourceId = Number(row.resource_id ?? 0)
    if (map.has(resourceId)) {
      const existing = map.get(resourceId)!
      existing.quantity += Number(row.quantity ?? 0)
      existing.warehouseCount++
    } else {
      map.set(resourceId, {
        id: `INV-${String(resourceId).padStart(3, "0")}`,
        name: String(row.resource_name ?? ""),
        category: String(row.resource_type ?? "").toLowerCase() as InventoryItem["category"],
        quantity: Number(row.quantity ?? 0),
        unit: String(row.unit ?? ""),
        minThreshold: Number(row.low_stock_threshold ?? 0),
        location: String(row.warehouse_name ?? ""),
        lastUpdated: String(row.last_updated ?? ""),
        warehouseCount: 1,
      })
    }
  }
  return Array.from(map.values()).map(({ warehouseCount, ...item }) => ({
    ...item,
    location: warehouseCount > 1 ? "Multiple Warehouses" : item.location,
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFinanceRecords(transactions: Record<string, any>[]): FinanceRecord[] {
  const byDate = new Map<string, { donations: number; expenses: number; ts: number }>()
  for (const t of transactions) {
    if (t.status !== "Approved") continue
    const d = new Date(String(t.transaction_date ?? ""))
    if (isNaN(d.getTime())) continue
    const dateKey = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    if (!byDate.has(dateKey)) byDate.set(dateKey, { donations: 0, expenses: 0, ts: d.getTime() })
    const entry = byDate.get(dateKey)!
    const amount = Number(t.amount ?? 0)
    if (t.transaction_type === "Donation") {
      entry.donations += amount
    } else {
      entry.expenses += amount
    }
  }
  return Array.from(byDate.values())
    .sort((a, b) => a.ts - b.ts)
    .map(({ donations, expenses, ts }) => {
      const d = new Date(ts)
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        donations,
        expenses,
      }
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBudgetByEvent(transactions: Record<string, any>[]): BudgetEvent[] {
  const byEvent = new Map<string, { allocated: number; spent: number }>()
  for (const t of transactions) {
    const event = t.disaster_type
      ? `${String(t.disaster_type)} Response`
      : "General Operations"
    if (!byEvent.has(event)) byEvent.set(event, { allocated: 0, spent: 0 })
    const entry = byEvent.get(event)!
    const amount = Number(t.amount ?? 0)
    if (t.transaction_type === "Donation" && t.status === "Approved") {
      entry.allocated += amount
    } else if (t.status === "Approved") {
      entry.spent += amount
    }
  }
  return Array.from(byEvent.entries()).map(([event, v]) => ({ event, ...v }))
}

export function mapInventoryByCategory(
  items: InventoryItem[]
): { name: string; value: number; color: string }[] {
  const byCategory = new Map<string, number>()
  for (const item of items) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.quantity)
  }
  return Array.from(byCategory.entries()).map(([cat, value]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value,
    color: CATEGORY_COLORS[cat] ?? "#94a3b8",
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAuditLog(l: Record<string, any>): AuditLog {
  const id = String(l.log_id ?? "0")
  const dbRole = String(l.role_name ?? "")
  return {
    id: `LOG-${id.padStart(3, "0")}`,
    timestamp: String(l.logged_at ?? ""),
    user: String(l.user_email ?? "system"),
    role: (DB_ROLE_MAP[dbRole] ?? "operator") as Role,
    action: String(l.action ?? ""),
    target: [l.table_name, l.record_id ? `#${l.record_id}` : ""].filter(Boolean).join(" "),
    status: "success" as const,
    ipAddress: String(l.ip_address ?? ""),
  }
}

const APPROVAL_TYPE_MAP: Record<string, ApprovalRequest["type"]> = {
  ResourceDistribution: "resource_deployment",
  RescueDeployment: "team_dispatch",
  FinancialApproval: "budget_release",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApproval(a: Record<string, any>): ApprovalRequest {
  const numId = Number(a.request_id ?? 0)
  const dbRole = String(a.requester_role ?? "")
  return {
    id: `APR-${String(numId).padStart(3, "0")}`,
    requestId: numId,
    referenceId: Number(a.reference_id ?? 0),
    type: APPROVAL_TYPE_MAP[String(a.request_type ?? "")] ?? "resource_deployment",
    requestedBy: `${a.requested_by ?? "Unknown"} (${DB_ROLE_MAP[dbRole] ?? dbRole})`,
    requestedAt: String(a.requested_at ?? ""),
    description: String(a.notes ?? ""),
    status: String(a.status ?? "pending").toLowerCase() as ApprovalRequest["status"],
    priority: "medium",
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInventoryAlert(a: Record<string, any>): InventoryAlert {
  return {
    warehouseId:     Number(a.warehouse_id ?? 0),
    warehouseName:   String(a.warehouse_name ?? ""),
    resourceId:      Number(a.resource_id ?? 0),
    resourceName:    String(a.resource_name ?? ""),
    resourceType:    String(a.resource_type ?? ""),
    unit:            String(a.unit ?? ""),
    currentQuantity: Number(a.current_quantity ?? 0),
    threshold:       Number(a.threshold ?? 0),
    alertLevel:      String(a.alert_level ?? "Low") as InventoryAlert["alertLevel"],
    lastUpdated:     String(a.last_updated ?? ""),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTransactionList(rows: Record<string, any>[]): FinancialTransaction[] {
  return rows.map((t) => ({
    transactionId:   Number(t.transaction_id ?? 0),
    transactionType: String(t.transaction_type ?? ""),
    amount:          Number(t.amount ?? 0),
    currency:        String(t.currency ?? "PKR"),
    description:     t.description ? String(t.description) : null,
    donorName:       t.donor_name  ? String(t.donor_name)  : null,
    status:          String(t.status ?? "Pending"),
    transactionDate: String(t.transaction_date ?? ""),
    recordedBy:      String(t.recorded_by ?? ""),
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAllocationRecord(a: Record<string, any>): AllocationRecord {
  return {
    allocationId:      Number(a.allocation_id ?? 0),
    reportId:          Number(a.report_id ?? 0),
    incidentLabel:     String(a.incident_label ?? ""),
    warehouseName:     String(a.warehouse_name ?? ""),
    resourceName:      String(a.resource_name ?? ""),
    resourceType:      String(a.resource_type ?? ""),
    unit:              String(a.unit ?? ""),
    quantityDispatched: Number(a.quantity_dispatched ?? 0),
    quantityConsumed:   Number(a.quantity_consumed ?? 0),
    status:            String(a.status ?? ""),
    requestedAt:       String(a.requested_at ?? ""),
  }
}

export function emergencyToFeedItem(e: Incident) {
  return {
    id: e.id,
    timestamp: e.reportedAt,
    type: e.status === "active" ? "alert" : "update",
    severity: e.severity,
    message: e.description || `${e.type} incident at ${e.location}`,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapIncidentsByType(summary: Record<string, any>[]) {
  const byType = new Map<string, number>()
  for (const row of summary) {
    const t = String(row.disaster_type ?? "Other")
    byType.set(t, (byType.get(t) ?? 0) + Number(row.count ?? 0))
  }
  return Array.from(byType.entries()).map(([type, count]) => ({
    type,
    count,
    color: DISASTER_COLORS[type] ?? "#94a3b8",
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSeverityBreakdown(summary: Record<string, any>[]) {
  const bySev = new Map<string, number>()
  for (const row of summary) {
    const s = String(row.severity_level ?? "Low")
    bySev.set(s, (bySev.get(s) ?? 0) + Number(row.count ?? 0))
  }
  const result: Record<string, number> = {}
  for (const [sev, count] of bySev.entries()) {
    result[sev.toLowerCase()] = count
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapResponseTime(rows: Record<string, any>[]) {
  return rows.map((r) => ({
    region: String(r.disaster_type ?? ""),
    avgMinutes: Math.round(Number(r.avg_response_minutes ?? 0)),
  }))
}
