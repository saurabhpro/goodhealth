"""Weekly analysis Pydantic models."""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class WeeklyStats(BaseModel):
    """Weekly workout statistics."""

    total_workouts: int = 0
    total_duration_minutes: int = 0
    average_effort: float | None = None
    workout_types: dict[str, int] = Field(default_factory=dict)
    exercises_performed: int = 0


class GoalProgress(BaseModel):
    """Progress on a specific goal."""

    goal_id: str
    title: str
    current_value: float | None
    target_value: float
    unit: str
    progress_percentage: float
    change_this_week: float | None = None


class MeasurementsComparison(BaseModel):
    """Body measurements comparison."""

    weight_change: float | None = None
    body_fat_change: float | None = None
    muscle_mass_change: float | None = None


class WeeklyAnalysisRequest(BaseModel):
    """Request model for weekly analysis generation."""

    user_id: str
    week_start_date: date | None = None  # Defaults to current week


class WeeklyAnalysisResponse(BaseModel):
    """Response model for weekly analysis."""

    success: bool
    analysis: dict[str, Any] | None = None
    error: str | None = None


class WeeklyAnalysisData(BaseModel):
    """Full weekly analysis data structure."""

    id: str
    user_id: str
    week_start_date: date
    week_end_date: date
    analysis_summary: str
    key_achievements: list[str]
    areas_for_improvement: list[str]
    weekly_stats: WeeklyStats
    goal_progress: list[GoalProgress]
    measurements_comparison: MeasurementsComparison | None = None
    recommendations: list[str]
    motivational_quote: str
    generated_at: datetime
