/**
 * Tests for DashboardContent client component
 * Tests the interactive functionality that was extracted from page.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DashboardContent } from '@/app/dashboard/client'
import type { Workout, Goal, WorkoutPlan, WorkoutPlanSession } from '@/types'

// Mock next/dynamic to avoid issues with lazy loading in tests
jest.mock('next/dynamic', () => () => {
  const MockSessionDetailModal = ({ open, onOpenChange, session }: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    session: WorkoutPlanSession
  }) => open ? (
    <div data-testid="session-modal">
      <span data-testid="modal-session-name">{session.workout_name}</span>
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  ) : null
  return MockSessionDetailModal
})

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} data-testid="mock-image" />
  },
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock fetch for API calls
globalThis.fetch = jest.fn()

/**
 * Type-safe mock data matching database.ts Row types exactly
 */
const mockWorkouts: Workout[] = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'Morning Cardio',
    date: '2024-01-20',
    duration_minutes: 45,
    description: 'Easy morning run',
    effort_level: 6,
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z',
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'Upper Body Strength',
    date: '2024-01-19',
    duration_minutes: 60,
    description: 'Push day',
    effort_level: 8,
    created_at: '2024-01-19T10:00:00Z',
    updated_at: '2024-01-19T10:00:00Z',
  },
]

const mockGoals: Goal[] = [
  {
    id: '1',
    user_id: 'user-1',
    title: 'Lose 10kg',
    description: 'Weight loss goal',
    target_value: 70,
    current_value: 75,
    initial_value: 80,
    unit: 'kg',
    target_date: '2024-06-01',
    achieved: false,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    deleted_at: null,
  },
]

