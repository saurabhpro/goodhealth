"""Pytest configuration and fixtures."""

import pytest
from unittest.mock import MagicMock, AsyncMock


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    mock = MagicMock()
    
    # Setup chainable methods
    mock.table.return_value = mock
    mock.select.return_value = mock
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.upsert.return_value = mock
    mock.delete.return_value = mock
    mock.eq.return_value = mock
    mock.neq.return_value = mock
    mock.gt.return_value = mock
    mock.gte.return_value = mock
    mock.lt.return_value = mock
    mock.lte.return_value = mock
    mock.is_.return_value = mock
    mock.in_.return_value = mock
    mock.ilike.return_value = mock
    mock.not_.return_value = mock
    mock.order.return_value = mock
    mock.limit.return_value = mock
    
    # Default execute response
    mock.execute.return_value = MagicMock(data=[])
    
    return mock


@pytest.fixture
def mock_gemini_client():
    """Create a mock Gemini client."""
    mock = MagicMock()
    mock.generate_content = AsyncMock(return_value="")
    mock.generate_json = AsyncMock(return_value={})
    return mock


@pytest.fixture
def sample_goal():
    """Create a sample goal for testing."""
    return {
        "id": "goal-123",
        "user_id": "user-456",
        "title": "Complete 50 workouts",
        "description": "Build consistency",
        "initial_value": 0,
        "current_value": 10,
        "target_value": 50,
        "unit": "workouts",
        "target_date": None,
        "achieved": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T00:00:00Z",
        "deleted_at": None,
    }


@pytest.fixture
def sample_workout():
    """Create a sample workout for testing."""
    return {
        "id": "workout-789",
        "user_id": "user-456",
        "name": "Upper Body",
        "date": "2024-01-15",
        "duration_minutes": 60,
        "effort_level": 4,
        "exercises": [
            {
                "name": "Bench Press",
                "sets": 3,
                "reps": 10,
                "weight": 80,
                "weight_unit": "kg",
            },
            {
                "name": "Rows",
                "sets": 3,
                "reps": 10,
                "weight": 60,
                "weight_unit": "kg",
            },
        ],
    }
