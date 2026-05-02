export type Role = "admin" | "operator" | "field_officer" | "warehouse_manager" | "finance"

export type Severity = "low" | "medium" | "high" | "critical"

export type IncidentStatus = "active" | "resolved" | "pending" | "contained" | "approved"

export type TeamStatus = "available" | "assigned" | "busy" | "offline"

export type TeamType = "medical" | "fire" | "search_rescue" | "logistics" | "hazmat"

export type DisasterType = "earthquake" | "flood" | "fire" | "hurricane" | "landslide" | "explosion" | "biological" | "other"

export type ApprovalStatus = "pending" | "approved" | "rejected"

export interface Incident {
  id: string
  reportId: number
  type: DisasterType
  location: string
  severity: Severity
  status: IncidentStatus
  assignedTeam: string | null
  reportedAt: string
  casualties: number
  description: string
}

export interface Team {
  id: string
  teamId: number
  name: string
  type: TeamType
  status: TeamStatus
  location: string
  members: number
  lead: string
  assignedIncidentId: string | null
  lastUpdate: string
}

export interface Hospital {
  id: string
  hospitalId: number
  name: string
  location: string
  totalBeds: number
  availableBeds: number
  icuBeds: number
  availableIcuBeds: number
  distanceKm: number
  contact: string
  admittedPatients?: number
  criticalCases?: number
  seriousCases?: number
}

export interface InventoryItem {
  id: string
  name: string
  category: "food" | "water" | "medicine" | "equipment" | "shelter"
  quantity: number
  unit: string
  minThreshold: number
  location: string
  lastUpdated: string
}

export interface FinanceRecord {
  date: string
  donations: number
  expenses: number
}

export interface BudgetEvent {
  event: string
  allocated: number
  spent: number
}

export interface AuditLog {
  id: string
  timestamp: string
  user: string
  role: Role
  action: string
  target: string
  status: "success" | "failed" | "pending"
  ipAddress: string
}

export interface ApprovalRequest {
  id: string
  requestId: number
  referenceId: number
  type: "resource_deployment" | "team_dispatch" | "budget_release" | "evacuation_order"
  requestedBy: string
  requestedAt: string
  description: string
  status: ApprovalStatus
  priority: Severity
  value?: string
}

export interface InventoryAlert {
  warehouseId: number
  warehouseName: string
  resourceId: number
  resourceName: string
  resourceType: string
  unit: string
  currentQuantity: number
  threshold: number
  alertLevel: "Out of Stock" | "Critical" | "Low"
  lastUpdated: string
}

export interface FinancialTransaction {
  transactionId: number
  transactionType: string
  amount: number
  currency: string
  description: string | null
  donorName: string | null
  status: string
  transactionDate: string
  recordedBy: string
}

export interface AllocationRecord {
  allocationId: number
  reportId: number
  incidentLabel: string
  warehouseName: string
  resourceName: string
  resourceType: string
  unit: string
  quantityDispatched: number
  quantityConsumed: number
  status: string
  requestedAt: string
}

export interface NavItem {
  label: string
  href: string
  iconName: string
  roles: Role[]
}