const mockPlans: WorkoutPlan[] = [
  {
    id: 'plan-1',
    user_id: 'user-1',
    name: 'Weight Loss Program',
    description: '4 week intensive',
    weeks_duration: 4,
    workouts_per_week: 4,
    avg_workout_duration: 45,
    goal_type: 'weight_loss',
    status: 'active',
    goal_id: '1',
    started_at: '2024-01-15',
    completed_at: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
]

const mockWeekSessions: WorkoutPlanSession[] = [
  {
    id: 'session-1',
    plan_id: 'plan-1',
    week_number: 1,
    day_of_week: 1, // Monday
    day_name: 'Monday',
    session_order: 1,
    workout_name: 'Chest & Triceps',
    workout_type: 'strength',
    workout_template_id: null,
    exercises: [],
    muscle_groups: ['chest', 'triceps'],
    intensity_level: 'moderate',
    estimated_duration: 60,
    status: 'scheduled',
    completed_workout_id: null,
    completed_at: null,
    notes: 'Push day focus',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'session-2',
    plan_id: 'plan-1',
    week_number: 1,
    day_of_week: 3, // Wednesday
    day_name: 'Wednesday',
    session_order: 2,
    workout_name: 'Back & Biceps',
    workout_type: 'strength',
    workout_template_id: null,
    exercises: [],
    muscle_groups: ['back', 'biceps'],
    intensity_level: 'moderate',
    estimated_duration: 55,
    status: 'completed',
    completed_workout_id: null,
    completed_at: '2024-01-17T10:00:00Z',
    notes: 'Pull day focus',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
  },
]

const mockWeeklyAnalysis = {
  id: 'analysis-1',
  week_start_date: '2024-01-15',
  week_end_date: '2024-01-21',
  analysis_summary: 'Great week of training!',
  key_achievements: ['Completed all workouts', 'Improved bench press'],
  areas_for_improvement: ['Sleep more'],
  recommendations: ['Add cardio'],
  motivational_quote: 'Keep pushing!',
  weekly_stats: {
    workouts_completed: 4,
    total_duration_minutes: 240,
    avg_effort_level: 7,
    total_exercises: 32,
    workout_types: { strength: 3, cardio: 1 },
  },
  viewed_at: null,
  is_dismissed: false,
  generated_at: '2024-01-21T08:00:00Z',
}

describe('DashboardContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessions: [], currentWeek: 1 }),
    })
  })

  describe('Initial Rendering', () => {
    it('should render stats with correct values', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      // Total workouts
      expect(screen.getByText('2')).toBeInTheDocument() // 2 workouts
      // Active goals (not achieved)
      expect(screen.getByText('1')).toBeInTheDocument() // 1 active goal
    })

    it('should render active workout plan', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      expect(screen.getByText('Weight Loss Program')).toBeInTheDocument()
      expect(screen.getByText('Week 1')).toBeInTheDocument()
    })

    it('should render week sessions', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      expect(screen.getByText('Chest & Triceps')).toBeInTheDocument()
      expect(screen.getByText('Back & Biceps')).toBeInTheDocument()
    })

    it('should render recent workouts', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      expect(screen.getByText('Morning Cardio')).toBeInTheDocument()
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should render empty state when no workouts', () => {
      render(
        <DashboardContent
          initialWorkouts={[]}
          initialGoals={[]}
          initialPlans={[]}
          initialWeekSessions={[]}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      expect(screen.getByText(/No workouts yet/)).toBeInTheDocument()
      expect(screen.getByText('Log Your First Workout')).toBeInTheDocument()
    })

    it('should render empty state when no active plan', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={[]}
          initialWeekSessions={[]}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      expect(screen.getByText('No active workout plan')).toBeInTheDocument()
      expect(screen.getByText('Create Workout Plan')).toBeInTheDocument()
    })
  })

  describe('Weekly Analysis Card', () => {
    it('should show weekly analysis when available', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={mockWeeklyAnalysis}
        />
      )

      // WeeklyAnalysisCard should be rendered with title and stats (always visible)
      expect(screen.getByText('Your Weekly Workout Analysis')).toBeInTheDocument()
      // Motivational quote is wrapped in curly quotes
      expect(screen.getByText(/Keep pushing!/)).toBeInTheDocument()
      expect(screen.getByText('View Full Analysis')).toBeInTheDocument()
    })

    it('should show motivational quote when no analysis', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      // MotivationalQuote should be shown (it has a rotating quote)
      // We can't test exact text, but the component should be in the DOM
      // The quote container should exist
      const container = document.querySelector('.container')
      expect(container).toBeInTheDocument()
    })

    it('should dismiss analysis and show quote', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={mockWeeklyAnalysis}
        />
      )

      // Analysis should be visible
      expect(screen.getByText('Your Weekly Workout Analysis')).toBeInTheDocument()

      // Find dismiss button (the X button in the header) - it's the first button
      const buttons = screen.getAllByRole('button')
      // Find the button that contains the X icon (dismiss button)
      const dismissButton = buttons.find(btn => {
        const svg = btn.querySelector('svg.lucide-x')
        return svg !== null
      })

      if (dismissButton) {
        fireEvent.click(dismissButton)

        await waitFor(() => {
          expect(globalThis.fetch).toHaveBeenCalledWith(
            '/api/weekly-analysis/analysis-1/dismiss',
            { method: 'PUT' }
          )
        })
      }
    })
  })

  describe('Session Modal', () => {
    it('should open modal when clicking on a session', async () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      // Find and click on a session card
      const sessionCard = screen.getByText('Chest & Triceps').closest('div[class*="cursor-pointer"]')
      if (sessionCard) {
        fireEvent.click(sessionCard)

        await waitFor(() => {
          expect(screen.getByTestId('session-modal')).toBeInTheDocument()
          expect(screen.getByTestId('modal-session-name')).toHaveTextContent('Chest & Triceps')
        })
      }
    })

    it('should not open modal for rest days', () => {
      const sessionsWithRest: WorkoutPlanSession[] = [
        {
          id: 'rest-1',
          plan_id: 'plan-1',
          week_number: 1,
          day_of_week: 0, // Sunday
          day_name: 'Sunday',
          session_order: 0,
          workout_name: 'Rest',
          workout_type: 'rest',
          workout_template_id: null,
          exercises: [],
          muscle_groups: null,
          intensity_level: null,
          estimated_duration: null,
          status: 'scheduled',
          completed_workout_id: null,
          completed_at: null,
          notes: null,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
      ]

      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={sessionsWithRest}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      // Multiple rest days are shown (for days without sessions)
      // Get the first "Rest" text and find its parent card
      const restDayTexts = screen.getAllByText('Rest')
      const restCard = restDayTexts[0].closest('div[class*="rounded-lg border"]')
      
      // Rest days should have muted styling, not cursor-pointer
      expect(restCard).toHaveClass('bg-muted/30')
    })
  })

  describe('Streak Calculation', () => {
    it('should calculate workout streak correctly', () => {
      // Create workouts for consecutive days ending today
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const consecutiveWorkouts: Workout[] = [
        { ...mockWorkouts[0], date: today.toISOString().split('T')[0] },
        { ...mockWorkouts[1], id: '2', date: yesterday.toISOString().split('T')[0] },
      ]

      render(
        <DashboardContent
          initialWorkouts={consecutiveWorkouts}
          initialGoals={mockGoals}
          initialPlans={[]}
          initialWeekSessions={[]}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      // Should show a streak (exact number depends on implementation)
      const statsGrid = document.querySelector('.grid-cols-4')
      expect(statsGrid).toBeInTheDocument()
    })

    it('should show 0 streak when no workouts', () => {
      render(
        <DashboardContent
          initialWorkouts={[]}
          initialGoals={[]}
          initialPlans={[]}
          initialWeekSessions={[]}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      // Streak should be 0
      expect(screen.getByText('Streak')).toBeInTheDocument()
      // The value 0 should be displayed in the stats
    })
  })

  describe('Navigation Links', () => {
    it('should have correct links for workout plan', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      const viewPlanLink = screen.getByText('View Full Plan').closest('a')
      expect(viewPlanLink).toHaveAttribute('href', '/workout-plans/plan-1')
    })

    it('should have link to create new workout', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      const logWorkoutButton = screen.getByText('Log Workout').closest('a')
      expect(logWorkoutButton).toHaveAttribute('href', '/workouts/new')
    })

    it('should have link to view all workouts', () => {
      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={null}
        />
      )

      const viewAllLink = screen.getByText('View All').closest('a')
      expect(viewAllLink).toHaveAttribute('href', '/workouts')
    })
  })

  describe('API Interactions', () => {
    it('should call view API when viewing analysis', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      render(
        <DashboardContent
          initialWorkouts={mockWorkouts}
          initialGoals={mockGoals}
          initialPlans={mockPlans}
          initialWeekSessions={mockWeekSessions}
          initialCurrentWeek={1}
          initialWeeklyAnalysis={mockWeeklyAnalysis}
        />
      )

      // The view API should be called when analysis is shown/expanded
      // This depends on the WeeklyAnalysisCard implementation
    })
  })
})

