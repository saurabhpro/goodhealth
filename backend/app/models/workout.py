"""Workout and Exercise Pydantic models."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ExerciseBase(BaseModel):
    """Base exercise model with common fields."""

    name: str
    exercise_type: Literal["strength", "cardio", "flexibility", "other"] = "strength"
    # Strength fields
    sets: int | None = None
    reps: int | None = None
    weight: float | None = None
    weight_unit: str = "kg"
    # Cardio fields
    duration_minutes: int | None = None
    distance: float | None = None
    distance_unit: str = "km"
    speed: float | None = None
    calories: int | None = None
    resistance_level: int | None = None
    incline: float | None = None
    notes: str | None = None


class ExerciseCreate(ExerciseBase):
    """Model for creating a new exercise."""

    pass


class Exercise(ExerciseBase):
    """Full exercise model with database fields."""

    id: str
    workout_id: str
    created_at: datetime


class WorkoutBase(BaseModel):
    """Base workout model with common fields."""

    name: str
    date: str  # ISO date string YYYY-MM-DD
    duration_minutes: int | None = None
    description: str | None = None
    effort_level: int | None = Field(None, ge=1, le=6)


class WorkoutCreate(WorkoutBase):
    """Model for creating a new workout."""

    exercises: list[ExerciseCreate] = Field(default_factory=list)
    session_id: str | None = None  # Link to workout plan session


class WorkoutUpdate(BaseModel):
    """Model for updating an existing workout."""

    name: str | None = None
    date: str | None = None
    duration_minutes: int | None = None
    description: str | None = None
    effort_level: int | None = Field(None, ge=1, le=6)
    exercises: list[ExerciseCreate] | None = None


class Workout(WorkoutBase):
    """Full workout model with database fields."""

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class WorkoutWithExercises(Workout):
    """Workout model including related exercises."""

    exercises: list[Exercise] = Field(default_factory=list)


class WorkoutWithSelfie(WorkoutWithExercises):
    """Workout model including exercises and selfie info."""

    workout_selfies: list[dict[str, Any]] = Field(default_factory=list)


class WorkoutListResponse(BaseModel):
    """Response model for listing workouts."""

    workouts: list[WorkoutWithSelfie]
    total: int | None = None


class WorkoutResponse(BaseModel):
    """Response model for single workout operations."""

    success: bool
    workout: WorkoutWithExercises | None = None
    workout_id: str | None = None
    error: str | None = None
