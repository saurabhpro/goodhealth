"""Workout selfie Pydantic models."""

from datetime import datetime

from pydantic import BaseModel


class SelfieBase(BaseModel):
    """Base selfie model with common fields."""

    caption: str | None = None


class SelfieCreate(SelfieBase):
    """Model for creating a new selfie (metadata only, file uploaded separately)."""

    workout_id: str
    file_name: str
    file_path: str
    file_size: int | None = None
    mime_type: str | None = None


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
    file_size: int | None = None
    mime_type: str | None = None
    taken_at: datetime
    created_at: datetime
    deleted_at: datetime | None = None


class SelfieWithUrl(Selfie):
    """Selfie model with signed URL for viewing."""

    signed_url: str | None = None


class SelfieWithWorkout(SelfieWithUrl):
    """Selfie with associated workout info."""

    workouts: dict | None = None


class SelfieListResponse(BaseModel):
    """Response model for listing selfies."""

    selfies: list[SelfieWithUrl]


class SelfieResponse(BaseModel):
    """Response model for single selfie operations."""

    success: bool
    selfie: SelfieWithUrl | None = None
    selfie_id: str | None = None
    error: str | None = None


class SelfieUrlResponse(BaseModel):
    """Response model for selfie URL retrieval."""

    url: str | None = None
    error: str | None = None
