import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];

/**
 * Calculate the progress percentage for a goal.
 */
export function calculateGoalProgress(goal: Goal): number {
  const { current_value, initial_value, target_value } = goal;

  if (current_value === null || target_value === null) {
    return 0;
  }

  const initial = initial_value ?? current_value;
  const totalChange = target_value - initial;

  if (totalChange === 0) {
    return current_value === target_value ? 100 : 0;
  }

  const currentChange = current_value - initial;
  const progress = (currentChange / totalChange) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, progress));
}

/**
 * Get the direction indicator for a goal.
 * Returns "up" if target is higher than initial, "down" if lower.
 */
export function getGoalDirection(goal: Goal): "up" | "down" | "neutral" {
  const { initial_value, target_value, current_value } = goal;

  if (target_value === null) {
    return "neutral";
  }

  const initial = initial_value ?? current_value ?? 0;

  if (target_value > initial) {
    return "up";
  } else if (target_value < initial) {
    return "down";
  }

  return "neutral";
}
