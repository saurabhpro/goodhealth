"""Tests for workouts API endpoints."""

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
def mock_workouts_service():
    """Mock workouts service."""
    with patch("app.routers.workouts.WorkoutsService") as mock:
        service = MagicMock()
        mock.return_value = service
        yield service


class TestCreateWorkout:
    """Tests for POST /api/workouts."""

    def test_create_workout_success(self, client, mock_auth, mock_workouts_service):
        """Test successful workout creation."""
        mock_workouts_service.create_workout = AsyncMock(
            return_value={"success": True, "workout_id": "workout-123"}
        )

        response = client.post(
            "/api/workouts",
            json={
                "name": "Morning Workout",
                "date": "2024-01-15",
                "duration_minutes": 60,
                "exercises": [
                    {"name": "Bench Press", "sets": 3, "reps": 10, "weight": 80}
                ],
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["workout_id"] == "workout-123"

    def test_create_workout_missing_name(self, client, mock_auth):
        """Test workout creation with missing required field."""
        response = client.post(
            "/api/workouts",
            json={
                "date": "2024-01-15",
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 422  # Validation error


class TestGetWorkouts:
    """Tests for GET /api/workouts."""

    def test_get_workouts_success(self, client, mock_auth, mock_workouts_service):
        """Test successful workout list retrieval."""
        mock_workouts_service.get_workouts = AsyncMock(
            return_value=[
                {
                    "id": "workout-1",
                    "name": "Workout 1",
                    "date": "2024-01-15",
                    "exercises": [],
                    "workout_selfies": [],
                },
                {
                    "id": "workout-2",
                    "name": "Workout 2",
                    "date": "2024-01-14",
                    "exercises": [],
                    "workout_selfies": [],
                },
            ]
        )

        response = client.get(
            "/api/workouts",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["workouts"]) == 2

    def test_get_workouts_with_limit(self, client, mock_auth, mock_workouts_service):
        """Test workout list with limit parameter."""
        mock_workouts_service.get_workouts = AsyncMock(return_value=[])

        response = client.get(
            "/api/workouts?limit=5",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200


class TestGetWorkout:
    """Tests for GET /api/workouts/{workout_id}."""

    def test_get_workout_success(self, client, mock_auth, mock_workouts_service):
        """Test successful single workout retrieval."""
        mock_workouts_service.get_workout = AsyncMock(
            return_value={
                "id": "workout-123",
                "name": "Test Workout",
                "date": "2024-01-15",
                "exercises": [
                    {"name": "Squat", "sets": 3, "reps": 10}
                ],
            }
        )

        response = client.get(
            "/api/workouts/workout-123",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "workout-123"
        assert data["name"] == "Test Workout"

    def test_get_workout_not_found(self, client, mock_auth, mock_workouts_service):
        """Test workout not found."""
        mock_workouts_service.get_workout = AsyncMock(return_value=None)

        response = client.get(
            "/api/workouts/nonexistent",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 404


class TestUpdateWorkout:
    """Tests for PUT /api/workouts/{workout_id}."""

    def test_update_workout_success(self, client, mock_auth, mock_workouts_service):
        """Test successful workout update."""
        mock_workouts_service.update_workout = AsyncMock(
            return_value={"success": True}
        )

        response = client.put(
            "/api/workouts/workout-123",
            json={
                "name": "Updated Workout",
                "duration_minutes": 90,
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestDeleteWorkout:
    """Tests for DELETE /api/workouts/{workout_id}."""

    def test_delete_workout_success(self, client, mock_auth, mock_workouts_service):
        """Test successful workout deletion."""
        mock_workouts_service.delete_workout = AsyncMock(
            return_value={"success": True}
        )

        response = client.delete(
            "/api/workouts/workout-123",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
