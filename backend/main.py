from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
import pyodbc
import hashlib
from jose import jwt
import time

SECRET_KEY = "supersecretkey123"
ALGORITHM = "HS256"

app = FastAPI(
    title="Disaster Response MIS API",
    description="Backend API for the Smart Disaster Response System",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB CONNECTION
DB_CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-SNI5HJG\\SQLEXPRESS;"
    "DATABASE=DisasterMIS;"
    "Trusted_Connection=yes;"
)

def get_db_connection():
    try:
        return pyodbc.connect(DB_CONN_STR)
    except Exception as e:
        print("DB ERROR:", e)
        raise HTTPException(status_code=500, detail="Database connection failed")

def fetch_data(query: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query)

        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        conn.close()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AUTH
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest().upper()

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def require_role(allowed_roles: list):
    def checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return user
    return checker

# =========================
# ROLES (public – for registration dropdown)
# =========================
@app.get("/roles")
def get_roles():
    return fetch_data("SELECT role_id, role_name, description FROM Roles ORDER BY role_id")

# =========================
# REGISTER ENDPOINT
# =========================
@app.post("/register")
async def register(request: Request):
    data = await request.json()
    full_name = str(data.get("full_name", "")).strip()
    email     = str(data.get("email", "")).strip().lower()
    password  = str(data.get("password", ""))
    role_id   = data.get("role_id")

    if not full_name or not email or not password or not role_id:
        raise HTTPException(status_code=400, detail="All fields are required.")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    hashed = hash_password(password)

    conn   = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT user_id FROM Users WHERE email = ?", email)
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    cursor.execute("SELECT role_id FROM Roles WHERE role_id = ?", role_id)
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid role selected.")

    cursor.execute(
        "INSERT INTO Users (full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
        full_name, email, hashed, role_id
    )
    conn.commit()
    conn.close()
    return {"message": "Account created successfully."}

# =========================
# LOGIN ENDPOINT (FIXED)
# =========================
@app.post("/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    hashed_password = hash_password(password)

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT u.email, u.full_name, r.role_name, u.password_hash
    FROM Users u
    JOIN Roles r ON u.role_id = r.role_id
    WHERE u.email = ?
    """

    cursor.execute(query, email)
    user = cursor.fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="User not found")

    db_hash = user[3].strip().upper()

    if hashed_password != db_hash:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid password")

    conn.close()
   
    token = jwt.encode(
        {
            "sub": user[0],
            "role": user[2],
            "name": user[1]
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user[0],
            "role": user[2],
            "name": user[1]
        }
    }

# =========================
# USER / DASHBOARD UTILS
# =========================
@app.get("/api/users/me")
def get_user_me(user=Depends(get_current_user)):
    return user

@app.get("/api/dashboard/stats")
def get_dashboard_stats(user=Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    stats = {}
    try:
        cursor.execute("SELECT COUNT(*) FROM EmergencyReports WHERE status IN ('Pending', 'Active')")
        stats["active_incidents"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM RescueTeams WHERE availability = 'Available'")
        stats["available_teams"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT ISNULL(SUM(amount), 0) FROM FinancialTransactions WHERE transaction_type = 'Donation' AND status = 'Approved'")
        stats["total_donations"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT ISNULL(SUM(quantity), 0) FROM WarehouseInventory")
        stats["total_inventory_items"] = cursor.fetchone()[0]
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# SYSTEM ADMIN / CRUD
# =========================
@app.get("/api/users")
def get_all_users(user=Depends(require_role(["Administrator"]))):
    return fetch_data("""
        SELECT u.user_id, u.full_name, u.email, r.role_name
        FROM Users u
        JOIN Roles r ON u.role_id = r.role_id
        ORDER BY u.full_name
    """)

@app.patch("/api/users/{target_user_id}/role")
async def update_user_role(target_user_id: int, request: Request, user=Depends(require_role(["Administrator"]))):
    data = await request.json()
    role_id = data.get("role_id")
    if not role_id:
        raise HTTPException(status_code=400, detail="role_id is required.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT role_id FROM Roles WHERE role_id = ?", role_id)
        if not cursor.fetchone():
            raise HTTPException(status_code=400, detail="Invalid role_id.")
        
        cursor.execute("UPDATE Users SET role_id = ? WHERE user_id = ?", role_id, target_user_id)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found.")
        
        conn.commit()
        return {"message": "User role updated successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/teams")
async def create_team(request: Request, user=Depends(require_role(["Administrator"]))):
    data = await request.json()
    team_name = data.get("team_name")
    team_type = data.get("team_type")
    team_size = data.get("team_size", 1)
    location_id = data.get("location_id")
    
    if not all([team_name, team_type, location_id]):
        raise HTTPException(status_code=400, detail="team_name, team_type, and location_id are required.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO RescueTeams (team_name, team_type, team_size, location_id, availability)
               VALUES (?, ?, ?, ?, 'Available')""",
            team_name, team_type, team_size, location_id
        )
        conn.commit()
        return {"message": "Team created successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/hospitals")
