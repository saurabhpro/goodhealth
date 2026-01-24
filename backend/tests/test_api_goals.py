"""Tests for goals API endpoints."""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_auth():
    """Mock authentication middleware."""
    with patch("app.dependencies.get_current_user_id") as mock:
        mock.return_value = "test-user-123"
        yield mock


@pytest.fixture
def mock_goals_service():
    """Mock goals CRUD service."""
    with patch("app.routers.goals.GoalsCrudService") as mock:
        service = MagicMock()
        mock.return_value = service
        yield service


class TestCreateGoal:
    """Tests for POST /api/goals."""

    def test_create_goal_success(self, client, mock_auth, mock_goals_service):
        """Test successful goal creation."""
        mock_goals_service.create_goal = AsyncMock(
            return_value={"success": True, "goal_id": "goal-123"}
        )

        response = client.post(
            "/api/goals",
            json={
                "title": "Run 50km",
                "description": "Monthly running goal",
                "target_value": 50,
                "unit": "km",
                "current_value": 0,
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["goal_id"] == "goal-123"

    def test_create_goal_invalid_date(self, client, mock_auth, mock_goals_service):
        """Test goal creation with past target date."""
        mock_goals_service.create_goal = AsyncMock(
            return_value={"success": False, "error": "Target date cannot be in the past"}
        )

        response = client.post(
            "/api/goals",
            json={
                "title": "Test Goal",
                "target_value": 100,
                "unit": "kg",
                "target_date": "2020-01-01",
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 400


class TestGetGoals:
    """Tests for GET /api/goals."""

    def test_get_goals_success(self, client, mock_auth, mock_goals_service):
        """Test successful goals list retrieval."""
        mock_goals_service.get_goals = AsyncMock(
            return_value=[
                {
                    "id": "goal-1",
                    "title": "Goal 1",
                    "target_value": 50,
                    "current_value": 25,
                    "unit": "km",
                },
                {
                    "id": "goal-2",
                    "title": "Goal 2",
                    "target_value": 100,
                    "current_value": 50,
                    "unit": "workouts",
                },
            ]
        )

        response = client.get(
            "/api/goals",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["goals"]) == 2


class TestUpdateGoalProgress:
    """Tests for PUT /api/goals/{goal_id}/progress."""

    def test_update_progress_success(self, client, mock_auth, mock_goals_service):
        """Test successful goal progress update."""
        mock_goals_service.update_goal_progress = AsyncMock(
            return_value={"success": True}
        )

        response = client.put(
            "/api/goals/goal-123/progress",
            json={"current_value": 35},
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestDeleteGoal:
    """Tests for DELETE /api/goals/{goal_id}."""

    def test_delete_goal_success(self, client, mock_auth, mock_goals_service):
        """Test successful goal deletion."""
        mock_goals_service.delete_goal = AsyncMock(
            return_value={"success": True}
        )

        response = client.delete(
            "/api/goals/goal-123",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
