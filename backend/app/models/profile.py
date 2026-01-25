"""User profile Pydantic models."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    """Base profile model with common fields."""

    full_name: str | None = None
    date_of_birth: str | None = None
    gender: Literal["male", "female", "other", "prefer_not_to_say"] | None = None
    height_cm: float | None = Field(None, ge=50, le=300)
    fitness_level: Literal["beginner", "intermediate", "advanced"] | None = None
    fitness_goals: list[str] | None = None
    medical_conditions: str | None = None
    injuries: str | None = None


class ProfileUpdate(ProfileBase):
    """Model for updating profile."""

    # User preferences
    theme: str | None = None
    accent_theme: str | None = None
    weight_unit: str | None = None
    distance_unit: str | None = None
    notification_preferences: dict[str, Any] | None = None


class Profile(ProfileBase):
    """Full profile model with database fields."""

    id: str
    email: str
    avatar_url: str | None = None
    theme: str | None = None
    accent_theme: str | None = None
    weight_unit: str | None = None
    distance_unit: str | None = None
    notification_preferences: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


class ProfileResponse(BaseModel):
    """Response model for profile operations."""

    success: bool = True
    profile: Profile | None = None
    error: str | None = None
