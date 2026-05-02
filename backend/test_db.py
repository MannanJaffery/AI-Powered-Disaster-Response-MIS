import pyodbc

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-SNI5HJG\\SQLEXPRESS;"
    "DATABASE=DisasterMIS;"
    "Trusted_Connection=yes;"
)

try:
    conn = pyodbc.connect(conn_str)
    print("✅ Connected successfully!")
    conn.close()
except Exception as e:
    print("Error:", e)