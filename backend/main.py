import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.connection import connect_to_mongo, close_mongo_connection, ping_database
from app.routers import auth, notes, billing


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


# Create FastAPI app with lifespan events
app = FastAPI(
    title="Galactic Archives API",
    description="Star Wars Notes App Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # Use configured origins from settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(billing.router)

# Health check endpoint
@app.get("/healthz")
async def health_check():
    """Health check endpoint with database connectivity test"""
    db_status = await ping_database()
    
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected",
        "service": "Galactic Archives API",
        "version": "1.0.0"
    }

# API v1 router placeholder
@app.get("/api/v1")
async def api_info():
    """API v1 information endpoint"""
    return {
        "message": "Galactic Archives API v1",
        "version": "1.0.0",
        "endpoints": {
            "health": "/healthz",
            "auth": "/api/v1/auth/*",
            "notes": "/api/v1/notes/*",
            "billing": "/api/v1/billing/*"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True if settings.APP_ENV == "development" else False
    )