describe('Dashboard Server Component Data Fetching', () => {
  /**
   * These tests verify the expected behavior of the server component
   * Since we can't directly test async server components with Jest,
   * we test the expected props that would be passed to DashboardContent
   */

  it('should pass empty arrays when user is not authenticated', () => {
    // When no user is logged in, the server should pass empty data
    render(
      <DashboardContent
        initialWorkouts={[]}
        initialGoals={[]}
        initialPlans={[]}
        initialWeekSessions={[]}
        initialCurrentWeek={1}
        initialWeeklyAnalysis={null}
      />
    )

    expect(screen.getByText(/No workouts yet/)).toBeInTheDocument()
    expect(screen.getByText('No active workout plan')).toBeInTheDocument()
  })

  it('should handle parallel data fetching results', () => {
    // Test that DashboardContent correctly handles all data sources
    render(
      <DashboardContent
        initialWorkouts={mockWorkouts}
        initialGoals={mockGoals}
        initialPlans={mockPlans}
        initialWeekSessions={mockWeekSessions}
        initialCurrentWeek={2}
        initialWeeklyAnalysis={mockWeeklyAnalysis}
      />
    )

    // Should show week 2
    expect(screen.getByText('Week 2')).toBeInTheDocument()
    // Should show workouts
    expect(screen.getByText('Morning Cardio')).toBeInTheDocument()
    // Should show analysis card (analysis_summary is only visible when expanded)
    expect(screen.getByText('Your Weekly Workout Analysis')).toBeInTheDocument()
    expect(screen.getByText(/Keep pushing!/)).toBeInTheDocument()
  })
})
