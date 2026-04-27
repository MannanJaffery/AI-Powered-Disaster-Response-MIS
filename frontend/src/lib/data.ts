import type {
  Incident,
  Team,
  Hospital,
  InventoryItem,
  FinanceRecord,
  BudgetEvent,
  AuditLog,
  ApprovalRequest,
} from "./types"

export const incidents: Incident[] = [
  { id: "INC-001", type: "earthquake", location: "Northern District, Sector 4", severity: "critical", status: "active", assignedTeam: "Alpha Squad", reportedAt: "2026-04-27T06:12:00Z", casualties: 47, description: "Magnitude 6.8 earthquake causing widespread structural collapse and casualties across residential zones." },
  { id: "INC-002", type: "flood", location: "Riverside Zone B, Blocks 7–12", severity: "high", status: "active", assignedTeam: "Bravo Team", reportedAt: "2026-04-27T08:34:00Z", casualties: 12, description: "Flash flooding in dense residential area following 48-hour sustained rainfall. Rising water levels." },
  { id: "INC-003", type: "fire", location: "Industrial Complex A, Unit 5", severity: "high", status: "contained", assignedTeam: "Charlie Unit", reportedAt: "2026-04-27T04:50:00Z", casualties: 3, description: "Warehouse fire with chemical hazard. Partially contained. Evacuation of adjacent units ongoing." },
  { id: "INC-004", type: "landslide", location: "Mountain Pass Route 7, KM 23", severity: "critical", status: "active", assignedTeam: "Delta Force", reportedAt: "2026-04-27T03:18:00Z", casualties: 28, description: "Major landslide blocking primary mountain route. Multiple vehicles and a bus reported trapped." },
  { id: "INC-005", type: "flood", location: "Southern Lowlands, Districts 3–6", severity: "medium", status: "active", assignedTeam: "Echo Squad", reportedAt: "2026-04-26T22:05:00Z", casualties: 5, description: "Slow-rising floodwaters affecting agricultural zones. Three evacuation shelters activated." },
  { id: "INC-006", type: "earthquake", location: "Northern District, Aftershock Zone", severity: "medium", status: "active", assignedTeam: "Alpha Squad", reportedAt: "2026-04-27T09:01:00Z", casualties: 8, description: "4.2 magnitude aftershock following INC-001. Secondary building collapses reported." },
  { id: "INC-007", type: "fire", location: "Residential Block 23, Floor 8–14", severity: "high", status: "active", assignedTeam: "Foxtrot Team", reportedAt: "2026-04-27T10:22:00Z", casualties: 6, description: "Apartment building fire on upper floors. Evacuations underway. Several residents unaccounted for." },
  { id: "INC-008", type: "hurricane", location: "Coastal Zone A–C, full coastline", severity: "critical", status: "pending", assignedTeam: null, reportedAt: "2026-04-27T11:00:00Z", casualties: 0, description: "Category 4 hurricane projected landfall in 18 hours. Mandatory evacuation order under review." },
  { id: "INC-009", type: "explosion", location: "Chemical Plant 5, Eastern Industrial", severity: "critical", status: "active", assignedTeam: "Golf Unit", reportedAt: "2026-04-27T07:44:00Z", casualties: 19, description: "Explosion and toxic gas release at chemical processing facility. Exclusion zone of 2km established." },
  { id: "INC-010", type: "flood", location: "Downtown Core, Commerce District", severity: "low", status: "resolved", assignedTeam: "Bravo Team", reportedAt: "2026-04-26T14:30:00Z", casualties: 0, description: "Drainage overflow causing street flooding. Cleared within 6 hours. No injuries reported." },
  { id: "INC-011", type: "biological", location: "Port District, Terminal 3", severity: "high", status: "pending", assignedTeam: null, reportedAt: "2026-04-27T09:55:00Z", casualties: 2, description: "Suspected biological contamination from imported cargo. Quarantine protocol initiated. Awaiting lab confirmation." },
  { id: "INC-012", type: "landslide", location: "Highway Route 9, KM 41", severity: "medium", status: "active", assignedTeam: "Hotel Team", reportedAt: "2026-04-26T18:20:00Z", casualties: 0, description: "Partial roadblock due to soil erosion. Heavy machinery deployed for clearance." },
  { id: "INC-013", type: "fire", location: "Forest Reserve North, Grid N-7", severity: "low", status: "resolved", assignedTeam: "India Squad", reportedAt: "2026-04-26T11:15:00Z", casualties: 0, description: "Small brush fire contained within 4 hours. No civilian structures affected." },
  { id: "INC-014", type: "earthquake", location: "Eastern Province, City Center", severity: "high", status: "active", assignedTeam: "Juliet Force", reportedAt: "2026-04-27T05:33:00Z", casualties: 21, description: "5.9 magnitude earthquake. Historic buildings heavily damaged. Urban search and rescue underway." },
  { id: "INC-015", type: "flood", location: "Rural District 3, Farm Zones", severity: "medium", status: "pending", assignedTeam: null, reportedAt: "2026-04-27T10:45:00Z", casualties: 1, description: "Crop flooding and one isolated farmstead requiring evacuation. Road access compromised." },
]

