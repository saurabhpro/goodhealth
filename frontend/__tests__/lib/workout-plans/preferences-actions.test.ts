/**
 * Unit tests for workout plan preferences actions
 */

import {
  getUserPreferences,
  upsertUserPreferences,
  getUserTemplates,
  createUserTemplate,
  deleteUserTemplate,
} from "@/lib/workout-plans/preferences-actions";
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

describe("Workout Plan Preferences Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserPreferences", () => {
    it("should fetch user preferences", async () => {
      const mockPreferences = {
        fitness_level: "intermediate",
        preferred_duration: 60,
        gym_access: true,
      };

      mockApiGet.mockResolvedValue({
        success: true,
        data: { preferences: mockPreferences },
      });

      const result = await getUserPreferences();

      expect(result.preferences).toEqual(mockPreferences);
      expect(result.error).toBeNull();
      expect(mockApiGet).toHaveBeenCalledWith("/api/workout-plans/preferences");
    });

    it("should handle errors when fetching preferences", async () => {
      mockApiGet.mockResolvedValue({
        success: false,
        error: "Failed to load preferences",
      });

      const result = await getUserPreferences();

      expect(result.preferences).toBeNull();
      expect(result.error).toBe("Failed to load preferences");
    });
  });

  describe("upsertUserPreferences", () => {
    it("should save user preferences", async () => {
      mockApiPut.mockResolvedValue({
        success: true,
        data: { preferences: {} },
      });

      const result = await upsertUserPreferences({
        fitness_level: "advanced",
        preferred_duration: 90,
      });

      expect(result.success).toBe(true);
      expect(mockApiPut).toHaveBeenCalledWith("/api/workout-plans/preferences", {
        fitness_level: "advanced",
        preferred_duration: 90,
      });
    });

    it("should handle errors when saving preferences", async () => {
      mockApiPut.mockResolvedValue({
        success: false,
        error: "Failed to save preferences",
      });

      const result = await upsertUserPreferences({});

      expect(result.error).toBe("Failed to save preferences");
    });
  });

  describe("getUserTemplates", () => {
    it("should fetch all user templates", async () => {
      const mockTemplates = [
        { id: "template-1", name: "Push Day" },
        { id: "template-2", name: "Pull Day" },
      ];

      mockApiGet.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      const result = await getUserTemplates();

      expect(result.templates).toEqual(mockTemplates);
      expect(result.error).toBeNull();
      expect(mockApiGet).toHaveBeenCalledWith("/api/workout-plans/templates");
    });

    it("should fetch active templates only", async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: { templates: [] },
      });

      await getUserTemplates({ isActive: true });

      expect(mockApiGet).toHaveBeenCalledWith(
        "/api/workout-plans/templates?is_active=true"
      );
    });

    it("should return empty array on error", async () => {
      mockApiGet.mockResolvedValue({
        success: false,
        error: "Failed to load templates",
      });

      const result = await getUserTemplates();

      expect(result.templates).toEqual([]);
      expect(result.error).toBe("Failed to load templates");
    });
  });

  describe("createUserTemplate", () => {
    it("should create a new template", async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: { template_id: "template-123" },
      });

      const result = await createUserTemplate({
        name: "New Template",
        workout_type: "strength",
      });

      expect(result.success).toBe(true);
      expect(result.templateId).toBe("template-123");
      expect(mockApiPost).toHaveBeenCalledWith("/api/workout-plans/templates", {
        name: "New Template",
        workout_type: "strength",
      });
    });

    it("should handle errors when creating template", async () => {
      mockApiPost.mockResolvedValue({
        success: false,
        error: "Failed to create template",
      });

      const result = await createUserTemplate({});

      expect(result.error).toBe("Failed to create template");
    });
  });

  describe("deleteUserTemplate", () => {
    it("should delete a template", async () => {
      mockApiDelete.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      const result = await deleteUserTemplate("template-123");

      expect(result.success).toBe(true);
      expect(mockApiDelete).toHaveBeenCalledWith(
        "/api/workout-plans/templates/template-123"
      );
    });

    it("should handle errors when deleting template", async () => {
      mockApiDelete.mockResolvedValue({
        success: false,
        error: "Failed to delete template",
      });

      const result = await deleteUserTemplate("invalid-id");

      expect(result.error).toBe("Failed to delete template");
    });
  });
});
