"""AI-powered workout plan generator using Google Gemini."""

import logging
from datetime import date, datetime
from typing import Any, Optional

from app.models.workout_plan import (
    AIGeneratedPlanResponse,
    AIGenerationRequest,
    ExerciseDetail,
    GeneratedPlan,
    WeeklyWorkout,
)
from app.services.gemini_client import get_gemini_client

logger = logging.getLogger(__name__)


class AIPlanGenerator:
    """Generates personalized workout plans using Gemini AI."""

    def __init__(self) -> None:
        self.gemini = get_gemini_client()

    async def generate_plan(
        self, request: AIGenerationRequest
    ) -> AIGeneratedPlanResponse:
        """Generate a workout plan based on user data and preferences.
        
        Args:
            request: The generation request with goal, preferences, history, etc.
            
        Returns:
            AIGeneratedPlanResponse with the generated plan or error
        """
        try:
            # Build the prompt
            prompt = self._build_prompt(request)
            
            # Generate with Gemini
            response_data = await self.gemini.generate_json(
                prompt=prompt,
                temperature=0.7,
                max_tokens=16000,
            )
            
            # Parse and validate the response
            plan = self._parse_response(response_data)
            
            if not plan.weekly_schedule:
                return AIGeneratedPlanResponse(
                    success=False,
                    error="AI did not generate any workout sessions. Please try again.",
                )
            
            return AIGeneratedPlanResponse(success=True, plan=plan)
            
        except ValueError as e:
            logger.error(f"Validation error: {e}")
            return AIGeneratedPlanResponse(success=False, error=str(e))
        except Exception as e:
            logger.error(f"Plan generation error: {e}")
            return AIGeneratedPlanResponse(
                success=False,
                error=f"Failed to generate workout plan: {e}",
            )

    def _build_prompt(self, request: AIGenerationRequest) -> str:
        """Build the Gemini prompt from the request data."""
        goal = request.goal
        config = request.plan_config
        
        prompt = f"""You are an expert fitness coach and workout planner. Generate a personalized workout plan based on the following information.

## User Goal
- **Title**: {goal.title}
- **Description**: {goal.description or 'Not specified'}
- **Target**: {goal.target_value} {goal.unit}
- **Current**: {goal.current_value} {goal.unit}
- **Target Date**: {goal.target_date or 'Not specified'}

## Plan Requirements
- **Duration**: {config.weeks_count} weeks
- **Workouts per Week**: {config.workouts_per_week}
- **Average Session Duration**: {config.avg_duration} minutes
"""

        # Add user profile if available
        if request.user_profile:
            profile = request.user_profile
            prompt += "\n## User Profile\n"
            
            if profile.date_of_birth:
                age = self._calculate_age(profile.date_of_birth)
                prompt += f"- **Age**: {age} years\n"
            if profile.gender:
                prompt += f"- **Gender**: {profile.gender}\n"
            if profile.height_cm:
                prompt += f"- **Height**: {profile.height_cm} cm\n"
            if profile.fitness_level:
                prompt += f"- **Fitness Level**: {profile.fitness_level}\n"
            if profile.medical_conditions:
                prompt += f"- **Medical Conditions**: {profile.medical_conditions}\n"
            if profile.injuries:
                prompt += f"- **Injuries/Limitations**: {profile.injuries}\n"

        # Add measurements if available
        if request.latest_measurements and request.latest_measurements.weight:
            measurements = request.latest_measurements
            prompt += f"\n## Current Body Metrics\n"
            prompt += f"- **Weight**: {measurements.weight} kg\n"
            
            if measurements.body_fat_percentage:
                prompt += f"- **Body Fat**: {measurements.body_fat_percentage}%\n"
            if measurements.muscle_mass:
                prompt += f"- **Muscle Mass**: {measurements.muscle_mass} kg\n"

        # Add preferences if available
        if request.preferences:
            prefs = request.preferences
            prompt += f"""
## User Preferences
- **Fitness Level**: {prefs.fitness_level or 'intermediate'}
- **Preferred Duration**: {prefs.preferred_duration or 60} minutes
- **Focus Areas**: {', '.join(prefs.focus_areas or ['Full body'])}
- **Available Equipment**: {', '.join(prefs.available_equipment or ['Full gym access'])}
- **Gym Access**: {'Yes' if prefs.gym_access else 'Home workouts only'}
"""
            if prefs.constraints:
                prompt += f"- **Constraints/Injuries**: {prefs.constraints}\n"

        # Add workout history analysis
        if request.workout_history:
            exercise_stats = self._analyze_exercise_history(request.workout_history)
            if exercise_stats:
                prompt += f"\n## Recent Workout History\n"
                prompt += f"User has completed {len(request.workout_history)} workout(s) recently.\n"
                prompt += "\n### Exercise Performance Data:\n"
                for name, stats in exercise_stats.items():
                    prompt += f"- **{name}**: Max {stats['max_weight']} {stats['unit']}, "
                    prompt += f"Avg {stats['avg_weight']:.1f} {stats['unit']}\n"

        # Output format instructions
        prompt += """
## Instructions
Create a detailed workout plan with the specified duration and frequency.

**Important Requirements:**
1. Respect all constraints and injuries mentioned
2. Match the user's fitness level
3. Focus on the user's goal
4. Include progressive overload across weeks
5. Each workout should have 4-6 exercises maximum
6. Provide specific exercises with sets, reps, and weights
7. Schedule workouts with rest days between intense sessions
8. Day field represents day of week: 0=Sunday, 1=Monday, ..., 6=Saturday

**Output Format (STRICT JSON):**

```json
{
  "weeklySchedule": [
    {
      "week": 1,
      "day": 1,
      "dayName": "Monday",
      "workoutType": "Upper Body Strength",
      "exercises": [
        {"name": "Bench Press", "sets": 3, "reps": 10, "weight": 60, "weightUnit": "kg", "restSeconds": 90},
        {"name": "Rows", "sets": 3, "reps": 10, "weight": 50, "weightUnit": "kg", "restSeconds": 90}
      ],
      "duration": 60,
      "intensity": "medium",
      "notes": "Focus on form this week"
    }
  ],
  "rationale": "Explanation of why this plan suits the user...",
  "progressionStrategy": "How the plan progresses week by week...",
  "keyConsiderations": ["Point 1", "Point 2", "Point 3"]
}
```

Generate a safe and effective workout plan. Return ONLY the JSON object."""

        return prompt

    def _calculate_age(self, date_of_birth: str) -> int:
        """Calculate age from date of birth string."""
        try:
            birth = datetime.fromisoformat(date_of_birth.replace("Z", "+00:00"))
            today = datetime.now()
            age = today.year - birth.year
            if (today.month, today.day) < (birth.month, birth.day):
                age -= 1
            return age
        except (ValueError, AttributeError):
            return 30  # Default age if parsing fails

    def _analyze_exercise_history(
        self, workouts: list[dict[str, Any]]
    ) -> dict[str, dict[str, Any]]:
        """Analyze workout history to extract exercise performance data."""
        exercise_data: dict[str, dict[str, Any]] = {}
        
        for workout in workouts:
            exercises = workout.get("exercises", [])
            if not isinstance(exercises, list):
                continue
            
            for exercise in exercises:
                name = exercise.get("name", "").lower().strip()
                weight = exercise.get("weight")
                
                if not name or not weight or weight <= 0:
                    continue
                
                unit = exercise.get("weight_unit", "kg")
                
                if name not in exercise_data:
                    exercise_data[name] = {
                        "weights": [],
                        "unit": unit,
                    }
                
                exercise_data[name]["weights"].append(weight)
        
        # Calculate stats
        stats: dict[str, dict[str, Any]] = {}
        for name, data in exercise_data.items():
            weights = data["weights"]
            if weights:
                stats[name] = {
                    "max_weight": max(weights),
                    "avg_weight": sum(weights) / len(weights),
                    "unit": data["unit"],
                }
        
        return stats

    def _parse_response(self, data: dict[str, Any]) -> GeneratedPlan:
        """Parse and validate the AI response into a GeneratedPlan."""
        weekly_schedule: list[WeeklyWorkout] = []
        
        for workout_data in data.get("weeklySchedule", []):
            exercises: list[ExerciseDetail] = []
            
            for ex in workout_data.get("exercises", []):
                exercises.append(ExerciseDetail(
                    name=ex.get("name", "Unknown"),
                    sets=ex.get("sets", 3),
                    reps=ex.get("reps", 10),
                    weight=ex.get("weight"),
                    weight_unit=ex.get("weightUnit", "kg"),
                    rest_seconds=ex.get("restSeconds"),
                    notes=ex.get("notes"),
                ))
            
            intensity = workout_data.get("intensity", "medium")
            if intensity not in ("low", "medium", "high"):
                intensity = "medium"
            
            weekly_schedule.append(WeeklyWorkout(
                week=workout_data.get("week", 1),
                day=workout_data.get("day", 1),
                day_name=workout_data.get("dayName", "Monday"),
                workout_type=workout_data.get("workoutType", "General"),
                exercises=exercises,
                duration=workout_data.get("duration", 60),
                intensity=intensity,
                notes=workout_data.get("notes"),
            ))
        
        return GeneratedPlan(
            weekly_schedule=weekly_schedule,
            rationale=data.get("rationale", "AI-generated workout plan."),
            progression_strategy=data.get("progressionStrategy", "Progressive overload."),
            key_considerations=data.get("keyConsiderations", []),
        )