export const teams: Team[] = [
  { id: "TEAM-001", name: "Alpha Squad", type: "search_rescue", status: "assigned", location: "Northern District, Sector 4", members: 12, lead: "Cpt. Marcus Chen", assignedIncidentId: "INC-001", lastUpdate: "2026-04-27T09:45:00Z" },
  { id: "TEAM-002", name: "Bravo Team", type: "medical", status: "busy", location: "Riverside Zone B", members: 8, lead: "Dr. Sarah Okafor", assignedIncidentId: "INC-002", lastUpdate: "2026-04-27T10:12:00Z" },
  { id: "TEAM-003", name: "Charlie Unit", type: "fire", status: "available", location: "Base Camp Alpha", members: 10, lead: "Lt. James Ruiz", assignedIncidentId: null, lastUpdate: "2026-04-27T08:30:00Z" },
  { id: "TEAM-004", name: "Delta Force", type: "search_rescue", status: "assigned", location: "Mountain Pass, KM 23", members: 15, lead: "Maj. Elena Volkov", assignedIncidentId: "INC-004", lastUpdate: "2026-04-27T09:58:00Z" },
  { id: "TEAM-005", name: "Echo Squad", type: "logistics", status: "assigned", location: "Southern Lowlands", members: 7, lead: "Sgt. David Park", assignedIncidentId: "INC-005", lastUpdate: "2026-04-27T08:55:00Z" },
  { id: "TEAM-006", name: "Foxtrot Team", type: "fire", status: "assigned", location: "Residential Block 23", members: 9, lead: "Cpt. Aisha Mohammed", assignedIncidentId: "INC-007", lastUpdate: "2026-04-27T10:30:00Z" },
  { id: "TEAM-007", name: "Golf Unit", type: "hazmat", status: "busy", location: "Chemical Plant 5", members: 6, lead: "Dr. Nathan Webb", assignedIncidentId: "INC-009", lastUpdate: "2026-04-27T10:05:00Z" },
  { id: "TEAM-008", name: "Hotel Team", type: "logistics", status: "assigned", location: "Highway Route 9", members: 11, lead: "Sgt. Priya Nair", assignedIncidentId: "INC-012", lastUpdate: "2026-04-27T07:40:00Z" },
  { id: "TEAM-009", name: "India Squad", type: "fire", status: "available", location: "Base Camp Beta", members: 8, lead: "Lt. Carlos Mendez", assignedIncidentId: null, lastUpdate: "2026-04-27T06:00:00Z" },
  { id: "TEAM-010", name: "Juliet Force", type: "search_rescue", status: "assigned", location: "Eastern Province, City Center", members: 14, lead: "Col. Yuki Tanaka", assignedIncidentId: "INC-014", lastUpdate: "2026-04-27T09:20:00Z" },
]

