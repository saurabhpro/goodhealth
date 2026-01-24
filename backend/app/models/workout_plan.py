"""Workout plan generation Pydantic models."""

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """User profile information for AI context."""

    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    fitness_level: Optional[str] = None
    medical_conditions: Optional[str] = None
    injuries: Optional[str] = None


class LatestMeasurements(BaseModel):
    """Latest body measurements for AI context."""

    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    measurement_date: Optional[str] = None


class UserWorkoutPreferences(BaseModel):
    """User workout preferences."""

    fitness_level: Optional[str] = "intermediate"
    preferred_duration: Optional[int] = 60
    min_duration: Optional[int] = 30
    max_duration: Optional[int] = 90
    focus_areas: Optional[list[str]] = None
    available_equipment: Optional[list[str]] = None
    gym_access: Optional[bool] = True
    constraints: Optional[str] = None
    preferred_time_of_day: Optional[str] = None
    preferred_days: Optional[list[int]] = None


class GoalInfo(BaseModel):
    """Goal information for plan generation."""

    id: str
    title: str
    description: Optional[str] = None
    target_value: float
    current_value: Optional[float] = None
    unit: str
    target_date: Optional[str] = None


class PlanConfig(BaseModel):
    """Plan configuration parameters."""

    weeks_count: int = Field(..., ge=1, le=12)
    workouts_per_week: int = Field(..., ge=1, le=7)
    avg_duration: int = Field(..., ge=15, le=180)


class AIGenerationRequest(BaseModel):
    """Request model for AI workout plan generation."""

    goal: GoalInfo
    preferences: Optional[UserWorkoutPreferences] = None
    workout_history: Optional[list[dict[str, Any]]] = None
    user_templates: Optional[list[dict[str, Any]]] = None
    user_profile: Optional[UserProfile] = None
    latest_measurements: Optional[LatestMeasurements] = None
    plan_config: PlanConfig


class ExerciseDetail(BaseModel):
    """Exercise details in a workout."""

    name: str
    sets: int
    reps: int
    weight: Optional[float] = None
    weight_unit: Optional[str] = "kg"
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None


class WeeklyWorkout(BaseModel):
    """A single workout in the weekly schedule."""

    week: int
    day: int  # 0=Sunday, 1=Monday, ..., 6=Saturday
    day_name: str
    workout_type: str
    exercises: list[ExerciseDetail]
    duration: int
    intensity: Literal["low", "medium", "high"]
    notes: Optional[str] = None


class GeneratedPlan(BaseModel):
    """The generated workout plan structure."""

    weekly_schedule: list[WeeklyWorkout]
    rationale: str
    progression_strategy: str
    key_considerations: list[str]


class AIGeneratedPlanResponse(BaseModel):
    """Response model for AI workout plan generation."""

    success: bool
    plan: Optional[GeneratedPlan] = None
    error: Optional[str] = None


# ============ CRUD Models ============


class WorkoutPlanBase(BaseModel):
    """Base workout plan model."""

    name: str
    description: Optional[str] = None
    goal_type: str
    goal_id: Optional[str] = None
    weeks_duration: int = Field(default=4, ge=1, le=52)
    workouts_per_week: int = Field(default=3, ge=1, le=7)
    avg_workout_duration: Optional[int] = None


class WorkoutPlanCreate(WorkoutPlanBase):
    """Model for creating a workout plan."""

    pass


class WorkoutPlanUpdate(BaseModel):
    """Model for updating a workout plan."""

    name: Optional[str] = None
    description: Optional[str] = None
    goal_type: Optional[str] = None
    goal_id: Optional[str] = None
    weeks_duration: Optional[int] = Field(None, ge=1, le=52)
    workouts_per_week: Optional[int] = Field(None, ge=1, le=7)
    avg_workout_duration: Optional[int] = None
    status: Optional[str] = None


class WorkoutPlan(WorkoutPlanBase):
    """Full workout plan model."""

    id: str
    user_id: str
    status: str = "draft"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class WorkoutPlanSession(BaseModel):
    """Workout plan session model."""

    id: str
    plan_id: str
    week_number: int
    day_of_week: int
    day_name: str
    workout_name: str
    workout_type: str
    exercises: list[dict[str, Any]] = Field(default_factory=list)
    estimated_duration: Optional[int] = None
    intensity_level: Optional[str] = None
    muscle_groups: Optional[list[str]] = None
    notes: Optional[str] = None
    status: str = "pending"
    session_order: int = 0
    completed_at: Optional[datetime] = None
    completed_workout_id: Optional[str] = None
    workout_template_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class WorkoutPlanWithSessions(WorkoutPlan):
    """Workout plan with all sessions."""

    workout_plan_sessions: list[WorkoutPlanSession] = Field(default_factory=list)
    goals: Optional[dict[str, Any]] = None


class WorkoutPlanListResponse(BaseModel):
    """Response for listing workout plans."""

    plans: list[WorkoutPlan]


class WorkoutPlanResponse(BaseModel):
    """Response for single workout plan operations."""

    success: bool
    plan: Optional[WorkoutPlanWithSessions] = None
    error: Optional[str] = None


class CurrentWeekSessionsResponse(BaseModel):
    """Response for current week sessions."""

    sessions: list[WorkoutPlanSession]
    current_week: int = 1
