/**
 * Unit tests for bidirectional goal progress calculation
 */

import { calculateGoalProgress, isGoalAchieved, getGoalDirection, calculateGoalStatus } from '@/lib/goals/progress'

describe('Goal Progress Tracking', () => {
  describe('calculateGoalProgress - Increasing Goals', () => {
    it('should calculate progress for increasing goals (e.g., lift more weight)', () => {
      // Start at 50kg, currently at 75kg, target 100kg
      const progress = calculateGoalProgress({
        initial_value: 50,
        current_value: 75,
        target_value: 100,
      })
      expect(progress).toBe(50) // Halfway there
    })

    it('should return 0% when at initial value for increasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 50,
        current_value: 50,
        target_value: 100,
      })
      expect(progress).toBe(0)
    })

    it('should return 100% when at target value for increasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 50,
        current_value: 100,
        target_value: 100,
      })
      expect(progress).toBe(100)
    })

    it('should cap at 100% when exceeding target for increasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 50,
        current_value: 120,
        target_value: 100,
      })
      expect(progress).toBe(100)
    })

    it('should handle starting from 0 for increasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 0,
        current_value: 25,
        target_value: 100,
      })
      expect(progress).toBe(25)
    })

    it('should handle decimal values for increasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 50.5,
        current_value: 75.25,
        target_value: 100,
      })
      expect(progress).toBeCloseTo(50, 0)
    })
  })

  describe('calculateGoalProgress - Decreasing Goals', () => {
    it('should calculate progress for decreasing goals (e.g., lose weight)', () => {
      // Start at 90kg, currently at 80kg, target 70kg
      const progress = calculateGoalProgress({
        initial_value: 90,
        current_value: 80,
        target_value: 70,
      })
      expect(progress).toBe(50) // Halfway there
    })

    it('should return 0% when at initial value for decreasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 90,
        current_value: 90,
        target_value: 70,
      })
      expect(progress).toBe(0)
    })

    it('should return 100% when at target value for decreasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 90,
        current_value: 70,
        target_value: 70,
      })
      expect(progress).toBe(100)
    })

    it('should cap at 100% when exceeding target for decreasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 90,
        current_value: 60,
        target_value: 70,
      })
      expect(progress).toBe(100)
    })

    it('should handle decimal values for decreasing goals', () => {
      const progress = calculateGoalProgress({
        initial_value: 90.5,
        current_value: 80.25,
        target_value: 70,
      })
      expect(progress).toBeCloseTo(50, 0)
    })

    it('should calculate correct progress for body fat percentage reduction', () => {
      // Start at 25% body fat, currently at 20%, target 15%
      const progress = calculateGoalProgress({
        initial_value: 25,
        current_value: 20,
        target_value: 15,
      })
      expect(progress).toBe(50) // Lost 5% out of 10% goal
    })
  })

  describe('calculateGoalProgress - Edge Cases', () => {
    it('should return 100% when initial equals target', () => {
      const progress = calculateGoalProgress({
        initial_value: 70,
        current_value: 70,
        target_value: 70,
      })
      expect(progress).toBe(100)
    })

    it('should handle negative progress (moving away from goal)', () => {
      // Increasing goal but current is less than initial
      const progress = calculateGoalProgress({
        initial_value: 50,
        current_value: 40,
        target_value: 100,
      })
      expect(progress).toBe(0) // Clamped at 0
    })

    it('should handle negative progress for decreasing goals', () => {
      // Decreasing goal but current is more than initial
      const progress = calculateGoalProgress({
        initial_value: 90,
        current_value: 95,
        target_value: 70,
      })
      expect(progress).toBe(0) // Clamped at 0
    })
  })

  describe('isGoalAchieved - Increasing Goals', () => {
    it('should mark increasing goal as achieved when current >= target', () => {
      expect(
        isGoalAchieved({
          initial_value: 50,
          current_value: 100,
          target_value: 100,
        })
      ).toBe(true)

      expect(
        isGoalAchieved({
          initial_value: 50,
          current_value: 110,
          target_value: 100,
        })
      ).toBe(true)
    })

    it('should not mark increasing goal as achieved when current < target', () => {
      expect(
        isGoalAchieved({
          initial_value: 50,
          current_value: 90,
          target_value: 100,
        })
      ).toBe(false)
    })
  })

  describe('isGoalAchieved - Decreasing Goals', () => {
    it('should mark decreasing goal as achieved when current <= target', () => {
      expect(
        isGoalAchieved({
          initial_value: 90,
          current_value: 70,
          target_value: 70,
        })
      ).toBe(true)

      expect(
        isGoalAchieved({
          initial_value: 90,
          current_value: 65,
          target_value: 70,
        })
      ).toBe(true)
    })

    it('should not mark decreasing goal as achieved when current > target', () => {
      expect(
        isGoalAchieved({
          initial_value: 90,
          current_value: 75,
          target_value: 70,
        })
      ).toBe(false)
    })
  })

  describe('getGoalDirection', () => {
    it('should identify increasing goals', () => {
      expect(
        getGoalDirection({
          initial_value: 50,
          target_value: 100,
        })
      ).toBe('increase')
    })

    it('should identify decreasing goals', () => {
      expect(
        getGoalDirection({
          initial_value: 90,
          target_value: 70,
        })
      ).toBe('decrease')
    })

    it('should handle equal values as decrease', () => {
      // When initial equals target, consider it as decrease (maintain)
      expect(
        getGoalDirection({
          initial_value: 70,
          target_value: 70,
        })
      ).toBe('decrease')
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle weight loss goal correctly', () => {
      // User starts at 95kg, wants to reach 75kg
      const goal = {
        initial_value: 95,
        current_value: 85,
        target_value: 75,
      }

      expect(calculateGoalProgress(goal)).toBe(50) // Lost 10kg out of 20kg
      expect(isGoalAchieved(goal)).toBe(false) // Not yet achieved
      expect(getGoalDirection(goal)).toBe('decrease')
    })

    it('should handle weight gain goal correctly', () => {
      // User starts at 60kg, wants to reach 75kg (muscle building)
      const goal = {
        initial_value: 60,
        current_value: 67.5,
        target_value: 75,
      }

      expect(calculateGoalProgress(goal)).toBe(50) // Gained 7.5kg out of 15kg
      expect(isGoalAchieved(goal)).toBe(false) // Not yet achieved
      expect(getGoalDirection(goal)).toBe('increase')
    })

    it('should handle workout count goal correctly', () => {
      // User wants to do 50 workouts, starting from 10
      const goal = {
        initial_value: 10,
        current_value: 30,
        target_value: 50,
      }

      expect(calculateGoalProgress(goal)).toBe(50) // 20 out of 40 workouts
      expect(isGoalAchieved(goal)).toBe(false)
      expect(getGoalDirection(goal)).toBe('increase')
    })

    it('should handle bench press strength goal correctly', () => {
      // User starts benching 60kg, wants to reach 100kg
      const goal = {
        initial_value: 60,
        current_value: 80,
        target_value: 100,
      }

      expect(calculateGoalProgress(goal)).toBe(50) // Lifted 20kg more out of 40kg goal
      expect(isGoalAchieved(goal)).toBe(false)
      expect(getGoalDirection(goal)).toBe('increase')
    })

    it('should handle running distance goal correctly', () => {
      // User ran 50km so far, wants to reach 100km
      const goal = {
        initial_value: 50,
        current_value: 75,
        target_value: 100,
      }

      expect(calculateGoalProgress(goal)).toBe(50) // Ran 25km more out of 50km goal
      expect(isGoalAchieved(goal)).toBe(false)
      expect(getGoalDirection(goal)).toBe('increase')
    })

    it('should handle body fat percentage reduction correctly', () => {
      // User starts at 25% body fat, wants to reach 15%
      const goal = {
        initial_value: 25,
        current_value: 22,
        target_value: 15,
      }

      expect(calculateGoalProgress(goal)).toBe(30) // Lost 3% out of 10%
      expect(isGoalAchieved(goal)).toBe(false)
      expect(getGoalDirection(goal)).toBe('decrease')
    })
  })

  describe('calculateGoalStatus', () => {
    describe('Completed status', () => {
      it('should return completed when goal is achieved (increasing)', () => {
        const status = calculateGoalStatus({
          initial_value: 50,
          current_value: 100,
          target_value: 100,
          target_date: '2025-12-31',
        })
        expect(status).toBe('completed')
      })

      it('should return completed when goal is achieved (decreasing)', () => {
        const status = calculateGoalStatus({
          initial_value: 90,
          current_value: 70,
          target_value: 70,
          target_date: '2025-12-31',
        })
        expect(status).toBe('completed')
      })

      it('should return completed when goal is achieved even without target date', () => {
        const status = calculateGoalStatus({
          initial_value: 50,
          current_value: 100,
          target_value: 100,
          target_date: null,
        })
        expect(status).toBe('completed')
      })
    })

    describe('Archived status', () => {
      it('should return archived when target date has passed without achievement', () => {
        // Create a date in the past
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 1)
        const pastDateStr = pastDate.toISOString().split('T')[0]

        const status = calculateGoalStatus({
          initial_value: 50,
          current_value: 75,
          target_value: 100,
          target_date: pastDateStr,
        })
        expect(status).toBe('archived')
      })

      it('should return completed even if target date passed when goal is achieved', () => {
        // Create a date in the past
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 1)
        const pastDateStr = pastDate.toISOString().split('T')[0]

        const status = calculateGoalStatus({
          initial_value: 50,
          current_value: 100,
          target_value: 100,
          target_date: pastDateStr,
        })
        expect(status).toBe('completed')
      })
    })

    describe('Active status', () => {
      it('should return active when goal is in progress with future target date', () => {
        // Create a date in the future
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        const futureDateStr = futureDate.toISOString().split('T')[0]

        const status = calculateGoalStatus({
          initial_value: 50,
          current_value: 75,
          target_value: 100,
          target_date: futureDateStr,
        })
        expect(status).toBe('active')
      })

      it('should return active when goal is in progress without target date', () => {
        const status = calculateGoalStatus({
          initial_value: 50,
          current_value: 75,
          target_value: 100,
          target_date: null,
        })
        expect(status).toBe('active')
      })

      it('should return active for today as target date', () => {
        const todayStr = new Date().toISOString().split('T')[0]

        const status = calculateGoalStatus({
          initial_value: 50,
          current_value: 75,
          target_value: 100,
          target_date: todayStr,
        })
        expect(status).toBe('active')
      })
    })
  })
})