export const hospitals: Hospital[] = [
  { id: "HOS-001", name: "Central Medical Center", location: "Downtown Core", totalBeds: 450, availableBeds: 28, icuBeds: 40, availableIcuBeds: 3, distanceKm: 2.4, contact: "+1-555-0100" },
  { id: "HOS-002", name: "Northern District Hospital", location: "Northern District", totalBeds: 200, availableBeds: 8, icuBeds: 18, availableIcuBeds: 1, distanceKm: 5.1, contact: "+1-555-0210" },
  { id: "HOS-003", name: "St. Mary's Regional", location: "Midtown West", totalBeds: 320, availableBeds: 87, icuBeds: 28, availableIcuBeds: 9, distanceKm: 3.8, contact: "+1-555-0320" },
  { id: "HOS-004", name: "Eastern Province Medical", location: "Eastern Province", totalBeds: 180, availableBeds: 41, icuBeds: 16, availableIcuBeds: 4, distanceKm: 12.6, contact: "+1-555-0430" },
  { id: "HOS-005", name: "Emergency Trauma Center", location: "City Bypass, Junction 4", totalBeds: 150, availableBeds: 22, icuBeds: 30, availableIcuBeds: 5, distanceKm: 7.2, contact: "+1-555-0540" },
  { id: "HOS-006", name: "Riverside Medical Institute", location: "Riverside", totalBeds: 280, availableBeds: 112, icuBeds: 22, availableIcuBeds: 8, distanceKm: 8.9, contact: "+1-555-0650" },
  { id: "HOS-007", name: "Mount Sinai Hospital", location: "Northern Heights", totalBeds: 350, availableBeds: 89, icuBeds: 32, availableIcuBeds: 11, distanceKm: 15.3, contact: "+1-555-0760" },
  { id: "HOS-008", name: "Field Hospital Alpha (Temp.)", location: "Northern District, Ground Zero", totalBeds: 80, availableBeds: 61, icuBeds: 8, availableIcuBeds: 7, distanceKm: 5.5, contact: "+1-555-0870" },
]

