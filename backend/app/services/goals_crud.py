"""Goals CRUD service."""

import logging
from datetime import datetime
from typing import Any, Optional

from supabase import Client

from app.models.goal import Goal, GoalCreate, GoalProgressUpdate, GoalUpdate

logger = logging.getLogger(__name__)

# Error messages
ERROR_GOAL_NOT_FOUND = "Goal not found"
ERROR_PAST_TARGET_DATE = "Target date cannot be in the past"


def calculate_goal_status(
    initial_value: float,
    current_value: float,
    target_value: float,
    target_date: Optional[str],
) -> str:
    """Calculate goal status based on progress and target date.
    
    Args:
        initial_value: Starting value
        current_value: Current value
        target_value: Target value
        target_date: Optional target date string
        
    Returns:
        Status string: 'completed', 'on_track', 'behind', or 'active'
    """
    # Check if goal is achieved
    if initial_value <= target_value:
        # Increasing goal
        if current_value >= target_value:
            return "completed"
    else:
        # Decreasing goal
        if current_value <= target_value:
            return "completed"

    # Check if overdue
    if target_date:
        try:
            target = datetime.fromisoformat(target_date.replace("Z", "+00:00"))
            if datetime.now(target.tzinfo) > target:
                return "behind"
        except (ValueError, AttributeError):
            pass

    return "active"


class GoalsCrudService:
    """Service for goals CRUD operations."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_goal(self, user_id: str, data: GoalCreate) -> dict[str, Any]:
        """Create a new goal.
        
        Args:
            user_id: The user's ID
            data: Goal creation data
            
        Returns:
            Dict with success status and goal_id or error
        """
        try:
            # Validate target date is not in the past
            if data.target_date:
                target = datetime.fromisoformat(data.target_date)
                today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                if target < today:
                    return {"success": False, "error": ERROR_PAST_TARGET_DATE}

            current_value = data.current_value or 0
            status = calculate_goal_status(
                initial_value=current_value,
                current_value=current_value,
                target_value=data.target_value,
                target_date=data.target_date,
            )
            achieved = status == "completed"

            goal_data = {
                "user_id": user_id,
                "title": data.title,
                "description": data.description,
                "target_value": data.target_value,
                "current_value": current_value,
                "initial_value": current_value,
                "unit": data.unit,
                "target_date": data.target_date,
                "achieved": achieved,
                "status": status,
            }

            response = self.supabase.table("goals").insert(goal_data).execute()

            if not response.data:
                return {"success": False, "error": "Failed to create goal"}

            return {"success": True, "goal_id": response.data[0]["id"]}

        except Exception as e:
            logger.error(f"Error creating goal: {e}")
            return {"success": False, "error": str(e)}

    async def get_goals(self, user_id: str) -> list[Goal]:
        """Get all goals for a user.
        
        Args:
            user_id: The user's ID
            
        Returns:
            List of goals
        """
        response = self.supabase.table("goals").select("*").eq(
            "user_id", user_id
        ).is_("deleted_at", "null").order("created_at", desc=True).execute()

        return response.data or []

    async def get_goal(self, user_id: str, goal_id: str) -> Optional[Goal]:
        """Get a single goal by ID.
        
        Args:
            user_id: The user's ID
            goal_id: The goal ID
            
        Returns:
            Goal or None if not found
        """
        response = self.supabase.table("goals").select("*").eq(
            "id", goal_id
        ).eq("user_id", user_id).is_("deleted_at", "null").single().execute()

        return response.data if response.data else None

    def _validate_target_date(self, target_date: Optional[str]) -> Optional[str]:
        """Validate target date is not in the past.
        
        Returns error message if invalid, None if valid.
        """
        if not target_date:
            return None
        try:
            target = datetime.fromisoformat(str(target_date).replace("Z", "+00:00"))
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            if target.replace(tzinfo=None) < today:
                return ERROR_PAST_TARGET_DATE
        except (ValueError, AttributeError):
            pass
        return None

    def _build_update_data(self, data: GoalUpdate) -> dict[str, Any]:
        """Build update dict from GoalUpdate, only including non-None fields."""
        update_data: dict[str, Any] = {"updated_at": datetime.now().isoformat()}
        
        field_mapping = ["title", "description", "target_value", "current_value", "unit", "target_date"]
        for field in field_mapping:
            value = getattr(data, field, None)
            if value is not None:
                update_data[field] = value
        
        return update_data

    async def update_goal(
        self, user_id: str, goal_id: str, data: GoalUpdate
    ) -> dict[str, Any]:
        """Update a goal.
        
        Args:
            user_id: The user's ID
            goal_id: The goal ID
            data: Update data
            
        Returns:
            Dict with success status or error
        """
        try:
            existing = await self.get_goal(user_id, goal_id)
            if not existing:
                return {"success": False, "error": ERROR_GOAL_NOT_FOUND}

            target_date = data.target_date if data.target_date is not None else existing.get("target_date")
            validation_error = self._validate_target_date(target_date)
            if validation_error:
                return {"success": False, "error": validation_error}

            update_data = self._build_update_data(data)

            # Calculate status
            current = data.current_value if data.current_value is not None else existing.get("current_value", 0)
            target_val = data.target_value if data.target_value is not None else existing.get("target_value", 0)
            
            status = calculate_goal_status(
                initial_value=existing.get("initial_value", 0),
                current_value=current,
                target_value=target_val,
                target_date=target_date,
            )
            update_data["status"] = status
            update_data["achieved"] = status == "completed"

            response = self.supabase.table("goals").update(update_data).eq(
                "id", goal_id
            ).eq("user_id", user_id).is_("deleted_at", "null").execute()

            if not response.data:
                return {"success": False, "error": ERROR_GOAL_NOT_FOUND}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error updating goal: {e}")
            return {"success": False, "error": str(e)}

    async def update_goal_progress(
        self, user_id: str, goal_id: str, data: GoalProgressUpdate
    ) -> dict[str, Any]:
        """Update only goal progress (current_value).
        
        Args:
            user_id: The user's ID
            goal_id: The goal ID
            data: Progress update with new current_value
            
        Returns:
            Dict with success status or error
        """
        try:
            # Get existing goal
            existing = await self.get_goal(user_id, goal_id)
            if not existing:
                return {"success": False, "error": ERROR_GOAL_NOT_FOUND}

            # Calculate status
            status = calculate_goal_status(
                initial_value=existing.get("initial_value", 0),
                current_value=data.current_value,
                target_value=existing.get("target_value", 0),
                target_date=existing.get("target_date"),
            )

            response = self.supabase.table("goals").update({
                "current_value": data.current_value,
                "status": status,
                "achieved": status == "completed",
                "updated_at": datetime.now().isoformat(),
            }).eq("id", goal_id).eq("user_id", user_id).execute()

            if not response.data:
                return {"success": False, "error": ERROR_GOAL_NOT_FOUND}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error updating goal progress: {e}")
            return {"success": False, "error": str(e)}

    async def delete_goal(self, user_id: str, goal_id: str) -> dict[str, Any]:
        """Soft delete a goal.
        
        Args:
            user_id: The user's ID
            goal_id: The goal ID
            
        Returns:
            Dict with success status or error
        """
        try:
            response = self.supabase.table("goals").update({
                "deleted_at": datetime.now().isoformat(),
                "status": "archived",
                "updated_at": datetime.now().isoformat(),
            }).eq("id", goal_id).eq("user_id", user_id).is_(
                "deleted_at", "null"
            ).execute()

            if not response.data:
                return {"success": False, "error": ERROR_GOAL_NOT_FOUND}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting goal: {e}")
            return {"success": False, "error": str(e)}
