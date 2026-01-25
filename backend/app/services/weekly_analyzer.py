"""Weekly workout analysis service using Google Gemini."""

import logging
from datetime import date, datetime, timedelta
from typing import Any
from uuid import uuid4

from supabase import Client

from app.models.weekly_analysis import (
    GoalProgress,
    MeasurementsComparison,
    WeeklyAnalysisData,
    WeeklyAnalysisResponse,
    WeeklyStats,
)
from app.services.gemini_client import get_gemini_client

logger = logging.getLogger(__name__)


class WeeklyAnalyzer:
    """Generates weekly workout analysis using Gemini AI."""

    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase
        self.gemini = get_gemini_client()

    async def generate_analysis(
        self, user_id: str, week_start: date | None = None
    ) -> WeeklyAnalysisResponse:
        """Generate weekly analysis for a user.

        Args:
            user_id: The user's ID
            week_start: Start of the week to analyze (defaults to current week)

        Returns:
            WeeklyAnalysisResponse with the analysis or error
        """
        try:
            # Determine week boundaries (Monday to Sunday)
            if week_start is None:
                today = date.today()
                week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)

            # Gather data for analysis
            weekly_stats = await self._get_weekly_stats(user_id, week_start, week_end)
            goal_progress = await self._get_goal_progress(user_id)
            measurements = await self._get_measurements_comparison(user_id)
            active_plan = await self._get_active_plan(user_id)

            # Build prompt and generate analysis
            prompt = self._build_prompt(
                weekly_stats=weekly_stats,
                goal_progress=goal_progress,
                measurements=measurements,
                active_plan=active_plan,
                week_start=week_start,
                week_end=week_end,
            )

            response_data = await self.gemini.generate_json(
                prompt=prompt,
                temperature=0.7,
                max_tokens=4000,
            )

            # Create and save the analysis
            analysis = WeeklyAnalysisData(
                id=str(uuid4()),
                user_id=user_id,
                week_start_date=week_start,
                week_end_date=week_end,
                analysis_summary=response_data.get("summary", ""),
                key_achievements=response_data.get("achievements", []),
                areas_for_improvement=response_data.get("improvements", []),
                weekly_stats=weekly_stats,
                goal_progress=goal_progress,
                measurements_comparison=measurements,
                recommendations=response_data.get("recommendations", []),
                motivational_quote=response_data.get("quote", ""),
                generated_at=datetime.now(),
            )

            # Save to database
            await self._save_analysis(analysis)

            return WeeklyAnalysisResponse(
                success=True,
                analysis=analysis.model_dump(mode="json"),
            )

        except Exception as e:
            logger.error(f"Weekly analysis error: {e}")
            return WeeklyAnalysisResponse(
                success=False,
                error=f"Failed to generate weekly analysis: {e}",
            )

    async def _get_weekly_stats(
        self, user_id: str, week_start: date, week_end: date
    ) -> WeeklyStats:
        """Get workout statistics for the week."""
        response = (
            self.supabase.table("workouts")
            .select("id, duration_minutes, effort_level, name")
            .eq("user_id", user_id)
            .gte("date", week_start.isoformat())
            .lte("date", week_end.isoformat())
            .is_("deleted_at", "null")
            .execute()
        )

        workouts = response.data or []

        if not workouts:
            return WeeklyStats()

        total_duration = sum(w.get("duration_minutes", 0) or 0 for w in workouts)
        effort_levels = [
            w.get("effort_level") for w in workouts if w.get("effort_level")
        ]
        avg_effort = sum(effort_levels) / len(effort_levels) if effort_levels else None

        # Count workout types
        workout_types: dict[str, int] = {}
        for w in workouts:
            name = w.get("name", "General")
            workout_types[name] = workout_types.get(name, 0) + 1

        return WeeklyStats(
            total_workouts=len(workouts),
            total_duration_minutes=total_duration,
            average_effort=round(avg_effort, 1) if avg_effort else None,
            workout_types=workout_types,
        )

    async def _get_goal_progress(self, user_id: str) -> list[GoalProgress]:
        """Get progress on all active goals."""
        response = (
            self.supabase.table("goals")
            .select("*")
            .eq("user_id", user_id)
            .eq("achieved", False)
            .is_("deleted_at", "null")
            .execute()
        )

        goals = response.data or []
        progress_list: list[GoalProgress] = []

        for goal in goals:
            initial = goal.get("initial_value", 0) or 0
            current = goal.get("current_value") or initial
            target = goal.get("target_value", 0) or 0

            # Calculate progress percentage
            if initial == target:
                percentage = 100.0 if current == target else 0.0
            elif initial < target:
                # Increasing goal
                total_range = target - initial
                progress = current - initial
                percentage = (progress / total_range) * 100 if total_range else 0
            else:
                # Decreasing goal
                total_range = initial - target
                progress = initial - current
                percentage = (progress / total_range) * 100 if total_range else 0

            progress_list.append(
                GoalProgress(
                    goal_id=goal.get("id"),
                    title=goal.get("title", ""),
                    current_value=current,
                    target_value=target,
                    unit=goal.get("unit", ""),
                    progress_percentage=min(100, max(0, round(percentage, 1))),
                )
            )

        return progress_list

    async def _get_measurements_comparison(
        self, user_id: str
    ) -> MeasurementsComparison | None:
        """Compare latest measurements with previous ones."""
        response = (
            self.supabase.table("body_measurements")
            .select("weight, body_fat_percentage, muscle_mass, measured_at")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("measured_at", desc=True)
            .limit(2)
            .execute()
        )

        measurements = response.data or []

        if len(measurements) < 2:
            return None

        latest = measurements[0]
        previous = measurements[1]

        def calc_change(key: str) -> float | None:
            latest_val = latest.get(key)
            prev_val = previous.get(key)
            if latest_val is not None and prev_val is not None:
                return round(latest_val - prev_val, 2)
            return None

        return MeasurementsComparison(
            weight_change=calc_change("weight"),
            body_fat_change=calc_change("body_fat_percentage"),
            muscle_mass_change=calc_change("muscle_mass"),
        )

    async def _get_active_plan(self, user_id: str) -> dict[str, Any] | None:
        """Get the user's active workout plan if any."""
        response = (
            self.supabase.table("workout_plans")
            .select("id, name, status, weeks_duration, workouts_per_week")
            .eq("user_id", user_id)
            .eq("status", "active")
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )

        plans = response.data or []
        return plans[0] if plans else None

    def _build_prompt(
        self,
        weekly_stats: WeeklyStats,
        goal_progress: list[GoalProgress],
        measurements: MeasurementsComparison | None,
        active_plan: dict[str, Any] | None,
        week_start: date,
        week_end: date,
    ) -> str:
        """Build the Gemini prompt for analysis."""
        prompt = f"""You are a supportive fitness coach analyzing a user's weekly workout performance.

## Week: {week_start.strftime('%B %d')} - {week_end.strftime('%B %d, %Y')}

## Weekly Statistics
- **Total Workouts**: {weekly_stats.total_workouts}
- **Total Duration**: {weekly_stats.total_duration_minutes} minutes
- **Average Effort Level**: {weekly_stats.average_effort or 'N/A'}/6
- **Workout Types**: {', '.join(f'{k} ({v})' for k, v in weekly_stats.workout_types.items()) or 'None'}

## Goal Progress
"""
        if goal_progress:
            for gp in goal_progress:
                prompt += f"- **{gp.title}**: {gp.current_value}/{gp.target_value} {gp.unit} ({gp.progress_percentage}% complete)\n"
        else:
            prompt += "No active goals set.\n"

        if measurements:
            prompt += "\n## Body Measurements Changes\n"
            if measurements.weight_change is not None:
                change = "+" if measurements.weight_change > 0 else ""
                prompt += f"- **Weight**: {change}{measurements.weight_change} kg\n"
            if measurements.body_fat_change is not None:
                change = "+" if measurements.body_fat_change > 0 else ""
                prompt += f"- **Body Fat**: {change}{measurements.body_fat_change}%\n"
            if measurements.muscle_mass_change is not None:
                change = "+" if measurements.muscle_mass_change > 0 else ""
                prompt += (
                    f"- **Muscle Mass**: {change}{measurements.muscle_mass_change} kg\n"
                )

        if active_plan:
            prompt += f"""
## Active Workout Plan
- **Name**: {active_plan.get('name', 'Unnamed')}
- **Duration**: {active_plan.get('weeks_duration', '?')} weeks
- **Frequency**: {active_plan.get('workouts_per_week', '?')} workouts/week
"""

        prompt += """
## Instructions
Provide a personalized weekly analysis in JSON format:

```json
{
  "summary": "2-3 paragraph comprehensive analysis of their week...",
  "achievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "improvements": ["Area for improvement 1", "Area for improvement 2"],
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"],
  "quote": "A personalized motivational quote (not generic)"
}
```

**Guidelines:**
- Be encouraging but honest
- Reference specific numbers from their data
- Make recommendations actionable
- The quote should be specific to their situation, not a generic fitness quote

Return ONLY the JSON object."""

        return prompt

    async def _save_analysis(self, analysis: WeeklyAnalysisData) -> None:
        """Save the analysis to the database."""
        data = {
            "id": analysis.id,
            "user_id": analysis.user_id,
            "week_start_date": analysis.week_start_date.isoformat(),
            "week_end_date": analysis.week_end_date.isoformat(),
            "analysis_summary": analysis.analysis_summary,
            "key_achievements": analysis.key_achievements,
            "areas_for_improvement": analysis.areas_for_improvement,
            "weekly_stats": analysis.weekly_stats.model_dump(),
            "goal_progress": [gp.model_dump() for gp in analysis.goal_progress],
            "measurements_comparison": (
                analysis.measurements_comparison.model_dump()
                if analysis.measurements_comparison
                else None
            ),
            "recommendations": analysis.recommendations,
            "motivational_quote": analysis.motivational_quote,
            "generated_at": analysis.generated_at.isoformat(),
        }

        # Upsert to handle duplicate week analysis
        self.supabase.table("weekly_workout_analysis").upsert(
            data,
            on_conflict="user_id,week_start_date",
        ).execute()
