"""User profile Pydantic models."""

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    """Base profile model with common fields."""

    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[Literal["male", "female", "other", "prefer_not_to_say"]] = None
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    fitness_level: Optional[Literal["beginner", "intermediate", "advanced"]] = None
    fitness_goals: Optional[list[str]] = None
    medical_conditions: Optional[str] = None
    injuries: Optional[str] = None


class ProfileUpdate(ProfileBase):
    """Model for updating profile."""

    # User preferences
    theme: Optional[str] = None
    accent_theme: Optional[str] = None
    weight_unit: Optional[str] = None
    distance_unit: Optional[str] = None
    notification_preferences: Optional[dict[str, Any]] = None


class Profile(ProfileBase):
    """Full profile model with database fields."""

    id: str
    email: str
    avatar_url: Optional[str] = None
    theme: Optional[str] = None
    accent_theme: Optional[str] = None
    weight_unit: Optional[str] = None
    distance_unit: Optional[str] = None
    notification_preferences: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class ProfileResponse(BaseModel):
    """Response model for profile operations."""

    success: bool = True
    profile: Optional[Profile] = None
    error: Optional[str] = None