export const inventory: InventoryItem[] = [
  { id: "INV-001", name: "Emergency Rations (MRE)", category: "food", quantity: 3800, unit: "packs", minThreshold: 5000, location: "Warehouse A", lastUpdated: "2026-04-27T08:00:00Z" },
  { id: "INV-002", name: "Protein Nutrition Bars", category: "food", quantity: 9200, unit: "bars", minThreshold: 2000, location: "Warehouse A", lastUpdated: "2026-04-27T08:00:00Z" },
  { id: "INV-003", name: "Canned Goods (Assorted)", category: "food", quantity: 18400, unit: "cans", minThreshold: 5000, location: "Warehouse B", lastUpdated: "2026-04-26T20:00:00Z" },
  { id: "INV-004", name: "Bottled Water (2L)", category: "water", quantity: 2100, unit: "bottles", minThreshold: 10000, location: "Warehouse A", lastUpdated: "2026-04-27T09:30:00Z" },
  { id: "INV-005", name: "Water Purification Tablets", category: "water", quantity: 14200, unit: "tablets", minThreshold: 5000, location: "Warehouse A", lastUpdated: "2026-04-26T15:00:00Z" },
  { id: "INV-006", name: "Portable Water Filters", category: "water", quantity: 145, unit: "units", minThreshold: 50, location: "Warehouse C", lastUpdated: "2026-04-25T12:00:00Z" },
  { id: "INV-007", name: "Water Storage Tanks (1000L)", category: "water", quantity: 38, unit: "tanks", minThreshold: 20, location: "Depot East", lastUpdated: "2026-04-26T10:00:00Z" },
  { id: "INV-008", name: "First Aid Kits (Standard)", category: "medicine", quantity: 412, unit: "kits", minThreshold: 200, location: "Warehouse C", lastUpdated: "2026-04-27T07:00:00Z" },
  { id: "INV-009", name: "Antibiotics (Broad Spectrum)", category: "medicine", quantity: 3200, unit: "doses", minThreshold: 1000, location: "Medical Store", lastUpdated: "2026-04-27T09:00:00Z" },
  { id: "INV-010", name: "IV Fluid Bags (500ml)", category: "medicine", quantity: 1480, unit: "bags", minThreshold: 500, location: "Medical Store", lastUpdated: "2026-04-27T09:00:00Z" },
  { id: "INV-011", name: "Insulin Vials", category: "medicine", quantity: 76, unit: "vials", minThreshold: 100, location: "Medical Store (Cold)", lastUpdated: "2026-04-27T06:00:00Z" },
  { id: "INV-012", name: "Morphine (Clinical)", category: "medicine", quantity: 380, unit: "doses", minThreshold: 200, location: "Secure Medical", lastUpdated: "2026-04-26T18:00:00Z" },
  { id: "INV-013", name: "Generator Sets (20kW)", category: "equipment", quantity: 14, unit: "units", minThreshold: 5, location: "Depot West", lastUpdated: "2026-04-25T16:00:00Z" },
  { id: "INV-014", name: "Satellite Phones", category: "equipment", quantity: 42, unit: "units", minThreshold: 15, location: "Comm Center", lastUpdated: "2026-04-27T07:30:00Z" },
  { id: "INV-015", name: "Search & Rescue Drones", category: "equipment", quantity: 9, unit: "units", minThreshold: 3, location: "Depot East", lastUpdated: "2026-04-26T14:00:00Z" },
  { id: "INV-016", name: "Emergency Tents (8-person)", category: "shelter", quantity: 520, unit: "tents", minThreshold: 300, location: "Warehouse B", lastUpdated: "2026-04-26T20:00:00Z" },
  { id: "INV-017", name: "Thermal Blankets", category: "shelter", quantity: 3200, unit: "blankets", minThreshold: 1000, location: "Warehouse B", lastUpdated: "2026-04-26T20:00:00Z" },
  { id: "INV-018", name: "Sleeping Bags (All-Weather)", category: "shelter", quantity: 1050, unit: "bags", minThreshold: 500, location: "Warehouse B", lastUpdated: "2026-04-26T20:00:00Z" },
]

export const financeData: FinanceRecord[] = [
  { date: "Apr 01", donations: 52000, expenses: 38000 },
  { date: "Apr 02", donations: 67000, expenses: 42000 },
  { date: "Apr 03", donations: 48000, expenses: 55000 },
  { date: "Apr 04", donations: 91000, expenses: 61000 },
  { date: "Apr 05", donations: 78000, expenses: 48000 },
  { date: "Apr 06", donations: 63000, expenses: 52000 },
  { date: "Apr 07", donations: 55000, expenses: 44000 },
  { date: "Apr 08", donations: 82000, expenses: 68000 },
  { date: "Apr 09", donations: 110000, expenses: 72000 },
  { date: "Apr 10", donations: 95000, expenses: 84000 },
  { date: "Apr 11", donations: 74000, expenses: 91000 },
  { date: "Apr 12", donations: 68000, expenses: 79000 },
  { date: "Apr 13", donations: 120000, expenses: 88000 },
  { date: "Apr 14", donations: 134000, expenses: 102000 },
  { date: "Apr 15", donations: 88000, expenses: 115000 },
  { date: "Apr 16", donations: 76000, expenses: 98000 },
  { date: "Apr 17", donations: 92000, expenses: 87000 },
  { date: "Apr 18", donations: 145000, expenses: 121000 },
  { date: "Apr 19", donations: 163000, expenses: 138000 },
  { date: "Apr 20", donations: 118000, expenses: 144000 },
  { date: "Apr 21", donations: 97000, expenses: 132000 },
  { date: "Apr 22", donations: 108000, expenses: 118000 },
  { date: "Apr 23", donations: 142000, expenses: 125000 },
  { date: "Apr 24", donations: 178000, expenses: 151000 },
  { date: "Apr 25", donations: 156000, expenses: 163000 },
  { date: "Apr 26", donations: 189000, expenses: 172000 },
  { date: "Apr 27", donations: 201000, expenses: 184000 },
]

