"""FastAPI routers."""

from app.routers import (
    goals,
    measurements,
    profiles,
    selfies,
    weekly_analysis,
    workout_plans,
    workouts,
)

__all__ = [
    "goals",
    "measurements",
    "profiles",
    "selfies",
    "weekly_analysis",
    "workout_plans",
    "workouts",
]
