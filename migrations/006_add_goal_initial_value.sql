-- Add initial_value field to goals table to support bidirectional progress tracking
-- This allows us to calculate accurate progress for goals where:
-- 1. You want to INCREASE a value (e.g., run more km, lift heavier)
-- 2. You want to DECREASE a value (e.g., lose weight, reduce body fat)

ALTER TABLE goals ADD COLUMN IF NOT EXISTS initial_value DECIMAL(10, 2);

-- For existing goals without initial_value, set it to current_value
-- This assumes that current_value was the starting point
UPDATE goals
SET initial_value = current_value
WHERE initial_value IS NULL;

-- Make initial_value NOT NULL after backfilling
ALTER TABLE goals ALTER COLUMN initial_value SET NOT NULL;

-- Add a default value for new records
ALTER TABLE goals ALTER COLUMN initial_value SET DEFAULT 0;
