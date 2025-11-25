#!/bin/bash

# Script to apply migration 005 - Fix handle_new_user trigger
# Usage: ./scripts/apply-migration-005.sh

set -e

echo "🔧 Applying Migration 005: Fix handle_new_user Trigger"
echo "=================================================="
echo

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo
  echo "Please set it using:"
  echo "  export DATABASE_URL='your-database-url'"
  echo
  echo "Or use Supabase CLI:"
  echo "  npx supabase db push"
  exit 1
fi

# Confirm before proceeding
read -p "⚠️  This will modify the database trigger. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted"
  exit 1
fi

echo "📥 Applying migration..."
psql "$DATABASE_URL" -f migrations/005_fix_handle_new_user_trigger.sql

echo
echo "✅ Migration applied successfully!"
echo
echo "🧪 To verify, run:"
echo "  psql \$DATABASE_URL -c \"SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';\""
echo
echo "🔍 To test OAuth:"
echo "  1. Clear your browser cookies for the app"
echo "  2. Try signing in with Google"
echo "  3. Check the logs for any errors"