async def create_hospital(request: Request, user=Depends(require_role(["Administrator"]))):
    data = await request.json()
    hospital_name = data.get("hospital_name")
    location_id = data.get("location_id")
    total_beds = data.get("total_beds")
    
    if not all([hospital_name, location_id, total_beds]):
        raise HTTPException(status_code=400, detail="hospital_name, location_id, and total_beds are required.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO Hospitals (hospital_name, location_id, total_beds, available_beds, is_active)
               VALUES (?, ?, ?, ?, 1)""",
            hospital_name, location_id, total_beds, total_beds
        )
        conn.commit()
        return {"message": "Hospital added successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/resources")
def get_resources(user=Depends(get_current_user)):
    return fetch_data("SELECT * FROM Resources ORDER BY resource_name")

@app.post("/api/resources")
async def create_resource(request: Request, user=Depends(require_role(["Administrator", "Warehouse Manager"]))):
    data = await request.json()
    resource_name = data.get("resource_name")
    resource_type = data.get("resource_type")
    unit = data.get("unit")
    threshold = data.get("low_stock_threshold", 0)
    
    if not all([resource_name, resource_type, unit]):
        raise HTTPException(status_code=400, detail="resource_name, resource_type, and unit are required.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO Resources (resource_name, resource_type, unit, low_stock_threshold)
               VALUES (?, ?, ?, ?)""",
            resource_name, resource_type, unit, threshold
        )
        conn.commit()
        return {"message": "Resource created successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# BASIC ENDPOINTS
# =========================
@app.get("/")
def read_root():
    return {"message": "FastAPI is running successfully!"}

@app.get("/health")
def health_check():
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "Database connection successful!"}
    except:
        return {"status": "Database connection failed."}

