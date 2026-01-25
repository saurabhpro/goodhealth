/**
 * Unit tests for goal actions
 */

import {
  createGoal,
  getGoals,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
} from "@/lib/goals/actions";
import * as apiClient from "@/lib/api/client";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/api/client", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

const mockApiGet = apiClient.apiGet as jest.MockedFunction<
  typeof apiClient.apiGet
>;
const mockApiPost = apiClient.apiPost as jest.MockedFunction<
  typeof apiClient.apiPost
>;
const mockApiPut = apiClient.apiPut as jest.MockedFunction<
  typeof apiClient.apiPut
>;
const mockApiDelete = apiClient.apiDelete as jest.MockedFunction<
  typeof apiClient.apiDelete
>;

describe("Goal Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createGoal", () => {
    it("should create a new goal", async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: { success: true, goal_id: "goal-123" },
      });

      const formData = new FormData();
      formData.set("title", "Lose Weight");
      formData.set("description", "Lose 10kg");
      formData.set("target_value", "70");
      formData.set("current_value", "80");
      formData.set("unit", "kg");
      formData.set("target_date", "2024-12-31");

      const result = await createGoal(formData);

      expect(result.success).toBe(true);
      expect(result.goalId).toBe("goal-123");
      expect(mockApiPost).toHaveBeenCalledWith("/api/goals", {
        title: "Lose Weight",
        description: "Lose 10kg",
        target_value: 70,
        current_value: 80,
        unit: "kg",
        target_date: "2024-12-31",
      });
    });

    it("should handle errors when creating goal", async () => {
      mockApiPost.mockResolvedValue({
        success: false,
        error: "Failed to create goal",
      });

      const formData = new FormData();
      formData.set("title", "Test Goal");
      formData.set("target_value", "100");
      formData.set("unit", "kg");

      const result = await createGoal(formData);

      expect(result.error).toBe("Failed to create goal");
    });
  });

  describe("getGoals", () => {
    it("should fetch all goals", async () => {
      const mockGoals = [
        { id: "goal-1", title: "Goal 1" },
        { id: "goal-2", title: "Goal 2" },
      ];

      mockApiGet.mockResolvedValue({
        success: true,
        data: { goals: mockGoals },
      });

      const result = await getGoals();

      expect(result.goals).toEqual(mockGoals);
      expect(mockApiGet).toHaveBeenCalledWith("/api/goals");
    });

    it("should return empty array on error", async () => {
      mockApiGet.mockResolvedValue({
        success: false,
        error: "Failed to fetch",
      });

      const result = await getGoals();

      expect(result.goals).toEqual([]);
    });
  });

  describe("updateGoal", () => {
    it("should update an existing goal", async () => {
      mockApiPut.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      const formData = new FormData();
      formData.set("title", "Updated Title");
      formData.set("current_value", "50");

      const result = await updateGoal("goal-123", formData);

      expect(result.success).toBe(true);
      expect(mockApiPut).toHaveBeenCalledWith("/api/goals/goal-123", {
        title: "Updated Title",
        current_value: 50,
      });
    });

    it("should handle errors when updating goal", async () => {
      mockApiPut.mockResolvedValue({
        success: false,
        error: "Goal not found",
      });

      const formData = new FormData();
      formData.set("title", "Test");

      const result = await updateGoal("invalid-id", formData);

      expect(result.error).toBe("Goal not found");
    });
  });

  describe("updateGoalProgress", () => {
    it("should update goal progress", async () => {
      mockApiPut.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      const result = await updateGoalProgress("goal-123", 75);

      expect(result.success).toBe(true);
      expect(mockApiPut).toHaveBeenCalledWith("/api/goals/goal-123/progress", {
        current_value: 75,
      });
    });
  });

  describe("deleteGoal", () => {
    it("should delete a goal", async () => {
      mockApiDelete.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      const result = await deleteGoal("goal-123");

      expect(result.success).toBe(true);
      expect(mockApiDelete).toHaveBeenCalledWith("/api/goals/goal-123");
    });

    it("should handle errors when deleting goal", async () => {
      mockApiDelete.mockResolvedValue({
        success: false,
        error: "Failed to delete",
      });

      const result = await deleteGoal("invalid-id");

      expect(result.error).toBe("Failed to delete");
    });
  });
});
