# Database Migrations

## Quick Start

```bash
npx supabase db push
```

Or run via Supabase Dashboard → SQL Editor:
1. `000_consolidated_schema.sql` - Complete schema
2. `001_add_plan_start_dates.sql` - Plan start dates
3. `002_add_weekly_workout_analysis.sql` - Weekly analysis

## Schema Includes

- 11 tables with RLS policies
- Soft delete support
- Indexes and constraints
- Workout templates (pre-seeded)
- Storage policies