# =========================
# VIEWS
# =========================
@app.get("/api/emergencies")
def get_active_emergencies(user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    return fetch_data("SELECT * FROM vw_ActiveEmergencies ORDER BY reported_at DESC")

@app.get("/api/inventory")
def get_inventory_status(user=Depends(require_role(["Administrator", "Warehouse Manager"]))):
    return fetch_data("SELECT * FROM vw_InventoryStatus")

@app.get("/api/financials")
def get_financial_summary(user=Depends(require_role(["Administrator", "Finance Officer"]))):
    return fetch_data("SELECT * FROM vw_FinancialSummary ORDER BY transaction_date DESC")

@app.get("/api/teams")
def get_rescue_teams(user=Depends(require_role(["Administrator", "Field Officer"]))):
    return fetch_data("SELECT * FROM vw_RescueTeamStatus")

@app.get("/api/hospitals")
def get_hospital_capacity(user=Depends(get_current_user)):
    return fetch_data("SELECT * FROM vw_HospitalCapacity")

@app.get("/api/hospitals/status")
def get_hospital_status(user=Depends(get_current_user)):
    return fetch_data("""
        SELECT
            h.hospital_id,
            h.hospital_name,
            l.city,
            l.district,
            h.total_beds,
            h.available_beds,
            h.total_beds - h.available_beds AS occupied_beds,
            CAST(ROUND(
                (CAST(h.total_beds - h.available_beds AS FLOAT) / NULLIF(h.total_beds, 0)) * 100, 1
            ) AS DECIMAL(5,1)) AS occupancy_pct,
            h.contact_number,
            COUNT(pa.admission_id) AS admitted_patients,
            SUM(CASE WHEN pa.condition = 'Critical' THEN 1 ELSE 0 END) AS critical_cases,
            SUM(CASE WHEN pa.condition = 'Serious'  THEN 1 ELSE 0 END) AS serious_cases
        FROM Hospitals h
        INNER JOIN Locations l ON h.location_id = l.location_id
        LEFT JOIN PatientAdmissions pa
            ON h.hospital_id = pa.hospital_id AND pa.discharged_at IS NULL
        WHERE h.is_active = 1
        GROUP BY h.hospital_id, h.hospital_name, l.city, l.district,
                 h.total_beds, h.available_beds, h.contact_number
        ORDER BY h.hospital_id
    """)

# =========================
# REPORTS
# =========================
@app.get("/api/reports/incident-summary")
def get_incident_summary(user=Depends(require_role(["Administrator"]))):
    return fetch_data("""
        SELECT disaster_type, severity_level, COUNT(*) AS count
        FROM EmergencyReports
        WHERE status IN ('Active','Pending')
        GROUP BY disaster_type, severity_level
        ORDER BY count DESC;
    """)

@app.get("/api/reports/resource-utilization")
def get_resource_utilization():
    return fetch_data("""
        SELECT w.warehouse_name, r.resource_type, SUM(wi.quantity) AS total_qty
        FROM WarehouseInventory wi
        JOIN Warehouses w ON wi.warehouse_id = w.warehouse_id
        JOIN Resources r ON wi.resource_id = r.resource_id
        GROUP BY w.warehouse_name, r.resource_type;
    """)

@app.get("/api/reports/financial-balance")
def get_financial_balance():
    return fetch_data("""
        SELECT
          SUM(CASE WHEN transaction_type = 'Donation' THEN amount ELSE 0 END) AS total_donations,
          SUM(CASE WHEN transaction_type IN ('Expense','Procurement') THEN amount ELSE 0 END) AS total_expenses,
          SUM(CASE WHEN transaction_type = 'Donation' THEN amount ELSE -amount END) AS net_balance
        FROM FinancialTransactions
        WHERE status = 'Approved';
    """)

@app.get("/api/reports/response-time")
def get_team_response_time():
    return fetch_data("""
        SELECT er.disaster_type,
               AVG(DATEDIFF(MINUTE, er.reported_at, ta.assigned_at)) AS avg_response_minutes
        FROM TeamAssignments ta
        JOIN EmergencyReports er ON ta.report_id = er.report_id
        GROUP BY er.disaster_type;
    """)

# =========================
# ANALYTICS / AUDIT / APPROVALS
# =========================
@app.get("/api/incidents")
def get_all_incidents(user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    return fetch_data("""
        SELECT er.report_id, er.disaster_type, er.severity_level, er.status,
               er.reported_by, er.description, er.reported_at,
               l.city, l.district, l.province
        FROM EmergencyReports er
        INNER JOIN Locations l ON er.location_id = l.location_id
        ORDER BY er.reported_at DESC
    """)

@app.get("/api/audit-logs")
def get_audit_logs(user=Depends(require_role(["Administrator"]))):
    return fetch_data("""
        SELECT al.log_id, al.action, al.table_name, al.record_id,
               al.logged_at, al.ip_address,
               u.email AS user_email, r.role_name
        FROM AuditLogs al
        LEFT JOIN Users u ON al.user_id = u.user_id
        LEFT JOIN Roles r ON u.role_id = r.role_id
        ORDER BY al.logged_at DESC
    """)

@app.get("/api/approvals")
def get_approval_requests(user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    return fetch_data("""
        SELECT ar.request_id, ar.request_type, ar.reference_id,
               ar.status, ar.notes, ar.requested_at,
               u.full_name AS requested_by, r.role_name AS requester_role
        FROM ApprovalRequests ar
        INNER JOIN Users u ON ar.requested_by = u.user_id
        INNER JOIN Roles r ON u.role_id = r.role_id
        ORDER BY ar.requested_at DESC
    """)

# =========================
# LOCATIONS + INCIDENT CREATE
# =========================
@app.get("/api/locations")
def get_locations(user=Depends(get_current_user)):
    return fetch_data("SELECT location_id, city, district, province FROM Locations ORDER BY city")

@app.post("/api/incidents")
async def create_incident(request: Request, user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    data          = await request.json()
    location_id   = data.get("location_id")
    disaster_type = data.get("disaster_type")
    severity_level = data.get("severity_level")
    description   = str(data.get("description", "")).strip()
    reported_by   = str(data.get("reported_by", "Anonymous")).strip()
    reported_at   = data.get("reported_at")

    if not all([location_id, disaster_type, severity_level, description]):
        raise HTTPException(status_code=400, detail="location_id, disaster_type, severity_level, and description are required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if reported_at:
            cursor.execute(
                """INSERT INTO EmergencyReports
                   (location_id, disaster_type, severity_level, reported_by, description, status, reported_at)
                   VALUES (?, ?, ?, ?, ?, 'Pending', ?)""",
                location_id, disaster_type, severity_level, reported_by, description,
                str(reported_at).replace("T", " ")
            )
        else:
            cursor.execute(
                """INSERT INTO EmergencyReports
                   (location_id, disaster_type, severity_level, reported_by, description, status)
                   VALUES (?, ?, ?, ?, ?, 'Pending')""",
                location_id, disaster_type, severity_level, reported_by, description
            )
        conn.commit()
        return {"message": "Incident reported successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# WORKFLOW ACTIONS
# =========================

@app.patch("/api/incidents/{report_id}/approve")
def approve_incident(report_id: int, user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status FROM EmergencyReports WHERE report_id = ?", report_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Incident not found.")
        if row[0] != "Pending":
            raise HTTPException(status_code=400, detail=f"Only 'Pending' incidents can be approved (current: {row[0]}).")
        cursor.execute(
            "UPDATE EmergencyReports SET status = 'Approved', updated_at = GETDATE() WHERE report_id = ?",
            report_id
        )
        conn.commit()
        return {"message": "Incident approved."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/teams/available")
def get_available_teams(user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    return fetch_data(
        "SELECT team_id, team_name, team_type, team_size, city, district FROM vw_RescueTeamStatus WHERE availability = 'Available'"
    )

@app.post("/api/incidents/{report_id}/assign-team")
async def assign_team_to_incident(report_id: int, request: Request, user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    data = await request.json()
    team_id = data.get("team_id")
    if not team_id:
        raise HTTPException(status_code=400, detail="team_id is required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status FROM EmergencyReports WHERE report_id = ?", report_id)
        inc = cursor.fetchone()
        if not inc:
            raise HTTPException(status_code=404, detail="Incident not found.")
        if inc[0] not in ("Approved", "Active"):
            raise HTTPException(status_code=400, detail=f"Incident must be 'Approved' before assigning a team (current: {inc[0]}).")

        cursor.execute("SELECT availability FROM RescueTeams WHERE team_id = ?", team_id)
        team = cursor.fetchone()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")
        if team[0] != "Available":
            raise HTTPException(status_code=400, detail=f"Team is '{team[0]}' and cannot be assigned.")

        cursor.execute("SELECT user_id FROM Users WHERE email = ?", user["sub"])
        u = cursor.fetchone()
        if not u:
            raise HTTPException(status_code=401, detail="Authenticated user not found in database.")
        user_id = u[0]

        cursor.execute(
            "INSERT INTO TeamAssignments (team_id, report_id, assigned_by, assigned_at, status) VALUES (?, ?, ?, GETDATE(), 'Active')",
            team_id, report_id, user_id
        )
        cursor.execute(
            "UPDATE EmergencyReports SET status = 'Active', updated_at = GETDATE() WHERE report_id = ?",
            report_id
        )
        cursor.execute("UPDATE RescueTeams SET availability = 'Assigned' WHERE team_id = ?", team_id)
        conn.commit()
        return {"message": "Team assigned successfully."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.patch("/api/incidents/{report_id}/resolve")
def resolve_incident(report_id: int, user=Depends(require_role(["Administrator", "Emergency Operator"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status FROM EmergencyReports WHERE report_id = ?", report_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Incident not found.")
        if row[0] != "Active":
            raise HTTPException(status_code=400, detail=f"Only 'Active' incidents can be resolved (current: {row[0]}).")

        cursor.execute(
            "UPDATE EmergencyReports SET status = 'Resolved', updated_at = GETDATE() WHERE report_id = ?",
            report_id
        )
        cursor.execute(
            """UPDATE RescueTeams SET availability = 'Available'
               WHERE team_id IN (
                   SELECT team_id FROM TeamAssignments WHERE report_id = ? AND status = 'Active'
               )""",
            report_id
        )
        cursor.execute(
            "UPDATE TeamAssignments SET status = 'Completed', completed_at = GETDATE() WHERE report_id = ? AND status = 'Active'",
            report_id
        )
        conn.commit()
        return {"message": "Incident resolved."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/incidents/{report_id}/allocate-resource")
async def allocate_resource(report_id: int, request: Request, user=Depends(require_role(["Administrator", "Warehouse Manager"]))):
    data = await request.json()
    warehouse_id = data.get("warehouse_id")
    resource_id  = data.get("resource_id")
    quantity     = data.get("quantity")
    if not all([warehouse_id, resource_id, quantity]):
        raise HTTPException(status_code=400, detail="warehouse_id, resource_id, and quantity are required.")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status FROM EmergencyReports WHERE report_id = ?", report_id)
        inc = cursor.fetchone()
        if not inc:
            raise HTTPException(status_code=404, detail="Incident not found.")
        if inc[0] not in ("Active", "Approved"):
            raise HTTPException(status_code=400, detail=f"Cannot allocate to incident with status '{inc[0]}'.")

        cursor.execute(
            "SELECT quantity FROM WarehouseInventory WHERE warehouse_id = ? AND resource_id = ?",
            warehouse_id, resource_id
        )
        inv = cursor.fetchone()
        if not inv:
            raise HTTPException(status_code=404, detail="Resource not found in specified warehouse.")
        if inv[0] < quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {inv[0]}, Requested: {quantity}.")

        cursor.execute("SELECT user_id FROM Users WHERE email = ?", user["sub"])
        u = cursor.fetchone()
        user_id = u[0] if u else 1

        cursor.execute(
            """INSERT INTO ResourceAllocations
               (report_id, warehouse_id, resource_id, quantity_requested, quantity_dispatched, requested_by, status, requested_at)
               VALUES (?, ?, ?, ?, ?, ?, 'Dispatched', GETDATE())""",
            report_id, warehouse_id, resource_id, quantity, quantity, user_id
        )
        cursor.execute(
            "UPDATE WarehouseInventory SET quantity = quantity - ?, last_updated = GETDATE() WHERE warehouse_id = ? AND resource_id = ?",
            quantity, warehouse_id, resource_id
        )
        conn.commit()
        return {"message": "Resources allocated successfully."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.patch("/api/approvals/{request_id}/review")
async def review_approval(request_id: int, request: Request, user=Depends(require_role(["Administrator"]))):
    data   = await request.json()
    action = data.get("action")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'.")
    new_status = "Approved" if action == "approve" else "Rejected"

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT status, request_type, reference_id FROM ApprovalRequests WHERE request_id = ?",
            request_id
        )
        req = cursor.fetchone()
        if not req:
            raise HTTPException(status_code=404, detail="Approval request not found.")
        if req[0] != "Pending":
            raise HTTPException(status_code=400, detail=f"Request is already '{req[0]}'.")

        cursor.execute("SELECT user_id FROM Users WHERE email = ?", user["sub"])
        u = cursor.fetchone()
        user_id = u[0] if u else 1

        cursor.execute(
            "UPDATE ApprovalRequests SET status = ?, reviewed_by = ?, reviewed_at = GETDATE() WHERE request_id = ?",
            new_status, user_id, request_id
        )
        if action == "approve":
            req_type, ref_id = req[1], req[2]
            if req_type == "FinancialApproval":
                cursor.execute(
                    "UPDATE FinancialTransactions SET status='Approved', approved_by=?, approved_at=GETDATE() WHERE transaction_id=?",
                    user_id, ref_id
                )
            elif req_type == "ResourceDistribution":
                cursor.execute(
                    "UPDATE ResourceAllocations SET status='Approved', approved_by=?, approved_at=GETDATE() WHERE allocation_id=?",
                    user_id, ref_id
                )

        conn.commit()
        return {"message": f"Request {new_status.lower()}."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# TEAM STATUS & LOCATION
# =========================
@app.patch("/api/teams/{team_id}/status")
async def update_team_status(team_id: int, request: Request, user=Depends(require_role(["Administrator", "Field Officer"]))):
    data        = await request.json()
    status      = data.get("status")
    location_id = data.get("location_id") 

    valid = ("Available", "Assigned", "Busy", "Completed")
    if not status or status not in valid:
        raise HTTPException(status_code=400, detail=f"status must be one of: {', '.join(valid)}.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT team_id FROM RescueTeams WHERE team_id = ?", team_id)
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Team not found.")

        if location_id is not None:
            cursor.execute("SELECT location_id FROM Locations WHERE location_id = ?", location_id)
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Location not found.")
            cursor.execute(
                "UPDATE RescueTeams SET availability = ?, location_id = ? WHERE team_id = ?",
                status, location_id, team_id
            )
        else:
            cursor.execute("UPDATE RescueTeams SET availability = ? WHERE team_id = ?", status, team_id)

        conn.commit()
        return {"message": f"Team {team_id} status updated to '{status}'."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# INVENTORY MANAGEMENT
# =========================
@app.post("/api/inventory/receive")
async def receive_inventory(request: Request, user=Depends(require_role(["Administrator", "Warehouse Manager"]))):
    data         = await request.json()
    warehouse_id = data.get("warehouse_id")
    resource_id  = data.get("resource_id")
    quantity     = data.get("quantity")

    if not all([warehouse_id, resource_id, quantity]):
        raise HTTPException(status_code=400, detail="warehouse_id, resource_id, and quantity are required.")
    if not isinstance(quantity, (int, float)) or quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity must be a positive number.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT warehouse_id FROM Warehouses WHERE warehouse_id = ?", warehouse_id)
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Warehouse not found.")
        cursor.execute("SELECT resource_id FROM Resources WHERE resource_id = ?", resource_id)
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Resource not found.")

        cursor.execute(
            "SELECT quantity FROM WarehouseInventory WHERE warehouse_id = ? AND resource_id = ?",
            warehouse_id, resource_id
        )
        if cursor.fetchone():
            cursor.execute(
                "UPDATE WarehouseInventory SET quantity = quantity + ?, last_updated = GETDATE() WHERE warehouse_id = ? AND resource_id = ?",
                quantity, warehouse_id, resource_id
            )
        else:
            cursor.execute(
                "INSERT INTO WarehouseInventory (warehouse_id, resource_id, quantity, last_updated) VALUES (?, ?, ?, GETDATE())",
                warehouse_id, resource_id, quantity
            )
        conn.commit()
        return {"message": f"Stock received. Added {quantity} units to warehouse {warehouse_id}."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/inventory/alerts")
def get_inventory_alerts(user=Depends(require_role(["Administrator", "Warehouse Manager"]))):
    return fetch_data("""
        SELECT wi.warehouse_id, w.warehouse_name, wi.resource_id,
               r.resource_name, r.resource_type, r.unit,
               wi.quantity        AS current_quantity,
               r.low_stock_threshold AS threshold,
               CASE
                   WHEN wi.quantity = 0                          THEN 'Out of Stock'
                   WHEN wi.quantity <= r.low_stock_threshold * 0.5 THEN 'Critical'
                   ELSE 'Low'
               END AS alert_level,
               wi.last_updated
        FROM WarehouseInventory wi
        JOIN Warehouses w ON wi.warehouse_id = w.warehouse_id
        JOIN Resources  r ON wi.resource_id  = r.resource_id
        WHERE wi.quantity <= r.low_stock_threshold
        ORDER BY wi.quantity ASC
    """)

@app.get("/api/inventory/allocations")
def get_allocations(user=Depends(require_role(["Administrator", "Warehouse Manager", "Field Officer"]))):
    return fetch_data("""
        SELECT ra.allocation_id,
               ra.report_id,
               CONCAT('INC-', RIGHT('000'+CAST(ra.report_id AS VARCHAR),3)) AS incident_label,
               w.warehouse_name, r.resource_name, r.resource_type, r.unit,
               ra.quantity_dispatched, ra.quantity_consumed, ra.status, ra.requested_at
        FROM ResourceAllocations ra
        JOIN Warehouses w ON ra.warehouse_id  = w.warehouse_id
        JOIN Resources  r ON ra.resource_id   = r.resource_id
        WHERE ra.status IN ('Dispatched','Consumed')
        ORDER BY ra.requested_at DESC
    """)


@app.patch("/api/inventory/allocations/{allocation_id}/status")
async def update_allocation_status(allocation_id: int, request: Request, user=Depends(require_role(["Administrator", "Field Officer", "Warehouse Manager"]))):
    data              = await request.json()
    new_status        = data.get("status")
    quantity_consumed = data.get("quantity_consumed")

    if new_status != "Consumed":
        raise HTTPException(status_code=400, detail="Only permitted transition is to 'Consumed'.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT status, quantity_dispatched FROM ResourceAllocations WHERE allocation_id = ?",
            allocation_id
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Allocation not found.")
        if row[0] != "Dispatched":
            raise HTTPException(status_code=400, detail=f"Only 'Dispatched' allocations can be marked Consumed (current: {row[0]}).")

        consumed = quantity_consumed if quantity_consumed is not None else row[1]
        cursor.execute(
            "UPDATE ResourceAllocations SET status = 'Consumed', quantity_consumed = ? WHERE allocation_id = ?",
            consumed, allocation_id
        )
        conn.commit()
        return {"message": f"Allocation {allocation_id} marked as Consumed ({consumed} units)."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# HOSPITAL COORDINATION
# =========================
@app.patch("/api/hospitals/{hospital_id}/capacity")
async def update_hospital_capacity(hospital_id: int, request: Request, user=Depends(require_role(["Administrator", "Field Officer"]))):
    data           = await request.json()
    available_beds = data.get("available_beds")
    total_beds     = data.get("total_beds")

    if available_beds is None and total_beds is None:
        raise HTTPException(status_code=400, detail="At least one of available_beds or total_beds is required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT hospital_id FROM Hospitals WHERE hospital_id = ? AND is_active = 1", hospital_id)
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Hospital not found.")

        updates, params = [], []
        if available_beds is not None:
            if available_beds < 0:
                raise HTTPException(status_code=400, detail="available_beds cannot be negative.")
            updates.append("available_beds = ?")
            params.append(available_beds)
        if total_beds is not None:
            if total_beds < 1:
                raise HTTPException(status_code=400, detail="total_beds must be at least 1.")
            updates.append("total_beds = ?")
            params.append(total_beds)
        params.append(hospital_id)

        cursor.execute(f"UPDATE Hospitals SET {', '.join(updates)} WHERE hospital_id = ?", params)
        conn.commit()
        return {"message": f"Hospital {hospital_id} capacity updated."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/hospitals/assign-patient")
async def assign_patient(request: Request, user=Depends(require_role(["Administrator", "Emergency Operator", "Field Officer"]))):
    data         = await request.json()
    patient_name = str(data.get("patient_name", "")).strip()
    condition    = data.get("condition", "Stable")
    age          = data.get("age")
    report_id    = data.get("report_id")
    location_id  = data.get("location_id")

    if not patient_name:
        raise HTTPException(status_code=400, detail="patient_name is required.")
    if condition not in ("Stable", "Serious", "Critical"):
        raise HTTPException(status_code=400, detail="condition must be Stable, Serious, or Critical.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id FROM Users WHERE email = ?", user["sub"])
        u = cursor.fetchone()
        user_id = u[0] if u else None

        if location_id:
            cursor.execute("""
                SELECT TOP 1 h.hospital_id, h.hospital_name, h.available_beds
                FROM Hospitals h
                JOIN Locations hl ON h.location_id = hl.location_id
                CROSS JOIN (SELECT latitude, longitude FROM Locations WHERE location_id = ?) pl
                WHERE h.available_beds > 0 AND h.is_active = 1
                ORDER BY SQRT(POWER(hl.latitude  - pl.latitude,  2)
                            + POWER(hl.longitude - pl.longitude, 2)) ASC
            """, location_id)
        else:
            cursor.execute("""
                SELECT TOP 1 hospital_id, hospital_name, available_beds
                FROM Hospitals
                WHERE available_beds > 0 AND is_active = 1
                ORDER BY available_beds DESC
            """)

        hosp = cursor.fetchone()
        if not hosp:
            raise HTTPException(status_code=400, detail="No hospitals with available bed capacity.")

        hospital_id, hospital_name, available_beds = hosp

        cursor.execute("""
            INSERT INTO PatientAdmissions
                (hospital_id, report_id, patient_name, age, condition, admitted_at, assigned_by)
            VALUES (?, ?, ?, ?, ?, GETDATE(), ?)
        """, hospital_id, report_id, patient_name, age, condition, user_id)
        conn.commit()
        return {
            "message":        f"Patient assigned to {hospital_name}.",
            "hospital_id":    hospital_id,
            "hospital_name":  hospital_name,
            "remaining_beds": available_beds - 1,
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# FINANCIAL MANAGEMENT
# =========================
@app.post("/api/financials/transaction")
async def create_transaction(request: Request, user=Depends(require_role(["Administrator", "Finance Officer"]))):
    data             = await request.json()
    transaction_type = data.get("transaction_type")
    amount           = data.get("amount")
    description      = str(data.get("description", "")).strip() or None
    currency         = str(data.get("currency", "PKR")).strip() or "PKR"
    donor_name       = data.get("donor_name")
    report_id        = data.get("report_id")

    valid_types = ("Donation", "Expense", "Procurement")
    if not transaction_type or transaction_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"transaction_type must be one of: {', '.join(valid_types)}.")
    if not amount or not isinstance(amount, (int, float)) or amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be a positive number.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id FROM Users WHERE email = ?", user["sub"])
        u = cursor.fetchone()
        if not u:
            raise HTTPException(status_code=401, detail="Authenticated user not found.")
        user_id = u[0]

        # FIX APPLIED HERE: Replaced OUTPUT INSERTED with NOCOUNT and SCOPE_IDENTITY()
        cursor.execute("""
            SET NOCOUNT ON;
            INSERT INTO FinancialTransactions
                (transaction_type, amount, currency, report_id, description, donor_name,
                 recorded_by, status, transaction_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', GETDATE());
            SELECT SCOPE_IDENTITY();
        """, transaction_type, amount, currency, report_id, description, donor_name, user_id)
        
        row = cursor.fetchone()
        transaction_id = row[0]

        notes = f"{transaction_type}: {description or 'No description'} — {currency} {amount:,.2f}"
        cursor.execute("""
            INSERT INTO ApprovalRequests
                (request_type, reference_id, requested_by, status, notes, requested_at)
            VALUES ('FinancialApproval', ?, ?, 'Pending', ?, GETDATE())
        """, transaction_id, user_id, notes)
        
        conn.commit()
        return {"message": "Transaction recorded and submitted for approval.", "transaction_id": transaction_id}
    
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/financials/{transaction_id}/audit")
def get_transaction_audit(transaction_id: int, user=Depends(require_role(["Administrator", "Finance Officer"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT ft.transaction_id, ft.transaction_type, ft.amount, ft.currency,
                   ft.description, ft.donor_name, ft.status, ft.transaction_date,
                   ru.full_name AS recorded_by,
                   au.full_name AS approved_by,
                   ft.approved_at
            FROM FinancialTransactions ft
            JOIN  Users ru ON ft.recorded_by = ru.user_id
            LEFT JOIN Users au ON ft.approved_by = au.user_id
            WHERE ft.transaction_id = ?
        """, transaction_id)
        tx = cursor.fetchone()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found.")
        tx_cols     = [col[0] for col in cursor.description]
        transaction = dict(zip(tx_cols, tx))

        cursor.execute("""
            SELECT ar.request_id, ar.status, ar.notes, ar.requested_at, ar.reviewed_at,
                   rv.full_name AS reviewed_by
            FROM ApprovalRequests ar
            LEFT JOIN Users rv ON ar.reviewed_by = rv.user_id
            WHERE ar.request_type = 'FinancialApproval' AND ar.reference_id = ?
            ORDER BY ar.requested_at DESC
        """, transaction_id)
        ap_cols   = [col[0] for col in cursor.description]
        approvals = [dict(zip(ap_cols, row)) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT al.log_id, al.action, al.old_value, al.new_value,
                   al.logged_at, al.ip_address,
                   u.full_name AS user_name, r.role_name
            FROM AuditLogs al
            LEFT JOIN Users u ON al.user_id   = u.user_id
            LEFT JOIN Roles r ON u.role_id    = r.role_id
            WHERE al.table_name = 'FinancialTransactions' AND al.record_id = ?
            ORDER BY al.logged_at DESC
        """, transaction_id)
        al_cols     = [col[0] for col in cursor.description]
        audit_trail = [dict(zip(al_cols, row)) for row in cursor.fetchall()]

        return {"transaction": transaction, "approvals": approvals, "audit_trail": audit_trail}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# GENERIC APPROVAL SUBMIT
# =========================
@app.post("/api/approvals/submit")
async def submit_approval(request: Request, user=Depends(get_current_user)):
    data         = await request.json()
    request_type = str(data.get("request_type", "")).strip()
    notes        = str(data.get("notes", "")).strip()
    reference_id = data.get("reference_id")

    if not request_type:
        raise HTTPException(status_code=400, detail="request_type is required.")
    if not notes:
        raise HTTPException(status_code=400, detail="notes is required.")
    if reference_id is None:
        raise HTTPException(status_code=400, detail="reference_id is required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id FROM Users WHERE email = ?", user["sub"])
        u = cursor.fetchone()
        if not u:
            raise HTTPException(status_code=401, detail="Authenticated user not found.")
        user_id = u[0]

        cursor.execute("""
            INSERT INTO ApprovalRequests
                (request_type, reference_id, requested_by, status, notes, requested_at)
            VALUES (?, ?, ?, 'Pending', ?, GETDATE())
        """, request_type, reference_id, user_id, notes)
        conn.commit()
        return {"message": "Approval request submitted successfully."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =========================
# DATABASE PERFORMANCE & AUDIT 
# =========================
@app.get("/api/performance/test-view")
def test_view_performance(user=Depends(require_role(["Administrator"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Measure Base Tables query time
        start_table = time.time()
        cursor.execute("""
            SELECT er.report_id, er.disaster_type, er.severity_level, er.status,
                   l.city, l.district, l.province
            FROM EmergencyReports er
            JOIN Locations l ON er.location_id = l.location_id
            WHERE er.status IN ('Active', 'Pending')
        """)
        cursor.fetchall()
        end_table = time.time()
        base_table_time = end_table - start_table

        # Measure View query time
        start_view = time.time()
        cursor.execute("SELECT * FROM vw_ActiveEmergencies")
        cursor.fetchall()
        end_view = time.time()
        view_time = end_view - start_view

        return {
            "base_table_execution_seconds": round(base_table_time, 5),
            "view_execution_seconds": round(view_time, 5),
            "difference_seconds": round(abs(base_table_time - view_time), 5),
            "faster_method": "View" if view_time < base_table_time else "Base Tables"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/performance/test-index")
def test_index_performance(user=Depends(require_role(["Administrator"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        start_time = time.time()
        cursor.execute("""
            SELECT report_id, disaster_type, severity_level, status 
            FROM EmergencyReports 
            WHERE severity_level = 'Critical' AND status = 'Active'
        """)
        cursor.fetchall()
        exec_time = time.time() - start_time
        
        return {
            "query_description": "SELECT on EmergencyReports filtering by severity_level and status",
            "execution_time_seconds": round(exec_time, 5),
            "index_recommendation": "For optimal performance, ensure a composite index exists on (status, severity_level)."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()