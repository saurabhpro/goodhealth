"""Workouts API routes."""


from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser, Database
from app.models.workout import (
    WorkoutCreate,
    WorkoutListResponse,
    WorkoutResponse,
    WorkoutUpdate,
    WorkoutWithExercises,
)
from app.services.workouts import WorkoutsService

router = APIRouter()


@router.post("/workouts", response_model=WorkoutResponse)
async def create_workout(
    data: WorkoutCreate,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutResponse:
    """Create a new workout with exercises.

    Args:
        data: Workout creation data including exercises
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutResponse with success status and workout_id
    """
    service = WorkoutsService(db)
    result = await service.create_workout(user_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutResponse(
        success=True,
        workout_id=result.get("workout_id"),
    )


@router.get("/workouts", response_model=WorkoutListResponse)
async def get_workouts(
    user_id: CurrentUser,
    db: Database,
    limit: int | None = None,
) -> WorkoutListResponse:
    """Get all workouts for the current user.

    Args:
        user_id: Current authenticated user
        db: Database client
        limit: Optional limit on number of workouts

    Returns:
        WorkoutListResponse with list of workouts
    """
    service = WorkoutsService(db)
    workouts = await service.get_workouts(user_id, limit)

    return WorkoutListResponse(workouts=workouts)


@router.get("/workouts/{workout_id}")
async def get_workout(
    workout_id: str,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutWithExercises:
    """Get a single workout by ID.

    Args:
        workout_id: The workout ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        Workout with exercises
    """
    service = WorkoutsService(db)
    workout = await service.get_workout(user_id, workout_id)

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    return workout


@router.put("/workouts/{workout_id}", response_model=WorkoutResponse)
async def update_workout(
    workout_id: str,
    data: WorkoutUpdate,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutResponse:
    """Update a workout and its exercises.

    Args:
        workout_id: The workout ID
        data: Update data
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutResponse with success status
    """
    service = WorkoutsService(db)
    result = await service.update_workout(user_id, workout_id, data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutResponse(success=True)


@router.delete("/workouts/{workout_id}", response_model=WorkoutResponse)
async def delete_workout(
    workout_id: str,
    user_id: CurrentUser,
    db: Database,
) -> WorkoutResponse:
    """Soft delete a workout.

    Args:
        workout_id: The workout ID
        user_id: Current authenticated user
        db: Database client

    Returns:
        WorkoutResponse with success status
    """
    service = WorkoutsService(db)
    result = await service.delete_workout(user_id, workout_id)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return WorkoutResponse(success=True)
