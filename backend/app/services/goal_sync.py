"""Goal synchronization service using strategy pattern.

This replaces the 290-line TypeScript sync.ts with a clean, testable design.
Each unit type (workouts, minutes, kg, etc.) has its own strategy class.
"""

import logging
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from supabase import Client

from app.models.goal import Goal, GoalSyncResult
from app.utils.unit_converter import UnitConverter

logger = logging.getLogger(__name__)


@dataclass
class SyncContext:
    """Context for sync strategies."""

    supabase: Client
    user_id: str
    goal: Goal


class SyncStrategy(ABC):
    """Abstract base class for goal sync strategies."""

    @abstractmethod
    async def calculate(self, ctx: SyncContext) -> float | None:
        """Calculate the current value for a goal.

        Args:
            ctx: Sync context containing supabase client, user_id, and goal

        Returns:
            The calculated current value, or None if not calculable
        """
        pass


class WorkoutCountStrategy(SyncStrategy):
    """Strategy for counting total workouts."""

    async def calculate(self, ctx: SyncContext) -> float | None:
        response = (
            ctx.supabase.table("workouts")
            .select("id")
            .eq("user_id", ctx.user_id)
            .is_("deleted_at", "null")
            .execute()
        )

        return len(response.data) if response.data else 0


class DurationStrategy(SyncStrategy):
    """Strategy for summing workout duration in minutes."""

    async def calculate(self, ctx: SyncContext) -> float | None:
        response = (
            ctx.supabase.table("workouts")
            .select("duration_minutes")
            .eq("user_id", ctx.user_id)
            .is_("deleted_at", "null")
            .execute()
        )

        if not response.data:
            return 0

        total = sum(w.get("duration_minutes", 0) or 0 for w in response.data)
        return total


class UniqueDaysStrategy(SyncStrategy):
    """Strategy for counting unique workout days."""

    async def calculate(self, ctx: SyncContext) -> float | None:
        response = (
            ctx.supabase.table("workouts")
            .select("date")
            .eq("user_id", ctx.user_id)
            .is_("deleted_at", "null")
            .execute()
        )

        if not response.data:
            return 0

        unique_days = set(w.get("date") for w in response.data if w.get("date"))
        return len(unique_days)


