/**
 * Goal progress calculation utilities
 * Supports bidirectional progress tracking (increase and decrease)
 */

export interface GoalProgress {
  initial_value: number
  current_value: number
  target_value: number
}

/**
 * Calculates the progress percentage for a goal.
 * Handles both increasing goals (e.g., run more km) and decreasing goals (e.g., lose weight).
 *
 * @param goal - Goal with initial_value, current_value, and target_value
 * @returns Progress percentage (0-100)
 *
 * @example
 * // Increasing goal: Start at 50kg bench press, currently at 75kg, target 100kg
 * calculateGoalProgress({ initial_value: 50, current_value: 75, target_value: 100 })
 * // Returns: 50 (halfway there)
 *
 * @example
 * // Decreasing goal: Start at 90kg weight, currently at 80kg, target 70kg
 * calculateGoalProgress({ initial_value: 90, current_value: 80, target_value: 70 })
 * // Returns: 50 (halfway there)
 */
export function calculateGoalProgress(goal: GoalProgress): number {
  const { initial_value, current_value, target_value } = goal

  // Handle edge case: already at target
  if (current_value === target_value) {
    return 100
  }

  // Handle edge case: initial equals target (no progress possible)
  if (initial_value === target_value) {
    return 100
  }

  const totalDistance = Math.abs(target_value - initial_value)

  // Determine if this is an increasing or decreasing goal
  const isIncreasing = target_value > initial_value

  if (isIncreasing) {
    // For increasing goals: progress when current > initial
    // Return 0 if moving in wrong direction (current < initial)
    if (current_value < initial_value) {
      return 0
    }
    const currentDistance = current_value - initial_value
    const progress = (currentDistance / totalDistance) * 100
    return Math.min(progress, 100) // Cap at 100
  } else {
    // For decreasing goals: progress when current < initial
    // Return 0 if moving in wrong direction (current > initial)
    if (current_value > initial_value) {
      return 0
    }
    const currentDistance = initial_value - current_value
    const progress = (currentDistance / totalDistance) * 100
    return Math.min(progress, 100) // Cap at 100
  }
}

/**
 * Checks if a goal has been achieved.
 * For increasing goals: current >= target
 * For decreasing goals: current <= target
 *
 * @param goal - Goal with initial_value, current_value, and target_value
 * @returns true if goal is achieved, false otherwise
 *
 * @example
 * // Increasing goal: achieved when current reaches or exceeds target
 * isGoalAchieved({ initial_value: 50, current_value: 100, target_value: 100 })
 * // Returns: true
 *
 * @example
 * // Decreasing goal: achieved when current reaches or goes below target
 * isGoalAchieved({ initial_value: 90, current_value: 70, target_value: 70 })
 * // Returns: true
 */
export function isGoalAchieved(goal: GoalProgress): boolean {
  const { initial_value, current_value, target_value } = goal

  // Determine direction
  const isIncreasing = target_value > initial_value

  if (isIncreasing) {
    return current_value >= target_value
  } else {
    return current_value <= target_value
  }
}

/**
 * Gets the direction of a goal (increase or decrease).
 *
 * @param goal - Goal with initial_value and target_value
 * @returns 'increase' | 'decrease'
 */
export function getGoalDirection(goal: Pick<GoalProgress, 'initial_value' | 'target_value'>): 'increase' | 'decrease' {
  return goal.target_value > goal.initial_value ? 'increase' : 'decrease'
}
