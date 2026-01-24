"""Weekly analysis Pydantic models."""

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class WeeklyStats(BaseModel):
    """Weekly workout statistics."""

    total_workouts: int = 0
    total_duration_minutes: int = 0
    average_effort: Optional[float] = None
    workout_types: dict[str, int] = Field(default_factory=dict)
    exercises_performed: int = 0


class GoalProgress(BaseModel):
    """Progress on a specific goal."""

    goal_id: str
    title: str
    current_value: Optional[float]
    target_value: float
    unit: str
    progress_percentage: float
    change_this_week: Optional[float] = None


class MeasurementsComparison(BaseModel):
    """Body measurements comparison."""

    weight_change: Optional[float] = None
    body_fat_change: Optional[float] = None
    muscle_mass_change: Optional[float] = None


class WeeklyAnalysisRequest(BaseModel):
    """Request model for weekly analysis generation."""

    user_id: str
    week_start_date: Optional[date] = None  # Defaults to current week


class WeeklyAnalysisResponse(BaseModel):
    """Response model for weekly analysis."""

    success: bool
    analysis: Optional[dict[str, Any]] = None
    error: Optional[str] = None


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
    measurements_comparison: Optional[MeasurementsComparison] = None
    recommendations: list[str]
    motivational_quote: str
    generated_at: datetime