class WeightStrategy(SyncStrategy):
    """Strategy for weight-based goals (body weight or exercise weight)."""

    def __init__(self, target_unit: str):
        self.target_unit = target_unit.lower()

    async def calculate(self, ctx: SyncContext) -> float | None:
        exercise_name = self._extract_exercise_name(ctx.goal.title)

        # Check if this is a body weight goal
        if exercise_name and self._is_body_weight_goal(ctx.goal.title):
            return await self._get_body_weight(ctx)
        elif exercise_name:
            return await self._get_exercise_max_weight(ctx, exercise_name)

        return None

    def _is_body_weight_goal(self, title: str) -> bool:
        """Check if goal is about body weight."""
        return bool(re.search(r"weight|body|lose|gain", title, re.IGNORECASE))

    def _extract_exercise_name(self, title: str) -> str | None:
        """Extract exercise name from goal title."""
        # Remove numbers and units
        cleaned = re.sub(r"\d+(\.\d+)?", "", title)
        cleaned = re.sub(
            r"\b(kg|lbs|km|miles|reps|minutes|days|workouts)\b",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = cleaned.strip()
        return cleaned if cleaned else None

    async def _get_body_weight(self, ctx: SyncContext) -> float | None:
        """Get latest body weight from measurements."""
        response = (
            ctx.supabase.table("body_measurements")
            .select("weight, weight_unit")
            .eq("user_id", ctx.user_id)
            .not_.is_("weight", "null")
            .is_("deleted_at", "null")
            .order("measured_at", desc=True)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        measurement = response.data[0]
        weight = measurement.get("weight", 0) or 0
        weight_unit = measurement.get("weight_unit", "kg") or "kg"

        # Convert to target unit if needed
        if weight_unit.lower() != self.target_unit:
            weight = UnitConverter.convert_weight(weight, weight_unit, self.target_unit)

        return round(weight, 1)

    async def _get_exercise_max_weight(
        self, ctx: SyncContext, exercise_name: str
    ) -> float | None:
        """Get max weight for a specific exercise."""
        # Get exercises matching the name
        response = (
            ctx.supabase.table("exercises")
            .select("weight, weight_unit, workout_id")
            .ilike("name", f"%{exercise_name}%")
            .not_.is_("weight", "null")
            .order("weight", desc=True)
            .execute()
        )

        if not response.data:
            return None

        # Get user's workout IDs
        workout_ids = [
            e.get("workout_id") for e in response.data if e.get("workout_id")
        ]
        if not workout_ids:
            return None

        user_workouts_response = (
            ctx.supabase.table("workouts")
            .select("id")
            .eq("user_id", ctx.user_id)
            .in_("id", workout_ids)
            .is_("deleted_at", "null")
            .execute()
        )

        if not user_workouts_response.data:
            return None

        valid_workout_ids = {w.get("id") for w in user_workouts_response.data}

        # Find max weight among valid exercises
        max_weight = 0.0
        for exercise in response.data:
            if exercise.get("workout_id") not in valid_workout_ids:
                continue

            weight = exercise.get("weight", 0) or 0
            weight_unit = exercise.get("weight_unit", "kg") or "kg"

            # Convert to target unit if needed
            if weight_unit.lower() != self.target_unit:
                weight = UnitConverter.convert_weight(
                    weight, weight_unit, self.target_unit
                )

            max_weight = max(max_weight, weight)

        return round(max_weight, 1) if max_weight > 0 else None


class MaxRepsStrategy(SyncStrategy):
    """Strategy for max reps goals."""

    async def calculate(self, ctx: SyncContext) -> float | None:
        exercise_name = self._extract_exercise_name(ctx.goal.title)
        if not exercise_name:
            return None

        # Get exercises matching the name
        response = (
            ctx.supabase.table("exercises")
            .select("reps, workout_id")
            .ilike("name", f"%{exercise_name}%")
            .not_.is_("reps", "null")
            .order("reps", desc=True)
            .execute()
        )

        if not response.data:
            return None

        # Get user's workout IDs
        workout_ids = [
            e.get("workout_id") for e in response.data if e.get("workout_id")
        ]
        if not workout_ids:
            return None

        user_workouts_response = (
            ctx.supabase.table("workouts")
            .select("id")
            .eq("user_id", ctx.user_id)
            .in_("id", workout_ids)
            .is_("deleted_at", "null")
            .execute()
        )

        if not user_workouts_response.data:
            return None

        valid_workout_ids = {w.get("id") for w in user_workouts_response.data}

        # Find max reps among valid exercises
        max_reps = 0
        for exercise in response.data:
            if exercise.get("workout_id") not in valid_workout_ids:
                continue
            max_reps = max(max_reps, exercise.get("reps", 0) or 0)

        return max_reps if max_reps > 0 else None

    def _extract_exercise_name(self, title: str) -> str | None:
        """Extract exercise name from goal title."""
        cleaned = re.sub(r"\d+(\.\d+)?", "", title)
        cleaned = re.sub(
            r"\b(kg|lbs|km|miles|reps|minutes|days|workouts)\b",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = cleaned.strip()
        return cleaned if cleaned else None


class DistanceStrategy(SyncStrategy):
    """Strategy for distance-based goals."""

    def __init__(self, target_unit: str):
        self.target_unit = target_unit.lower()

    async def calculate(self, ctx: SyncContext) -> float | None:
        exercise_name = self._extract_exercise_name(ctx.goal.title)

        # Build query
        query = (
            ctx.supabase.table("exercises")
            .select("distance, distance_unit, workout_id, name")
            .not_.is_("distance", "null")
        )

        if exercise_name:
            query = query.ilike("name", f"%{exercise_name}%")

        response = query.execute()

        if not response.data:
            return None

        # Get user's workout IDs
        workout_ids = [
            e.get("workout_id") for e in response.data if e.get("workout_id")
        ]
        if not workout_ids:
            return None

        user_workouts_response = (
            ctx.supabase.table("workouts")
            .select("id")
            .eq("user_id", ctx.user_id)
            .in_("id", workout_ids)
            .is_("deleted_at", "null")
            .execute()
        )

        if not user_workouts_response.data:
            return None

        valid_workout_ids = {w.get("id") for w in user_workouts_response.data}

        # Sum distances
        total_distance = 0.0
        for exercise in response.data:
            if exercise.get("workout_id") not in valid_workout_ids:
                continue

            distance = exercise.get("distance", 0) or 0
            distance_unit = exercise.get("distance_unit", "km") or "km"

            # Convert to target unit if needed
            if distance_unit.lower() != self.target_unit:
                distance = UnitConverter.convert_distance(
                    distance, distance_unit, self.target_unit
                )

            total_distance += distance

        return round(total_distance, 1) if total_distance > 0 else None

    def _extract_exercise_name(self, title: str) -> str | None:
        """Extract exercise name from goal title."""
        cleaned = re.sub(r"\d+(\.\d+)?", "", title)
        cleaned = re.sub(
            r"\b(kg|lbs|km|miles|reps|minutes|days|workouts)\b",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = cleaned.strip()
        return cleaned if cleaned else None


def is_goal_achieved(
    initial_value: float, current_value: float, target_value: float
) -> bool:
    """Check if a goal has been achieved.

    Handles both increasing goals (e.g., lift more weight) and
    decreasing goals (e.g., lose weight).
    """
    if initial_value <= target_value:
        # Increasing goal: current must reach or exceed target
        return current_value >= target_value
    else:
        # Decreasing goal: current must reach or go below target
        return current_value <= target_value


class GoalSyncService:
    """Service for synchronizing goal progress with workout data."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

        # Strategy registry - each unit type gets its own strategy
        self.strategies: dict[str, SyncStrategy] = {
            "workouts": WorkoutCountStrategy(),
            "minutes": DurationStrategy(),
            "days": UniqueDaysStrategy(),
            "kg": WeightStrategy("kg"),
            "lbs": WeightStrategy("lbs"),
            "reps": MaxRepsStrategy(),
            "km": DistanceStrategy("km"),
            "miles": DistanceStrategy("miles"),
        }

    async def sync_user_goals(self, user_id: str) -> GoalSyncResult:
        """Sync all goals for a user.

        Args:
            user_id: The user's ID

        Returns:
            GoalSyncResult with success status and update count
        """
        # Fetch all goals for the user
        response = (
            self.supabase.table("goals")
            .select("*")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )

        if not response.data:
            return GoalSyncResult(success=True, updated=0, message="No goals found")

        updated_count = 0
        details: list[dict[str, Any]] = []

        for goal_data in response.data:
            goal = Goal(**goal_data)
            result = await self._sync_single_goal(user_id, goal)

            if result:
                updated_count += 1
                details.append(result)

        return GoalSyncResult(
            success=True,
            updated=updated_count,
            message=f"Synced {updated_count} goal(s)",
            details=details,
        )

    async def _sync_single_goal(
        self, user_id: str, goal: Goal
    ) -> dict[str, Any] | None:
        """Sync a single goal.

        Returns dict with sync details if updated, None otherwise.
        """
        unit = goal.unit.lower()
        strategy = self.strategies.get(unit)

        if not strategy:
            logger.debug(f"No strategy for unit: {unit}")
            return None

        ctx = SyncContext(supabase=self.supabase, user_id=user_id, goal=goal)

        try:
            new_value = await strategy.calculate(ctx)
        except Exception as e:
            logger.error(f"Error calculating goal {goal.id}: {e}")
            return None

        if new_value is None:
            return None

        # Only update if value changed
        if new_value == goal.current_value:
            return None

        # Check if goal is achieved
        achieved = is_goal_achieved(
            initial_value=goal.initial_value,
            current_value=new_value,
            target_value=goal.target_value,
        )

        # Update the goal
        try:
            self.supabase.table("goals").update(
                {
                    "current_value": new_value,
                    "achieved": achieved,
                    "updated_at": "now()",
                }
            ).eq("id", goal.id).execute()

            logger.info(
                f"Synced goal '{goal.title}': {goal.current_value} → {new_value} {goal.unit}"
                + (" (ACHIEVED!)" if achieved else "")
            )

            return {
                "goal_id": goal.id,
                "title": goal.title,
                "old_value": goal.current_value,
                "new_value": new_value,
                "unit": goal.unit,
                "achieved": achieved,
            }

        except Exception as e:
            logger.error(f"Error updating goal {goal.id}: {e}")
            return None
