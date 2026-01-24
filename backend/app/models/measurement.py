"""Body measurement Pydantic models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MeasurementBase(BaseModel):
    """Base measurement model with common fields."""

    measured_at: Optional[datetime] = None
    
    # Weight and composition
    weight: Optional[float] = Field(None, ge=0)
    body_fat_percentage: Optional[float] = Field(None, ge=0, le=100)
    muscle_mass: Optional[float] = Field(None, ge=0)
    bone_mass: Optional[float] = Field(None, ge=0)
    water_percentage: Optional[float] = Field(None, ge=0, le=100)
    protein_percentage: Optional[float] = Field(None, ge=0, le=100)
    
    # Body dimensions
    height: Optional[float] = Field(None, ge=0)
    neck: Optional[float] = Field(None, ge=0)
    shoulders: Optional[float] = Field(None, ge=0)
    chest: Optional[float] = Field(None, ge=0)
    waist: Optional[float] = Field(None, ge=0)
    hips: Optional[float] = Field(None, ge=0)
    
    # Limb measurements
    bicep_left: Optional[float] = Field(None, ge=0)
    bicep_right: Optional[float] = Field(None, ge=0)
    forearm_left: Optional[float] = Field(None, ge=0)
    forearm_right: Optional[float] = Field(None, ge=0)
    thigh_left: Optional[float] = Field(None, ge=0)
    thigh_right: Optional[float] = Field(None, ge=0)
    calf_left: Optional[float] = Field(None, ge=0)
    calf_right: Optional[float] = Field(None, ge=0)
    
    # Health metrics
    bmr: Optional[int] = Field(None, ge=0)  # Basal Metabolic Rate
    metabolic_age: Optional[int] = Field(None, ge=0)
    visceral_fat: Optional[int] = Field(None, ge=0)
    
    notes: Optional[str] = None


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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class MeasurementListResponse(BaseModel):
    """Response model for listing measurements."""

    measurements: list[Measurement]


class MeasurementResponse(BaseModel):
    """Response model for single measurement operations."""

    success: bool
    measurement: Optional[Measurement] = None
    error: Optional[str] = None
