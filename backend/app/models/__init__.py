"""Pydantic models for the application."""

# Goal models
from app.models.goal import (
    Goal,
    GoalBase,
    GoalCreate,
    GoalListResponse,
    GoalProgressUpdate,
    GoalResponse,
    GoalSyncRequest,
    GoalSyncResult,
    GoalUpdate,
)

# Measurement models
from app.models.measurement import (
    Measurement,
    MeasurementBase,
    MeasurementCreate,
    MeasurementListResponse,
    MeasurementResponse,
    MeasurementUpdate,
)

# Profile models
from app.models.profile import (
    Profile,
    ProfileBase,
    ProfileResponse,
    ProfileUpdate,
)

# Selfie models
from app.models.selfie import (
    Selfie,
    SelfieBase,
    SelfieCreate,
    SelfieListResponse,
    SelfieResponse,
    SelfieUpdate,
    SelfieUrlResponse,
    SelfieWithUrl,
    SelfieWithWorkout,
)

# Weekly analysis models
from app.models.weekly_analysis import (
    GoalProgress,
    MeasurementsComparison,
    WeeklyAnalysisData,
    WeeklyAnalysisRequest,
    WeeklyAnalysisResponse,
    WeeklyStats,
)

# Workout models
from app.models.workout import (
    Exercise,
    ExerciseBase,
    ExerciseCreate,
    Workout,
    WorkoutBase,
    WorkoutCreate,
    WorkoutListResponse,
    WorkoutResponse,
    WorkoutUpdate,
    WorkoutWithExercises,
    WorkoutWithSelfie,
)

# Workout plan models
from app.models.workout_plan import (
    AIGeneratedPlanResponse,
    AIGenerationRequest,
    CurrentWeekSessionsResponse,
    ExerciseDetail,
    GeneratedPlan,
    GoalInfo,
    LatestMeasurements,
    PlanConfig,
    UserProfile,
    UserWorkoutPreferences,
    WeeklyWorkout,
    WorkoutPlan,
    WorkoutPlanBase,
    WorkoutPlanCreate,
    WorkoutPlanListResponse,
    WorkoutPlanResponse,
    WorkoutPlanSession,
    WorkoutPlanUpdate,
    WorkoutPlanWithSessions,
)

__all__ = [
    # Goal models
    "Goal",
    "GoalBase",
    "GoalCreate",
    "GoalListResponse",
    "GoalProgressUpdate",
    "GoalResponse",
    "GoalSyncRequest",
    "GoalSyncResult",
    "GoalUpdate",
    # Measurement models
    "Measurement",
    "MeasurementBase",
    "MeasurementCreate",
    "MeasurementListResponse",
    "MeasurementResponse",
    "MeasurementUpdate",
    # Profile models
    "Profile",
    "ProfileBase",
    "ProfileResponse",
    "ProfileUpdate",
    # Selfie models
    "Selfie",
    "SelfieBase",
    "SelfieCreate",
    "SelfieListResponse",
    "SelfieResponse",
    "SelfieUpdate",
    "SelfieUrlResponse",
    "SelfieWithUrl",
    "SelfieWithWorkout",
    # Weekly analysis models
    "GoalProgress",
    "MeasurementsComparison",
    "WeeklyAnalysisData",
    "WeeklyAnalysisRequest",
    "WeeklyAnalysisResponse",
    "WeeklyStats",
    # Workout models
    "Exercise",
    "ExerciseBase",
    "ExerciseCreate",
    "Workout",
    "WorkoutBase",
    "WorkoutCreate",
    "WorkoutListResponse",
    "WorkoutResponse",
    "WorkoutUpdate",
    "WorkoutWithExercises",
    "WorkoutWithSelfie",
    # Workout plan models
    "AIGeneratedPlanResponse",
    "AIGenerationRequest",
    "CurrentWeekSessionsResponse",
    "ExerciseDetail",
    "GeneratedPlan",
    "GoalInfo",
    "LatestMeasurements",
    "PlanConfig",
    "UserProfile",
    "UserWorkoutPreferences",
    "WeeklyWorkout",
    "WorkoutPlan",
    "WorkoutPlanBase",
    "WorkoutPlanCreate",
    "WorkoutPlanListResponse",
    "WorkoutPlanResponse",
    "WorkoutPlanSession",
    "WorkoutPlanUpdate",
    "WorkoutPlanWithSessions",
]
