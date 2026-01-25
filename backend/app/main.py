"""FastAPI application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.auth import JWTAuthMiddleware
from app.routers import (
    goals,
    measurements,
    profiles,
    selfies,
    weekly_analysis,
    workout_plans,
    workouts,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    print(f"Starting {settings.app_name}...")
    yield
    # Shutdown
    print(f"Shutting down {settings.app_name}...")


app = FastAPI(
    title=settings.app_name,
    description="Python backend for GoodHealth - AI services and complete backend API",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS (must be added before other middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add JWT authentication middleware
app.add_middleware(JWTAuthMiddleware)

# Include routers
app.include_router(workouts.router, prefix=settings.api_prefix, tags=["Workouts"])
app.include_router(goals.router, prefix=settings.api_prefix, tags=["Goals"])
app.include_router(
    workout_plans.router, prefix=settings.api_prefix, tags=["Workout Plans"]
)
app.include_router(
    measurements.router, prefix=settings.api_prefix, tags=["Measurements"]
)
app.include_router(selfies.router, prefix=settings.api_prefix, tags=["Selfies"])
app.include_router(profiles.router, prefix=settings.api_prefix, tags=["Profiles"])
app.include_router(
    weekly_analysis.router, prefix=settings.api_prefix, tags=["Weekly Analysis"]
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.app_name}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "docs": "/docs",
        "health": "/health",
    }