export const budgetByEvent: BudgetEvent[] = [
  { event: "Earthquake Relief", allocated: 850000, spent: 612000 },
  { event: "Flood Response", allocated: 620000, spent: 441000 },
  { event: "Fire Containment", allocated: 280000, spent: 198000 },
  { event: "Hurricane Prep", allocated: 450000, spent: 87000 },
  { event: "Medical Surge", allocated: 390000, spent: 352000 },
]

export const inventoryByCategory = [
  { name: "Food", value: 31400, color: "#10b981" },
  { name: "Water", value: 16483, color: "#3b82f6" },
  { name: "Medicine", value: 5548, color: "#f59e0b" },
  { name: "Equipment", value: 65, color: "#8b5cf6" },
  { name: "Shelter", value: 4770, color: "#06b6d4" },
]

export const responseTimeByRegion = [
  { region: "Northern", avgMinutes: 18 },
  { region: "Southern", avgMinutes: 34 },
  { region: "Eastern", avgMinutes: 27 },
  { region: "Western", avgMinutes: 22 },
  { region: "Coastal", avgMinutes: 41 },
  { region: "Central", avgMinutes: 14 },
  { region: "Rural", avgMinutes: 58 },
]

export const incidentsByType = [
  { type: "Earthquake", count: 3, color: "#ef4444" },
  { type: "Flood", count: 5, color: "#3b82f6" },
  { type: "Fire", count: 3, color: "#f97316" },
  { type: "Hurricane", count: 1, color: "#8b5cf6" },
  { type: "Landslide", count: 2, color: "#f59e0b" },
  { type: "Explosion", count: 1, color: "#ef4444" },
]

export const approvalRequests: ApprovalRequest[] = [
  { id: "APR-001", type: "resource_deployment", requestedBy: "J. Martinez (Operator)", requestedAt: "2026-04-27T07:23:00Z", description: "Deploy 500 emergency rations and 1,000L water to Northern District Sector 4 — INC-001 relief.", status: "pending", priority: "critical", value: "$12,400" },
  { id: "APR-002", type: "team_dispatch", requestedBy: "K. Thompson (Field Officer)", requestedAt: "2026-04-27T08:15:00Z", description: "Dispatch India Squad to Flood Zone B for evacuation assistance — INC-002 support.", status: "pending", priority: "high" },
  { id: "APR-003", type: "budget_release", requestedBy: "S. Lee (Finance)", requestedAt: "2026-04-27T06:48:00Z", description: "Release $85,000 for emergency medical supply procurement from MediCorp International.", status: "pending", priority: "high", value: "$85,000" },
  { id: "APR-004", type: "evacuation_order", requestedBy: "M. Rodriguez (Operator)", requestedAt: "2026-04-27T09:02:00Z", description: "Mandatory evacuation order for Coastal Zone A — estimated 4,200 residents ahead of hurricane.", status: "pending", priority: "critical" },
  { id: "APR-005", type: "resource_deployment", requestedBy: "P. Kim (Warehouse)", requestedAt: "2026-04-26T16:34:00Z", description: "Resupply Field Hospital Alpha with ICU equipment and pharmaceuticals.", status: "approved", priority: "high", value: "$34,200" },
  { id: "APR-006", type: "budget_release", requestedBy: "A. Hassan (Finance)", requestedAt: "2026-04-26T14:20:00Z", description: "Emergency fuel procurement for 12 generator sets (10-day supply for INC-001 operations).", status: "approved", priority: "medium", value: "$18,600" },
  { id: "APR-007", type: "team_dispatch", requestedBy: "C. Williams (Operator)", requestedAt: "2026-04-26T11:45:00Z", description: "Deploy Hotel Team to Highway Route 9 for debris clearance operation.", status: "rejected", priority: "medium" },
  { id: "APR-008", type: "resource_deployment", requestedBy: "N. Okonkwo (Warehouse)", requestedAt: "2026-04-27T05:30:00Z", description: "Emergency insulin delivery to Northern District Hospital for 89 diabetic patients on site.", status: "pending", priority: "critical", value: "$7,800" },
]

