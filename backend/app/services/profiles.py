"""Profiles CRUD service."""

import logging
from datetime import datetime
from typing import Any

from supabase import Client

from app.models.profile import Profile, ProfileUpdate

logger = logging.getLogger(__name__)


class ProfilesService:
    """Service for user profile operations."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def get_profile(self, user_id: str) -> Profile | None:
        """Get user profile.

        Args:
            user_id: The user's ID

        Returns:
            Profile or None if not found
        """
        response = (
            self.supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        return response.data

    async def update_profile(self, user_id: str, data: ProfileUpdate) -> dict[str, Any]:
        """Update user profile.

        Args:
            user_id: The user's ID
            data: Profile update data

        Returns:
            Dict with success status or error
        """
        try:
            # Validate date of birth if provided
            if data.date_of_birth:
                try:
                    dob = datetime.fromisoformat(data.date_of_birth)
                    age = (datetime.now() - dob).days // 365
                    if age < 13 or age > 120:
                        return {
                            "success": False,
                            "error": "Please enter a valid date of birth (age must be between 13 and 120)",
                        }
                except (ValueError, AttributeError):
                    return {"success": False, "error": "Invalid date of birth format"}

            # Validate height if provided
            if data.height_cm is not None and (
                data.height_cm < 50 or data.height_cm > 300
            ):
                return {
                    "success": False,
                    "error": "Height must be between 50 and 300 cm",
                }

            # Build update dict
            update_data: dict[str, Any] = {"updated_at": datetime.now().isoformat()}

            # Map all updatable fields
            fields = [
                "full_name",
                "date_of_birth",
                "gender",
                "height_cm",
                "fitness_level",
                "fitness_goals",
                "medical_conditions",
                "injuries",
                "theme",
                "accent_theme",
                "weight_unit",
                "distance_unit",
                "notification_preferences",
            ]

            for field in fields:
                value = getattr(data, field, None)
                if value is not None:
                    update_data[field] = value

            response = (
                self.supabase.table("profiles")
                .update(update_data)
                .eq("id", user_id)
                .execute()
            )

            if not response.data:
                return {"success": False, "error": "Profile not found"}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return {"success": False, "error": str(e)}
