"""Selfies API routes."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.dependencies import CurrentUser, Database
from app.models.selfie import (
    SelfieListResponse,
    SelfieResponse,
    SelfieUpdate,
    SelfieUrlResponse,
)
from app.services.selfies import SelfiesService

router = APIRouter()


@router.post("/workouts/{workout_id}/selfie", response_model=SelfieResponse)
async def upload_selfie(
    workout_id: str,
    user_id: CurrentUser,
    db: Database,
    file: UploadFile = File(...),
    caption: str = Form(None),
) -> SelfieResponse:
    """Upload a selfie for a workout.
    
    Only ONE selfie is allowed per workout - replaces existing.
    
    Args:
        workout_id: The workout ID
        user_id: Current authenticated user
        db: Database client
        file: The image file to upload
        caption: Optional caption
        
    Returns:
        SelfieResponse with success status and selfie_id
    """
    service = SelfiesService(db)
    
    # Read file content
    file_content = await file.read()
    
    result = await service.upload_selfie(
        user_id=user_id,
        workout_id=workout_id,
        file_content=file_content,
        file_name=file.filename or "selfie.jpg",
        mime_type=file.content_type or "image/jpeg",
        caption=caption,
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return SelfieResponse(
        success=True,
        selfie_id=result.get("selfie_id"),
    )


@router.get("/workouts/{workout_id}/selfie", response_model=SelfieListResponse)
async def get_workout_selfie(
    workout_id: str,
    user_id: CurrentUser,
    db: Database,
) -> SelfieListResponse:
    """Get selfie for a workout.
    
    Args:
        workout_id: The workout ID
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        SelfieListResponse with selfies (should be 0 or 1)
    """
    service = SelfiesService(db)
    selfies = await service.get_workout_selfies(user_id, workout_id)
    
    return SelfieListResponse(selfies=selfies)


@router.delete("/selfies/{selfie_id}", response_model=SelfieResponse)
async def delete_selfie(
    selfie_id: str,
    user_id: CurrentUser,
    db: Database,
) -> SelfieResponse:
    """Delete a selfie.
    
    Args:
        selfie_id: The selfie ID
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        SelfieResponse with success status
    """
    service = SelfiesService(db)
    result = await service.delete_selfie(user_id, selfie_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return SelfieResponse(success=True)


@router.put("/selfies/{selfie_id}/caption", response_model=SelfieResponse)
async def update_caption(
    selfie_id: str,
    data: SelfieUpdate,
    user_id: CurrentUser,
    db: Database,
) -> SelfieResponse:
    """Update selfie caption.
    
    Args:
        selfie_id: The selfie ID
        data: Update data with new caption
        user_id: Current authenticated user
        db: Database client
        
    Returns:
        SelfieResponse with success status
    """
    service = SelfiesService(db)
    result = await service.update_caption(user_id, selfie_id, data.caption)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return SelfieResponse(success=True)


@router.get("/selfies/recent", response_model=SelfieListResponse)
async def get_recent_selfies(
    user_id: CurrentUser,
    db: Database,
    limit: int = 10,
) -> SelfieListResponse:
    """Get recent selfies across all workouts.
    
    Args:
        user_id: Current authenticated user
        db: Database client
        limit: Maximum number of selfies (default 10)
        
    Returns:
        SelfieListResponse with recent selfies
    """
    service = SelfiesService(db)
    selfies = await service.get_recent_selfies(user_id, limit)
    
    return SelfieListResponse(selfies=selfies)
