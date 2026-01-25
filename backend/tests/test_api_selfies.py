"""Tests for selfies API endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_current_user_id, get_db
from app.main import app


@pytest.fixture
def mock_db():
    """Create mock database."""
    return MagicMock()


@pytest.fixture
def client(mock_db):
    """Create test client with mocked dependencies."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_id] = lambda: "test-user-123"

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def mock_selfies_service():
    """Mock selfies service."""
    with patch("app.routers.selfies.SelfiesService") as mock:
        service = MagicMock()
        mock.return_value = service
        yield service


class TestGetSelfieUrl:
    """Tests for GET /api/selfies/url."""

    def test_get_selfie_url_success(self, client, mock_selfies_service):
        """Test successful URL generation."""
        mock_selfies_service.get_signed_url = AsyncMock(
            return_value="https://storage.example.com/signed-url?token=abc123"
        )

        response = client.get(
            "/api/selfies/url?path=user-123/workout-456/selfie.jpg",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data["url"] == "https://storage.example.com/signed-url?token=abc123"

    def test_get_selfie_url_not_found(self, client, mock_selfies_service):
        """Test URL generation for missing file."""
        mock_selfies_service.get_signed_url = AsyncMock(return_value=None)

        response = client.get(
            "/api/selfies/url?path=nonexistent/path.jpg",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["url"] is None

    def test_get_selfie_url_missing_path(self, client):
        """Test URL generation without path parameter."""
        response = client.get(
            "/api/selfies/url",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 422  # Validation error

    def test_get_selfie_url_unauthorized(self):
        """Test unauthorized access."""
        # Create client without mocked auth
        with TestClient(app) as test_client:
            response = test_client.get("/api/selfies/url?path=some/path.jpg")
            assert response.status_code == 401


class TestGetWorkoutSelfie:
    """Tests for GET /api/workouts/{workout_id}/selfie."""

    def test_get_workout_selfie_success(self, client, mock_selfies_service):
        """Test successful selfie retrieval."""
        mock_selfies_service.get_workout_selfies = AsyncMock(
            return_value=[
                {
                    "id": "selfie-123",
                    "workout_id": "workout-456",
                    "user_id": "test-user-123",
                    "file_path": "user/workout/selfie.jpg",
                    "file_name": "selfie.jpg",
                    "file_size": 1024000,
                    "mime_type": "image/jpeg",
                    "caption": "Great workout!",
                    "taken_at": "2024-01-15T10:00:00Z",
                    "created_at": "2024-01-15T10:00:00Z",
                    "updated_at": "2024-01-15T10:00:00Z",
                    "deleted_at": None,
                    "signed_url": "https://storage.example.com/signed",
                }
            ]
        )

        response = client.get(
            "/api/workouts/workout-456/selfie",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["selfies"]) == 1
        assert data["selfies"][0]["id"] == "selfie-123"

    def test_get_workout_selfie_none(self, client, mock_selfies_service):
        """Test workout with no selfie."""
        mock_selfies_service.get_workout_selfies = AsyncMock(return_value=[])

        response = client.get(
            "/api/workouts/workout-456/selfie",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["selfies"] == []


class TestDeleteSelfie:
    """Tests for DELETE /api/selfies/{selfie_id}."""

    def test_delete_selfie_success(self, client, mock_selfies_service):
        """Test successful selfie deletion."""
        mock_selfies_service.delete_selfie = AsyncMock(return_value={"success": True})

        response = client.delete(
            "/api/selfies/selfie-123",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_delete_selfie_not_found(self, client, mock_selfies_service):
        """Test deleting non-existent selfie."""
        mock_selfies_service.delete_selfie = AsyncMock(
            return_value={"success": False, "error": "Selfie not found"}
        )

        response = client.delete(
            "/api/selfies/nonexistent",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 400


class TestUpdateSelfieCaption:
    """Tests for PUT /api/selfies/{selfie_id}/caption."""

    def test_update_caption_success(self, client, mock_selfies_service):
        """Test successful caption update."""
        mock_selfies_service.update_caption = AsyncMock(return_value={"success": True})

        response = client.put(
            "/api/selfies/selfie-123/caption",
            json={"caption": "Updated caption!"},
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_update_caption_empty(self, client, mock_selfies_service):
        """Test updating caption to empty string."""
        mock_selfies_service.update_caption = AsyncMock(return_value={"success": True})

        response = client.put(
            "/api/selfies/selfie-123/caption",
            json={"caption": ""},
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200


class TestGetRecentSelfies:
    """Tests for GET /api/selfies/recent."""

    def test_get_recent_selfies_success(self, client, mock_selfies_service):
        """Test successful recent selfies retrieval."""
        mock_selfies_service.get_recent_selfies = AsyncMock(
            return_value=[
                {
                    "id": "selfie-1",
                    "workout_id": "workout-1",
                    "user_id": "test-user-123",
                    "file_path": "user/workout1/selfie.jpg",
                    "file_name": "selfie.jpg",
                    "file_size": 1024000,
                    "mime_type": "image/jpeg",
                    "caption": "First",
                    "taken_at": "2024-01-15T10:00:00Z",
                    "created_at": "2024-01-15T10:00:00Z",
                    "updated_at": "2024-01-15T10:00:00Z",
                    "deleted_at": None,
                },
                {
                    "id": "selfie-2",
                    "workout_id": "workout-2",
                    "user_id": "test-user-123",
                    "file_path": "user/workout2/selfie.jpg",
                    "file_name": "selfie.jpg",
                    "file_size": 1024000,
                    "mime_type": "image/jpeg",
                    "caption": "Second",
                    "taken_at": "2024-01-14T10:00:00Z",
                    "created_at": "2024-01-14T10:00:00Z",
                    "updated_at": "2024-01-14T10:00:00Z",
                    "deleted_at": None,
                },
            ]
        )

        response = client.get(
            "/api/selfies/recent",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["selfies"]) == 2

    def test_get_recent_selfies_with_limit(self, client, mock_selfies_service):
        """Test recent selfies with custom limit."""
        mock_selfies_service.get_recent_selfies = AsyncMock(return_value=[])

        response = client.get(
            "/api/selfies/recent?limit=5",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        # Verify limit was passed to service
        mock_selfies_service.get_recent_selfies.assert_called_once()
