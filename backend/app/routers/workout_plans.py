"""Workout plans API routes."""

from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser, Database
from app.models.workout_plan import (
    AIGeneratedPlanResponse,
    AIGenerationRequest,
    CurrentWeekSessionsResponse,
    WorkoutPlan,
    WorkoutPlanCreate,
    WorkoutPlanListResponse,
    WorkoutPlanResponse,
    WorkoutPlanUpdate,
    WorkoutPlanWithSessions,
)
from app.services.ai_plan_generator import AIPlanGenerator
from app.services.workout_plans_crud import WorkoutPlansCrudService

router = APIRouter()


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
    service = WorkoutPlansCrudService(db)
    plans = await service.get_plans(user_id)
    
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
async def generate_workout_plan(request: AIGenerationRequest) -> AIGeneratedPlanResponse:
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
