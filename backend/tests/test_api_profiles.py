"""Tests for profiles API endpoints."""

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
def mock_profiles_service():
    """Mock profiles service."""
    with patch("app.routers.profiles.ProfilesService") as mock:
        service = MagicMock()
        mock.return_value = service
        yield service


class TestGetProfile:
    """Tests for GET /api/profile."""

    def test_get_profile_success(self, client, mock_auth, mock_profiles_service):
        """Test successful profile retrieval."""
        mock_profiles_service.get_profile = AsyncMock(
            return_value={
                "id": "test-user-123",
                "email": "test@example.com",
                "full_name": "Test User",
                "fitness_level": "intermediate",
            }
        )

        response = client.get(
            "/api/profile",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["profile"]["email"] == "test@example.com"

    def test_get_profile_not_found(self, client, mock_auth, mock_profiles_service):
        """Test profile not found."""
        mock_profiles_service.get_profile = AsyncMock(return_value=None)

        response = client.get(
            "/api/profile",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 404


class TestUpdateProfile:
    """Tests for PUT /api/profile."""

    def test_update_profile_success(self, client, mock_auth, mock_profiles_service):
        """Test successful profile update."""
        mock_profiles_service.update_profile = AsyncMock(
            return_value={"success": True}
        )

        response = client.put(
            "/api/profile",
            json={
                "full_name": "Updated Name",
                "fitness_level": "advanced",
                "height_cm": 180,
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_update_profile_invalid_height(
        self, client, mock_auth, mock_profiles_service
    ):
        """Test profile update with invalid height."""
        mock_profiles_service.update_profile = AsyncMock(
            return_value={"success": False, "error": "Height must be between 50 and 300 cm"}
        )

        response = client.put(
            "/api/profile",
            json={"height_cm": 500},  # Invalid height
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 400

    def test_update_profile_invalid_dob(
        self, client, mock_auth, mock_profiles_service
    ):
        """Test profile update with invalid date of birth."""
        mock_profiles_service.update_profile = AsyncMock(
            return_value={
                "success": False,
                "error": "Please enter a valid date of birth (age must be between 13 and 120)",
            }
        )

        response = client.put(
            "/api/profile",
            json={"date_of_birth": "2020-01-01"},  # Too young
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 400
