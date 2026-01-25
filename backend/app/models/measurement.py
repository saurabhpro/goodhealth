"""Body measurement Pydantic models."""

from datetime import datetime

from pydantic import BaseModel, Field


class MeasurementBase(BaseModel):
    """Base measurement model with common fields."""

    measured_at: datetime | None = None

    # Weight and composition
    weight: float | None = Field(None, ge=0)
    body_fat_percentage: float | None = Field(None, ge=0, le=100)
    muscle_mass: float | None = Field(None, ge=0)
    bone_mass: float | None = Field(None, ge=0)
    water_percentage: float | None = Field(None, ge=0, le=100)
    protein_percentage: float | None = Field(None, ge=0, le=100)

    # Body dimensions
    height: float | None = Field(None, ge=0)
    neck: float | None = Field(None, ge=0)
    shoulders: float | None = Field(None, ge=0)
    chest: float | None = Field(None, ge=0)
    waist: float | None = Field(None, ge=0)
    hips: float | None = Field(None, ge=0)

    # Limb measurements
    bicep_left: float | None = Field(None, ge=0)
    bicep_right: float | None = Field(None, ge=0)
    forearm_left: float | None = Field(None, ge=0)
    forearm_right: float | None = Field(None, ge=0)
    thigh_left: float | None = Field(None, ge=0)
    thigh_right: float | None = Field(None, ge=0)
    calf_left: float | None = Field(None, ge=0)
    calf_right: float | None = Field(None, ge=0)

    # Health metrics
    bmr: int | None = Field(None, ge=0)  # Basal Metabolic Rate
    metabolic_age: int | None = Field(None, ge=0)
    visceral_fat: int | None = Field(None, ge=0)

    notes: str | None = None


class MeasurementCreate(MeasurementBase):
    """Model for creating a new measurement."""

    pass


class MeasurementUpdate(MeasurementBase):
    """Model for updating an existing measurement."""

    pass


class Measurement(MeasurementBase):
    """Full measurement model with database fields."""

    id: str
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None


class MeasurementListResponse(BaseModel):
    """Response model for listing measurements."""

    measurements: list[Measurement]


class MeasurementResponse(BaseModel):
    """Response model for single measurement operations."""

    success: bool
    measurement: Measurement | None = None
    error: str | None = None
