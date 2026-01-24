"""Measurements API routes."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser, Database
from app.models.measurement import (
    Measurement,
    MeasurementCreate,
    MeasurementListResponse,
    MeasurementResponse,
    MeasurementUpdate,
)
from app.services.measurements import MeasurementsService

router = APIRouter()


@router.post("/measurements", response_model=MeasurementResponse)
async def create_measurement(
    data: MeasurementCreate,
    user_id: CurrentUser,
    db: Database,
) -> MeasurementResponse:
    """Create a new body measurement.
    
    Args:
        data: Measurement creation data
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        MeasurementResponse with success status and data
    """
    service = MeasurementsService(db)
    result = await service.create_measurement(user_id, data)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return MeasurementResponse(
        success=True,
        measurement=result.get("data"),
    )


@router.get("/measurements", response_model=MeasurementListResponse)
async def get_measurements(
    user_id: CurrentUser,
    db: Database,
    limit: Optional[int] = None,
) -> MeasurementListResponse:
    """Get all measurements for the current user.
    
    Args:
        user_id: Current authenticated user
        db: Database client
        limit: Optional limit on number of measurements
        
    Returns:
        MeasurementListResponse with list of measurements
    """
    service = MeasurementsService(db)
    measurements = await service.get_measurements(user_id, limit)
    
    return MeasurementListResponse(measurements=measurements)


@router.get("/measurements/latest")
async def get_latest_measurement(
    user_id: CurrentUser,
    db: Database,
) -> MeasurementResponse:
    """Get the most recent measurement.
    
    Args:
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        MeasurementResponse with latest measurement
    """
    service = MeasurementsService(db)
    measurement = await service.get_latest_measurement(user_id)
    
    return MeasurementResponse(
        success=True,
        measurement=measurement,
    )


@router.get("/measurements/{measurement_id}")
async def get_measurement(
    measurement_id: str,
    user_id: CurrentUser,
    db: Database,
) -> Measurement:
    """Get a single measurement by ID.
    
    Args:
        measurement_id: The measurement ID
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        Measurement
    """
    service = MeasurementsService(db)
    measurement = await service.get_measurement(user_id, measurement_id)
    
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")
    
    return measurement


@router.put("/measurements/{measurement_id}", response_model=MeasurementResponse)
async def update_measurement(
    measurement_id: str,
    data: MeasurementUpdate,
    user_id: CurrentUser,
    db: Database,
) -> MeasurementResponse:
    """Update a measurement.
    
    Args:
        measurement_id: The measurement ID
        data: Update data
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        MeasurementResponse with success status
    """
    service = MeasurementsService(db)
    result = await service.update_measurement(user_id, measurement_id, data)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return MeasurementResponse(success=True)


@router.delete("/measurements/{measurement_id}", response_model=MeasurementResponse)
async def delete_measurement(
    measurement_id: str,
    user_id: CurrentUser,
    db: Database,
) -> MeasurementResponse:
    """Soft delete a measurement.
    
    Args:
        measurement_id: The measurement ID
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        MeasurementResponse with success status
    """
    service = MeasurementsService(db)
    result = await service.delete_measurement(user_id, measurement_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return MeasurementResponse(success=True)
