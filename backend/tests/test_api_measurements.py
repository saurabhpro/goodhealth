"""Tests for measurements API endpoints."""

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
def mock_measurements_service():
    """Mock measurements service."""
    with patch("app.routers.measurements.MeasurementsService") as mock:
        service = MagicMock()
        mock.return_value = service
        yield service


class TestCreateMeasurement:
    """Tests for POST /api/measurements."""

    def test_create_measurement_success(self, client, mock_measurements_service):
        """Test successful measurement creation."""
        mock_measurements_service.create_measurement = AsyncMock(
            return_value={
                "success": True,
                "measurement": {
                    "id": "measurement-123",
                    "user_id": "test-user-123",
                    "weight": 75.5,
                    "body_fat_percentage": 15.0,
                    "measured_at": "2024-01-15T10:00:00Z",
                    "created_at": "2024-01-15T10:00:00Z",
                    "updated_at": "2024-01-15T10:00:00Z",
                    "deleted_at": None,
                },
            }
        )

        response = client.post(
            "/api/measurements",
            json={
                "weight": 75.5,
                "body_fat_percentage": 15.0,
                "muscle_mass": 35.0,
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_create_measurement_invalid_values(self, client):
        """Test measurement creation with invalid values."""
        response = client.post(
            "/api/measurements",
            json={
                "weight": -10,  # Invalid negative weight
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 422  # Validation error


class TestGetMeasurements:
    """Tests for GET /api/measurements."""

    def test_get_measurements_success(self, client, mock_measurements_service):
        """Test successful measurements list retrieval."""
        mock_measurements_service.get_measurements = AsyncMock(
            return_value=[
                {
                    "id": "m-1",
                    "user_id": "test-user-123",
                    "weight": 75.0,
                    "measured_at": "2024-01-15T10:00:00Z",
                    "created_at": "2024-01-15T10:00:00Z",
                    "updated_at": "2024-01-15T10:00:00Z",
                    "deleted_at": None,
                },
                {
                    "id": "m-2",
                    "user_id": "test-user-123",
                    "weight": 74.5,
                    "measured_at": "2024-01-08T10:00:00Z",
                    "created_at": "2024-01-08T10:00:00Z",
                    "updated_at": "2024-01-08T10:00:00Z",
                    "deleted_at": None,
                },
            ]
        )

        response = client.get(
            "/api/measurements",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["measurements"]) == 2


class TestGetLatestMeasurement:
    """Tests for GET /api/measurements/latest."""

    def test_get_latest_measurement_success(self, client, mock_measurements_service):
        """Test successful latest measurement retrieval."""
        mock_measurements_service.get_latest_measurement = AsyncMock(
            return_value={
                "id": "m-1",
                "user_id": "test-user-123",
                "weight": 75.0,
                "measured_at": "2024-01-15T10:00:00Z",
                "created_at": "2024-01-15T10:00:00Z",
                "updated_at": "2024-01-15T10:00:00Z",
                "deleted_at": None,
            }
        )

        response = client.get(
            "/api/measurements/latest",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["measurement"] is not None

    def test_get_latest_measurement_none(self, client, mock_measurements_service):
        """Test when no measurements exist."""
        mock_measurements_service.get_latest_measurement = AsyncMock(return_value=None)

        response = client.get(
            "/api/measurements/latest",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["measurement"] is None


class TestDeleteMeasurement:
    """Tests for DELETE /api/measurements/{measurement_id}."""

    def test_delete_measurement_success(self, client, mock_measurements_service):
        """Test successful measurement deletion."""
        mock_measurements_service.delete_measurement = AsyncMock(
            return_value={"success": True}
        )

        response = client.delete(
            "/api/measurements/measurement-123",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