export const auditLogs: AuditLog[] = [
  { id: "LOG-001", timestamp: "2026-04-27T10:45:23Z", user: "admin@drms.gov", role: "admin", action: "INCIDENT_ESCALATED", target: "INC-001 severity: HIGH → CRITICAL", status: "success", ipAddress: "192.168.1.101" },
  { id: "LOG-002", timestamp: "2026-04-27T10:38:17Z", user: "operator.chen@drms.gov", role: "operator", action: "TEAM_ASSIGNED", target: "Alpha Squad → INC-001", status: "success", ipAddress: "192.168.1.205" },
  { id: "LOG-003", timestamp: "2026-04-27T10:32:44Z", user: "finance.lee@drms.gov", role: "finance", action: "BUDGET_RELEASED", target: "APR-006: $18,600 (Fuel procurement)", status: "success", ipAddress: "192.168.1.312" },
  { id: "LOG-004", timestamp: "2026-04-27T10:25:09Z", user: "warehouse.kim@drms.gov", role: "warehouse_manager", action: "INVENTORY_UPDATED", target: "Bottled Water (2L): 3,200 → 2,100 units", status: "success", ipAddress: "192.168.1.408" },
  { id: "LOG-005", timestamp: "2026-04-27T10:18:33Z", user: "admin@drms.gov", role: "admin", action: "APPROVAL_GRANTED", target: "APR-005 — Field Hospital Alpha resupply", status: "success", ipAddress: "192.168.1.101" },
  { id: "LOG-006", timestamp: "2026-04-27T10:12:55Z", user: "operator.chen@drms.gov", role: "operator", action: "INCIDENT_CREATED", target: "INC-007 — Residential Block 23 Fire", status: "success", ipAddress: "192.168.1.205" },
  { id: "LOG-007", timestamp: "2026-04-27T10:05:40Z", user: "field.volkov@drms.gov", role: "field_officer", action: "STATUS_UPDATE", target: "TEAM-004 location: KM 18 → KM 23 Mountain Pass", status: "success", ipAddress: "10.0.2.44" },
  { id: "LOG-008", timestamp: "2026-04-27T09:58:12Z", user: "admin@drms.gov", role: "admin", action: "APPROVAL_REJECTED", target: "APR-007 — Hotel Team dispatch", status: "success", ipAddress: "192.168.1.101" },
  { id: "LOG-009", timestamp: "2026-04-27T09:50:28Z", user: "finance.hassan@drms.gov", role: "finance", action: "BUDGET_REQUEST", target: "APR-003: $85,000 medical supplies — submitted", status: "pending", ipAddress: "192.168.1.501" },
  { id: "LOG-010", timestamp: "2026-04-27T09:44:07Z", user: "operator.rodriguez@drms.gov", role: "operator", action: "EVACUATION_ORDER_ISSUED", target: "APR-004 — Coastal Zone A submitted for approval", status: "pending", ipAddress: "192.168.1.206" },
  { id: "LOG-011", timestamp: "2026-04-27T09:35:19Z", user: "warehouse.okonkwo@drms.gov", role: "warehouse_manager", action: "LOW_STOCK_ALERT", target: "Insulin Vials: 76 units (threshold: 100) — CRITICAL", status: "failed", ipAddress: "192.168.1.409" },
  { id: "LOG-012", timestamp: "2026-04-27T09:28:44Z", user: "admin@drms.gov", role: "admin", action: "HOSPITAL_CAPACITY_ALERT", target: "Northern District Hospital: 96% capacity", status: "success", ipAddress: "192.168.1.101" },
  { id: "LOG-013", timestamp: "2026-04-27T09:20:30Z", user: "field.tanaka@drms.gov", role: "field_officer", action: "CASUALTIES_REPORTED", target: "INC-014: 21 casualties confirmed, Eastern Province", status: "success", ipAddress: "10.0.2.55" },
  { id: "LOG-014", timestamp: "2026-04-27T09:12:15Z", user: "operator.thompson@drms.gov", role: "operator", action: "INCIDENT_STATUS_CHANGE", target: "INC-003 status: ACTIVE → CONTAINED", status: "success", ipAddress: "192.168.1.207" },
  { id: "LOG-015", timestamp: "2026-04-27T09:05:02Z", user: "admin@drms.gov", role: "admin", action: "USER_LOGIN", target: "admin@drms.gov — Session started", status: "success", ipAddress: "192.168.1.101" },
  { id: "LOG-016", timestamp: "2026-04-27T08:58:47Z", user: "warehouse.park@drms.gov", role: "warehouse_manager", action: "RESOURCE_ALLOCATED", target: "APR-005: 40 ICU equipment units → Field Hospital Alpha", status: "success", ipAddress: "192.168.1.410" },
  { id: "LOG-017", timestamp: "2026-04-27T08:44:33Z", user: "operator.chen@drms.gov", role: "operator", action: "TEAM_STATUS_UPDATE", target: "TEAM-003 status: ASSIGNED → AVAILABLE (INC-003 contained)", status: "success", ipAddress: "192.168.1.205" },
  { id: "LOG-018", timestamp: "2026-04-27T08:30:11Z", user: "finance.lee@drms.gov", role: "finance", action: "DONATION_RECORDED", target: "Anonymous: $201,000 — daily total updated", status: "success", ipAddress: "192.168.1.312" },
  { id: "LOG-019", timestamp: "2026-04-27T08:20:59Z", user: "admin@drms.gov", role: "admin", action: "SYSTEM_CONFIG_CHANGED", target: "Alert threshold: Severity HIGH auto-escalation enabled", status: "success", ipAddress: "192.168.1.101" },
  { id: "LOG-020", timestamp: "2026-04-27T08:08:22Z", user: "unknown@external.net", role: "operator", action: "LOGIN_ATTEMPT_FAILED", target: "Unauthorized access attempt — IP flagged", status: "failed", ipAddress: "203.45.67.89" },
]

