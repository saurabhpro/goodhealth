/**
 * Unit tests for workout plan start date calculations
 * Tests actual_date calculations based on start_date, week_number, and day_of_week
 */

import { describe, it, expect } from '@jest/globals'

/**
 * Calculate the actual calendar date for a workout session
 * (Extracted from job-processor.ts for testing)
 */
function calculateActualDate(startDateStr: string, weekNumber: number, dayOfWeek: number): string {
  const startDate = new Date(startDateStr)

  // Get the day of week of the start date (0=Sunday, 6=Saturday)
  const startDayOfWeek = startDate.getDay()

  // Calculate days offset from start date
  // First, calculate how many days until the target day of week in week 1
  let daysOffset = dayOfWeek - startDayOfWeek

  // If the target day is before the start day in the same week, it means it's in the next week
  if (daysOffset < 0) {
    daysOffset += 7
  }

  // Add weeks offset (week 1 = 0 additional weeks, week 2 = 7 days, etc.)
  daysOffset += (weekNumber - 1) * 7

  // Calculate the actual date
  const actualDate = new Date(startDate)
  actualDate.setDate(startDate.getDate() + daysOffset)

  // Return as ISO date string (YYYY-MM-DD)
  return actualDate.toISOString().split('T')[0]
}

describe('Workout Plan Start Date Calculations', () => {
  describe('calculateActualDate', () => {
    describe('Monday start (traditional)', () => {
      const startDate = '2024-12-02' // Monday, Dec 2, 2024

      it('should schedule Monday workout on same day for week 1', () => {
        const result = calculateActualDate(startDate, 1, 1) // Monday (day 1)
        expect(result).toBe('2024-12-02') // Same Monday
      })

      it('should schedule Wednesday workout 2 days later for week 1', () => {
        const result = calculateActualDate(startDate, 1, 3) // Wednesday (day 3)
        expect(result).toBe('2024-12-04') // Wednesday, Dec 4
      })

      it('should schedule Friday workout 4 days later for week 1', () => {
        const result = calculateActualDate(startDate, 1, 5) // Friday (day 5)
        expect(result).toBe('2024-12-06') // Friday, Dec 6
      })

      it('should schedule Saturday workout 5 days later for week 1', () => {
        const result = calculateActualDate(startDate, 1, 6) // Saturday (day 6)
        expect(result).toBe('2024-12-07') // Saturday, Dec 7
      })

      it('should schedule Sunday workout 5 days later for week 1', () => {
        const result = calculateActualDate(startDate, 1, 0) // Sunday (day 0)
        expect(result).toBe('2024-12-08') // Sunday, Dec 8 (next week)
      })

      it('should schedule Tuesday workout 1 day later for week 1', () => {
        const result = calculateActualDate(startDate, 1, 2) // Tuesday (day 2)
        expect(result).toBe('2024-12-03') // Tuesday, Dec 3
      })
    })

    describe('Thursday start (flexible)', () => {
      const startDate = '2024-12-05' // Thursday, Dec 5, 2024

      it('should schedule Monday workout in next week', () => {
        const result = calculateActualDate(startDate, 1, 1) // Monday (day 1)
        expect(result).toBe('2024-12-09') // Monday, Dec 9
      })

      it('should schedule Wednesday workout in next week', () => {
        const result = calculateActualDate(startDate, 1, 3) // Wednesday (day 3)
        expect(result).toBe('2024-12-11') // Wednesday, Dec 11
      })

      it('should schedule Friday workout 1 day later', () => {
        const result = calculateActualDate(startDate, 1, 5) // Friday (day 5)
        expect(result).toBe('2024-12-06') // Friday, Dec 6
      })

      it('should schedule Saturday workout 2 days later', () => {
        const result = calculateActualDate(startDate, 1, 6) // Saturday (day 6)
        expect(result).toBe('2024-12-07') // Saturday, Dec 7
      })

      it('should schedule Thursday workout on same day', () => {
        const result = calculateActualDate(startDate, 1, 4) // Thursday (day 4)
        expect(result).toBe('2024-12-05') // Same Thursday
      })
    })

    describe('Sunday start', () => {
      const startDate = '2024-12-01' // Sunday, Dec 1, 2024

      it('should schedule Sunday workout on same day for week 1', () => {
        const result = calculateActualDate(startDate, 1, 0) // Sunday (day 0)
        expect(result).toBe('2024-12-01') // Same Sunday
      })

      it('should schedule Monday workout 1 day later', () => {
        const result = calculateActualDate(startDate, 1, 1) // Monday (day 1)
        expect(result).toBe('2024-12-02') // Monday, Dec 2
      })

      it('should schedule Wednesday workout 3 days later', () => {
        const result = calculateActualDate(startDate, 1, 3) // Wednesday (day 3)
        expect(result).toBe('2024-12-04') // Wednesday, Dec 4
      })

      it('should schedule Friday workout 5 days later', () => {
        const result = calculateActualDate(startDate, 1, 5) // Friday (day 5)
        expect(result).toBe('2024-12-06') // Friday, Dec 6
      })

      it('should schedule Saturday workout 6 days later', () => {
        const result = calculateActualDate(startDate, 1, 6) // Saturday (day 6)
        expect(result).toBe('2024-12-07') // Saturday, Dec 7
      })
    })

    describe('Week progression', () => {
      const startDate = '2024-12-02' // Monday, Dec 2, 2024

      it('should calculate week 2 Monday correctly', () => {
        const result = calculateActualDate(startDate, 2, 1) // Week 2, Monday
        expect(result).toBe('2024-12-09') // Monday, Dec 9 (7 days later)
      })

      it('should calculate week 3 Monday correctly', () => {
        const result = calculateActualDate(startDate, 3, 1) // Week 3, Monday
        expect(result).toBe('2024-12-16') // Monday, Dec 16 (14 days later)
      })

      it('should calculate week 4 Monday correctly', () => {
        const result = calculateActualDate(startDate, 4, 1) // Week 4, Monday
        expect(result).toBe('2024-12-23') // Monday, Dec 23 (21 days later)
      })

      it('should calculate week 2 Friday correctly', () => {
        const result = calculateActualDate(startDate, 2, 5) // Week 2, Friday
        expect(result).toBe('2024-12-13') // Friday, Dec 13 (11 days later)
      })

      it('should calculate week 3 Wednesday correctly', () => {
        const result = calculateActualDate(startDate, 3, 3) // Week 3, Wednesday
        expect(result).toBe('2024-12-18') // Wednesday, Dec 18 (16 days later)
      })
    })

    describe('Saturday start edge cases', () => {
      const startDate = '2024-12-07' // Saturday, Dec 7, 2024

      it('should schedule Saturday workout on same day', () => {
        const result = calculateActualDate(startDate, 1, 6) // Saturday (day 6)
        expect(result).toBe('2024-12-07') // Same Saturday
      })

      it('should schedule Sunday workout 1 day later', () => {
        const result = calculateActualDate(startDate, 1, 0) // Sunday (day 0)
        expect(result).toBe('2024-12-08') // Sunday, Dec 8
      })

      it('should schedule Monday workout 2 days later', () => {
        const result = calculateActualDate(startDate, 1, 1) // Monday (day 1)
        expect(result).toBe('2024-12-09') // Monday, Dec 9
      })

      it('should schedule Friday workout 6 days later', () => {
        const result = calculateActualDate(startDate, 1, 5) // Friday (day 5)
        expect(result).toBe('2024-12-13') // Friday, Dec 13
      })
    })

    describe('Real-world 4-week plan examples', () => {
      it('should handle 4 workouts/week starting Monday', () => {
        const startDate = '2024-12-02' // Monday
        const schedule = [
          { week: 1, day: 1, expected: '2024-12-02' }, // Mon
          { week: 1, day: 3, expected: '2024-12-04' }, // Wed
          { week: 1, day: 5, expected: '2024-12-06' }, // Fri
          { week: 1, day: 6, expected: '2024-12-07' }, // Sat
          { week: 2, day: 1, expected: '2024-12-09' }, // Mon
          { week: 2, day: 3, expected: '2024-12-11' }, // Wed
          { week: 2, day: 5, expected: '2024-12-13' }, // Fri
          { week: 2, day: 6, expected: '2024-12-14' }, // Sat
        ]

        schedule.forEach(({ week, day, expected }) => {
          const result = calculateActualDate(startDate, week, day)
          expect(result).toBe(expected)
        })
      })

      it('should handle 4 workouts/week starting Thursday', () => {
        const startDate = '2024-12-05' // Thursday
        const schedule = [
          { week: 1, day: 1, expected: '2024-12-09' }, // Mon (next week)
          { week: 1, day: 3, expected: '2024-12-11' }, // Wed (next week)
          { week: 1, day: 5, expected: '2024-12-06' }, // Fri (this week)
          { week: 1, day: 6, expected: '2024-12-07' }, // Sat (this week)
          { week: 2, day: 1, expected: '2024-12-16' }, // Mon
          { week: 2, day: 3, expected: '2024-12-18' }, // Wed
        ]

        schedule.forEach(({ week, day, expected }) => {
          const result = calculateActualDate(startDate, week, day)
          expect(result).toBe(expected)
        })
      })

      it('should handle 3 workouts/week with rest days', () => {
        const startDate = '2024-12-02' // Monday
        const schedule = [
          { week: 1, day: 1, expected: '2024-12-02' }, // Mon
          { week: 1, day: 3, expected: '2024-12-04' }, // Wed (rest Tue)
          { week: 1, day: 5, expected: '2024-12-06' }, // Fri (rest Thu)
          // Rest: Sat, Sun
          { week: 2, day: 1, expected: '2024-12-09' }, // Mon
          { week: 2, day: 3, expected: '2024-12-11' }, // Wed
          { week: 2, day: 5, expected: '2024-12-13' }, // Fri
        ]

        schedule.forEach(({ week, day, expected }) => {
          const result = calculateActualDate(startDate, week, day)
          expect(result).toBe(expected)
        })
      })
    })

    describe('Month boundary handling', () => {
      it('should handle dates crossing month boundaries', () => {
        const startDate = '2024-11-28' // Thursday, Nov 28, 2024

        // Week 1 workouts that cross into December
        expect(calculateActualDate(startDate, 1, 1)).toBe('2024-12-02') // Mon, Dec 2
        expect(calculateActualDate(startDate, 1, 5)).toBe('2024-11-29') // Fri, Nov 29
        expect(calculateActualDate(startDate, 1, 6)).toBe('2024-11-30') // Sat, Nov 30
      })

      it('should handle year boundary correctly', () => {
        const startDate = '2024-12-30' // Monday, Dec 30, 2024

        expect(calculateActualDate(startDate, 1, 1)).toBe('2024-12-30') // Mon, Dec 30
        expect(calculateActualDate(startDate, 1, 3)).toBe('2025-01-01') // Wed, Jan 1, 2025
        expect(calculateActualDate(startDate, 2, 1)).toBe('2025-01-06') // Mon, Jan 6, 2025
      })
    })

    describe('All days of the week', () => {
      const startDate = '2024-12-01' // Sunday, Dec 1, 2024

      it('should handle all 7 days of the week', () => {
        const days = [
          { day: 0, name: 'Sunday', expected: '2024-12-01' },
          { day: 1, name: 'Monday', expected: '2024-12-02' },
          { day: 2, name: 'Tuesday', expected: '2024-12-03' },
          { day: 3, name: 'Wednesday', expected: '2024-12-04' },
          { day: 4, name: 'Thursday', expected: '2024-12-05' },
          { day: 5, name: 'Friday', expected: '2024-12-06' },
          { day: 6, name: 'Saturday', expected: '2024-12-07' },
        ]

        days.forEach(({ day, name, expected }) => {
          const result = calculateActualDate(startDate, 1, day)
          expect(result).toBe(expected) // , `Failed for ${name}`
        })
      })
    })

    describe('12-week plan', () => {
      const startDate = '2024-01-01' // Monday, Jan 1, 2024

      it('should calculate week 12 correctly', () => {
        // Week 12 starts 77 days after start (11 weeks * 7 days)
        const result = calculateActualDate(startDate, 12, 1) // Week 12, Monday
        expect(result).toBe('2024-03-18') // Monday, Mar 18, 2024
      })

      it('should calculate all weeks correctly', () => {
        for (let week = 1; week <= 12; week++) {
          const result = calculateActualDate(startDate, week, 1) // Each Monday
          const expected = new Date(startDate)
          expected.setDate(expected.getDate() + (week - 1) * 7)
          expect(result).toBe(expected.toISOString().split('T')[0])
        }
      })
    })
  })

  describe('Day of week constants', () => {
    it('should use correct day of week mapping', () => {
      // Verify our understanding matches JavaScript Date.getDay()
      const referenceDate = new Date('2024-12-01') // Known Sunday
      expect(referenceDate.getDay()).toBe(0) // Sunday = 0

      const monday = new Date('2024-12-02')
      expect(monday.getDay()).toBe(1) // Monday = 1

      const tuesday = new Date('2024-12-03')
      expect(tuesday.getDay()).toBe(2) // Tuesday = 2

      const wednesday = new Date('2024-12-04')
      expect(wednesday.getDay()).toBe(3) // Wednesday = 3

      const thursday = new Date('2024-12-05')
      expect(thursday.getDay()).toBe(4) // Thursday = 4

      const friday = new Date('2024-12-06')
      expect(friday.getDay()).toBe(5) // Friday = 5

      const saturday = new Date('2024-12-07')
      expect(saturday.getDay()).toBe(6) // Saturday = 6
    })
  })
})
