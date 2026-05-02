-- ============================================================
-- SMART DISASTER RESPONSE MIS
-- SQL Server Management Studio Script
-- DDL + DML + Indexes + Triggers + Views (COMPLETE FILE)
-- ============================================================

-- Safely wipe existing tables in correct dependency order to avoid "sys.databases" errors
DROP TABLE IF EXISTS StockAlerts;
DROP TABLE IF EXISTS AuditLogs;
DROP TABLE IF EXISTS ApprovalRequests;
DROP TABLE IF EXISTS FinancialTransactions;
DROP TABLE IF EXISTS PatientAdmissions;
DROP TABLE IF EXISTS Hospitals;
DROP TABLE IF EXISTS ResourceAllocations;
DROP TABLE IF EXISTS WarehouseInventory;
DROP TABLE IF EXISTS Resources;
DROP TABLE IF EXISTS Warehouses;
DROP TABLE IF EXISTS TeamAssignments;
DROP TABLE IF EXISTS RescueTeams;
DROP TABLE IF EXISTS EmergencyReports;
DROP TABLE IF EXISTS Locations;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;
GO

-- ============================================================
-- 1. DDL - TABLE DEFINITIONS
-- ============================================================

-- USERS & ROLES
CREATE TABLE Roles (
    role_id     INT IDENTITY(1,1) PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL UNIQUE,  
    description VARCHAR(200)
);

CREATE TABLE Users (
    user_id         INT IDENTITY(1,1) PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(256) NOT NULL,
    role_id         INT NOT NULL REFERENCES Roles(role_id),
    is_active       BIT NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT GETDATE()
);

-- LOCATIONS
CREATE TABLE Locations (
    location_id     INT IDENTITY(1,1) PRIMARY KEY,
    city            VARCHAR(100) NOT NULL,
    district        VARCHAR(100) NOT NULL,
    province        VARCHAR(100) NOT NULL,
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6)
);

-- EMERGENCY REPORTS
CREATE TABLE EmergencyReports (
    report_id       INT IDENTITY(1,1) PRIMARY KEY,
    location_id     INT NOT NULL REFERENCES Locations(location_id),
    disaster_type   VARCHAR(50) NOT NULL,   
    severity_level  VARCHAR(20) NOT NULL,   
    reported_by     VARCHAR(100) NOT NULL,
    contact_number  VARCHAR(20),
    description     NVARCHAR(500),
    status          VARCHAR(30) NOT NULL DEFAULT 'Pending',  
    reported_at     DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME
);

