"""Measurements CRUD service."""

import logging
from datetime import datetime
from typing import Any, Optional

from supabase import Client

from app.models.measurement import Measurement, MeasurementCreate, MeasurementUpdate
from app.services.goal_sync import GoalSyncService

logger = logging.getLogger(__name__)


class MeasurementsService:
    """Service for body measurements CRUD operations."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_measurement(
        self, user_id: str, data: MeasurementCreate
    ) -> dict[str, Any]:
        """Create a new body measurement.
        
        Args:
            user_id: The user's ID
            data: Measurement creation data
            
        Returns:
            Dict with success status and measurement data or error
        """
        try:
            measurement_data = {
                "user_id": user_id,
                "measured_at": (
                    data.measured_at.isoformat() 
                    if data.measured_at 
                    else datetime.now().isoformat()
                ),
                "weight": data.weight,
                "body_fat_percentage": data.body_fat_percentage,
                "muscle_mass": data.muscle_mass,
                "bone_mass": data.bone_mass,
                "water_percentage": data.water_percentage,
                "protein_percentage": data.protein_percentage,
                "height": data.height,
                "neck": data.neck,
                "shoulders": data.shoulders,
                "chest": data.chest,
                "waist": data.waist,
                "hips": data.hips,
                "bicep_left": data.bicep_left,
                "bicep_right": data.bicep_right,
                "forearm_left": data.forearm_left,
                "forearm_right": data.forearm_right,
                "thigh_left": data.thigh_left,
                "thigh_right": data.thigh_right,
                "calf_left": data.calf_left,
                "calf_right": data.calf_right,
                "bmr": data.bmr,
                "metabolic_age": data.metabolic_age,
                "visceral_fat": data.visceral_fat,
                "notes": data.notes,
            }

            response = self.supabase.table("body_measurements").insert(
                measurement_data
            ).execute()

            if not response.data:
                return {"success": False, "error": "Failed to create measurement"}

            # Sync goal progress (weight goals)
            goal_sync = GoalSyncService(self.supabase)
            await goal_sync.sync_user_goals(user_id)

            return {"success": True, "data": response.data[0]}

        except Exception as e:
            logger.error(f"Error creating measurement: {e}")
            return {"success": False, "error": str(e)}

    async def get_measurements(
        self, user_id: str, limit: Optional[int] = None
    ) -> list[Measurement]:
        """Get all measurements for a user.
        
        Args:
            user_id: The user's ID
            limit: Optional limit on number of measurements
            
        Returns:
            List of measurements
        """
        query = self.supabase.table("body_measurements").select("*").eq(
            "user_id", user_id
        ).is_("deleted_at", "null").order("measured_at", desc=True)

        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data or []

    async def get_latest_measurement(self, user_id: str) -> Optional[Measurement]:
        """Get the most recent measurement for a user.
        
        Args:
            user_id: The user's ID
            
        Returns:
            Latest measurement or None
        """
        response = self.supabase.table("body_measurements").select("*").eq(
            "user_id", user_id
        ).is_("deleted_at", "null").order("measured_at", desc=True).limit(1).execute()

        return response.data[0] if response.data else None

    async def get_measurement(
        self, user_id: str, measurement_id: str
    ) -> Optional[Measurement]:
        """Get a single measurement by ID.
        
        Args:
            user_id: The user's ID
            measurement_id: The measurement ID
            
        Returns:
            Measurement or None if not found
        """
        response = self.supabase.table("body_measurements").select("*").eq(
            "id", measurement_id
        ).eq("user_id", user_id).is_("deleted_at", "null").single().execute()

        return response.data if response.data else None

    async def update_measurement(
        self, user_id: str, measurement_id: str, data: MeasurementUpdate
    ) -> dict[str, Any]:
        """Update a measurement.
        
        Args:
            user_id: The user's ID
            measurement_id: The measurement ID
            data: Update data
            
        Returns:
            Dict with success status or error
        """
        try:
            # Build update dict with all fields that are set
            update_data: dict[str, Any] = {"updated_at": datetime.now().isoformat()}
            
            # Map all fields
            field_mapping = {
                "measured_at": lambda v: v.isoformat() if v else None,
                "weight": lambda v: v,
                "body_fat_percentage": lambda v: v,
                "muscle_mass": lambda v: v,
                "bone_mass": lambda v: v,
                "water_percentage": lambda v: v,
                "protein_percentage": lambda v: v,
                "height": lambda v: v,
                "neck": lambda v: v,
                "shoulders": lambda v: v,
                "chest": lambda v: v,
                "waist": lambda v: v,
                "hips": lambda v: v,
                "bicep_left": lambda v: v,
                "bicep_right": lambda v: v,
                "forearm_left": lambda v: v,
                "forearm_right": lambda v: v,
                "thigh_left": lambda v: v,
                "thigh_right": lambda v: v,
                "calf_left": lambda v: v,
                "calf_right": lambda v: v,
                "bmr": lambda v: v,
                "metabolic_age": lambda v: v,
                "visceral_fat": lambda v: v,
                "notes": lambda v: v,
            }

            for field, transform in field_mapping.items():
                value = getattr(data, field, None)
                if value is not None:
                    update_data[field] = transform(value)

            response = self.supabase.table("body_measurements").update(
                update_data
            ).eq("id", measurement_id).eq("user_id", user_id).execute()

            if not response.data:
                return {"success": False, "error": "Measurement not found"}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error updating measurement: {e}")
            return {"success": False, "error": str(e)}

    async def delete_measurement(
        self, user_id: str, measurement_id: str
    ) -> dict[str, Any]:
        """Soft delete a measurement.
        
        Args:
            user_id: The user's ID
            measurement_id: The measurement ID
            
        Returns:
            Dict with success status or error
        """
        try:
            response = self.supabase.table("body_measurements").update({
                "deleted_at": datetime.now().isoformat()
            }).eq("id", measurement_id).eq("user_id", user_id).is_(
                "deleted_at", "null"
            ).execute()

            if not response.data:
                return {"success": False, "error": "Measurement not found"}

            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting measurement: {e}")
            return {"success": False, "error": str(e)}
