"""Tests for weekly analysis API endpoints."""

from unittest.mock import MagicMock

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


class TestGetLatestWeeklyAnalysis:
    """Tests for GET /api/weekly-analysis/latest."""

    def test_get_latest_analysis_success(self, client, mock_db):
        """Test successful retrieval of latest weekly analysis."""
        mock_analysis = {
            "id": "analysis-123",
            "user_id": "test-user-123",
            "week_start_date": "2026-01-20",
            "week_end_date": "2026-01-26",
            "analysis_summary": "Great week!",
            "is_dismissed": False,
        }

        # Mock user preferences query (weekly analysis enabled)
        prefs_response = MagicMock()
        prefs_response.data = {"weekly_analysis_enabled": True}

        # Mock weekly analysis query
        analysis_response = MagicMock()
        analysis_response.data = mock_analysis

        mock_db.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
            prefs_response
        )
        mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.maybe_single.return_value.execute.return_value = (
            analysis_response
        )

        response = client.get(
            "/api/weekly-analysis/latest",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["analysis"]["id"] == "analysis-123"

    def test_get_latest_analysis_none_found(self, client, mock_db):
        """Test when no weekly analysis exists."""
        # Mock user preferences query
        prefs_response = MagicMock()
        prefs_response.data = None

        # Mock weekly analysis query returning None
        analysis_response = MagicMock()
        analysis_response.data = None

        mock_db.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
            prefs_response
        )
        mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.maybe_single.return_value.execute.return_value = (
            analysis_response
        )

        response = client.get(
            "/api/weekly-analysis/latest",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["analysis"] is None

    def test_get_latest_analysis_disabled(self, client, mock_db):
        """Test when weekly analysis is disabled in user preferences."""
        # Mock user preferences with analysis disabled
        prefs_response = MagicMock()
        prefs_response.data = {"weekly_analysis_enabled": False}

        mock_db.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
            prefs_response
        )

        response = client.get(
            "/api/weekly-analysis/latest",
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["analysis"] is None

    def test_get_latest_analysis_unauthenticated(self, mock_db):
        """Test that unauthenticated requests return 401."""
        # Create client without auth override
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides.pop(get_current_user_id, None)

        with TestClient(app) as test_client:
            response = test_client.get("/api/weekly-analysis/latest")

        app.dependency_overrides.clear()

        assert response.status_code == 401
