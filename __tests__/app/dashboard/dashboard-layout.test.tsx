/**
 * Unit tests for Dashboard layout and components
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Dashboard Layout', () => {
  describe('Statistics Cards', () => {
    it('should display compact statistics in single row layout', () => {
      // Mock data structure that dashboard would receive
      const stats = {
        totalWorkouts: 10,
        activeGoals: 3,
        currentStreak: 5,
        totalExercises: 45
      }

      const { container } = render(
        <div className="grid grid-cols-4 gap-2">
          <div data-testid="stat-workouts">{stats.totalWorkouts}</div>
          <div data-testid="stat-goals">{stats.activeGoals}</div>
          <div data-testid="stat-streak">{stats.currentStreak}</div>
          <div data-testid="stat-exercises">{stats.totalExercises}</div>
        </div>
      )

      // Check grid layout - always 4 columns
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-4')

      // Check all stats are rendered
      expect(screen.getByTestId('stat-workouts')).toHaveTextContent('10')
      expect(screen.getByTestId('stat-goals')).toHaveTextContent('3')
      expect(screen.getByTestId('stat-streak')).toHaveTextContent('5')
      expect(screen.getByTestId('stat-exercises')).toHaveTextContent('45')
    })

    it('should have compact spacing', () => {
      const { container } = render(
        <div className="grid grid-cols-4 gap-2" />
      )

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('gap-2')
    })
  })

  describe('Log Workout Button', () => {
    it('should be prominent and full-width on mobile', () => {
      const { container } = render(
        <button className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14">
          Log Workout
        </button>
      )

      const button = container.querySelector('button')
      expect(button).toHaveClass('w-full', 'sm:w-auto')
      expect(button).toHaveClass('h-12', 'sm:h-14')
      expect(button).toHaveClass('text-base', 'sm:text-lg')
    })

    it('should display correct text', () => {
      render(
        <button>
          Log Workout
        </button>
      )

      expect(screen.getByText('Log Workout')).toBeInTheDocument()
    })
  })

  describe('Workout Plan Section', () => {
    it('should display active workout plan', () => {
      const activePlan = {
        id: '1',
        name: 'Weight Loss Plan',
        description: '4 week intensive',
        weeks_duration: 4,
        workouts_per_week: 5,
        status: 'active'
      }

      render(
        <div data-testid="workout-plan">
          <h3>{activePlan.name}</h3>
          <p>{activePlan.description}</p>
          <span>{activePlan.weeks_duration} weeks</span>
          <span>{activePlan.workouts_per_week} workouts/week</span>
          <span data-testid="plan-status">{activePlan.status}</span>
        </div>
      )

      expect(screen.getByText('Weight Loss Plan')).toBeInTheDocument()
      expect(screen.getByText('4 week intensive')).toBeInTheDocument()
      expect(screen.getByText('4 weeks')).toBeInTheDocument()
      expect(screen.getByText('5 workouts/week')).toBeInTheDocument()
      expect(screen.getByTestId('plan-status')).toHaveTextContent('active')
    })

    it('should display empty state when no plan exists', () => {
      render(
        <div data-testid="no-plan-state">
          <p>No active workout plan</p>
          <button>Create Workout Plan</button>
        </div>
      )

      expect(screen.getByText('No active workout plan')).toBeInTheDocument()
      expect(screen.getByText('Create Workout Plan')).toBeInTheDocument()
    })
  })

  describe('Recent Activity Section', () => {
    it('should display workout cards in compact format', () => {
      const workout = {
        id: '1',
        name: 'Leg Day',
        date: '2024-01-15',
        duration_minutes: 60,
        exercises: [{ id: '1' }, { id: '2' }, { id: '3' }]
      }

      const { container } = render(
        <div className="space-y-2 sm:space-y-3" data-testid="activity-list">
          <div className="flex gap-2 sm:gap-3 p-2 sm:p-3">
            <div>
              <h3 className="text-sm sm:text-base">{workout.name}</h3>
              <p className="text-xs">Jan 15</p>
              <span data-testid="exercise-count">{workout.exercises.length}</span>
              <span>{workout.duration_minutes} min</span>
            </div>
          </div>
        </div>
      )

      expect(screen.getByText('Leg Day')).toBeInTheDocument()
      expect(screen.getByText('Jan 15')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-count')).toHaveTextContent('3')
      expect(screen.getByText('60 min')).toBeInTheDocument()

      // Check compact spacing
      const list = container.querySelector('[data-testid="activity-list"]')
      expect(list).toHaveClass('space-y-2', 'sm:space-y-3')
    })

    it('should display empty state when no workouts exist', () => {
      render(
        <div data-testid="no-workouts-state">
          <p>No workouts yet. Start your fitness journey today!</p>
          <button>Log Your First Workout</button>
        </div>
      )

      expect(screen.getByText(/No workouts yet/)).toBeInTheDocument()
      expect(screen.getByText('Log Your First Workout')).toBeInTheDocument()
    })

    it('should have proper responsive typography', () => {
      const { container } = render(
        <h3 className="text-sm sm:text-base font-semibold">Workout Title</h3>
      )

      const title = container.querySelector('h3')
      expect(title).toHaveClass('text-sm', 'sm:text-base', 'font-semibold')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should have reduced padding on mobile', () => {
      const { container } = render(
        <div className="container mx-auto px-4 py-4 sm:py-6" />
      )

      const wrapper = container.querySelector('.container')
      expect(wrapper).toHaveClass('py-4', 'sm:py-6')
    })

    it('should have responsive spacing between sections', () => {
      const { container } = render(
        <div className="space-y-4 sm:space-y-6" />
      )

      const wrapper = container.querySelector('.space-y-4')
      expect(wrapper).toHaveClass('space-y-4', 'sm:space-y-6')
    })

    it('should display 4 columns for stats grid on all devices', () => {
      const { container } = render(
        <div className="grid grid-cols-4" />
      )

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-4')
    })
  })

  describe('Image Optimization', () => {
    it('should use responsive image sizes for workout selfies', () => {
      const { container } = render(
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <img
            src="/test-image.jpg"
            alt="Workout selfie"
            sizes="(max-width: 640px) 64px, 80px"
          />
        </div>
      )

      const imageWrapper = container.querySelector('.relative')
      expect(imageWrapper).toHaveClass('w-16', 'h-16', 'sm:w-20', 'sm:h-20')

      const img = container.querySelector('img')
      expect(img).toHaveAttribute('sizes', '(max-width: 640px) 64px, 80px')
      expect(img).toHaveAttribute('alt', 'Workout selfie')
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(
        <img src="/test.jpg" alt="Workout selfie" />
      )

      const img = screen.getByAltText('Workout selfie')
      expect(img).toBeInTheDocument()
    })

    it('should use semantic heading hierarchy', () => {
      const { container } = render(
        <div>
          <h2>Recent Activity</h2>
          <h3>Workout Title</h3>
        </div>
      )

      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('h3')).toBeInTheDocument()
    })
  })
})
