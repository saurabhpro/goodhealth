"""Goal-related Pydantic models."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class GoalBase(BaseModel):
    """Base goal model with common fields."""

    title: str
    description: Optional[str] = None
    target_value: float
    unit: str
    target_date: Optional[str] = None  # ISO date string


class GoalCreate(GoalBase):
    """Model for creating a new goal."""

    current_value: Optional[float] = 0


class GoalUpdate(BaseModel):
    """Model for updating an existing goal."""

    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    target_date: Optional[str] = None


class GoalProgressUpdate(BaseModel):
    """Model for updating goal progress only."""

    current_value: float


class Goal(BaseModel):
    """Goal model matching the database schema."""

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    initial_value: float
    current_value: Optional[float] = None
    target_value: float
    unit: str
    target_date: Optional[datetime] = None
    achieved: bool = False
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class GoalListResponse(BaseModel):
    """Response model for listing goals."""

    goals: list[Goal]


class GoalResponse(BaseModel):
    """Response model for single goal operations."""

    success: bool
    goal: Optional[Goal] = None
    goal_id: Optional[str] = None
    error: Optional[str] = None


class GoalSyncRequest(BaseModel):
    """Request model for goal sync endpoint."""

    user_id: str = Field(..., description="User ID to sync goals for")


class GoalSyncResult(BaseModel):
    """Result of goal sync operation."""

    success: bool
    updated: int = Field(default=0, description="Number of goals updated")
    message: Optional[str] = None
    details: list[dict] = Field(default_factory=list, description="Details of updated goals")
