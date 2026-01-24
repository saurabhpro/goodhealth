"""Workouts CRUD service."""

import logging
from datetime import datetime
from typing import Any, Optional

from supabase import Client

from app.models.workout import (
    Exercise,
    ExerciseCreate,
    Workout,
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutWithExercises,
    WorkoutWithSelfie,
)
from app.services.goal_sync import GoalSyncService

logger = logging.getLogger(__name__)


class WorkoutsService:
    """Service for workout CRUD operations."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_workout(
        self, user_id: str, data: WorkoutCreate
    ) -> dict[str, Any]:
        """Create a new workout with exercises.
        
        Args:
            user_id: The user's ID
            data: Workout creation data including exercises
            
        Returns:
            Dict with success status and workout_id or error
        """
        try:
            # Create workout record
            workout_data = {
                "user_id": user_id,
                "name": data.name,
                "date": data.date,
                "duration_minutes": data.duration_minutes,
                "description": data.description,
                "effort_level": data.effort_level,
            }

            response = self.supabase.table("workouts").insert(
                workout_data
            ).execute()

            if not response.data:
                return {"success": False, "error": "Failed to create workout"}

            workout = response.data[0]
            workout_id = workout["id"]

            # Create exercises if provided
            if data.exercises:
                exercise_records = [
                    self._build_exercise_record(ex, workout_id)
                    for ex in data.exercises
                ]
                
                ex_response = self.supabase.table("exercises").insert(
                    exercise_records
                ).execute()

                if not ex_response.data:
                    logger.warning(f"Failed to create exercises for workout {workout_id}")

            # Update workout plan session if linked
            if data.session_id:
                self.supabase.table("workout_plan_sessions").update({
                    "status": "completed",
                    "completed_workout_id": workout_id,
                    "completed_at": datetime.now().isoformat(),
                }).eq("id", data.session_id).execute()

            # Sync goal progress
            goal_sync = GoalSyncService(self.supabase)
            await goal_sync.sync_user_goals(user_id)

            return {"success": True, "workout_id": workout_id}

        except Exception as e:
            logger.error(f"Error creating workout: {e}")
            return {"success": False, "error": str(e)}

    async def get_workouts(
        self, user_id: str, limit: Optional[int] = None
    ) -> list[WorkoutWithSelfie]:
        """Get all workouts for a user with exercises and selfies.
        
        Args:
            user_id: The user's ID
            limit: Optional limit on number of workouts
            
        Returns:
            List of workouts with exercises and selfies
        """
        query = self.supabase.table("workouts").select(
            "*, exercises(*), workout_selfies(id, file_path, caption, taken_at)"
        ).eq("user_id", user_id).is_("deleted_at", "null").order(
            "date", desc=True
        )

        if limit:
            query = query.limit(limit)

        response = query.execute()
        workouts = response.data or []

        # Generate signed URLs for selfies
        result = []
        for workout in workouts:
            selfies = workout.get("workout_selfies", [])
            if selfies:
                for selfie in selfies:
                    signed_url = await self._get_signed_url(selfie.get("file_path"))
                    selfie["signedUrl"] = signed_url
            result.append(workout)

        return result

    async def get_workout(
        self, user_id: str, workout_id: str
    ) -> Optional[WorkoutWithExercises]:
        """Get a single workout by ID.
        
        Args:
            user_id: The user's ID
            workout_id: The workout ID
            
        Returns:
            Workout with exercises or None if not found
        """
        response = self.supabase.table("workouts").select(
            "*, exercises(*)"
        ).eq("id", workout_id).eq("user_id", user_id).is_(
            "deleted_at", "null"
        ).single().execute()

        return response.data if response.data else None

    async def update_workout(
        self, user_id: str, workout_id: str, data: WorkoutUpdate
    ) -> dict[str, Any]:
        """Update a workout and its exercises.
        
        Args:
            user_id: The user's ID
            workout_id: The workout ID
            data: Update data
            
        Returns:
            Dict with success status or error
        """
        try:
            # Build update dict (only non-None values)
            update_data: dict[str, Any] = {"updated_at": datetime.now().isoformat()}
            
            if data.name is not None:
                update_data["name"] = data.name
            if data.date is not None:
                update_data["date"] = data.date
            if data.duration_minutes is not None:
                update_data["duration_minutes"] = data.duration_minutes
            if data.description is not None:
                update_data["description"] = data.description
            if data.effort_level is not None:
                update_data["effort_level"] = data.effort_level

            # Update workout
            response = self.supabase.table("workouts").update(
                update_data
            ).eq("id", workout_id).eq("user_id", user_id).execute()

            if not response.data:
                return {"success": False, "error": "Workout not found"}

            # Update exercises if provided
            if data.exercises is not None:
                # Soft delete existing exercises
                self.supabase.table("exercises").update({
                    "deleted_at": datetime.now().isoformat()
                }).eq("workout_id", workout_id).is_("deleted_at", "null").execute()

                # Insert new exercises
                if data.exercises:
                    exercise_records = [
                        self._build_exercise_record(ex, workout_id)
                        for ex in data.exercises
                    ]
                    self.supabase.table("exercises").insert(exercise_records).execute()

            # Sync goal progress
            goal_sync = GoalSyncService(self.supabase)
            await goal_sync.sync_user_goals(user_id)

            return {"success": True}

        except Exception as e:
            logger.error(f"Error updating workout: {e}")
            return {"success": False, "error": str(e)}

    async def delete_workout(self, user_id: str, workout_id: str) -> dict[str, Any]:
        """Soft delete a workout.
        
        Args:
            user_id: The user's ID
            workout_id: The workout ID
            
        Returns:
            Dict with success status or error
        """
        try:
            response = self.supabase.table("workouts").update({
                "deleted_at": datetime.now().isoformat()
            }).eq("id", workout_id).eq("user_id", user_id).is_(
                "deleted_at", "null"
            ).execute()

            if not response.data:
                return {"success": False, "error": "Workout not found"}

            # Sync goal progress
            goal_sync = GoalSyncService(self.supabase)
            await goal_sync.sync_user_goals(user_id)

            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting workout: {e}")
            return {"success": False, "error": str(e)}

    def _build_exercise_record(
        self, exercise: ExerciseCreate, workout_id: str
    ) -> dict[str, Any]:
        """Build exercise record for database insertion."""
        return {
            "workout_id": workout_id,
            "name": exercise.name,
            "exercise_type": exercise.exercise_type,
            "sets": exercise.sets,
            "reps": exercise.reps,
            "weight": exercise.weight,
            "weight_unit": exercise.weight_unit,
            "duration_minutes": exercise.duration_minutes,
            "distance": exercise.distance,
            "distance_unit": exercise.distance_unit,
            "speed": exercise.speed,
            "calories": exercise.calories,
            "resistance_level": exercise.resistance_level,
            "incline": exercise.incline,
            "notes": exercise.notes,
        }

    async def _get_signed_url(self, file_path: Optional[str]) -> Optional[str]:
        """Get signed URL for a selfie file."""
        if not file_path:
            return None
        
        try:
            result = self.supabase.storage.from_("workout-selfies").create_signed_url(
                file_path, 3600
            )
            return result.get("signedUrl") if result else None
        except Exception as e:
            logger.warning(f"Failed to get signed URL: {e}")
            return None
