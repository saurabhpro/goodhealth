# Database Schema Issues Report

## Critical Issues Found

### 1. **Migration Number Conflicts** ❌

We have duplicate migration numbers which can cause confusion about execution order:

#### Conflicting Files:
```
migrations/009_add_public_workout_templates.sql
migrations/009_add_workout_plan_jobs.sql          ← CONFLICT!
migrations/009b_fix_template_rls.sql

migrations/010_add_user_profile_fields.sql
migrations/010_add_user_workout_preferences.sql   ← CONFLICT!
```

#### Root Cause:
During development, multiple features were added in parallel, resulting in duplicate migration numbers.

## Recommended Fix

### Option 1: Renumber Migrations (Recommended)
Rename files to sequential numbers:

```bash
# Current → Proposed
009_add_public_workout_templates.sql  → 009_add_public_workout_templates.sql (keep)
009b_fix_template_rls.sql             → 009b_fix_template_rls.sql (keep)
010_add_user_workout_preferences.sql  → 010_add_user_workout_preferences.sql (keep)
009_add_workout_plan_jobs.sql         → 011_add_workout_plan_jobs.sql (rename)
010_add_user_profile_fields.sql       → 012_add_user_profile_fields.sql (rename)
011_add_raw_response_to_jobs.sql      → 013_add_raw_response_to_jobs.sql (rename)
```

### Option 2: Use Timestamps (Alternative)
Could adopt timestamp-based migrations like:
- `20250121_120000_add_workout_plan_jobs.sql`
- `20250121_130000_add_user_profile_fields.sql`

## Current State Analysis

### ✅ What's Correct:

1. **TypeScript Types Match Tables**
   - All tables in migrations exist in `types/database.ts`
   - Field names and types are consistent

2. **Table Structure**
   - 12 tables total
   - All have proper RLS policies
   - Indexes are properly defined

3. **Foreign Key References**
   - All references point to correct tables
   - CASCADE behaviors properly defined

### ⚠️ What Needs Attention:

1. **Migration Numbering**
   - Need to resolve duplicate 009 and 010 numbers
   - Ensure clear execution order

2. **Migration Tracking**
   - No `_migrations` table to track what's been run
   - Supabase doesn't automatically track migration history
   - Recommend adding migration tracking

3. **Documentation**
   - Need to document which migrations have been applied in production
   - Should add migration status tracking

## Tables in Current Schema

Based on migrations, we should have:

1. **profiles** - User profiles with personalization fields (001, 010)
2. **workouts** - Workout sessions (001, 002)
3. **exercises** - Exercise details (001, 003)
4. **workout_templates** - Workout templates (001, 009)
5. **goals** - User fitness goals (001, 006)
6. **workout_selfies** - Progress photos (004)
7. **body_measurements** - Body metrics (005)
8. **workout_plans** - AI-generated plans (007)
9. **workout_plan_sessions** - Individual sessions in plans (008)
10. **user_workout_preferences** - User preferences (010)
11. **user_workout_templates** - User custom templates (010)
12. **workout_plan_generation_jobs** - Async job tracking (009, 011)

## Action Items

### Immediate (Before Next Deployment):
- [ ] Rename conflicting migration files
- [ ] Update PR #48 with corrected migration names
- [ ] Document migration order in README

### Next Steps (Optional):
- [ ] Add migration tracking table
- [ ] Create migration runner script
- [ ] Add database schema documentation

## Impact Assessment

**Risk Level**: Medium

- Migrations work correctly if run in chronological order
- TypeScript types are accurate and up-to-date
- No data loss risk
- Main issue is organizational/clarity

**Recommendation**: Fix numbering before merging PR #48 to avoid future confusion.
