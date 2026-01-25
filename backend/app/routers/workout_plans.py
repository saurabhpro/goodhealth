"""Workout plans API routes."""

import logging
import sys
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import CurrentUser, Database
from app.models.workout_plan import (
    AIGeneratedPlanResponse,
    AIGenerationRequest,
    CurrentWeekSessionsResponse,
    WorkoutPlanCreate,
    WorkoutPlanListResponse,
    WorkoutPlanResponse,
    WorkoutPlanUpdate,
    WorkoutPlanWithSessions,
)
from app.services.ai_plan_generator import AIPlanGenerator
from app.services.workout_plans_crud import WorkoutPlansCrudService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("api.workout_plans")

router = APIRouter()


# ============ Response Models ============


class PreferencesResponse(BaseModel):
    """Response model for user preferences."""

    preferences: dict[str, Any] | None = None
    error: str | None = None


class TemplatesResponse(BaseModel):
    """Response model for workout templates."""

    templates: list[dict[str, Any]] | None = None
    template: dict[str, Any] | None = None
    template_id: str | None = None
    error: str | None = None


# ============ Preferences Routes (MUST be before {plan_id}) ============


@router.get("/workout-plans/preferences", response_model=PreferencesResponse)
async def get_user_preferences(
    user_id: CurrentUser,
    db: Database,
) -> PreferencesResponse:
    """Get user workout preferences.

    Args:
        user_id: Current authenticated user
        db: Database client

    Returns:
        PreferencesResponse with user preferences
    """
    response = (
        db.table("user_workout_preferences")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    return PreferencesResponse(preferences=response.data)


@router.put("/workout-plans/preferences", response_model=PreferencesResponse)
async def upsert_user_preferences(
    preferences: dict[str, Any],
    user_id: CurrentUser,
    db: Database,
) -> PreferencesResponse:
    """Create or update user workout preferences.

    Args:
        preferences: Preference data to upsert
        user_id: Current authenticated user
        db: Database client

    Returns:
        PreferencesResponse with updated preferences
    """
    # Add user_id to preferences
    preferences["user_id"] = user_id

    response = (
        db.table("user_workout_preferences")
        .upsert(preferences, on_conflict="user_id")
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to save preferences")

    return PreferencesResponse(preferences=response.data[0] if response.data else None)


# ============ Templates Routes (MUST be before {plan_id}) ============


@router.get("/workout-plans/templates", response_model=TemplatesResponse)
async def get_user_templates(
    user_id: CurrentUser,
    db: Database,
    is_active: bool | None = Query(None),
) -> TemplatesResponse:
    """Get user workout templates.

    Args:
        user_id: Current authenticated user
        db: Database client
        is_active: Optional filter for active templates

    Returns:
        TemplatesResponse with user templates
    """
    query = (
        db.table("workout_templates")
        .select("*")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
    )

    if is_active is not None:
        query = query.eq("is_active", is_active)

    response = query.order("created_at", desc=True).execute()

    return TemplatesResponse(templates=response.data or [])


@router.post("/workout-plans/templates", response_model=TemplatesResponse)
async def create_user_template(
    template: dict[str, Any],
    user_id: CurrentUser,
    db: Database,
) -> TemplatesResponse:
    """Create a new workout template.

    Args:
        template: Template data
        user_id: Current authenticated user
        db: Database client

    Returns:
        TemplatesResponse with created template
    """
    # Add user_id to template
    template["user_id"] = user_id

    response = db.table("workout_templates").insert(template).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create template")

    return TemplatesResponse(
        template=response.data[0] if response.data else None,
        template_id=response.data[0]["id"] if response.data else None,
    )


@router.delete(
    "/workout-plans/templates/{template_id}", response_model=TemplatesResponse
)
async def delete_user_template(
    template_id: str,
    user_id: CurrentUser,
    db: Database,
) -> TemplatesResponse:
    """Soft delete a workout template.

    Args:
        template_id: Template ID to delete
        user_id: Current authenticated user
        db: Database client

    Returns:
        TemplatesResponse with success status
    """
    from datetime import datetime

    response = (
        db.table("workout_templates")
        .update(
            {
                "deleted_at": datetime.now().isoformat(),
            }
        )
        .eq("id", template_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Template not found")

    return TemplatesResponse(template_id=template_id)


# ============ CRUD Operations ============


@router.post("/workout-plans", response_model=WorkoutPlanResponse)
async def create_workout_plan(
    data: WorkoutPlanCreate,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanResponse:
    """Create a new workout plan.

    Args:
        data: Plan creation data
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanResponse with success status and plan
    """
    service = WorkoutPlansCrudService(db)
    result = await service.create_plan(user_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutPlanResponse(success=True, plan=result.get("plan"))


@router.get("/workout-plans", response_model=WorkoutPlanListResponse)
async def get_workout_plans(
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanListResponse:
    """Get all workout plans for the current user.

    Args:
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanListResponse with list of plans
    """
    logger.info(f"[PLANS] GET /workout-plans - user_id: {user_id}")

    service = WorkoutPlansCrudService(db)
    plans = await service.get_plans(user_id)

    logger.info(f"[PLANS] Found {len(plans)} workout plans for user {user_id}")
    if plans:
        for p in plans[:3]:  # Log first 3 plans
            logger.info(f"[PLANS]   - {p.get('name', 'N/A')} (id: {p.get('id', 'N/A')}, status: {p.get('status', 'N/A')})")

    return WorkoutPlanListResponse(plans=plans)


@router.get("/workout-plans/current-week", response_model=CurrentWeekSessionsResponse)
async def get_current_week_sessions(
    user_id: CurrentUser,
    db: Database,
) -> CurrentWeekSessionsResponse:
    """Get current week's sessions for active workout plan.

    Args:
        user_id: Current authenticated user
        db: Database client

    Returns:
        CurrentWeekSessionsResponse with sessions and current week number
    """
    service = WorkoutPlansCrudService(db)
    result = await service.get_current_week_sessions(user_id)

    return CurrentWeekSessionsResponse(
        sessions=result.get("sessions", []),
        current_week=result.get("current_week", 1),
    )


@router.get("/workout-plans/{plan_id}/week/{week_number}")
async def get_plan_week_sessions(
    plan_id: str,
    week_number: int,
    user_id: CurrentUser,
    db: Database,
) -> dict[str, Any]:
    """Get sessions for a specific week of a workout plan.

    Args:
        plan_id: The plan ID
        week_number: The week number (1-based)
        user_id: Current authenticated user
        db: Database client

    Returns:
        Dict with sessions for the week
    """
    # Verify user owns this plan
    plan_response = (
        db.table("workout_plans")
        .select("id")
        .eq("id", plan_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not plan_response.data:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Get sessions for this week
    sessions_response = (
        db.table("workout_plan_sessions")
        .select("*")
        .eq("plan_id", plan_id)
        .eq("week_number", week_number)
        .is_("deleted_at", "null")
        .order("day_of_week")
        .execute()
    )

    return {"sessions": sessions_response.data or []}


@router.get("/workout-plans/{plan_id}")
async def get_workout_plan(
    plan_id: str,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanWithSessions:
    """Get a workout plan with all sessions.

    Args:
        plan_id: The plan ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanWithSessions
    """
    service = WorkoutPlansCrudService(db)
    plan = await service.get_plan(user_id, plan_id)

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    return plan


@router.put("/workout-plans/{plan_id}", response_model=WorkoutPlanResponse)
async def update_workout_plan(
    plan_id: str,
    data: WorkoutPlanUpdate,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanResponse:
    """Update a workout plan.

    Args:
        plan_id: The plan ID
        data: Update data
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanResponse with success status and plan
    """
    service = WorkoutPlansCrudService(db)
    result = await service.update_plan(user_id, plan_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutPlanResponse(success=True, plan=result.get("plan"))


@router.delete("/workout-plans/{plan_id}", response_model=WorkoutPlanResponse)
async def delete_workout_plan(
    plan_id: str,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanResponse:
    """Soft delete a workout plan.

    Args:
        plan_id: The plan ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanResponse with success status
    """
    service = WorkoutPlansCrudService(db)
    result = await service.delete_plan(user_id, plan_id)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutPlanResponse(success=True)


@router.post("/workout-plans/{plan_id}/activate", response_model=WorkoutPlanResponse)
async def activate_workout_plan(
    plan_id: str,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanResponse:
    """Activate a workout plan.

    Args:
        plan_id: The plan ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanResponse with success status and plan
    """
    service = WorkoutPlansCrudService(db)
    result = await service.activate_plan(user_id, plan_id)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutPlanResponse(success=True, plan=result.get("plan"))


@router.post("/workout-plans/{plan_id}/complete", response_model=WorkoutPlanResponse)
async def complete_workout_plan(
    plan_id: str,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanResponse:
    """Complete a workout plan.

    Args:
        plan_id: The plan ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanResponse with success status and plan
    """
    service = WorkoutPlansCrudService(db)
    result = await service.complete_plan(user_id, plan_id)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutPlanResponse(success=True, plan=result.get("plan"))


@router.post("/workout-plans/{plan_id}/deactivate", response_model=WorkoutPlanResponse)
async def deactivate_workout_plan(
    plan_id: str,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutPlanResponse:
    """Deactivate/archive a workout plan.

    Args:
        plan_id: The plan ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutPlanResponse with success status and plan
    """
    service = WorkoutPlansCrudService(db)
    result = await service.deactivate_plan(user_id, plan_id)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutPlanResponse(success=True, plan=result.get("plan"))


# ============ AI Generation ============


@router.post("/workout-plans/generate", response_model=AIGeneratedPlanResponse)
async def generate_workout_plan(
    request: AIGenerationRequest,
) -> AIGeneratedPlanResponse:
    """Generate an AI-powered workout plan.

    Args:
        request: The generation request with goal, preferences, and history

    Returns:
        AIGeneratedPlanResponse with the generated plan or error
    """
    try:
        generator = AIPlanGenerator()
        result = await generator.generate_plan(request)

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
