"""Workout selfie Pydantic models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SelfieBase(BaseModel):
    """Base selfie model with common fields."""

    caption: Optional[str] = None


class SelfieCreate(SelfieBase):
    """Model for creating a new selfie (metadata only, file uploaded separately)."""

    workout_id: str
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class SelfieUpdate(BaseModel):
    """Model for updating a selfie (caption only)."""

    caption: str


class Selfie(SelfieBase):
    """Full selfie model with database fields."""

    id: str
    workout_id: str
    user_id: str
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    taken_at: datetime
    created_at: datetime
    deleted_at: Optional[datetime] = None


class SelfieWithUrl(Selfie):
    """Selfie model with signed URL for viewing."""

    signed_url: Optional[str] = None


class SelfieWithWorkout(SelfieWithUrl):
    """Selfie with associated workout info."""

    workouts: Optional[dict] = None


class SelfieListResponse(BaseModel):
    """Response model for listing selfies."""

    selfies: list[SelfieWithUrl]


class SelfieResponse(BaseModel):
    """Response model for single selfie operations."""

    success: bool
    selfie: Optional[SelfieWithUrl] = None
    selfie_id: Optional[str] = None
    error: Optional[str] = None


class SelfieUrlResponse(BaseModel):
    """Response model for selfie URL retrieval."""

    url: Optional[str] = None
    error: Optional[str] = None