-- RESCUE TEAMS
CREATE TABLE RescueTeams (
    team_id         INT IDENTITY(1,1) PRIMARY KEY,
    team_name       VARCHAR(100) NOT NULL,
    team_type       VARCHAR(50) NOT NULL,   
    location_id     INT REFERENCES Locations(location_id),
    team_size       INT NOT NULL,
    availability    VARCHAR(30) NOT NULL DEFAULT 'Available',  
    created_at      DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE TeamAssignments (
    assignment_id   INT IDENTITY(1,1) PRIMARY KEY,
    team_id         INT NOT NULL REFERENCES RescueTeams(team_id),
    report_id       INT NOT NULL REFERENCES EmergencyReports(report_id),
    assigned_by     INT NOT NULL REFERENCES Users(user_id),
    assigned_at     DATETIME NOT NULL DEFAULT GETDATE(),
    completed_at    DATETIME,
    notes           NVARCHAR(300),
    status          VARCHAR(30) NOT NULL DEFAULT 'Active'  
);

-- WAREHOUSES & RESOURCES
CREATE TABLE Warehouses (
    warehouse_id    INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_name  VARCHAR(100) NOT NULL,
    location_id     INT NOT NULL REFERENCES Locations(location_id),
    manager_id      INT REFERENCES Users(user_id),
    capacity        INT NOT NULL,
    is_active       BIT NOT NULL DEFAULT 1
);

CREATE TABLE Resources (
    resource_id     INT IDENTITY(1,1) PRIMARY KEY,
    resource_name   VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,   
    unit            VARCHAR(20) NOT NULL,   
    low_stock_threshold INT NOT NULL DEFAULT 50
);

CREATE TABLE WarehouseInventory (
    inventory_id    INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id    INT NOT NULL REFERENCES Warehouses(warehouse_id),
    resource_id     INT NOT NULL REFERENCES Resources(resource_id),
    quantity        INT NOT NULL DEFAULT 0,
    last_updated    DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_Warehouse_Resource UNIQUE (warehouse_id, resource_id)
);

CREATE TABLE ResourceAllocations (
    allocation_id   INT IDENTITY(1,1) PRIMARY KEY,
    report_id       INT NOT NULL REFERENCES EmergencyReports(report_id),
    warehouse_id    INT NOT NULL REFERENCES Warehouses(warehouse_id),
    resource_id     INT NOT NULL REFERENCES Resources(resource_id),
    quantity_requested INT NOT NULL,
    quantity_dispatched INT DEFAULT 0,
    quantity_consumed   INT DEFAULT 0,
    requested_by    INT NOT NULL REFERENCES Users(user_id),
    approved_by     INT REFERENCES Users(user_id),
    status          VARCHAR(30) NOT NULL DEFAULT 'Pending',  
    requested_at    DATETIME NOT NULL DEFAULT GETDATE(),
    approved_at     DATETIME,
    dispatched_at   DATETIME
);

-- HOSPITALS
CREATE TABLE Hospitals (
    hospital_id     INT IDENTITY(1,1) PRIMARY KEY,
    hospital_name   VARCHAR(150) NOT NULL,
    location_id     INT NOT NULL REFERENCES Locations(location_id),
    total_beds      INT NOT NULL,
    available_beds  INT NOT NULL,
    contact_number  VARCHAR(20),
    is_active       BIT NOT NULL DEFAULT 1
);

CREATE TABLE PatientAdmissions (
    admission_id    INT IDENTITY(1,1) PRIMARY KEY,
    hospital_id     INT NOT NULL REFERENCES Hospitals(hospital_id),
    report_id       INT REFERENCES EmergencyReports(report_id),
    patient_name    VARCHAR(100) NOT NULL,
    age             INT,
    condition       VARCHAR(50) NOT NULL,   
    admitted_at     DATETIME NOT NULL DEFAULT GETDATE(),
    discharged_at   DATETIME,
    assigned_by     INT REFERENCES Users(user_id)
);

-- FINANCIAL MANAGEMENT
CREATE TABLE FinancialTransactions (
    transaction_id      INT IDENTITY(1,1) PRIMARY KEY,
    transaction_type    VARCHAR(30) NOT NULL,  
    amount              DECIMAL(15,2) NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'PKR',
    report_id           INT REFERENCES EmergencyReports(report_id),
    description         NVARCHAR(300),
    donor_name          VARCHAR(100),            
    recorded_by         INT NOT NULL REFERENCES Users(user_id),
    approved_by         INT REFERENCES Users(user_id),
    status              VARCHAR(30) NOT NULL DEFAULT 'Pending',  
    transaction_date    DATETIME NOT NULL DEFAULT GETDATE(),
    approved_at         DATETIME
);

-- APPROVAL WORKFLOW
CREATE TABLE ApprovalRequests (
    request_id      INT IDENTITY(1,1) PRIMARY KEY,
    request_type    VARCHAR(50) NOT NULL,  
    reference_id    INT NOT NULL,          
    requested_by    INT NOT NULL REFERENCES Users(user_id),
    reviewed_by     INT REFERENCES Users(user_id),
    status          VARCHAR(20) NOT NULL DEFAULT 'Pending',  
    notes           NVARCHAR(300),
    requested_at    DATETIME NOT NULL DEFAULT GETDATE(),
    reviewed_at     DATETIME
);

-- AUDIT & LOGS
CREATE TABLE AuditLogs (
    log_id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id         INT REFERENCES Users(user_id),
    action          VARCHAR(100) NOT NULL,
    table_name      VARCHAR(100),
    record_id       INT,
    old_value       NVARCHAR(MAX),
    new_value       NVARCHAR(MAX),
    logged_at       DATETIME NOT NULL DEFAULT GETDATE(),
    ip_address      VARCHAR(45)
);

CREATE TABLE StockAlerts (
    alert_id        INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id    INT NOT NULL REFERENCES Warehouses(warehouse_id),
    resource_id     INT NOT NULL REFERENCES Resources(resource_id),
    current_quantity INT NOT NULL,
    threshold       INT NOT NULL,
    alert_type      VARCHAR(30) NOT NULL DEFAULT 'LowStock',
    is_resolved     BIT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT GETDATE()
);

GO

-- ============================================================
-- 2. INDEXES
-- ============================================================

-- Emergency Reports - frequently filtered
CREATE INDEX IX_EmergencyReports_DisasterType   ON EmergencyReports(disaster_type);
CREATE INDEX IX_EmergencyReports_Severity       ON EmergencyReports(severity_level);
CREATE INDEX IX_EmergencyReports_Status         ON EmergencyReports(status);
CREATE INDEX IX_EmergencyReports_ReportedAt     ON EmergencyReports(reported_at);
CREATE INDEX IX_EmergencyReports_Location       ON EmergencyReports(location_id);
-- Composite: common filter combo
CREATE INDEX IX_EmergencyReports_Type_Severity  ON EmergencyReports(disaster_type, severity_level);

-- Resource allocations
CREATE INDEX IX_ResourceAllocations_Status      ON ResourceAllocations(status);
CREATE INDEX IX_ResourceAllocations_RequestedAt ON ResourceAllocations(requested_at);
CREATE INDEX IX_ResourceAllocations_Resource    ON ResourceAllocations(resource_id);

-- Financial transactions
CREATE INDEX IX_FinancialTx_Type                ON FinancialTransactions(transaction_type);
CREATE INDEX IX_FinancialTx_Date                ON FinancialTransactions(transaction_date);
CREATE INDEX IX_FinancialTx_Status              ON FinancialTransactions(status);

-- Rescue teams
CREATE INDEX IX_RescueTeams_Availability        ON RescueTeams(availability);
CREATE INDEX IX_RescueTeams_Type                ON RescueTeams(team_type);

-- Inventory
CREATE INDEX IX_Inventory_Resource              ON WarehouseInventory(resource_id);
CREATE INDEX IX_Inventory_Warehouse             ON WarehouseInventory(warehouse_id);

-- Audit logs
CREATE INDEX IX_AuditLogs_User                  ON AuditLogs(user_id);
CREATE INDEX IX_AuditLogs_LoggedAt              ON AuditLogs(logged_at);
CREATE INDEX IX_AuditLogs_Table                 ON AuditLogs(table_name);

GO

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- Trigger 1: Update rescue team status when assigned
CREATE OR ALTER TRIGGER trg_TeamAssignment_UpdateStatus
ON TeamAssignments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RescueTeams
    SET availability = 'Assigned'
    WHERE team_id IN (SELECT team_id FROM inserted);

    INSERT INTO AuditLogs(user_id, action, table_name, record_id, new_value, logged_at)
    SELECT assigned_by, 'TEAM_ASSIGNED', 'TeamAssignments', assignment_id,
           CONCAT('Team assigned to report #', report_id), GETDATE()
    FROM inserted;
END;
GO

-- Trigger 2: Update rescue team status on assignment completion
CREATE OR ALTER TRIGGER trg_TeamAssignment_Complete
ON TeamAssignments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(status)
    BEGIN
        UPDATE RescueTeams
        SET availability = 'Available'
        WHERE team_id IN (
            SELECT team_id FROM inserted WHERE status IN ('Completed', 'Cancelled')
        );
    END
END;
GO

-- Trigger 3: Deduct inventory after resource allocation is dispatched
CREATE OR ALTER TRIGGER trg_ResourceAllocation_DeductInventory
ON ResourceAllocations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(status)
    BEGIN
        -- Deduct from inventory when dispatched
        UPDATE wi
        SET wi.quantity = wi.quantity - i.quantity_dispatched,
            wi.last_updated = GETDATE()
        FROM WarehouseInventory wi
        INNER JOIN inserted i ON wi.warehouse_id = i.warehouse_id AND wi.resource_id = i.resource_id
        WHERE i.status = 'Dispatched';

        -- Prevent negative inventory
        IF EXISTS (
            SELECT 1 FROM WarehouseInventory WHERE quantity < 0
        )
        BEGIN
            RAISERROR('Insufficient stock. Allocation would result in negative inventory.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Generate low stock alerts
        INSERT INTO StockAlerts(warehouse_id, resource_id, current_quantity, threshold, alert_type)
        SELECT wi.warehouse_id, wi.resource_id, wi.quantity, r.low_stock_threshold, 'LowStock'
        FROM WarehouseInventory wi
        INNER JOIN Resources r ON wi.resource_id = r.resource_id
        INNER JOIN inserted i ON wi.warehouse_id = i.warehouse_id AND wi.resource_id = i.resource_id
        WHERE wi.quantity <= r.low_stock_threshold
          AND i.status = 'Dispatched'
          AND NOT EXISTS (
              SELECT 1 FROM StockAlerts sa
              WHERE sa.warehouse_id = wi.warehouse_id
                AND sa.resource_id = wi.resource_id
                AND sa.is_resolved = 0
          );
    END
END;
GO

-- Trigger 4: Log financial transactions into audit
CREATE OR ALTER TRIGGER trg_FinancialTransaction_Audit
ON FinancialTransactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO AuditLogs(user_id, action, table_name, record_id, new_value, logged_at)
    SELECT recorded_by,
           CASE WHEN EXISTS (SELECT 1 FROM deleted d WHERE d.transaction_id = i.transaction_id)
                THEN 'FINANCIAL_UPDATE' ELSE 'FINANCIAL_INSERT' END,
           'FinancialTransactions',
           transaction_id,
           CONCAT(transaction_type, ' | Amount: ', amount, ' | Status: ', status),
           GETDATE()
    FROM inserted i;
END;
GO

-- Trigger 5: Log hospital bed updates
CREATE OR ALTER TRIGGER trg_Hospital_BedUpdate
ON Hospitals
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(available_beds)
    BEGIN
        INSERT INTO AuditLogs(action, table_name, record_id, old_value, new_value, logged_at)
        SELECT 'HOSPITAL_BED_UPDATE', 'Hospitals', i.hospital_id,
               CONCAT('Available beds: ', d.available_beds),
               CONCAT('Available beds: ', i.available_beds),
               GETDATE()
        FROM inserted i INNER JOIN deleted d ON i.hospital_id = d.hospital_id;
    END
END;
GO

-- Trigger 6: Update hospital bed count when patient admitted
CREATE OR ALTER TRIGGER trg_PatientAdmission_UpdateBeds
ON PatientAdmissions
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Hospitals
    SET available_beds = available_beds - 1
    WHERE hospital_id IN (SELECT hospital_id FROM inserted)
      AND available_beds > 0;

    IF EXISTS (
        SELECT 1 FROM Hospitals h
        INNER JOIN inserted i ON h.hospital_id = i.hospital_id
        WHERE h.available_beds < 0
    )
    BEGIN
        RAISERROR('No available beds in the selected hospital.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- Trigger 7: Update hospital bed count on discharge
CREATE OR ALTER TRIGGER trg_PatientDischarge_UpdateBeds
ON PatientAdmissions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(discharged_at)
    BEGIN
        UPDATE Hospitals
        SET available_beds = available_beds + 1
        WHERE hospital_id IN (
            SELECT hospital_id FROM inserted WHERE discharged_at IS NOT NULL
        );
    END
END;
GO

-- ============================================================
-- 4. VIEWS
-- ============================================================

-- View 1: Active emergencies with location detail
CREATE OR ALTER VIEW vw_ActiveEmergencies AS
SELECT
    er.report_id,
    er.disaster_type,
    er.severity_level,
    er.status,
    er.reported_by,
    er.description,
    er.reported_at,
    l.city,
    l.district,
    l.province,
    l.latitude,
    l.longitude
FROM EmergencyReports er
INNER JOIN Locations l ON er.location_id = l.location_id
WHERE er.status IN ('Pending', 'Active');
GO

-- View 2: Inventory status with warehouse and resource info
CREATE OR ALTER VIEW vw_InventoryStatus AS
SELECT
    w.warehouse_id,
    w.warehouse_name,
    l.city AS warehouse_city,
    r.resource_id,
    r.resource_name,
    r.resource_type,
    r.unit,
    wi.quantity,
    r.low_stock_threshold,
    CASE WHEN wi.quantity <= r.low_stock_threshold THEN 'LOW STOCK' ELSE 'OK' END AS stock_status,
    wi.last_updated
FROM WarehouseInventory wi
INNER JOIN Warehouses w ON wi.warehouse_id = w.warehouse_id
INNER JOIN Resources r ON wi.resource_id = r.resource_id
INNER JOIN Locations l ON w.location_id = l.location_id;
GO

-- View 3: Finance officer view - transactions summary
CREATE OR ALTER VIEW vw_FinancialSummary AS
SELECT
    ft.transaction_id,
    ft.transaction_type,
    ft.amount,
    ft.currency,
    ft.description,
    ft.donor_name,
    ft.status,
    ft.transaction_date,
    u.full_name AS recorded_by,
    er.disaster_type,
    l.city AS disaster_city
FROM FinancialTransactions ft
INNER JOIN Users u ON ft.recorded_by = u.user_id
LEFT JOIN EmergencyReports er ON ft.report_id = er.report_id
LEFT JOIN Locations l ON er.location_id = l.location_id;
GO

-- View 4: Rescue team operational status
CREATE OR ALTER VIEW vw_RescueTeamStatus AS
SELECT
    rt.team_id,
    rt.team_name,
    rt.team_type,
    rt.team_size,
    rt.availability,
    l.city,
    l.district,
    ta.report_id AS current_assignment,
    er.disaster_type AS assigned_disaster,
    er.severity_level AS assignment_severity
FROM RescueTeams rt
LEFT JOIN Locations l ON rt.location_id = l.location_id
LEFT JOIN TeamAssignments ta ON rt.team_id = ta.team_id AND ta.status = 'Active'
LEFT JOIN EmergencyReports er ON ta.report_id = er.report_id;
GO

-- View 5: Hospital capacity overview
CREATE OR ALTER VIEW vw_HospitalCapacity AS
SELECT
    h.hospital_id,
    h.hospital_name,
    l.city,
    l.district,
    h.total_beds,
    h.available_beds,
    h.total_beds - h.available_beds AS occupied_beds,
    CAST(ROUND((CAST(h.total_beds - h.available_beds AS FLOAT) / h.total_beds) * 100, 1) AS DECIMAL(5,1)) AS occupancy_pct,
    COUNT(pa.admission_id) AS critical_cases
FROM Hospitals h
INNER JOIN Locations l ON h.location_id = l.location_id
LEFT JOIN PatientAdmissions pa ON h.hospital_id = pa.hospital_id
    AND pa.condition = 'Critical' AND pa.discharged_at IS NULL
WHERE h.is_active = 1
GROUP BY h.hospital_id, h.hospital_name, l.city, l.district,
         h.total_beds, h.available_beds;
GO

-- View 6: Pending approvals dashboard
CREATE OR ALTER VIEW vw_PendingApprovals AS
SELECT
    ar.request_id,
    ar.request_type,
    ar.reference_id,
    ar.status,
    ar.notes,
    ar.requested_at,
    u.full_name AS requested_by,
    r.role_name AS requester_role
FROM ApprovalRequests ar
INNER JOIN Users u ON ar.requested_by = u.user_id
INNER JOIN Roles r ON u.role_id = r.role_id
WHERE ar.status = 'Pending';
GO

-- View 7: MIS Dashboard - incident stats by location
CREATE OR ALTER VIEW vw_IncidentStatsByLocation AS
SELECT
    l.city,
    l.district,
    l.province,
    COUNT(er.report_id) AS total_incidents,
    SUM(CASE WHEN er.severity_level = 'Critical' THEN 1 ELSE 0 END) AS critical,
    SUM(CASE WHEN er.severity_level = 'High' THEN 1 ELSE 0 END) AS high,
    SUM(CASE WHEN er.severity_level = 'Medium' THEN 1 ELSE 0 END) AS medium,
    SUM(CASE WHEN er.severity_level = 'Low' THEN 1 ELSE 0 END) AS low,
    SUM(CASE WHEN er.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN er.status IN ('Pending','Active') THEN 1 ELSE 0 END) AS active
FROM Locations l
LEFT JOIN EmergencyReports er ON l.location_id = er.location_id
GROUP BY l.city, l.district, l.province;
GO

-- ============================================================
-- 5. DML - SEED DATA
-- ============================================================

-- ROLES
INSERT INTO Roles (role_name, description) VALUES
('Administrator',       'Full system access and user management'),
('Emergency Operator',  'Manages incoming emergency reports and dispatch'),
('Field Officer',       'On-ground team member managing assignments'),
('Warehouse Manager',   'Manages resource inventory and allocation'),
('Finance Officer',     'Handles donations, expenses and financial reports');
GO

-- FIX: Missing users (6-10) restored to prevent FK errors across all tables
INSERT INTO Users (full_name, email, password_hash, role_id) VALUES
('Admin Khan',    'admin@disasterMIS.gov.pk',     '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 1),
('Sara Ahmed',    'sara.ahmed@disasterMIS.gov.pk','008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 2),
('Bilal Hussain', 'bilal.h@disasterMIS.gov.pk',   '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 2),
('Usman Tariq',   'usman.t@disasterMIS.gov.pk',   '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 3),
('Fatima Noor',   'fatima.n@disasterMIS.gov.pk',  '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 3),
('Zahid Ali',     'zahid.a@disasterMIS.gov.pk',   '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 4), 
('Mariam Shah',   'mariam.s@disasterMIS.gov.pk',  '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 4), 
('Tariq Jamil',   'tariq.j@disasterMIS.gov.pk',   '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 5), 
('Ayesha Gul',    'ayesha.g@disasterMIS.gov.pk',  '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 5), 
('Asad Raza',     'asad.r@disasterMIS.gov.pk',    '008C70392E3ABFBD0FA47BBC2ED96AA99BD49E159727FCBA0F2E6ABEB3A9D601', 3); 
GO

-- LOCATIONS
INSERT INTO Locations (city, district, province, latitude, longitude) VALUES
('Karachi',         'South',        'Sindh',            24.8607,  67.0011),
('Lahore',          'Lahore',       'Punjab',           31.5204,  74.3587),
('Peshawar',        'Peshawar',     'KPK',              34.0151,  71.5249),
('Quetta',          'Quetta',       'Balochistan',      30.1798,  66.9750),
('Islamabad',       'Islamabad',    'Federal',          33.7215,  73.0433),
('Multan',          'Multan',       'Punjab',           30.1575,  71.5249),
('Faisalabad',      'Faisalabad',   'Punjab',           31.4504,  73.1350),
('Hyderabad',       'Hyderabad',    'Sindh',            25.3960,  68.3578),
('Sukkur',          'Sukkur',       'Sindh',            27.7052,  68.8574),
('Abbottabad',      'Abbottabad',   'KPK',              34.1463,  73.2117),
('Swat',            'Swat',         'KPK',              35.2227,  72.4258),
('Chitral',         'Chitral',      'KPK',              35.8518,  71.7864),
('Rawalpindi',      'Rawalpindi',   'Punjab',           33.5651,  73.0169),
('Gwadar',          'Gwadar',       'Balochistan',      25.1264,  62.3225),
('Mirpur',          'Mirpur',       'AJK',              33.1477,  73.7505);
GO

-- EMERGENCY REPORTS (DYNAMIC DATA COMMENTED OUT)
/*
INSERT INTO EmergencyReports (location_id, disaster_type, severity_level, reported_by, contact_number, description, status, reported_at) VALUES
(11, 'Flood',       'Critical', 'Ali Hassan',       '0312-1234567', 'Severe flooding in Swat valley, villages submerged, residents stranded on rooftops.',            'Active',   '2025-07-15 08:30:00'),
(3,  'Earthquake',  'High',     'Zubair Khan',      '0345-9876543', 'Magnitude 5.8 earthquake in Peshawar suburbs. Several buildings collapsed.',                      'Active',   '2025-07-15 09:15:00'),
(1,  'Fire',        'High',     'Rashida Begum',    '0300-1122334', 'Industrial fire in SITE area Karachi, multiple factories affected, 3 casualties reported.',       'Resolved', '2025-07-14 14:00:00'),
(9,  'Flood',       'Critical', 'Imran Baloch',     '0334-5566778', 'Indus river overflow, 10 villages flooded, approximately 2000 people displaced.',                 'Active',   '2025-07-16 06:00:00'),
(12, 'Earthquake',  'Medium',   'Saleem Ahmad',     '0333-6677889', 'Mild earthquake tremors felt in Chitral. Minor structural damage to old buildings.',              'Resolved', '2025-07-13 11:00:00'),
(2,  'Fire',        'Medium',   'Tariq Mahmood',    '0321-4433221', 'Residential fire in Gulberg area, 2 houses destroyed, no casualties.',                            'Resolved', '2025-07-14 22:00:00'),
(8,  'Flood',       'High',     'Shahid Memon',     '0310-2233445', 'Flash floods in Hyderabad, low-lying areas affected, sewage overflow.',                           'Active',   '2025-07-16 10:30:00'),
(4,  'Earthquake',  'Critical', 'Nawab Jan',        '0346-7788990', 'Strong earthquake near Quetta, 6.1 magnitude, major road damage and casualties reported.',       'Active',   '2025-07-17 04:45:00'),
(10, 'Landslide',   'High',     'Roshan Afridi',    '0315-9900112', 'Landslide blocks main highway near Abbottabad, 200+ vehicles stranded.',                          'Active',   '2025-07-17 07:00:00'),
(6,  'Fire',        'Low',      'Anwar Hussain',    '0303-2211334', 'Small shop fire in Multan bazaar, controlled quickly, minor property damage.',                    'Resolved', '2025-07-12 16:00:00'),
(5,  'Flood',       'Medium',   'Rukhsana Bibi',    '0317-8899001', 'Urban flooding in Islamabad F-sector after heavy rains, drainage system overwhelmed.',            'Active',   '2025-07-16 18:00:00'),
(15, 'Earthquake',  'Medium',   'Kashif Mirza',     '0302-3344556', 'Earthquake tremors in Mirpur AJK, residents evacuated from damaged apartments.',                  'Pending',  '2025-07-17 09:00:00'),
(7,  'Fire',        'High',     'Farhana Akhtar',   '0326-5544332', 'Textile mill fire in Faisalabad, large quantities of fabric burned, 5 workers injured.',         'Active',   '2025-07-17 11:30:00'),
(14, 'Flood',       'Low',      'Bashir Ahmad',     '0344-1122003', 'Coastal flooding near Gwadar due to high tide, fishing boats damaged.',                           'Resolved', '2025-07-11 09:00:00'),
(13, 'Landslide',   'Medium',   'Pervez Iqbal',     '0318-6655443', 'Landslide on Murree road near Rawalpindi, road partially blocked, no casualties.',                'Pending',  '2025-07-17 13:00:00'),
(11, 'Flood',       'Critical', 'Nusrat Begum',     '0301-7766554', 'Second wave of flooding in Swat, water level rising, hospitals at risk.',                         'Active',   '2025-07-17 15:00:00'),
(3,  'Earthquake',  'High',     'Ghulam Mustafa',   '0322-8877665', 'Aftershock from morning quake, more buildings at risk in Peshawar old city.',                     'Active',   '2025-07-17 14:00:00'),
(1,  'Fire',        'Critical', 'Mohammad Ansar',   '0335-9988776', 'Massive fire at Karachi port, oil tanker explosion, emergency evacuation ordered.',               'Active',   '2025-07-17 16:00:00'),
(8,  'Flood',       'Critical', 'Saeed Soomro',     '0347-0011223', 'Hyderabad situation worsening, river breach threatens entire district.',                          'Active',   '2025-07-17 17:00:00'),
(4,  'Earthquake',  'Critical', 'Dost Mohammad',    '0311-2233004', 'Strong aftershock near Quetta 5.9 magnitude, rescue operations hampered.',                        'Active',   '2025-07-17 18:00:00');
GO
*/

-- RESCUE TEAMS
INSERT INTO RescueTeams (team_name, team_type, location_id, team_size, availability) VALUES
('Alpha Medical Unit',      'Medical',  1,  12, 'Busy'),
('Beta Fire Squad',         'Fire',     2,  10, 'Available'),
('Gamma Search & Rescue',   'Rescue',   3,  15, 'Busy'),
('Delta Medical Unit',      'Medical',  4,  10, 'Busy'),
('Echo Fire Brigade',       'Fire',     5,  8,  'Available'),
('Foxtrot Rescue Team',     'Rescue',   6,  14, 'Available'),
('Golf Medical Response',   'Medical',  7,  9,  'Available'),
('Hotel Search Unit',       'Search',   8,  11, 'Busy'),
('India Fire Control',      'Fire',     9,  7,  'Available'),
('Juliet Rescue Alpha',     'Rescue',   10, 16, 'Busy'),
('Kilo Medical Advance',    'Medical',  11, 13, 'Busy'),
('Lima Fire Response',      'Fire',     12, 8,  'Available'),
('Mike Rescue Elite',       'Rescue',   13, 12, 'Available'),
('November Medical Fast',   'Medical',  14, 10, 'Available'),
('Oscar Fire & Rescue',     'Fire',     15, 9,  'Available'),
('Papa Urban Search',       'Search',   1,  11, 'Available'),
('Quebec Water Rescue',     'Rescue',   9,  14, 'Busy'),
('Romeo Trauma Unit',       'Medical',  2,  8,  'Available'),
('Sierra Mountain Rescue',  'Rescue',   12, 13, 'Busy'),
('Tango Rapid Response',    'Rescue',   5,  10, 'Available');
GO

-- TEAM ASSIGNMENTS (DYNAMIC DATA COMMENTED OUT)
/*
INSERT INTO TeamAssignments (team_id, report_id, assigned_by, assigned_at, status, notes) VALUES
(1,  1,  2, '2025-07-15 09:00:00', 'Active',    'Medical team deployed to Swat flood zone.'),
(3,  2,  2, '2025-07-15 10:00:00', 'Active',    'Search & rescue for collapsed buildings in Peshawar.'),
(11, 1,  2, '2025-07-15 09:30:00', 'Active',    'Advance medical support for Swat.'),
(4,  8,  2, '2025-07-17 05:30:00', 'Active',    'Delta medical deployed to Quetta earthquake site.'),
(10, 9,  2, '2025-07-17 08:00:00', 'Active',    'Juliet rescue team clearing Abbottabad landslide.'),
(17, 4,  3, '2025-07-16 07:00:00', 'Active',    'Water rescue operations in Sukkur floods.'),
(8,  7,  3, '2025-07-16 11:00:00', 'Active',    'Search unit assisting in Hyderabad flood areas.'),
(19, 9,  2, '2025-07-17 08:30:00', 'Active',    'Sierra mountain rescue for Abbottabad landslide.'),
(1,  3,  2, '2025-07-14 14:30:00', 'Completed', 'Medical team cleared from Karachi fire site.'),
(2,  6,  3, '2025-07-14 22:30:00', 'Completed', 'Beta fire squad resolved Lahore residential fire.');
GO
*/

-- WAREHOUSES
INSERT INTO Warehouses (warehouse_name, location_id, manager_id, capacity) VALUES
('Central Warehouse Karachi',   1,  6, 50000),
('Punjab Relief Depot Lahore',  2,  6, 40000),
('KPK Emergency Store',         3,  7, 30000),
('Balochistan Relief Depot',    4,  7, 25000),
('Islamabad Federal Store',     5,  6, 35000),
('Sindh Backup Warehouse',      9,  7, 20000),
('Northern Relief Center',      10, 6, 15000);
GO

-- RESOURCES
INSERT INTO Resources (resource_name, resource_type, unit, low_stock_threshold) VALUES
('Rice',                    'Food',         'kg',       500),
('Wheat Flour',             'Food',         'kg',       500),
('Canned Food',             'Food',         'units',    200),
('Drinking Water',          'Water',        'litre',    1000),
('Water Purification Tabs', 'Water',        'units',    300),
('Oral Rehydration Salts',  'Medicine',     'units',    200),
('Paracetamol',             'Medicine',     'units',    500),
('Bandages & Dressings',    'Medicine',     'units',    300),
('IV Fluids',               'Medicine',     'units',    200),
('Tents (Family)',          'Shelter',      'units',    50),
('Blankets',                'Shelter',      'units',    300),
('Sleeping Mats',           'Shelter',      'units',    200),
('Generator (Portable)',    'Equipment',    'units',    5),
('Boats (Inflatable)',      'Equipment',    'units',    5),
('Water Pumps',             'Equipment',    'units',    10);
GO

-- WAREHOUSE INVENTORY
INSERT INTO WarehouseInventory (warehouse_id, resource_id, quantity) VALUES
(1, 1,  8000), (1, 2,  6000), (1, 3,  1500), (1, 4,  20000), (1, 5,  800),
(1, 6,  600),  (1, 7,  2000), (1, 8,  1200), (1, 9,  800),   (1, 10, 200),
(1, 11, 1500), (1, 12, 800),  (1, 13, 20),   (1, 14, 30),    (1, 15, 50),
(2, 1,  7000), (2, 2,  5500), (2, 3,  1200), (2, 4,  15000), (2, 5,  600),
(2, 6,  500),  (2, 7,  1800), (2, 8,  900),  (2, 9,  600),   (2, 10, 150),
(2, 11, 1200), (2, 12, 700),  (2, 13, 15),   (2, 14, 20),    (2, 15, 40),
(3, 1,  5000), (3, 2,  4000), (3, 3,  900),  (3, 4,  12000), (3, 5,  500),
(3, 6,  400),  (3, 7,  1200), (3, 8,  700),  (3, 9,  400),   (3, 10, 120),
(3, 11, 900),  (3, 12, 500),  (3, 13, 12),   (3, 14, 18),    (3, 15, 30),
(4, 1,  3500), (4, 2,  3000), (4, 3,  700),  (4, 4,  9000),  (4, 5,  350),
(4, 6,  300),  (4, 7,  900),  (4, 8,  500),  (4, 9,  300),   (4, 10, 80),
(4, 11, 700),  (4, 12, 400),  (4, 13, 8),    (4, 14, 12),    (4, 15, 20),
(5, 1,  6000), (5, 2,  4500), (5, 3,  1100), (5, 4,  14000), (5, 5,  550),
(5, 6,  450),  (5, 7,  1600), (5, 8,  850),  (5, 9,  550),   (5, 10, 130),
(5, 11, 1100), (5, 12, 600),  (5, 13, 18),   (5, 14, 22),    (5, 15, 35),
(6, 1,  2000), (6, 2,  1500), (6, 3,  400),  (6, 4,  5000),  (6, 5,  200),
(6, 6,  150),  (6, 7,  500),  (6, 8,  300),  (6, 9,  150),   (6, 10, 40),
(6, 11, 400),  (6, 12, 200),  (6, 13, 5),    (6, 14, 8),     (6, 15, 12),
(7, 1,  1500), (7, 2,  1200), (7, 3,  300),  (7, 4,  4000),  (7, 5,  150),
(7, 6,  120),  (7, 7,  400),  (7, 8,  250),  (7, 9,  100),   (7, 10, 30),
(7, 11, 300),  (7, 12, 150),  (7, 13, 4),    (7, 14, 6),     (7, 15, 10);
GO

-- RESOURCE ALLOCATIONS (DYNAMIC DATA COMMENTED OUT)
/*
INSERT INTO ResourceAllocations (report_id, warehouse_id, resource_id, quantity_requested, quantity_dispatched, quantity_consumed, requested_by, approved_by, status, requested_at, approved_at, dispatched_at) VALUES
(1,  3, 10,  50, 40, 30, 4, 1, 'Dispatched',   '2025-07-15 10:00:00', '2025-07-15 10:30:00', '2025-07-15 11:00:00'),
(1,  3, 4,  5000, 4000, 3000, 4, 1, 'Dispatched','2025-07-15 10:00:00', '2025-07-15 10:30:00', '2025-07-15 11:30:00'),
(1,  3, 1,  2000, 1800, 1200, 4, 1, 'Dispatched','2025-07-15 10:00:00', '2025-07-15 10:30:00', '2025-07-15 11:30:00'),
(2,  3, 8,   300,  250,  180, 5, 2, 'Dispatched','2025-07-15 11:00:00', '2025-07-15 11:30:00', '2025-07-15 12:00:00'),
(4,  6, 14,    8,    8,    4, 4, 1, 'Dispatched','2025-07-16 07:30:00', '2025-07-16 08:00:00', '2025-07-16 08:30:00'),
(4,  6, 4,  3000, 2500, 1500, 4, 1, 'Dispatched','2025-07-16 07:30:00', '2025-07-16 08:00:00', '2025-07-16 09:00:00'),
(7,  1, 11,  400,  300,  200, 5, 2, 'Dispatched','2025-07-16 12:00:00', '2025-07-16 12:30:00', '2025-07-16 13:00:00'),
(8,  4, 9,   200,  150,  100, 4, 2, 'Dispatched','2025-07-17 06:00:00', '2025-07-17 06:30:00', '2025-07-17 07:00:00'),
(8,  4, 7,   500,  400,  200, 4, 2, 'Dispatched','2025-07-17 06:00:00', '2025-07-17 06:30:00', '2025-07-17 07:00:00'),
(9,  7, 14,    5,    5,    2, 5, 1, 'Dispatched','2025-07-17 08:30:00', '2025-07-17 09:00:00', '2025-07-17 09:30:00'),
(11, 5, 3,   500,    0,    0, 4, NULL, 'Pending','2025-07-16 19:00:00', NULL, NULL),
(13, 1, 8,   200,    0,    0, 5, NULL, 'Pending','2025-07-17 12:00:00', NULL, NULL),
(16, 3, 10,   80,    0,    0, 4, NULL, 'Pending','2025-07-17 15:30:00', NULL, NULL),
(18, 1, 9,   300,    0,    0, 5, 2, 'Approved', '2025-07-17 16:30:00', '2025-07-17 17:00:00', NULL),
(19, 6, 14,   10,    0,    0, 4, 2, 'Approved', '2025-07-17 17:30:00', '2025-07-17 18:00:00', NULL);
GO
*/

-- HOSPITALS
INSERT INTO Hospitals (hospital_name, location_id, total_beds, available_beds, contact_number) VALUES
('Jinnah Postgraduate Medical Centre',  1,  500, 80,  '021-99201300'),
('Civil Hospital Karachi',              1,  400, 50,  '021-99215740'),
('Services Hospital Lahore',            2,  600, 120, '042-99203740'),
('Lady Reading Hospital Peshawar',      3,  450, 70,  '091-9212370'),
('Civil Hospital Quetta',               4,  300, 40,  '081-9201550'),
('PIMS Islamabad',                      5,  550, 110, '051-9261170'),
('Nishtar Hospital Multan',             6,  400, 90,  '061-9200011'),
('Liaquat University Hospital',         8,  350, 55,  '022-9200190'),
('Ayub Medical Complex',               10,  380, 85,  '0992-9310162'),
('Saidu Group of Teaching Hospitals',  11,  250, 30,  '0946-9240095');
GO

-- PATIENT ADMISSIONS (DYNAMIC DATA COMMENTED OUT)
/*
INSERT INTO PatientAdmissions (hospital_id, report_id, patient_name, age, condition, admitted_at, assigned_by) VALUES
(10, 1,  'Noor Bibi',          35, 'Critical',  '2025-07-15 12:00:00', 2),
(10, 1,  'Gul Rahman',         48, 'Serious',   '2025-07-15 12:30:00', 2),
(10, 1,  'Zainab Gul',         22, 'Stable',    '2025-07-15 13:00:00', 2),
(4,  2,  'Abdullah Khan',      60, 'Critical',  '2025-07-15 11:00:00', 3),
(4,  2,  'Mariam Bibi',        45, 'Serious',   '2025-07-15 11:30:00', 3),
(5,  8,  'Hamid Baloch',       52, 'Critical',  '2025-07-17 06:30:00', 3),
(5,  8,  'Fatima Baloch',      30, 'Serious',   '2025-07-17 07:00:00', 3),
(5,  8,  'Ali Raza',           67, 'Critical',  '2025-07-17 07:30:00', 2),
(5,  20, 'Sara Mengal',        40, 'Serious',   '2025-07-17 19:00:00', 2),
(9,  9,  'Babar Afridi',       38, 'Stable',    '2025-07-17 09:00:00', 4),
(1,  18, 'Salman Sheikh',      29, 'Critical',  '2025-07-17 17:00:00', 2),
(1,  18, 'Razia Bano',         55, 'Critical',  '2025-07-17 17:30:00', 2),
(8,  19, 'Nadeem Soomro',      44, 'Serious',   '2025-07-17 18:00:00', 3),
(3,  13, 'Tahir Abbas',        33, 'Stable',    '2025-07-17 12:30:00', 4),
(6,  11, 'Uzma Malik',         27, 'Stable',    '2025-07-16 20:00:00', 5);
GO
*/

-- FINANCIAL TRANSACTIONS (DYNAMIC DATA COMMENTED OUT)
/*
INSERT INTO FinancialTransactions (transaction_type, amount, currency, report_id, description, donor_name, recorded_by, approved_by, status, transaction_date, approved_at) VALUES
('Donation',    500000.00,  'PKR', NULL,  'Corporate donation from Habib Bank Limited', 'Habib Bank Limited',       8, 1, 'Approved', '2025-07-15 10:00:00', '2025-07-15 11:00:00'),
('Donation',    250000.00,  'PKR', NULL,  'Donation from Imtiaz Supermarket',           'Imtiaz Supermarket',       8, 1, 'Approved', '2025-07-14 14:00:00', '2025-07-14 15:00:00'),
('Donation',    100000.00,  'PKR', NULL,  'Public donation drive contribution',         'Public Collection',        9, 1, 'Approved', '2025-07-16 09:00:00', '2025-07-16 10:00:00'),
('Donation',    750000.00,  'PKR', NULL,  'UN emergency relief fund transfer',          'UNDP Pakistan',            8, 1, 'Approved', '2025-07-16 11:00:00', '2025-07-16 12:00:00'),
('Expense',      80000.00,  'PKR', 1,     'Helicopter fuel and transport Swat',         NULL,                       9, 1, 'Approved', '2025-07-15 14:00:00', '2025-07-15 15:00:00'),
('Expense',      45000.00,  'PKR', 2,     'Emergency medical supplies Peshawar',        NULL,                       8, 1, 'Approved', '2025-07-15 15:00:00', '2025-07-15 16:00:00'),
('Procurement', 120000.00,  'PKR', NULL,  'Tent procurement for displaced families',   NULL,                       9, 1, 'Approved', '2025-07-15 13:00:00', '2025-07-15 14:00:00'),
('Procurement',  65000.00,  'PKR', NULL,  'Water purification equipment purchase',     NULL,                       8, 1, 'Approved', '2025-07-16 10:00:00', '2025-07-16 11:00:00'),
('Expense',      30000.00,  'PKR', 4,     'Boat rental for Sukkur flood rescue',       NULL,                       9, 1, 'Approved', '2025-07-16 09:00:00', '2025-07-16 10:00:00'),
('Expense',      55000.00,  'PKR', 8,     'Heavy machinery for Quetta earthquake',     NULL,                       8, 1, 'Approved', '2025-07-17 07:00:00', '2025-07-17 08:00:00'),
('Donation',    200000.00,  'PKR', NULL,  'Donation from Meezan Bank',                 'Meezan Bank',              9, 1, 'Approved', '2025-07-17 09:00:00', '2025-07-17 10:00:00'),
('Expense',      90000.00,  'PKR', 18,    'Fire fighting foam and equipment Karachi',  NULL,                       8, NULL, 'Pending', '2025-07-17 17:00:00', NULL),
('Procurement',  40000.00,  'PKR', NULL,  'Emergency food ration bags bulk order',    NULL,                       9, NULL, 'Pending', '2025-07-17 16:00:00', NULL),
('Donation',     15000.00,  'PKR', NULL,  'Individual donor contribution',             'Arif Hussain',             8, 1, 'Approved', '2025-07-17 12:00:00', '2025-07-17 13:00:00'),
('Expense',      25000.00,  'PKR', 9,     'Medical supply restocking for Abbottabad',  NULL,                       9, 1, 'Approved', '2025-07-17 11:00:00', '2025-07-17 12:00:00'),
('Procurement',  85000.00,  'PKR', NULL,  'Generator procurement for field hospitals', NULL,                       8, 1, 'Approved', '2025-07-17 10:00:00', '2025-07-17 11:00:00'),
('Donation',    300000.00,  'PKR', NULL,  'Relief fund from Pakistan Army Foundation', 'Pakistan Army Foundation', 9, 1, 'Approved', '2025-07-17 14:00:00', '2025-07-17 15:00:00'),
('Expense',      18000.00,  'PKR', 11,    'Urban drainage pump rental Islamabad',      NULL,                       8, 1, 'Approved', '2025-07-16 21:00:00', '2025-07-16 22:00:00'),
('Expense',      72000.00,  'PKR', 7,     'Rescue boat deployment Hyderabad',          NULL,                       9, 1, 'Approved', '2025-07-16 14:00:00', '2025-07-16 15:00:00'),
('Procurement',  50000.00,  'PKR', NULL,  'Blankets and sleeping bags bulk order',    NULL,                       8, NULL, 'Pending', '2025-07-17 18:00:00', NULL);
GO
*/

-- APPROVAL REQUESTS (DYNAMIC DATA COMMENTED OUT)
/*
INSERT INTO ApprovalRequests (request_type, reference_id, requested_by, reviewed_by, status, notes, requested_at, reviewed_at) VALUES
('ResourceDistribution',  11, 4, NULL, 'Pending',  'Canned food needed urgently for Islamabad flood victims.',         '2025-07-16 19:00:00', NULL),
('ResourceDistribution',  12, 5, NULL, 'Pending',  'Bandages for Faisalabad fire victims still awaiting dispatch.',    '2025-07-17 12:00:00', NULL),
('ResourceDistribution',  13, 4, NULL, 'Pending',  'Tents needed for second Swat flood wave.',                         '2025-07-17 15:30:00', NULL),
('RescueDeployment',       1, 2, 1,   'Approved', 'Alpha medical unit approved for Swat deployment.',                 '2025-07-15 08:50:00', '2025-07-15 09:00:00'),
('RescueDeployment',       2, 2, 1,   'Approved', 'Gamma rescue approved for Peshawar earthquake.',                   '2025-07-15 09:50:00', '2025-07-15 10:00:00'),
('FinancialApproval',     12, 8, NULL, 'Pending',  'Pending approval for Karachi port fire fighting expenses.',        '2025-07-17 17:00:00', NULL),
('FinancialApproval',     13, 9, NULL, 'Pending',  'Emergency food ration procurement awaiting finance approval.',     '2025-07-17 16:00:00', NULL),
('RescueDeployment',       9, 3, 2,   'Approved', 'Juliet rescue approved for Abbottabad landslide.',                 '2025-07-17 07:50:00', '2025-07-17 08:00:00'),
('FinancialApproval',     20, 8, NULL, 'Pending',  'Blankets procurement pending approval.',                           '2025-07-17 18:00:00', NULL),
('ResourceDistribution',  14, 4, 1,   'Approved', 'IV fluids for Karachi port fire approved.',                        '2025-07-17 16:30:00', '2025-07-17 17:00:00');
GO
*/

-- AUDIT LOGS (DYNAMIC DATA COMMENTED OUT)
/*
INSERT INTO AuditLogs (user_id, action, table_name, record_id, old_value, new_value, logged_at, ip_address) VALUES
(1, 'CREATE',           'Users',                10, NULL,                             'New user Asad Raza created',           '2025-07-01 09:00:00', '192.168.1.1'),
(2, 'STATUS_UPDATE',    'EmergencyReports',     3,  'Active',                       'Resolved',                             '2025-07-14 18:00:00', '192.168.1.5'),
(2, 'STATUS_UPDATE',    'EmergencyReports',     5,  'Active',                       'Resolved',                             '2025-07-13 14:00:00', '192.168.1.5'),
(2, 'STATUS_UPDATE',    'EmergencyReports',     6,  'Active',                       'Resolved',                             '2025-07-15 02:00:00', '192.168.1.5'),
(1, 'UPDATE',           'Roles',                NULL, NULL,                         'New role permissions applied',         '2025-07-10 10:00:00', '192.168.1.1'),
(6, 'INVENTORY_UPDATE', 'WarehouseInventory',   NULL, 'KPK Tents: 120',             'KPK Tents: 80 (dispatched 40)',        '2025-07-15 11:00:00', '192.168.1.10'),
(8, 'LOGIN',            'Users',                8,  NULL,                           'Finance Officer login',                '2025-07-17 09:00:00', '192.168.1.20'),
(2, 'ASSIGN',           'TeamAssignments',      4,  NULL,                           'Delta team assigned to Quetta EQ',     '2025-07-17 05:30:00', '192.168.1.5'),
(1, 'APPROVE',          'ApprovalRequests',     4,  'Pending',                      'Approved',                             '2025-07-15 09:00:00', '192.168.1.1'),
(1, 'APPROVE',          'ApprovalRequests',     5,  'Pending',                      'Approved',                             '2025-07-15 10:00:00', '192.168.1.1');
GO
*/

-- ============================================================
-- 6. ANALYTICAL QUERIES TO TEST 
-- ============================================================
-- Uncomment these and run them separately after executing the script above!

-- SELECT * FROM Users;
-- SELECT * FROM Warehouses;
-- SELECT * FROM WarehouseInventory;
-- SELECT * FROM vw_IncidentStatsByLocation;
-- SELECT * FROM AuditLogs;

PRINT 'DisasterMIS database created and seeded successfully!';
GO