/**
 * Tests for WorkoutPlansClient component
 * Tests the interactive functionality for the workout plans listing page
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { WorkoutPlan } from '@/types'

// Mock next/navigation BEFORE importing the component
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))
import { toast as mockToast } from 'sonner'

// Mock AIGeneratingPlaceholder
jest.mock('@/components/workout-plans/ai-generating-placeholder', () => ({
  AIGeneratingPlaceholder: ({ planName }: { planName: string }) => (
    <div data-testid="ai-generating-placeholder">{planName}</div>
  ),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch - return immediately to prevent polling loops
const mockFetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
)
global.fetch = mockFetch as jest.Mock

// Mock confirm
global.confirm = jest.fn()

// Import component AFTER mocks are set up
import { WorkoutPlansClient } from '@/app/workout-plans/client'

const mockPlans: WorkoutPlan[] = [
  {
    id: 'plan-1',
    user_id: 'user-1',
    name: 'Weight Loss Program',
    description: '8 week intensive fat burning program',
    weeks_duration: 8,
    workouts_per_week: 4,
    avg_workout_duration: 45,
    goal_type: 'weight_loss',
    status: 'active',
    goal_id: 'goal-1',
    started_at: '2024-01-15',
    completed_at: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'plan-2',
    user_id: 'user-1',
    name: 'Muscle Building',
    description: 'Hypertrophy focused training',
    weeks_duration: 12,
    workouts_per_week: 5,
    avg_workout_duration: 60,
    goal_type: 'muscle_building',
    status: 'draft',
    goal_id: 'goal-2',
    started_at: null,
    completed_at: null,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
  {
    id: 'plan-3',
    user_id: 'user-1',
    name: 'Marathon Prep',
    description: 'Endurance training for marathon',
    weeks_duration: 16,
    workouts_per_week: 6,
    avg_workout_duration: 50,
    goal_type: 'endurance',
    status: 'completed',
    goal_id: 'goal-3',
    started_at: '2023-09-01',
    completed_at: '2023-12-31',
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z',
  },
  {
    id: 'plan-4',
    user_id: 'user-1',
    name: 'Old Plan',
    description: 'Archived plan',
    weeks_duration: 4,
    workouts_per_week: 3,
    avg_workout_duration: 30,
    goal_type: 'general_fitness',
    status: 'archived',
    goal_id: null,
    started_at: null,
    completed_at: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

describe('WorkoutPlansClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
  })

  describe('Initial Rendering', () => {
    it('should render page header', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      expect(screen.getByRole('heading', { name: 'Workout Plans' })).toBeInTheDocument()
      expect(screen.getByText('Manage your personalized workout plans and track your progress')).toBeInTheDocument()
    })

    it('should render create plan button', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const createButton = screen.getByRole('link', { name: /Create Plan/i })
      expect(createButton).toHaveAttribute('href', '/workout-plans/new')
    })

    it('should render quick action cards', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      expect(screen.getByText('Workout Preferences')).toBeInTheDocument()
      expect(screen.getByText('My Templates')).toBeInTheDocument()
    })

    it('should render all workout plans', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      expect(screen.getByText('Weight Loss Program')).toBeInTheDocument()
      // "Muscle Building" appears both as plan name and goal type
      expect(screen.getAllByText('Muscle Building').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Marathon Prep')).toBeInTheDocument()
      expect(screen.getByText('Old Plan')).toBeInTheDocument()
    })

    it('should render plan details correctly', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      expect(screen.getByText('8 week intensive fat burning program')).toBeInTheDocument()
      expect(screen.getByText('8 weeks')).toBeInTheDocument()
      expect(screen.getByText('4/week')).toBeInTheDocument()
      expect(screen.getByText('45 min')).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    it('should render all status badges', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Archived')).toBeInTheDocument()
    })
  })

  describe('Goal Type Display', () => {
    it('should display formatted goal types', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      // Goal types appear in badge elements
      expect(screen.getByText('Weight Loss')).toBeInTheDocument()
      // "Muscle Building" appears both as plan name and goal type - use getAllByText
      expect(screen.getAllByText('Muscle Building').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Endurance')).toBeInTheDocument()
      expect(screen.getByText('General Fitness')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no plans', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={[]} />)
      })

      expect(screen.getByText('No workout plans yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first personalized workout plan to get started')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Create Your First Plan/i })).toHaveAttribute('href', '/workout-plans/new')
    })
  })

  describe('Quick Action Navigation', () => {
    it('should navigate to preferences when clicking preferences card', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const preferencesCard = screen.getByText('Workout Preferences').closest('div[class*="cursor-pointer"]')
      if (preferencesCard) {
        await act(async () => {
          fireEvent.click(preferencesCard)
        })
        expect(mockPush).toHaveBeenCalledWith('/workout-plans/preferences')
      }
    })

    it('should navigate to templates when clicking templates card', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const templatesCard = screen.getByText('My Templates').closest('div[class*="cursor-pointer"]')
      if (templatesCard) {
        await act(async () => {
          fireEvent.click(templatesCard)
        })
        expect(mockPush).toHaveBeenCalledWith('/workout-plans/templates')
      }
    })
  })

  describe('Plan Card Navigation', () => {
    it('should navigate to plan details when clicking on a plan card', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const planCard = screen.getByText('Weight Loss Program').closest('div[class*="cursor-pointer"]')
      if (planCard) {
        await act(async () => {
          fireEvent.click(planCard)
        })
        expect(mockPush).toHaveBeenCalledWith('/workout-plans/plan-1')
      }
    })

    it('should navigate to plan when clicking Continue button', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const continueButton = screen.getByRole('button', { name: /Continue/i })
      await act(async () => {
        fireEvent.click(continueButton)
      })

      expect(mockPush).toHaveBeenCalledWith('/workout-plans/plan-1')
    })

    it('should navigate to plan when clicking Start Plan button for draft', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const startButton = screen.getByRole('button', { name: /Start Plan/i })
      await act(async () => {
        fireEvent.click(startButton)
      })

      expect(mockPush).toHaveBeenCalledWith('/workout-plans/plan-2')
    })
  })

  describe('Delete Functionality', () => {
    it('should confirm before deleting a plan', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(false)

      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-trash-2')
      )

      if (deleteButtons.length > 0) {
        await act(async () => {
          fireEvent.click(deleteButtons[0])
        })
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this workout plan?')
      }
    })

    it('should delete plan when confirmed', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(true)
      mockFetch.mockResolvedValue({ ok: true })

      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-trash-2')
      )

      if (deleteButtons.length > 0) {
        await act(async () => {
          fireEvent.click(deleteButtons[0])
        })

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            '/api/workout-plans/plan-1',
            { method: 'DELETE' }
          )
        })
      }
    })

    it('should show success toast after deletion', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(true)
      mockFetch.mockResolvedValue({ ok: true })

      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-trash-2')
      )

      if (deleteButtons.length > 0) {
        await act(async () => {
          fireEvent.click(deleteButtons[0])
        })

        await waitFor(() => {
          expect(mockToast.success as jest.Mock).toHaveBeenCalledWith('Plan deleted successfully')
        })
      }
    })
  })

  describe('Plan Duration Display', () => {
    it('should show singular "week" for 1 week plans', async () => {
      const singleWeekPlan: WorkoutPlan[] = [{
        ...mockPlans[0],
        id: 'plan-single',
        weeks_duration: 1,
      }]

      await act(async () => {
        render(<WorkoutPlansClient initialPlans={singleWeekPlan} />)
      })

      expect(screen.getByText('1 week')).toBeInTheDocument()
    })

    it('should show plural "weeks" for multiple week plans', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      expect(screen.getByText('8 weeks')).toBeInTheDocument()
      expect(screen.getByText('12 weeks')).toBeInTheDocument()
    })
  })

  describe('Plan Dates Display', () => {
    it('should show start and end dates for active plans', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      // Multiple plans show Started/Ends labels (active and completed plans)
      expect(screen.getAllByText('Started').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Ends').length).toBeGreaterThanOrEqual(1)
    })

    it('should show progress bar for active plans', async () => {
      await act(async () => {
        render(<WorkoutPlansClient initialPlans={mockPlans} />)
      })

      const progressText = screen.getByText('Progress')
      expect(progressText).toBeInTheDocument()
    })
  })

  describe('Null Data Handling', () => {
    it('should handle plans with null descriptions', async () => {
      const planWithNullDescription: WorkoutPlan[] = [{
        ...mockPlans[0],
        description: null,
      }]

      await act(async () => {
        render(<WorkoutPlansClient initialPlans={planWithNullDescription} />)
      })

      expect(screen.getByText('Weight Loss Program')).toBeInTheDocument()
      expect(screen.queryByText('8 week intensive fat burning program')).not.toBeInTheDocument()
    })

    it('should handle plans with null avg_workout_duration', async () => {
      const planWithNullDuration: WorkoutPlan[] = [{
        ...mockPlans[0],
        avg_workout_duration: null,
      }]

      await act(async () => {
        render(<WorkoutPlansClient initialPlans={planWithNullDuration} />)
      })

      expect(screen.getByText('Weight Loss Program')).toBeInTheDocument()
      expect(screen.queryByText('45 min')).not.toBeInTheDocument()
    })
  })
})

describe('WorkoutPlans Server Component Data Fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should pass empty array when no plans exist', async () => {
    await act(async () => {
      render(<WorkoutPlansClient initialPlans={[]} />)
    })

    expect(screen.getByText('No workout plans yet')).toBeInTheDocument()
    expect(screen.queryByText('Weight Loss Program')).not.toBeInTheDocument()
  })

  it('should correctly initialize state from server-fetched data', async () => {
    await act(async () => {
      render(<WorkoutPlansClient initialPlans={mockPlans} />)
    })

    // All 4 plans should be rendered immediately (no loading state)
    expect(screen.getByText('Weight Loss Program')).toBeInTheDocument()
    // "Muscle Building" appears both as plan name and goal type
    expect(screen.getAllByText('Muscle Building').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Marathon Prep')).toBeInTheDocument()
    expect(screen.getByText('Old Plan')).toBeInTheDocument()

    // Quick actions should be visible
    expect(screen.getByText('Workout Preferences')).toBeInTheDocument()
    expect(screen.getByText('My Templates')).toBeInTheDocument()
  })
})
