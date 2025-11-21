# Database Migrations

This directory contains the consolidated Supabase database migration for the GoodHealth app.

## 🚀 Quick Start

Use the consolidated migration script to set up your complete database in one step:

### Run `000_consolidated_schema.sql`

This single file contains the **complete, production-ready database schema** with all features.

**What's included:**
- ✅ All 11 tables with complete schema
- ✅ Soft delete support (`deleted_at` columns)
- ✅ Performance-optimized RLS policies
- ✅ All indexes and constraints
- ✅ Triggers and helper functions
- ✅ Storage policies for workout photos
- ✅ 10 research-backed public workout templates (pre-seeded)
- ✅ Custom types and enums

---

## 📋 How to Deploy

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `000_consolidated_schema.sql`
5. Paste and click **Run** (or press `Ctrl/Cmd + Enter`)
6. ✅ Done! Your database is fully configured

### Option B: Supabase CLI

```bash
# Connect to your project
supabase link --project-ref your-project-ref

# Run the consolidated migration
supabase db execute < migrations/000_consolidated_schema.sql
```

### Post-Setup: Create Storage Bucket

**Manual step required:**
1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name: `workout-selfies`
4. Set to **Private** (RLS policies already configured in migration)
5. Click **Create**

---

## 📊 Database Schema

After deployment, you'll have these tables:

### Core User Data
- **`profiles`** - User profiles (name, bio, fitness level, medical info, demographics)
- **`goals`** - Fitness goals with progress tracking (initial → current → target values)

### Workout Tracking
- **`workouts`** - Workout sessions with effort level (1-6 scale)
- **`exercises`** - Individual exercises (strength/cardio/functional with specific metrics)
- **`workout_selfies`** - Workout photos (max 1 per workout)
- **`body_measurements`** - Body metrics (30+ measurements: weight, body fat, circumferences, etc.)

### Workout Planning
- **`workout_templates`** - Reusable templates (system + user-created)
  - 10 pre-seeded public templates (StrongLifts 5x5, PPL split, HIIT, etc.)
  - User custom templates with tags, difficulty, equipment requirements
- **`workout_plans`** - AI-generated workout plans (draft/active/completed/archived)
- **`workout_plan_sessions`** - Individual sessions within plans (scheduled/completed/skipped)

### AI & Personalization
- **`user_workout_preferences`** - User preferences (equipment, gym access, scheduling, exercise preferences)
- **`workout_plan_generation_jobs`** - AI generation job tracking (pending/processing/completed/failed)

---

## ✅ Verify Deployment

After running the migration, verify everything is set up correctly:

### 1. Check Tables
Go to **Table Editor** and verify all 11 tables exist:
- ✅ profiles
- ✅ goals
- ✅ workouts
- ✅ exercises
- ✅ workout_selfies
- ✅ body_measurements
- ✅ workout_templates
- ✅ workout_plans
- ✅ workout_plan_sessions
- ✅ user_workout_preferences
- ✅ workout_plan_generation_jobs

### 2. Check RLS Policies
Go to **Authentication** → **Policies** and verify policies exist for all tables.

### 3. Check Public Templates
Run in SQL Editor:
```sql
-- Should return 10 public templates
SELECT id, name, workout_type, difficulty_level
FROM workout_templates
WHERE is_public = TRUE
ORDER BY name;
```

### 4. Verify Soft Delete Support
Run in SQL Editor:
```sql
-- Should show deleted_at column for 8 tables
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'deleted_at'
  AND table_schema = 'public'
ORDER BY table_name;
```

---

## 🛠️ Schema Design Details

### Key Features

#### 1. Soft Deletes
All major tables include `deleted_at TIMESTAMPTZ`:
- `NULL` = active record
- Set to `NOW()` when "deleted"
- Enables data recovery and audit trails

**Important:** Always filter active records in queries:
```sql
SELECT * FROM workouts WHERE deleted_at IS NULL;
```

#### 2. Performance-Optimized RLS
All RLS policies use the `(SELECT auth.uid())` pattern for better performance:
```sql
-- ✅ Optimized (evaluated once per query)
USING ((SELECT auth.uid()) = user_id)

-- ❌ Not optimized (evaluated per row)
USING (auth.uid() = user_id)
```

Reference: [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

#### 3. Unified Template System
Single `workout_templates` table handles both:
- **System templates:** `is_public = TRUE`, `user_id = NULL`
- **User templates:** `is_public = FALSE`, `user_id` set

#### 4. Flexible Scheduling
`workout_plan_sessions.day_of_week` represents the **day of the week** (0=Sunday, 6=Saturday), NOT the sequence number. This enables flexible scheduling and rest day management.

---

## 🎯 Pre-Seeded Workout Templates

The database comes with 10 research-backed workout templates:

### Strength Training
1. **StrongLifts 5x5 - Workout A** (Intermediate) - Squat, Bench Press, Barbell Row
2. **StrongLifts 5x5 - Workout B** (Intermediate) - Squat, Overhead Press, Deadlift
3. **PPL - Push Day** (Intermediate) - Chest, Shoulders, Triceps
4. **PPL - Pull Day** (Intermediate) - Back, Biceps, Rear Delts
5. **PPL - Leg Day** (Intermediate) - Quads, Hamstrings, Glutes, Calves

### Cardio & HIIT
6. **HIIT Circuit - Fat Burner** (Beginner) - Bodyweight circuit
7. **HIIT Cardio - Running Intervals** (Intermediate) - Sprint intervals

### Beginner & Functional
8. **Full Body Beginner** (Beginner) - Basic compound movements
9. **Metabolic Conditioning** (Advanced) - High-intensity circuit
10. **Core Strength & Stability** (Intermediate) - Core training

---

## 🐛 Troubleshooting

### "Relation already exists" Error
You're running the migration on a database that already has tables. Either drop the existing schema or manually remove conflicting tables first.

### Storage Bucket Not Found
Create the `workout-selfies` bucket manually in the Storage section (see Post-Setup instructions above).

### RLS Policy Blocks Queries
Ensure you're authenticated (`SELECT auth.uid()` should return a UUID) and querying your own data.

### No Public Templates
Re-run just the INSERT section from the migration file (search for "SEED DATA: Public Workout Templates").

### Soft Delete Confusion
Always add `WHERE deleted_at IS NULL` filter to show only active records.

---

## 🔄 Adding New Changes

When you need to make schema changes:

1. **Create a new migration file:** `001_add_feature_name.sql`

2. **Write safe migration SQL:**
   ```sql
   -- Migration: Add workout notes field
   -- Date: 2025-11-XX

   BEGIN;
   ALTER TABLE IF EXISTS workouts ADD COLUMN IF NOT EXISTS notes TEXT;
   COMMIT;
   ```

3. **Update consolidated schema:** After testing, update `000_consolidated_schema.sql` to include your changes

4. **Test thoroughly** in development before production

---

## 🔙 Rollback

If you need to rollback:

### Using Supabase Backups
1. Go to **Database** → **Backups**
2. Select a backup from before the migration
3. Click **Restore**

### Manual Rollback
Create a rollback SQL file to reverse changes. Always test in development first.

---

## 📈 Schema Version

**Version:** 2.0.0 (Consolidated)

**Last Updated:** November 21, 2025

**Features:**
- Complete workout tracking system
- AI-powered workout plan generation
- Body measurement tracking
- Photo storage integration
- Soft delete support
- Performance-optimized RLS policies
- Pre-seeded workout template library

---

## 📚 Resources

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## 💬 Support

For migration issues, check Supabase logs, review error messages, and open an issue with full details if needed
