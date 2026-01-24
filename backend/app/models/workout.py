"""Workout and Exercise Pydantic models."""

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class ExerciseBase(BaseModel):
    """Base exercise model with common fields."""

    name: str
    exercise_type: Literal["strength", "cardio", "flexibility", "other"] = "strength"
    # Strength fields
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None
    weight_unit: str = "kg"
    # Cardio fields
    duration_minutes: Optional[int] = None
    distance: Optional[float] = None
    distance_unit: str = "km"
    speed: Optional[float] = None
    calories: Optional[int] = None
    resistance_level: Optional[int] = None
    incline: Optional[float] = None
    notes: Optional[str] = None


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
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    effort_level: Optional[int] = Field(None, ge=1, le=6)


class WorkoutCreate(WorkoutBase):
    """Model for creating a new workout."""

    exercises: list[ExerciseCreate] = Field(default_factory=list)
    session_id: Optional[str] = None  # Link to workout plan session


class WorkoutUpdate(BaseModel):
    """Model for updating an existing workout."""

    name: Optional[str] = None
    date: Optional[str] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    effort_level: Optional[int] = Field(None, ge=1, le=6)
    exercises: Optional[list[ExerciseCreate]] = None


class Workout(WorkoutBase):
    """Full workout model with database fields."""

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class WorkoutWithExercises(Workout):
    """Workout model including related exercises."""

    exercises: list[Exercise] = Field(default_factory=list)


class WorkoutWithSelfie(WorkoutWithExercises):
    """Workout model including exercises and selfie info."""

    workout_selfies: list[dict[str, Any]] = Field(default_factory=list)


class WorkoutListResponse(BaseModel):
    """Response model for listing workouts."""

    workouts: list[WorkoutWithSelfie]
    total: Optional[int] = None


class WorkoutResponse(BaseModel):
    """Response model for single workout operations."""

    success: bool
    workout: Optional[WorkoutWithExercises] = None
    workout_id: Optional[str] = None
    error: Optional[str] = None
