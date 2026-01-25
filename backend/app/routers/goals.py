"""Goals API routes."""

import logging
import sys

from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser, Database
from app.models.goal import (
    Goal,
    GoalCreate,
    GoalListResponse,
    GoalProgressUpdate,
    GoalResponse,
    GoalSyncRequest,
    GoalSyncResult,
    GoalUpdate,
)
from app.services.goal_sync import GoalSyncService
from app.services.goals_crud import GoalsCrudService
from app.utils.supabase_client import get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("api.goals")

router = APIRouter()


# ============ CRUD Operations ============


@router.post("/goals", response_model=GoalResponse)
async def create_goal(
    data: GoalCreate,
    user_id: CurrentUser,
    db: Database,
) -> GoalResponse:
    """Create a new goal.

    Args:
        data: Goal creation data
        user_id: Current authenticated user
        db: Database client

    Returns:
        GoalResponse with success status and goal_id
    """
    service = GoalsCrudService(db)
    result = await service.create_goal(user_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return GoalResponse(
        success=True,
        goal_id=result.get("goal_id"),
    )


@router.get("/goals", response_model=GoalListResponse)
async def get_goals(
    user_id: CurrentUser,
    db: Database,
) -> GoalListResponse:
    """Get all goals for the current user.

    Args:
        user_id: Current authenticated user
        db: Database client

    Returns:
        GoalListResponse with list of goals
    """
    logger.info(f"[GOALS] GET /goals - user_id: {user_id}")

    service = GoalsCrudService(db)
    goals = await service.get_goals(user_id)

    logger.info(f"[GOALS] Found {len(goals)} goals for user {user_id}")
    if goals:
        for g in goals[:3]:  # Log first 3 goals
            title = g.get("title", "N/A") if isinstance(g, dict) else g.title
            goal_id = g.get("id", "N/A") if isinstance(g, dict) else g.id
            logger.info(f"[GOALS]   - {title} (id: {goal_id})")

    return GoalListResponse(goals=goals)


@router.get("/goals/{goal_id}")
async def get_goal(
    goal_id: str,
    user_id: CurrentUser,
    db: Database,
) -> Goal:
    """Get a single goal by ID.

    Args:
        goal_id: The goal ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        Goal
    """
    service = GoalsCrudService(db)
    goal = await service.get_goal(user_id, goal_id)

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return goal


@router.put("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    data: GoalUpdate,
    user_id: CurrentUser,
    db: Database,
) -> GoalResponse:
    """Update a goal.

    Args:
        goal_id: The goal ID
        data: Update data
        user_id: Current authenticated user
        db: Database client

    Returns:
        GoalResponse with success status
    """
    service = GoalsCrudService(db)
    result = await service.update_goal(user_id, goal_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return GoalResponse(success=True)


@router.put("/goals/{goal_id}/progress", response_model=GoalResponse)
async def update_goal_progress(
    goal_id: str,
    data: GoalProgressUpdate,
    user_id: CurrentUser,
    db: Database,
) -> GoalResponse:
    """Update only goal progress (current_value).

    Args:
        goal_id: The goal ID
        data: Progress update with new current_value
        user_id: Current authenticated user
        db: Database client

    Returns:
        GoalResponse with success status
    """
    service = GoalsCrudService(db)
    result = await service.update_goal_progress(user_id, goal_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return GoalResponse(success=True)


@router.delete("/goals/{goal_id}", response_model=GoalResponse)
async def delete_goal(
    goal_id: str,
    user_id: CurrentUser,
    db: Database,
) -> GoalResponse:
    """Soft delete a goal.

    Args:
        goal_id: The goal ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        GoalResponse with success status
    """
    service = GoalsCrudService(db)
    result = await service.delete_goal(user_id, goal_id)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return GoalResponse(success=True)


# ============ Sync Operations ============


@router.post("/goals/sync", response_model=GoalSyncResult)
async def sync_goals(request: GoalSyncRequest) -> GoalSyncResult:
    """Sync all goals for a user with their workout data.

    This endpoint calculates current values for goals based on:
    - Workout counts (for "workouts" unit)
    - Total duration (for "minutes" unit)
    - Unique workout days (for "days" unit)
    - Body weight or exercise max weight (for "kg"/"lbs" units)
    - Max reps for exercises (for "reps" unit)
    - Total distance (for "km"/"miles" units)

    Args:
        request: The sync request with user_id

    Returns:
        GoalSyncResult with success status and number of updated goals
    """
    try:
        supabase = get_supabase_client()
        service = GoalSyncService(supabase)

        result = await service.sync_user_goals(request.user_id)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/goals/{goal_id}/sync", response_model=GoalSyncResult)
async def sync_single_goal(goal_id: str, request: GoalSyncRequest) -> GoalSyncResult:
    """Sync a single goal with workout data.

    Args:
        goal_id: The goal ID to sync
        request: The sync request with user_id

    Returns:
        GoalSyncResult with success status
    """
    try:
        supabase = get_supabase_client()

        # Fetch the specific goal
        response = (
            supabase.table("goals")
            .select("*")
            .eq("id", goal_id)
            .eq("user_id", request.user_id)
            .is_("deleted_at", "null")
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Goal not found")

        service = GoalSyncService(supabase)

        # Sync just this goal by filtering
        from app.models.goal import Goal

        goal = Goal(**response.data[0])

        result = await service._sync_single_goal(request.user_id, goal)

        if result:
            return GoalSyncResult(
                success=True,
                updated=1,
                message=f"Synced goal '{goal.title}'",
                details=[result],
            )
        else:
            return GoalSyncResult(
                success=True,
                updated=0,
                message="Goal value unchanged",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
