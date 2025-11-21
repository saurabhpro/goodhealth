# Database Migrations

This directory contains all Supabase database migrations in chronological order.

## Migration Order

Run these migrations in order in the Supabase SQL Editor:

### 1. Initial Schema (`001_initial_schema.sql`)
**Purpose:** Creates the base database structure
- ✅ Creates `profiles` table (user information)
- ✅ Creates `workouts` table (workout sessions)
- ✅ Creates `exercises` table (individual exercises)
- ✅ Creates `workout_templates` table (reusable templates)
- ✅ Creates `goals` table (fitness goals)
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates triggers and functions

**Run this first** before using the application.

### 2. Add Effort Level (`002_add_effort_level.sql`)
**Purpose:** Adds effort level tracking to workouts
- ✅ Adds `effort_level` column to `workouts` table
- ✅ Adds constraint for values 1-6
- ✅ Adds column comment with level descriptions

**Run after:** 001_initial_schema.sql

### 3. Add Exercise Types (`003_add_exercise_types.sql`)
**Purpose:** Enables smart exercise inputs (cardio/strength/functional)
- ✅ Makes `sets` column nullable in `exercises` table
- ✅ Adds `exercise_type` column with enum constraint
- ✅ Adds cardio-specific fields:
  - `duration_minutes`
  - `distance` and `distance_unit`
  - `speed`
  - `calories`
  - `resistance_level`
  - `incline`

**Run after:** 002_add_effort_level.sql

### 10. Add User Workout Preferences (`010_add_user_workout_preferences.sql`)
**Purpose:** Adds user workout preferences and custom templates for personalized planning
- ✅ Creates `user_workout_preferences` table (exercise preferences, equipment, scheduling)
- ✅ Creates `user_workout_templates` table (user-created custom templates)
- ✅ Adds gym locations support (integrates with issue #17)
- ✅ Sets up RLS policies for both tables
- ✅ Creates indexes for query performance
- ✅ Adds triggers for updated_at timestamps

**Run after:** 009_add_public_workout_templates.sql

**Related to:** Issue #43 (AI-powered personalized workout planner), Issue #17 (Gym location management)

---

## How to Run Migrations

### In Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of the migration file
5. Paste into the editor
6. Click **Run** or press `Ctrl/Cmd + Enter`
7. Verify success (green checkmark)
8. Repeat for next migration

### Using Supabase CLI (Alternative)

```bash
# Connect to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## Verify Migrations

After running all migrations, verify in Supabase:

### Check Tables Exist
Go to **Table Editor** and verify:
- ✅ profiles
- ✅ workouts
- ✅ exercises
- ✅ workout_templates
- ✅ goals
- ✅ workout_plans
- ✅ workout_plan_sessions
- ✅ user_workout_preferences
- ✅ user_workout_templates

### Check RLS Policies
Go to **Authentication** → **Policies** and verify policies exist for all tables.

### Test in SQL Editor
```sql
-- Check workouts table has effort_level
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workouts';

-- Check exercises table has exercise_type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercises';
```

---

## Migration Best Practices

### Before Running
- ✅ Backup your database (if production)
- ✅ Test migrations in a development environment first
- ✅ Review the SQL code to understand changes

### When Running
- ✅ Run migrations in order (001, 002, 003, etc.)
- ✅ Don't skip migrations
- ✅ Check for errors after each migration
- ✅ Verify data integrity

### After Running
- ✅ Test application functionality
- ✅ Verify RLS policies work correctly
- ✅ Check that existing data is intact

---

## Creating New Migrations

When adding new database changes:

1. **Create a new file** with the next number:
   ```
   004_your_migration_name.sql
   ```

2. **Include comments** explaining the purpose:
   ```sql
   -- Migration: Add workout notes
   -- Date: 2024-XX-XX
   -- Description: Adds notes field to workouts table

   ALTER TABLE workouts ADD COLUMN notes TEXT;
   ```

3. **Update this README** with the new migration details

4. **Test thoroughly** before applying to production

---

## Rollback (If Needed)

If a migration causes issues, you may need to rollback:

### Manual Rollback
Create a rollback script that reverses the changes:

```sql
-- Rollback for 003_add_exercise_types.sql
ALTER TABLE exercises DROP COLUMN IF EXISTS exercise_type;
ALTER TABLE exercises DROP COLUMN IF EXISTS duration_minutes;
-- ... etc
```

### Using Supabase Dashboard
1. Go to **Database** → **Backups**
2. Restore from a backup before the migration

---

## Current Schema Version

**Latest Migration:** `010_add_user_workout_preferences.sql`

**Schema Version:** 1.10.0

**Last Updated:** January 21, 2025

---

## Troubleshooting

### Migration Fails with "Already Exists" Error
- The migration was already run previously
- Skip to the next migration

### RLS Policy Errors
- Ensure you're logged in as a user when testing
- Check policies in **Authentication** → **Policies**
- Verify user_id matches in your data

### Column Already Exists
- Check if a previous migration added it
- You can safely skip that part of the migration

---

## Support

For migration issues:
- Check Supabase logs in the dashboard
- Review the SQL error message carefully
- See [Supabase Docs](https://supabase.com/docs/guides/database)
- Open an issue in the project repository
