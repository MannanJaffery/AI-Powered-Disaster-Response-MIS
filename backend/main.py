from fastapi import FastAPI

app = FastAPI(
    title="Disaster Response MIS API",
    description="Backend API for the Smart Disaster Response System",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "FastAPI is running successfully!"}

@app.get("/health")
def health_check():
    return {"status": "Database connection pending..."}