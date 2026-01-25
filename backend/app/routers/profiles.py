"""Profiles API routes."""

from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser, Database
from app.models.profile import ProfileResponse, ProfileUpdate
from app.services.profiles import ProfilesService

router = APIRouter()


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    user_id: CurrentUser,
    db: Database,
) -> ProfileResponse:
    """Get current user's profile.

    Args:
        user_id: Current authenticated user
        db: Database client

    Returns:
        ProfileResponse with profile data
    """
    service = ProfilesService(db)
    profile = await service.get_profile(user_id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return ProfileResponse(success=True, profile=profile)


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    user_id: CurrentUser,
    db: Database,
) -> ProfileResponse:
    """Update current user's profile.

    Args:
        data: Profile update data
        user_id: Current authenticated user
        db: Database client

    Returns:
        ProfileResponse with success status
    """
    service = ProfilesService(db)
    result = await service.update_profile(user_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return ProfileResponse(success=True)
