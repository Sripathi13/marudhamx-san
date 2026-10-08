from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import shipments, markets
from app.core.config import settings

app = FastAPI(
    title="AgriRoute API",
    description="AI-Based Perishable Produce Transportation Optimizer for Farmers in Coimbatore Region",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipments.router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(markets.router, prefix="/api/catalog", tags=["Catalog"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AgriRoute Optimizer",
        "version": "1.0.0"
    }
