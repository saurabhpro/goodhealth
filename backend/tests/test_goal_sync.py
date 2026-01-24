"""Tests for goal sync service."""

import pytest
from unittest.mock import MagicMock

from app.models.goal import Goal
from app.services.goal_sync import (
    GoalSyncService,
    WorkoutCountStrategy,
    DurationStrategy,
    UniqueDaysStrategy,
    WeightStrategy,
    MaxRepsStrategy,
    DistanceStrategy,
    SyncContext,
    is_goal_achieved,
)


class TestIsGoalAchieved:
    """Tests for is_goal_achieved function."""

    def test_increasing_goal_achieved(self):
        """Test increasing goal that is achieved."""
        assert is_goal_achieved(
            initial_value=0,
            current_value=50,
            target_value=50,
        ) is True

    def test_increasing_goal_exceeded(self):
        """Test increasing goal that exceeds target."""
        assert is_goal_achieved(
            initial_value=0,
            current_value=60,
            target_value=50,
        ) is True

    def test_increasing_goal_not_achieved(self):
        """Test increasing goal not yet achieved."""
        assert is_goal_achieved(
            initial_value=0,
            current_value=30,
            target_value=50,
        ) is False

    def test_decreasing_goal_achieved(self):
        """Test decreasing goal (e.g., weight loss) achieved."""
        assert is_goal_achieved(
            initial_value=80,
            current_value=70,
            target_value=70,
        ) is True

    def test_decreasing_goal_exceeded(self):
        """Test decreasing goal exceeded (went below target)."""
        assert is_goal_achieved(
            initial_value=80,
            current_value=65,
            target_value=70,
        ) is True

    def test_decreasing_goal_not_achieved(self):
        """Test decreasing goal not yet achieved."""
        assert is_goal_achieved(
            initial_value=80,
            current_value=75,
            target_value=70,
        ) is False


class TestWorkoutCountStrategy:
    """Tests for workout count strategy."""

    @pytest.mark.asyncio
    async def test_count_workouts(self, mock_supabase, sample_goal):
        """Test counting total workouts."""
        # Setup mock response
        mock_supabase.execute.return_value = MagicMock(
            data=[{"id": "1"}, {"id": "2"}, {"id": "3"}]
        )
        
        strategy = WorkoutCountStrategy()
        goal = Goal(**sample_goal)
        ctx = SyncContext(
            supabase=mock_supabase,
            user_id="user-456",
            goal=goal,
        )
        
        result = await strategy.calculate(ctx)
        
        assert result == 3

    @pytest.mark.asyncio
    async def test_count_workouts_empty(self, mock_supabase, sample_goal):
        """Test counting workouts when none exist."""
        mock_supabase.execute.return_value = MagicMock(data=[])
        
        strategy = WorkoutCountStrategy()
        goal = Goal(**sample_goal)
        ctx = SyncContext(
            supabase=mock_supabase,
            user_id="user-456",
            goal=goal,
        )
        
        result = await strategy.calculate(ctx)
        
        assert result == 0


class TestDurationStrategy:
    """Tests for duration strategy."""

    @pytest.mark.asyncio
    async def test_sum_duration(self, mock_supabase, sample_goal):
        """Test summing workout durations."""
        mock_supabase.execute.return_value = MagicMock(
            data=[
                {"duration_minutes": 60},
                {"duration_minutes": 45},
                {"duration_minutes": 30},
            ]
        )
        
        strategy = DurationStrategy()
        goal = Goal(**{**sample_goal, "unit": "minutes"})
        ctx = SyncContext(
            supabase=mock_supabase,
            user_id="user-456",
            goal=goal,
        )
        
        result = await strategy.calculate(ctx)
        
        assert result == 135

    @pytest.mark.asyncio
    async def test_sum_duration_with_nulls(self, mock_supabase, sample_goal):
        """Test summing durations with null values."""
        mock_supabase.execute.return_value = MagicMock(
            data=[
                {"duration_minutes": 60},
                {"duration_minutes": None},
                {"duration_minutes": 30},
            ]
        )
        
        strategy = DurationStrategy()
        goal = Goal(**{**sample_goal, "unit": "minutes"})
        ctx = SyncContext(
            supabase=mock_supabase,
            user_id="user-456",
            goal=goal,
        )
        
        result = await strategy.calculate(ctx)
        
        assert result == 90


class TestUniqueDaysStrategy:
    """Tests for unique days strategy."""

    @pytest.mark.asyncio
    async def test_count_unique_days(self, mock_supabase, sample_goal):
        """Test counting unique workout days."""
        mock_supabase.execute.return_value = MagicMock(
            data=[
                {"date": "2024-01-15"},
                {"date": "2024-01-15"},  # Duplicate
                {"date": "2024-01-16"},
                {"date": "2024-01-17"},
            ]
        )
        
        strategy = UniqueDaysStrategy()
        goal = Goal(**{**sample_goal, "unit": "days"})
        ctx = SyncContext(
            supabase=mock_supabase,
            user_id="user-456",
            goal=goal,
        )
        
        result = await strategy.calculate(ctx)
        
        assert result == 3  # 3 unique days


class TestGoalSyncService:
    """Tests for goal sync service."""

    @pytest.mark.asyncio
    async def test_sync_user_goals_no_goals(self, mock_supabase):
        """Test syncing when user has no goals."""
        mock_supabase.execute.return_value = MagicMock(data=[])
        
        service = GoalSyncService(mock_supabase)
        result = await service.sync_user_goals("user-456")
        
        assert result.success is True
        assert result.updated == 0

    @pytest.mark.asyncio
    async def test_sync_user_goals_unsupported_unit(self, mock_supabase, sample_goal):
        """Test syncing goal with unsupported unit."""
        mock_supabase.execute.return_value = MagicMock(
            data=[{**sample_goal, "unit": "unknown_unit"}]
        )
        
        service = GoalSyncService(mock_supabase)
        result = await service.sync_user_goals("user-456")
        
        assert result.success is True
        assert result.updated == 0  # No strategy for unknown unit
