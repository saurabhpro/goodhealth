"""Workout Plans CRUD service."""

import logging
from datetime import datetime
from typing import Any

from supabase import Client

from app.models.workout_plan import (
    WorkoutPlan,
    WorkoutPlanCreate,
    WorkoutPlanUpdate,
    WorkoutPlanWithSessions,
)

logger = logging.getLogger(__name__)


class WorkoutPlansCrudService:
    """Service for workout plan CRUD operations."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_plan(
        self, user_id: str, data: WorkoutPlanCreate
    ) -> dict[str, Any]:
        """Create a new workout plan.

        Args:
            user_id: The user's ID
            data: Plan creation data

        Returns:
            Dict with success status and plan or error
        """
        try:
            plan_data = {
                "user_id": user_id,
                "name": data.name,
                "description": data.description,
                "goal_type": data.goal_type,
                "goal_id": data.goal_id,
                "weeks_duration": data.weeks_duration,
                "workouts_per_week": data.workouts_per_week,
                "avg_workout_duration": data.avg_workout_duration,
            }

            response = self.supabase.table("workout_plans").insert(plan_data).execute()

            if not response.data:
                return {"success": False, "error": "Failed to create workout plan"}

            return {"success": True, "plan": response.data[0]}

        except Exception as e:
            logger.error(f"Error creating workout plan: {e}")
            return {"success": False, "error": str(e)}

    async def get_plans(self, user_id: str) -> list[WorkoutPlan]:
        """Get all workout plans for a user.

        Args:
            user_id: The user's ID

        Returns:
            List of workout plans
        """
        response = (
            self.supabase.table("workout_plans")
            .select("*, goals(*)")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    async def get_plan(
        self, user_id: str, plan_id: str
    ) -> WorkoutPlanWithSessions | None:
        """Get a workout plan with all sessions.

        Args:
            user_id: The user's ID
            plan_id: The plan ID

        Returns:
            Plan with sessions or None if not found
        """
        response = (
            self.supabase.table("workout_plans")
            .select("*, goals(*), workout_plan_sessions(*)")
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )

        return response.data if response.data else None

    async def update_plan(
        self, user_id: str, plan_id: str, data: WorkoutPlanUpdate
    ) -> dict[str, Any]:
        """Update a workout plan.

        Args:
            user_id: The user's ID
            plan_id: The plan ID
            data: Update data

        Returns:
            Dict with success status and plan or error
        """
        try:
            update_data: dict[str, Any] = {"updated_at": datetime.now().isoformat()}

            fields = [
                "name",
                "description",
                "goal_type",
                "goal_id",
                "weeks_duration",
                "workouts_per_week",
                "avg_workout_duration",
                "status",
            ]

            for field in fields:
                value = getattr(data, field, None)
                if value is not None:
                    update_data[field] = value

            response = (
                self.supabase.table("workout_plans")
                .update(update_data)
                .eq("id", plan_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                return {"success": False, "error": "Plan not found"}

            return {"success": True, "plan": response.data[0]}

        except Exception as e:
            logger.error(f"Error updating workout plan: {e}")
            return {"success": False, "error": str(e)}

    async def delete_plan(self, user_id: str, plan_id: str) -> dict[str, Any]:
        """Soft delete a workout plan.

        Args:
            user_id: The user's ID
            plan_id: The plan ID

        Returns:
            Dict with success status or error
        """
        try:
            response = (
                self.supabase.table("workout_plans")
                .update(
                    {
                        "deleted_at": datetime.now().isoformat(),
                        "status": "archived",
                        "updated_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", plan_id)
                .eq("user_id", user_id)
                .is_("deleted_at", "null")
                .execute()
            )

            if not response.data:
                return {"success": False, "error": "Plan not found"}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting workout plan: {e}")
            return {"success": False, "error": str(e)}

    async def activate_plan(self, user_id: str, plan_id: str) -> dict[str, Any]:
        """Activate a workout plan.

        Args:
            user_id: The user's ID
            plan_id: The plan ID

        Returns:
            Dict with success status and plan or error
        """
        try:
            # Check for existing active plan
            active = (
                self.supabase.table("workout_plans")
                .select("id")
                .eq("user_id", user_id)
                .eq("status", "active")
                .is_("deleted_at", "null")
                .execute()
            )

            if active.data:
                return {
                    "success": False,
                    "error": "You already have an active plan. Complete or archive it first.",
                }

            response = (
                self.supabase.table("workout_plans")
                .update(
                    {
                        "status": "active",
                        "started_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", plan_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                return {"success": False, "error": "Plan not found"}

            return {"success": True, "plan": response.data[0]}

        except Exception as e:
            logger.error(f"Error activating workout plan: {e}")
            return {"success": False, "error": str(e)}

    async def complete_plan(self, user_id: str, plan_id: str) -> dict[str, Any]:
        """Complete a workout plan.

        Args:
            user_id: The user's ID
            plan_id: The plan ID

        Returns:
            Dict with success status and plan or error
        """
        try:
            response = (
                self.supabase.table("workout_plans")
                .update(
                    {
                        "status": "completed",
                        "completed_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", plan_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                return {"success": False, "error": "Plan not found"}

            return {"success": True, "plan": response.data[0]}

        except Exception as e:
            logger.error(f"Error completing workout plan: {e}")
            return {"success": False, "error": str(e)}

    async def deactivate_plan(self, user_id: str, plan_id: str) -> dict[str, Any]:
        """Deactivate/archive a workout plan.

        Args:
            user_id: The user's ID
            plan_id: The plan ID

        Returns:
            Dict with success status and plan or error
        """
        try:
            response = (
                self.supabase.table("workout_plans")
                .update(
                    {
                        "status": "archived",
                        "updated_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", plan_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                return {"success": False, "error": "Plan not found"}

            return {"success": True, "plan": response.data[0]}

        except Exception as e:
            logger.error(f"Error deactivating workout plan: {e}")
            return {"success": False, "error": str(e)}

    async def get_current_week_sessions(self, user_id: str) -> dict[str, Any]:
        """Get current week's sessions for active workout plan.

        Args:
            user_id: The user's ID

        Returns:
            Dict with sessions and current_week
        """
        # Find active plan
        plan_response = (
            self.supabase.table("workout_plans")
            .select("id, started_at, weeks_duration")
            .eq("user_id", user_id)
            .or_("status.eq.active,status.eq.draft")
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )

        if not plan_response.data:
            return {"sessions": [], "current_week": 1}

        plan = plan_response.data[0]

        # Calculate current week
        current_week = 1
        if plan.get("started_at"):
            start_date = datetime.fromisoformat(
                plan["started_at"].replace("Z", "+00:00")
            )
            days_since_start = (datetime.now(start_date.tzinfo) - start_date).days
            current_week = min(
                (days_since_start // 7) + 1,
                plan.get("weeks_duration", 1),
            )

        # Fetch sessions for current week
        sessions_response = (
            self.supabase.table("workout_plan_sessions")
            .select("*")
            .eq("plan_id", plan["id"])
            .eq("week_number", current_week)
            .is_("deleted_at", "null")
            .order("day_of_week")
            .execute()
        )

        return {
            "sessions": sessions_response.data or [],
            "current_week": current_week,
        }
