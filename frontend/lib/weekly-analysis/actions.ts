"use server";

import { apiGet } from "@/lib/api/client";

// Match the interface expected by DashboardContent
export interface WeeklyAnalysis {
  id: string;
  week_start_date: string;
  week_end_date: string;
  analysis_summary: string;
  key_achievements: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  motivational_quote: string;
  weekly_stats: {
    workouts_completed: number;
    total_duration_minutes: number;
    avg_effort_level: number;
    total_exercises: number;
    workout_types: Record<string, number>;
  };
  viewed_at: string | null;
  is_dismissed: boolean;
  generated_at: string;
}

interface WeeklyAnalysisResponse {
  analysis: WeeklyAnalysis | null;
}

export async function getLatestWeeklyAnalysis(): Promise<WeeklyAnalysis | null> {
  const response = await apiGet<WeeklyAnalysisResponse>(
    "/api/weekly-analysis/latest"
  );

  return response.data?.analysis || null;
}
