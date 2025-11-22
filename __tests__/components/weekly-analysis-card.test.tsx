import { render, screen, fireEvent } from '@testing-library/react'
import { WeeklyAnalysisCard } from '@/components/weekly-analysis-card'

const mockAnalysis = {
  id: 'analysis1',
  week_start_date: '2024-01-01',
  week_end_date: '2024-01-07',
  analysis_summary: 'Great progress this week!',
  key_achievements: ['Completed 5 workouts', 'Hit new PR on squats'],
  areas_for_improvement: ['Rest days needed', 'Increase protein intake'],
  recommendations: ['Add stretching routine', 'Focus on recovery'],
  motivational_quote: 'Every workout counts!',
  weekly_stats: {
    workouts_completed: 5,
    total_duration_minutes: 240,
    avg_effort_level: 4.5,
    total_exercises: 25,
    workout_types: { strength: 15, cardio: 10 },
  },
  viewed_at: null,
  is_dismissed: false,
  generated_at: '2024-01-08T08:00:00Z',
}

describe('WeeklyAnalysisCard', () => {
  it('should render analysis summary', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    expect(screen.getByText(/Your Weekly Workout Analysis/i)).toBeInTheDocument()
    expect(screen.getByText(/Every workout counts!/i)).toBeInTheDocument()
  })

  it('should display weekly stats', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    expect(screen.getByText('5')).toBeInTheDocument() // workouts
    expect(screen.getByText('240')).toBeInTheDocument() // minutes
    expect(screen.getByText('4.5/6')).toBeInTheDocument() // effort
    expect(screen.getByText('25')).toBeInTheDocument() // exercises
  })

  it('should show "New" badge when not viewed', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('should not show "New" badge when viewed', () => {
    const viewedAnalysis = {
      ...mockAnalysis,
      viewed_at: '2024-01-08T10:00:00Z',
    }

    render(<WeeklyAnalysisCard analysis={viewedAnalysis} />)

    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })

  it('should expand details when clicking "View Full Analysis"', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    const expandButton = screen.getByText(/View Full Analysis/i)
    fireEvent.click(expandButton)

    expect(screen.getByText(/Great progress this week!/i)).toBeInTheDocument()
    expect(screen.getByText(/Completed 5 workouts/i)).toBeInTheDocument()
    expect(screen.getByText(/Rest days needed/i)).toBeInTheDocument()
  })

  it('should collapse details when clicking "Hide Details"', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    const expandButton = screen.getByText(/View Full Analysis/i)
    fireEvent.click(expandButton)

    const collapseButton = screen.getByText(/Hide Details/i)
    fireEvent.click(collapseButton)

    expect(screen.queryByText(/Great progress this week!/i)).not.toBeInTheDocument()
  })

  it('should call onDismiss when dismiss button clicked', () => {
    const mockDismiss = jest.fn()
    render(
      <WeeklyAnalysisCard
        analysis={mockAnalysis}
        onDismiss={mockDismiss}
      />
    )

    const dismissButton = screen.getAllByRole('button')[0] // First button is dismiss (X)
    fireEvent.click(dismissButton)

    expect(mockDismiss).toHaveBeenCalledWith('analysis1')
  })

  it('should call onView when component mounts and not yet viewed', () => {
    const mockView = jest.fn()
    render(
      <WeeklyAnalysisCard
        analysis={mockAnalysis}
        onView={mockView}
      />
    )

    expect(mockView).toHaveBeenCalledWith('analysis1')
  })

  it('should not call onView when already viewed', () => {
    const mockView = jest.fn()
    const viewedAnalysis = {
      ...mockAnalysis,
      viewed_at: '2024-01-08T10:00:00Z',
    }

    render(
      <WeeklyAnalysisCard
        analysis={viewedAnalysis}
        onView={mockView}
      />
    )

    expect(mockView).not.toHaveBeenCalled()
  })

  it('should show loading state', () => {
    const { container } = render(<WeeklyAnalysisCard isLoading={true} />)

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render nothing when no analysis provided', () => {
    const { container } = render(<WeeklyAnalysisCard />)

    expect(container.firstChild).toBeNull()
  })

  it('should display date range correctly', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    // Check that date range is displayed (format: Jan 1 - Jan 7, 2024)
    expect(screen.getByText(/Jan 1.*Jan 7.*2024/)).toBeInTheDocument()
  })

  it('should show all achievement items', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    const expandButton = screen.getByText(/View Full Analysis/i)
    fireEvent.click(expandButton)

    expect(screen.getByText(/Completed 5 workouts/i)).toBeInTheDocument()
    expect(screen.getByText(/Hit new PR on squats/i)).toBeInTheDocument()
  })

  it('should show all improvement areas', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    const expandButton = screen.getByText(/View Full Analysis/i)
    fireEvent.click(expandButton)

    expect(screen.getByText(/Rest days needed/i)).toBeInTheDocument()
    expect(screen.getByText(/Increase protein intake/i)).toBeInTheDocument()
  })

  it('should show all recommendations', () => {
    render(<WeeklyAnalysisCard analysis={mockAnalysis} />)

    const expandButton = screen.getByText(/View Full Analysis/i)
    fireEvent.click(expandButton)

    expect(screen.getByText(/Add stretching routine/i)).toBeInTheDocument()
    expect(screen.getByText(/Focus on recovery/i)).toBeInTheDocument()
  })
})
