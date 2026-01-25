"""Tests for profiles API endpoints."""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_db, get_current_user_id


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
def mock_profiles_service():
    """Mock profiles service."""
    with patch("app.routers.profiles.ProfilesService") as mock:
        service = MagicMock()
        mock.return_value = service
        yield service


class TestGetProfile:
    """Tests for GET /api/profile."""

    def test_get_profile_success(self, client, mock_profiles_service):
        """Test successful profile retrieval."""
        mock_profiles_service.get_profile = AsyncMock(
            return_value={
                "id": "test-user-123",
                "email": "test@example.com",
                "full_name": "Test User",
                "fitness_level": "intermediate",
                "date_of_birth": "1990-01-15",
                "gender": "male",
                "height_cm": 180.0,
                "fitness_goals": ["strength", "endurance"],
                "avatar_url": None,
                "theme": "light",
                "accent_theme": "blue",
                "weight_unit": "kg",
                "distance_unit": "km",
                "notification_preferences": {},
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-15T00:00:00Z",
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

    def test_get_profile_not_found(self, client, mock_profiles_service):
        """Test profile not found."""
        mock_profiles_service.get_profile = AsyncMock(return_value=None)

        response = client.get(
            "/api/profile",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 404


class TestUpdateProfile:
    """Tests for PUT /api/profile."""

    def test_update_profile_success(self, client, mock_profiles_service):
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

    def test_update_profile_invalid_height(self, client):
        """Test profile update with invalid height (Pydantic validation)."""
        # height_cm has a max of 300 in the model, so Pydantic rejects 500
        response = client.put(
            "/api/profile",
            json={"height_cm": 500},  # Invalid height - exceeds max
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 422  # Pydantic validation error

    def test_update_profile_invalid_dob(self, client, mock_profiles_service):
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
