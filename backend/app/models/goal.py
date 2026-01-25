"""Goal-related Pydantic models."""

from datetime import datetime

from pydantic import BaseModel, Field


class GoalBase(BaseModel):
    """Base goal model with common fields."""

    title: str
    description: str | None = None
    target_value: float
    unit: str
    target_date: str | None = None  # ISO date string


class GoalCreate(GoalBase):
    """Model for creating a new goal."""

    current_value: float | None = 0


class GoalUpdate(BaseModel):
    """Model for updating an existing goal."""

    title: str | None = None
    description: str | None = None
    target_value: float | None = None
    current_value: float | None = None
    unit: str | None = None
    target_date: str | None = None


class GoalProgressUpdate(BaseModel):
    """Model for updating goal progress only."""

    current_value: float


class Goal(BaseModel):
    """Goal model matching the database schema."""

    id: str
    user_id: str
    title: str
    description: str | None = None
    initial_value: float
    current_value: float | None = None
    target_value: float
    unit: str
    target_date: datetime | None = None
    achieved: bool = False
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class GoalListResponse(BaseModel):
    """Response model for listing goals."""

    goals: list[Goal]


class GoalResponse(BaseModel):
    """Response model for single goal operations."""

    success: bool
    goal: Goal | None = None
    goal_id: str | None = None
    error: str | None = None


class GoalSyncRequest(BaseModel):
    """Request model for goal sync endpoint."""

    user_id: str = Field(..., description="User ID to sync goals for")


class GoalSyncResult(BaseModel):
    """Result of goal sync operation."""

    success: bool
    updated: int = Field(default=0, description="Number of goals updated")
    message: str | None = None
    details: list[dict] = Field(
        default_factory=list, description="Details of updated goals"
    )
