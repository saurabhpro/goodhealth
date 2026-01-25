"""Weekly analysis API routes."""

from fastapi import APIRouter, HTTPException

from app.models.weekly_analysis import WeeklyAnalysisRequest, WeeklyAnalysisResponse
from app.services.weekly_analyzer import WeeklyAnalyzer
from app.utils.supabase_client import get_supabase_client

router = APIRouter()


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
