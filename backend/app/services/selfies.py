"""Selfies CRUD service."""

import logging
import re
from datetime import datetime
from typing import Any

from supabase import Client

from app.models.selfie import SelfieWithUrl, SelfieWithWorkout

logger = logging.getLogger(__name__)

BUCKET_NAME = "workout-selfies"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


class SelfiesService:
    """Service for workout selfie operations."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def upload_selfie(
        self,
        user_id: str,
        workout_id: str,
        file_content: bytes,
        file_name: str,
        mime_type: str,
        caption: str | None = None,
    ) -> dict[str, Any]:
        """Upload a selfie for a workout.

        Only ONE selfie is allowed per workout - replaces existing.

        Args:
            user_id: The user's ID
            workout_id: The workout ID
            file_content: File binary content
            file_name: Original file name
            mime_type: File MIME type
            caption: Optional caption

        Returns:
            Dict with success status and selfie_id or error
        """
        try:
            # Validate file
            if len(file_content) > MAX_FILE_SIZE:
                return {"success": False, "error": "File size must be less than 5MB"}

            if mime_type not in ALLOWED_MIME_TYPES:
                return {
                    "success": False,
                    "error": "File must be a valid image (JPEG, PNG, WebP, or HEIC)",
                }

            # Verify workout belongs to user
            workout_response = (
                self.supabase.table("workouts")
                .select("id")
                .eq("id", workout_id)
                .eq("user_id", user_id)
                .is_("deleted_at", "null")
                .single()
                .execute()
            )

            if not workout_response.data:
                return {"success": False, "error": "Workout not found or access denied"}

            # Check and soft delete existing selfie
            existing = (
                self.supabase.table("workout_selfies")
                .select("id, file_path")
                .eq("workout_id", workout_id)
                .eq("user_id", user_id)
                .is_("deleted_at", "null")
                .execute()
            )

            if existing.data:
                for selfie in existing.data:
                    self.supabase.table("workout_selfies").update(
                        {"deleted_at": datetime.now().isoformat()}
                    ).eq("id", selfie["id"]).execute()

            # Generate unique filename
            timestamp = int(datetime.now().timestamp() * 1000)
            safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", file_name)
            file_path = f"{user_id}/{workout_id}/{timestamp}_{safe_name}"

            # Upload to storage
            upload_result = self.supabase.storage.from_(BUCKET_NAME).upload(
                file_path,
                file_content,
                {"content-type": mime_type, "cache-control": "3600"},
            )

            if not upload_result:
                return {"success": False, "error": "Failed to upload file"}

            # Create database record
            selfie_data = {
                "workout_id": workout_id,
                "user_id": user_id,
                "file_path": file_path,
                "file_name": file_name,
                "file_size": len(file_content),
                "mime_type": mime_type,
                "caption": caption,
            }

            response = (
                self.supabase.table("workout_selfies").insert(selfie_data).execute()
            )

            if not response.data:
                # Clean up uploaded file
                self.supabase.storage.from_(BUCKET_NAME).remove([file_path])
                return {"success": False, "error": "Failed to save selfie record"}

            return {"success": True, "selfie_id": response.data[0]["id"]}

        except Exception as e:
            logger.error(f"Error uploading selfie: {e}")
            return {"success": False, "error": str(e)}

    async def get_workout_selfies(
        self, user_id: str, workout_id: str
    ) -> list[SelfieWithUrl]:
        """Get selfies for a workout (should only be 1).

        Args:
            user_id: The user's ID
            workout_id: The workout ID

        Returns:
            List of selfies with signed URLs
        """
        response = (
            self.supabase.table("workout_selfies")
            .select("*")
            .eq("workout_id", workout_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("taken_at", desc=True)
            .limit(1)
            .execute()
        )

        selfies = response.data or []

        # Add signed URLs
        result = []
        for selfie in selfies:
            signed_url = await self.get_signed_url(selfie.get("file_path"))
            result.append({**selfie, "signed_url": signed_url})

        return result

    async def get_signed_url(self, file_path: str | None) -> str | None:
        """Get a signed URL for viewing a selfie.

        Args:
            file_path: Storage file path

        Returns:
            Signed URL or None
        """
        if not file_path:
            return None

        try:
            result = self.supabase.storage.from_(BUCKET_NAME).create_signed_url(
                file_path, 3600  # 1 hour expiry
            )
            return result.get("signedUrl") if result else None
        except Exception as e:
            logger.warning(f"Failed to get signed URL: {e}")
            return None

    async def delete_selfie(self, user_id: str, selfie_id: str) -> dict[str, Any]:
        """Soft delete a selfie.

        Args:
            user_id: The user's ID
            selfie_id: The selfie ID

        Returns:
            Dict with success status or error
        """
        try:
            # Get selfie to verify ownership
            selfie = (
                self.supabase.table("workout_selfies")
                .select("id, file_path, workout_id")
                .eq("id", selfie_id)
                .eq("user_id", user_id)
                .is_("deleted_at", "null")
                .single()
                .execute()
            )

            if not selfie.data:
                return {"success": False, "error": "Selfie not found or access denied"}

            # Soft delete (keep file for recovery)
            self.supabase.table("workout_selfies").update(
                {"deleted_at": datetime.now().isoformat()}
            ).eq("id", selfie_id).execute()

            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting selfie: {e}")
            return {"success": False, "error": str(e)}

    async def update_caption(
        self, user_id: str, selfie_id: str, caption: str
    ) -> dict[str, Any]:
        """Update selfie caption.

        Args:
            user_id: The user's ID
            selfie_id: The selfie ID
            caption: New caption

        Returns:
            Dict with success status or error
        """
        try:
            response = (
                self.supabase.table("workout_selfies")
                .update({"caption": caption})
                .eq("id", selfie_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                return {"success": False, "error": "Selfie not found"}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error updating caption: {e}")
            return {"success": False, "error": str(e)}

    async def get_recent_selfies(
        self, user_id: str, limit: int = 10
    ) -> list[SelfieWithWorkout]:
        """Get recent selfies across all workouts.

        Args:
            user_id: The user's ID
            limit: Maximum number of selfies

        Returns:
            List of selfies with workout info
        """
        response = (
            self.supabase.table("workout_selfies")
            .select("*, workouts:workout_id(id, name, date)")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("taken_at", desc=True)
            .limit(limit)
            .execute()
        )

        selfies = response.data or []

        # Add signed URLs
        result = []
        for selfie in selfies:
            signed_url = await self.get_signed_url(selfie.get("file_path"))
            result.append({**selfie, "signed_url": signed_url})

        return result
