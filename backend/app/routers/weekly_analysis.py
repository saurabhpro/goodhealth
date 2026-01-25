"""Weekly analysis API routes."""

from typing import Any

from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUser, Database
from app.models.weekly_analysis import WeeklyAnalysisRequest, WeeklyAnalysisResponse
from app.services.weekly_analyzer import WeeklyAnalyzer
from app.utils.supabase_client import get_supabase_client

router = APIRouter()


@router.get("/weekly-analysis/latest")
async def get_latest_weekly_analysis(
    user_id: CurrentUser,
    db: Database,
) -> dict[str, Any] | None:
    """Get the most recent undismissed weekly analysis.

    Args:
        user_id: Current authenticated user
        db: Database client

    Returns:
        Latest weekly analysis or null if none exists
    """
    # Check user preferences for weekly_analysis_enabled
    prefs_response = (
        db.table("user_preferences")
        .select("weekly_analysis_enabled")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if prefs_response.data and prefs_response.data.get("weekly_analysis_enabled") is False:
        return {"analysis": None}

    # Get most recent undismissed analysis
    response = (
        db.table("weekly_workout_analysis")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_dismissed", False)
        .order("week_end_date", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )

    return {"analysis": response.data}


@router.post("/weekly-analysis/generate", response_model=WeeklyAnalysisResponse)
async def generate_weekly_analysis(
    request: WeeklyAnalysisRequest,
) -> WeeklyAnalysisResponse:
    """Generate weekly workout analysis.

    Args:
        request: The analysis request with user_id and optional week_start_date

    Returns:
        WeeklyAnalysisResponse with the analysis or error
    """
    try:
        supabase = get_supabase_client()
        analyzer = WeeklyAnalyzer(supabase)

        result = await analyzer.generate_analysis(
            user_id=request.user_id,
            week_start=request.week_start_date,
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
