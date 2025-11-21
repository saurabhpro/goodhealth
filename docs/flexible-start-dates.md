# Flexible Start Dates for Workout Plans

## Overview

This feature allows users to choose when they want to start their workout plan, rather than being locked into a Monday-Sunday weekly schedule. The system now supports starting a plan on any day of the week.

## Key Changes

### 1. Database Schema Updates

#### `workout_plans` table
- **Added**: `start_date DATE` - Optional field to specify when the plan should start
- **Index**: `idx_workout_plans_start_date` for efficient date-based queries

#### `workout_plan_sessions` table
- **Added**: `actual_date DATE` - The calculated calendar date for each workout session
- **Index**: `idx_workout_plan_sessions_actual_date` for efficient date-based queries

### 2. Date Calculation Logic

The system uses the `day_of_week` field (0=Sunday through 6=Saturday) to calculate actual calendar dates:

```typescript
function calculateActualDate(startDate: string, weekNumber: number, dayOfWeek: number): string {
  // Example: If plan starts on Thursday Dec 5, 2024
  // and a workout is scheduled for day=1 (Monday), week 1
  // actual_date = Monday, Dec 9, 2024
}
```

**Formula**:
1. Find the first occurrence of `dayOfWeek` on or after `startDate`
2. Add `(weekNumber - 1) * 7` days for subsequent weeks

### 3. User Interface

**New Field**: Start Date picker in the "Configure Plan" step
- Optional field (can be left empty to schedule later)
- Date validation (cannot be in the past)
- Friendly display in the review step showing the full date with day name

### 4. API Changes

**Endpoint**: `POST /api/workout-plans/generate`

**New Parameter**:
```json
{
  "startDate": "2024-12-05" // Optional ISO date string
}
```

**Validation**:
- Date format validation
- Past date prevention
- Proper error responses

### 5. AI Prompt Enhancements

The AI now receives clearer instructions about the `day` field:
- Explicitly states that `day` represents day of the week (0-6), not a sequence number
- Explains that users can start on any date
- Provides concrete examples (e.g., "starting on Thursday Dec 5")
- Reinforces the need for rest days between workouts

## Example Use Cases

### Use Case 1: Monday Start (Traditional)
- User selects start date: **Monday, Dec 2, 2024**
- AI schedules workouts on days: 1 (Mon), 3 (Wed), 5 (Fri), 6 (Sat)
- Actual dates: Dec 2, Dec 4, Dec 6, Dec 7

### Use Case 2: Thursday Start (Flexible)
- User selects start date: **Thursday, Dec 5, 2024**
- AI schedules workouts on days: 1 (Mon), 3 (Wed), 5 (Fri), 6 (Sat)
- Actual dates: Dec 9 (Mon), Dec 11 (Wed), Dec 13 (Fri), Dec 14 (Sat)

### Use Case 3: No Start Date (Schedule Later)
- User leaves start date empty
- Plan is created with `start_date = NULL`
- Sessions have `actual_date = NULL`
- User can set start date later (future feature)

## Benefits

1. **Flexibility**: Users can start their plan whenever it's convenient
2. **Real-world alignment**: Not everyone starts working out on a Monday
3. **Better adherence**: Start when you're ready, not when the calendar dictates
4. **Calendar integration**: Actual dates make it easier to sync with calendars
5. **Scheduling logic**: Day-of-week pattern remains consistent regardless of start date

## Technical Details

### Day of Week Mapping
```
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

### Database Migrations

**Migration 001**: `001_add_plan_start_dates.sql`
- Adds `start_date` to `workout_plans`
- Adds `actual_date` to `workout_plan_sessions`
- Creates indexes for efficient queries

**Consolidated Schema**: Updated `000_consolidated_schema.sql`
- Includes all new fields and indexes
- Ready for fresh database deployments

## Future Enhancements

1. **Update Start Date**: Allow users to reschedule plans by changing start date
2. **Calendar View**: Display sessions on an actual calendar
3. **Reminders**: Send notifications based on actual dates
4. **Rescheduling**: Move individual sessions to different dates
5. **Completion Tracking**: Track adherence based on actual dates vs. completed dates

## Migration Guide

### For Existing Databases
Run migration `001_add_plan_start_dates.sql`:
```bash
supabase db execute < migrations/001_add_plan_start_dates.sql
```

### For New Databases
Use the consolidated schema `000_consolidated_schema.sql` which includes all changes.

### Backward Compatibility
- Existing plans will have `start_date = NULL` (not scheduled)
- Existing sessions will have `actual_date = NULL`
- All existing functionality continues to work
- Users can optionally set start dates for existing plans (future feature)

## Testing

### Manual Testing Checklist
- [ ] Create plan with start date (Monday)
- [ ] Create plan with start date (Thursday)
- [ ] Create plan without start date
- [ ] Verify actual dates are calculated correctly
- [ ] Verify past dates are rejected
- [ ] Verify invalid date formats are rejected
- [ ] Check AI generates appropriate day-of-week schedules

### Example Test Cases

**Test 1: Monday Start, 4 workouts/week**
```
Start: 2024-12-02 (Monday)
AI schedule: day 1, 3, 5, 6
Expected dates: Dec 2 (Mon), Dec 4 (Wed), Dec 6 (Fri), Dec 7 (Sat)
```

**Test 2: Thursday Start, 4 workouts/week**
```
Start: 2024-12-05 (Thursday)
AI schedule: day 1, 3, 5, 6
Expected dates: Dec 9 (Mon), Dec 11 (Wed), Dec 13 (Fri), Dec 14 (Sat)
```

**Test 3: Sunday Start, Week 2 calculation**
```
Start: 2024-12-01 (Sunday)
AI schedule for week 2: day 1 (Monday)
Expected date: Dec 9 (Monday) = Dec 2 + 7 days
```

## Code References

- **UI**: [app/workout-plans/new/page.tsx](../app/workout-plans/new/page.tsx)
- **API**: [app/api/workout-plans/generate/route.ts](../app/api/workout-plans/generate/route.ts)
- **Job Processor**: [lib/workout-plans/job-processor.ts](../lib/workout-plans/job-processor.ts)
- **AI Generator**: [lib/workout-plans/ai-generator.ts](../lib/workout-plans/ai-generator.ts)
- **Database Schema**: [migrations/000_consolidated_schema.sql](../migrations/000_consolidated_schema.sql)

## Summary

This feature transforms workout plans from rigid weekly schedules to flexible, user-centric schedules that can start on any day. The implementation maintains the logical structure of day-of-week patterns while calculating actual calendar dates for better real-world usability.
