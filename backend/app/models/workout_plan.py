"""Workout plan generation Pydantic models."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """User profile information for AI context."""

    date_of_birth: str | None = None
    gender: str | None = None
    height_cm: float | None = None
    fitness_level: str | None = None
    medical_conditions: str | None = None
    injuries: str | None = None


class LatestMeasurements(BaseModel):
    """Latest body measurements for AI context."""

    weight: float | None = None
    body_fat_percentage: float | None = None
    muscle_mass: float | None = None
    measurement_date: str | None = None


class UserWorkoutPreferences(BaseModel):
    """User workout preferences."""

    fitness_level: str | None = "intermediate"
    preferred_duration: int | None = 60
    min_duration: int | None = 30
    max_duration: int | None = 90
    focus_areas: list[str] | None = None
    available_equipment: list[str] | None = None
    gym_access: bool | None = True
    constraints: str | None = None
    preferred_time_of_day: str | None = None
    preferred_days: list[int] | None = None


class GoalInfo(BaseModel):
    """Goal information for plan generation."""

    id: str
    title: str
    description: str | None = None
    target_value: float
    current_value: float | None = None
    unit: str
    target_date: str | None = None


class PlanConfig(BaseModel):
    """Plan configuration parameters."""

    weeks_count: int = Field(..., ge=1, le=12)
    workouts_per_week: int = Field(..., ge=1, le=7)
    avg_duration: int = Field(..., ge=15, le=180)


class AIGenerationRequest(BaseModel):
    """Request model for AI workout plan generation."""

    goal: GoalInfo
    preferences: UserWorkoutPreferences | None = None
    workout_history: list[dict[str, Any]] | None = None
    user_templates: list[dict[str, Any]] | None = None
    user_profile: UserProfile | None = None
    latest_measurements: LatestMeasurements | None = None
    plan_config: PlanConfig


class ExerciseDetail(BaseModel):
    """Exercise details in a workout."""

    name: str
    sets: int
    reps: int
    weight: float | None = None
    weight_unit: str | None = "kg"
    rest_seconds: int | None = None
    notes: str | None = None


class WeeklyWorkout(BaseModel):
    """A single workout in the weekly schedule."""

    week: int
    day: int  # 0=Sunday, 1=Monday, ..., 6=Saturday
    day_name: str
    workout_type: str
    exercises: list[ExerciseDetail]
    duration: int
    intensity: Literal["low", "medium", "high"]
    notes: str | None = None


class GeneratedPlan(BaseModel):
    """The generated workout plan structure."""

    weekly_schedule: list[WeeklyWorkout]
    rationale: str
    progression_strategy: str
    key_considerations: list[str]


class AIGeneratedPlanResponse(BaseModel):
    """Response model for AI workout plan generation."""

    success: bool
    plan: GeneratedPlan | None = None
    error: str | None = None


# ============ CRUD Models ============


class WorkoutPlanBase(BaseModel):
    """Base workout plan model."""

    name: str
    description: str | None = None
    goal_type: str
    goal_id: str | None = None
    weeks_duration: int = Field(default=4, ge=1, le=52)
    workouts_per_week: int = Field(default=3, ge=1, le=7)
    avg_workout_duration: int | None = None


class WorkoutPlanCreate(WorkoutPlanBase):
    """Model for creating a workout plan."""

    pass


class WorkoutPlanUpdate(BaseModel):
    """Model for updating a workout plan."""

    name: str | None = None
    description: str | None = None
    goal_type: str | None = None
    goal_id: str | None = None
    weeks_duration: int | None = Field(None, ge=1, le=52)
    workouts_per_week: int | None = Field(None, ge=1, le=7)
    avg_workout_duration: int | None = None
    status: str | None = None


class WorkoutPlan(WorkoutPlanBase):
    """Full workout plan model."""

    id: str
    user_id: str
    status: str = "draft"
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


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
    estimated_duration: int | None = None
    intensity_level: str | None = None
    muscle_groups: list[str] | None = None
    notes: str | None = None
    status: str = "pending"
    session_order: int = 0
    completed_at: datetime | None = None
    completed_workout_id: str | None = None
    workout_template_id: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class WorkoutPlanWithSessions(WorkoutPlan):
    """Workout plan with all sessions."""

    workout_plan_sessions: list[WorkoutPlanSession] = Field(default_factory=list)
    goals: dict[str, Any] | None = None


class WorkoutPlanListResponse(BaseModel):
    """Response for listing workout plans."""

    plans: list[WorkoutPlan]


class WorkoutPlanResponse(BaseModel):
    """Response for single workout plan operations."""

    success: bool
    plan: WorkoutPlanWithSessions | None = None
    error: str | None = None


class CurrentWeekSessionsResponse(BaseModel):
    """Response for current week sessions."""

    sessions: list[WorkoutPlanSession]
    current_week: int = 1
