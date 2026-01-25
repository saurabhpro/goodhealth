/**
 * Unit tests for goal progress calculation
 */

import { calculateGoalProgress, getGoalDirection } from "@/lib/goals/progress";
import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];

const createMockGoal = (
  overrides: Partial<Goal> = {}
): Goal => ({
  id: "goal-123",
  user_id: "user-456",
  title: "Test Goal",
  description: null,
  initial_value: 0,
  current_value: 0,
  target_value: 100,
  unit: "kg",
  target_date: null,
  achieved: false,
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides,
});

describe("Goal Progress Tracking", () => {
  describe("calculateGoalProgress - Increasing Goals", () => {
    it("should calculate progress for increasing goals (e.g., lift more weight)", () => {
      const goal = createMockGoal({
        initial_value: 50,
        current_value: 75,
        target_value: 100,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(50); // Halfway there
    });

    it("should return 0% when at initial value for increasing goals", () => {
      const goal = createMockGoal({
        initial_value: 50,
        current_value: 50,
        target_value: 100,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(0);
    });

    it("should return 100% when at target value for increasing goals", () => {
      const goal = createMockGoal({
        initial_value: 50,
        current_value: 100,
        target_value: 100,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(100);
    });

    it("should cap progress at 100% when exceeding target", () => {
      const goal = createMockGoal({
        initial_value: 50,
        current_value: 120,
        target_value: 100,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(100);
    });
  });

  describe("calculateGoalProgress - Decreasing Goals", () => {
    it("should calculate progress for decreasing goals (e.g., lose weight)", () => {
      const goal = createMockGoal({
        initial_value: 100,
        current_value: 75,
        target_value: 50,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(50); // Halfway there
    });

    it("should return 0% when at initial value for decreasing goals", () => {
      const goal = createMockGoal({
        initial_value: 100,
        current_value: 100,
        target_value: 50,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(0);
    });

    it("should return 100% when at target for decreasing goals", () => {
      const goal = createMockGoal({
        initial_value: 100,
        current_value: 50,
        target_value: 50,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(100);
    });
  });

  describe("calculateGoalProgress - Edge Cases", () => {
    it("should handle null current_value", () => {
      const goal = createMockGoal({
        initial_value: 0,
        current_value: null,
        target_value: 100,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(0);
    });

    it("should handle null target_value", () => {
      const goal = createMockGoal({
        initial_value: 0,
        current_value: 50,
        target_value: null,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(0);
    });

    it("should handle same initial and target value", () => {
      const goal = createMockGoal({
        initial_value: 100,
        current_value: 100,
        target_value: 100,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(100);
    });

    it("should use current_value as initial if initial_value is null", () => {
      const goal = createMockGoal({
        initial_value: null,
        current_value: 50,
        target_value: 100,
      });
      const progress = calculateGoalProgress(goal);
      expect(progress).toBe(0); // No progress from current to target yet
    });
  });

  describe("getGoalDirection", () => {
    it('should return "up" for increasing goals', () => {
      const goal = createMockGoal({
        initial_value: 50,
        target_value: 100,
      });
      expect(getGoalDirection(goal)).toBe("up");
    });

    it('should return "down" for decreasing goals', () => {
      const goal = createMockGoal({
        initial_value: 100,
        target_value: 50,
      });
      expect(getGoalDirection(goal)).toBe("down");
    });

    it('should return "neutral" when target equals initial', () => {
      const goal = createMockGoal({
        initial_value: 100,
        target_value: 100,
      });
      expect(getGoalDirection(goal)).toBe("neutral");
    });

    it('should return "neutral" when target is null', () => {
      const goal = createMockGoal({
        initial_value: 100,
        target_value: null,
      });
      expect(getGoalDirection(goal)).toBe("neutral");
    });

    it("should use current_value when initial_value is null", () => {
      const goal = createMockGoal({
        initial_value: null,
        current_value: 50,
        target_value: 100,
      });
      expect(getGoalDirection(goal)).toBe("up");
    });
  });
});
