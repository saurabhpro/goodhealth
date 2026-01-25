/**
 * Unit tests for workout plan actions
 */

import {
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  activateWorkoutPlan,
  completeWorkoutPlan,
  deactivateWorkoutPlan,
} from "@/lib/workout-plans/actions";
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

describe("Workout Plan Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createWorkoutPlan", () => {
    it("should create a new workout plan", async () => {
      const mockPlan = { id: "plan-123", name: "Test Plan" };
      mockApiPost.mockResolvedValue({
        success: true,
        data: { success: true, plan: mockPlan },
      });

      const result = await createWorkoutPlan({
        name: "Test Plan",
        goal_type: "strength",
        weeks_duration: 4,
        workouts_per_week: 3,
      });

      expect(result.success).toBe(true);
      expect(result.plan).toEqual(mockPlan);
      expect(mockApiPost).toHaveBeenCalledWith("/api/workout-plans", {
        name: "Test Plan",
        goal_type: "strength",
        weeks_duration: 4,
        workouts_per_week: 3,
      });
    });

    it("should handle errors when creating plan", async () => {
      mockApiPost.mockResolvedValue({
        success: false,
        error: "Failed to create workout plan",
      });

      const result = await createWorkoutPlan({
        name: "Test Plan",
        goal_type: "strength",
        weeks_duration: 4,
        workouts_per_week: 3,
      });

      expect(result.error).toBe("Failed to create workout plan");
    });
  });

  describe("getWorkoutPlans", () => {
    it("should fetch all workout plans", async () => {
      const mockPlans = [
        { id: "plan-1", name: "Plan 1" },
        { id: "plan-2", name: "Plan 2" },
      ];

      mockApiGet.mockResolvedValue({
        success: true,
        data: { plans: mockPlans },
      });

      const result = await getWorkoutPlans();

      expect(result.plans).toEqual(mockPlans);
      expect(mockApiGet).toHaveBeenCalledWith("/api/workout-plans");
    });

    it("should return empty array on error", async () => {
      mockApiGet.mockResolvedValue({
        success: false,
        error: "Failed to fetch",
      });

      const result = await getWorkoutPlans();

      expect(result.plans).toEqual([]);
    });
  });

  describe("getWorkoutPlan", () => {
    it("should fetch a single workout plan", async () => {
      const mockPlan = { id: "plan-123", name: "Test Plan" };

      mockApiGet.mockResolvedValue({
        success: true,
        data: mockPlan,
      });

      const result = await getWorkoutPlan("plan-123");

      expect(result.plan).toEqual(mockPlan);
      expect(mockApiGet).toHaveBeenCalledWith("/api/workout-plans/plan-123");
    });

    it("should handle errors when fetching plan", async () => {
      mockApiGet.mockResolvedValue({
        success: false,
        error: "Plan not found",
      });

      const result = await getWorkoutPlan("invalid-id");

      expect(result.error).toBe("Plan not found");
    });
  });

  describe("updateWorkoutPlan", () => {
    it("should update a workout plan", async () => {
      const mockPlan = { id: "plan-123", name: "Updated Plan" };

      mockApiPut.mockResolvedValue({
        success: true,
        data: { success: true, plan: mockPlan },
      });

      const result = await updateWorkoutPlan("plan-123", { name: "Updated Plan" });

      expect(result.success).toBe(true);
      expect(result.plan).toEqual(mockPlan);
      expect(mockApiPut).toHaveBeenCalledWith("/api/workout-plans/plan-123", {
        name: "Updated Plan",
      });
    });
  });

  describe("deleteWorkoutPlan", () => {
    it("should delete a workout plan", async () => {
      mockApiDelete.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      const result = await deleteWorkoutPlan("plan-123");

      expect(result.success).toBe(true);
      expect(mockApiDelete).toHaveBeenCalledWith("/api/workout-plans/plan-123");
    });
  });

  describe("activateWorkoutPlan", () => {
    it("should activate a workout plan", async () => {
      const mockPlan = { id: "plan-123", status: "active" };

      mockApiPost.mockResolvedValue({
        success: true,
        data: { success: true, plan: mockPlan },
      });

      const result = await activateWorkoutPlan("plan-123");

      expect(result.success).toBe(true);
      expect(result.plan).toEqual(mockPlan);
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/workout-plans/plan-123/activate",
        {}
      );
    });
  });

  describe("completeWorkoutPlan", () => {
    it("should complete a workout plan", async () => {
      const mockPlan = { id: "plan-123", status: "completed" };

      mockApiPost.mockResolvedValue({
        success: true,
        data: { success: true, plan: mockPlan },
      });

      const result = await completeWorkoutPlan("plan-123");

      expect(result.success).toBe(true);
      expect(result.plan).toEqual(mockPlan);
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/workout-plans/plan-123/complete",
        {}
      );
    });
  });

  describe("deactivateWorkoutPlan", () => {
    it("should deactivate a workout plan", async () => {
      const mockPlan = { id: "plan-123", status: "draft" };

      mockApiPost.mockResolvedValue({
        success: true,
        data: { success: true, plan: mockPlan },
      });

      const result = await deactivateWorkoutPlan("plan-123");

      expect(result.success).toBe(true);
      expect(result.plan).toEqual(mockPlan);
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/workout-plans/plan-123/deactivate",
        {}
      );
    });
  });
});