export const liveEmergencyFeed = [
  { id: "FEED-001", timestamp: "2026-04-27T10:47:00Z", type: "alert", severity: "critical", message: "INC-009: Toxic gas readings rising at Chemical Plant 5. Golf Unit requesting immediate evacuation support." },
  { id: "FEED-002", timestamp: "2026-04-27T10:44:00Z", type: "update", severity: "high", message: "INC-001: Search teams locate 7 survivors in collapsed structure on Block 4-C. Medical extraction in progress." },
  { id: "FEED-003", timestamp: "2026-04-27T10:41:00Z", type: "alert", severity: "critical", message: "Hurricane tracking: Category 4 storm accelerating. Projected landfall revised to 14 hours. Request immediate action." },
  { id: "FEED-004", timestamp: "2026-04-27T10:38:00Z", type: "resource", severity: "medium", message: "INV-004: Bottled water inventory at 21% of minimum threshold. Resupply order critical." },
  { id: "FEED-005", timestamp: "2026-04-27T10:35:00Z", type: "update", severity: "medium", message: "INC-002: Flood level stabilizing in Blocks 10–12. Blocks 7–9 still at risk. Bravo Team requesting additional boats." },
  { id: "FEED-006", timestamp: "2026-04-27T10:32:00Z", type: "alert", severity: "high", message: "HOS-001: Central Medical Center ICU at 92.5% capacity. Patient overflow protocol activated." },
  { id: "FEED-007", timestamp: "2026-04-27T10:29:00Z", type: "update", severity: "low", message: "INC-010 resolved. Downtown Core flooding cleared. Bravo Team returning to staging area." },
  { id: "FEED-008", timestamp: "2026-04-27T10:26:00Z", type: "alert", severity: "high", message: "INC-011: Bio-containment team en route to Port District Terminal 3. Lab results in 4 hours." },
]
