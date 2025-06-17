from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🌱 Rural Insights API starting up...")
    yield
    # Shutdown
    print("👋 Rural Insights API shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Rural Insights API",
    description="API para análise financeira rural com IA",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "🌾 Rural Insights API",
        "version": "1.0.0",
        "status": "healthy"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# API routes
from api.routes import upload, insights

app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )