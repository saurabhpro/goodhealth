"""Tests for workout plans API endpoints."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_current_user_id, get_db
from app.main import app


def create_mock_db():
    """Create a mock database client with chainable methods."""
    db = MagicMock()
    db.table.return_value = db
    db.select.return_value = db
    db.insert.return_value = db
    db.update.return_value = db
    db.upsert.return_value = db
    db.delete.return_value = db
    db.eq.return_value = db
    db.is_.return_value = db
    db.or_.return_value = db
    db.order.return_value = db
    db.limit.return_value = db
    db.maybe_single.return_value = db
    db.single.return_value = db
    return db


@pytest.fixture
def mock_db():
    """Create and configure mock database."""
    return create_mock_db()


@pytest.fixture
def client(mock_db):
    """Create test client with mocked dependencies."""
    # Override dependencies
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_id] = lambda: "test-user-123"

    with TestClient(app) as test_client:
        yield test_client

    # Clean up
    app.dependency_overrides.clear()


class TestGetUserPreferences:
    """Tests for GET /api/workout-plans/preferences."""

    def test_get_preferences_success(self, client, mock_db):
        """Test successful preferences retrieval."""
        mock_db.execute.return_value = MagicMock(
            data={
                "id": "pref-123",
                "user_id": "test-user-123",
                "fitness_level": "intermediate",
                "preferred_duration": 60,
            }
        )

        response = client.get(
            "/api/workout-plans/preferences",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["preferences"]["fitness_level"] == "intermediate"

    def test_get_preferences_not_found(self, client, mock_db):
        """Test preferences not found returns None."""
        mock_db.execute.return_value = MagicMock(data=None)

        response = client.get(
            "/api/workout-plans/preferences",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["preferences"] is None


class TestUpsertUserPreferences:
    """Tests for PUT /api/workout-plans/preferences."""

    def test_upsert_preferences_success(self, client, mock_db):
        """Test successful preferences upsert."""
        mock_db.execute.return_value = MagicMock(
            data=[
                {
                    "id": "pref-123",
                    "user_id": "test-user-123",
                    "fitness_level": "advanced",
                    "preferred_duration": 90,
                }
            ]
        )

        response = client.put(
            "/api/workout-plans/preferences",
            json={"fitness_level": "advanced", "gym_access": True},
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["preferences"]["fitness_level"] == "advanced"


class TestGetUserTemplates:
    """Tests for GET /api/workout-plans/templates."""

    def test_get_templates_success(self, client, mock_db):
        """Test successful templates retrieval."""
        mock_db.execute.return_value = MagicMock(
            data=[
                {"id": "template-1", "name": "Push Day", "workout_type": "strength"},
                {"id": "template-2", "name": "Pull Day", "workout_type": "strength"},
            ]
        )

        response = client.get(
            "/api/workout-plans/templates",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["templates"]) == 2

    def test_get_templates_empty(self, client, mock_db):
        """Test empty templates list."""
        mock_db.execute.return_value = MagicMock(data=[])

        response = client.get(
            "/api/workout-plans/templates",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["templates"] == []


class TestCreateUserTemplate:
    """Tests for POST /api/workout-plans/templates."""

    def test_create_template_success(self, client, mock_db):
        """Test successful template creation."""
        mock_db.execute.return_value = MagicMock(
            data=[{"id": "template-new", "name": "New Template"}]
        )

        response = client.post(
            "/api/workout-plans/templates",
            json={"name": "New Template", "workout_type": "strength"},
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["template_id"] == "template-new"

    def test_create_template_failure(self, client, mock_db):
        """Test template creation failure."""
        mock_db.execute.return_value = MagicMock(data=[])

        response = client.post(
            "/api/workout-plans/templates",
            json={"name": "Failed Template"},
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 400


class TestDeleteUserTemplate:
    """Tests for DELETE /api/workout-plans/templates/{template_id}."""

    def test_delete_template_success(self, client, mock_db):
        """Test successful template deletion."""
        mock_db.execute.return_value = MagicMock(data=[{"id": "template-123"}])

        response = client.delete(
            "/api/workout-plans/templates/template-123",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["template_id"] == "template-123"

    def test_delete_template_not_found(self, client, mock_db):
        """Test deleting non-existent template."""
        mock_db.execute.return_value = MagicMock(data=[])

        response = client.delete(
            "/api/workout-plans/templates/nonexistent",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 404


class TestGetPlanWeekSessions:
    """Tests for GET /api/workout-plans/{plan_id}/week/{week_number}."""

    def test_get_week_sessions_success(self, client, mock_db):
        """Test successful week sessions retrieval."""
        # First call for plan verification, second for sessions
        mock_db.execute.side_effect = [
            MagicMock(data={"id": "plan-123"}),
            MagicMock(
                data=[
                    {"id": "session-1", "workout_name": "Push Day", "week_number": 1},
                    {"id": "session-2", "workout_name": "Pull Day", "week_number": 1},
                ]
            ),
        ]

        response = client.get(
            "/api/workout-plans/plan-123/week/1",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["sessions"]) == 2

    def test_get_week_sessions_plan_not_found(self, client, mock_db):
        """Test week sessions for non-existent plan."""
        mock_db.execute.return_value = MagicMock(data=None)

        response = client.get(
            "/api/workout-plans/nonexistent/week/1",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 404

    def test_get_week_sessions_empty(self, client, mock_db):
        """Test week with no sessions."""
        mock_db.execute.side_effect = [
            MagicMock(data={"id": "plan-123"}),
            MagicMock(data=[]),
        ]

        response = client.get(
            "/api/workout-plans/plan-123/week/5",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["sessions"] == []


class TestUnauthorizedAccess:
    """Test unauthorized access to endpoints."""

    def test_preferences_unauthorized(self):
        """Test preferences endpoint requires auth."""
        # Create client without auth override
        with TestClient(app) as client:
            response = client.get("/api/workout-plans/preferences")
            assert response.status_code == 401

    def test_templates_unauthorized(self):
        """Test templates endpoint requires auth."""
        with TestClient(app) as client:
            response = client.get("/api/workout-plans/templates")
            assert response.status_code == 401
