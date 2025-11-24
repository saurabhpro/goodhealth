/**
 * AI Model Configuration
 *
 * Centralized configuration for AI models used across the application.
 * Update this file to change model versions globally.
 */

/**
 * Gemini Model Configuration
 *
 * Current: Gemini 3 Pro Preview (released Nov 18, 2025)
 * - 50%+ improvement over Gemini 2.5 Pro in benchmark tasks
 * - Advanced reasoning, multimodal capabilities, and agentic development
 * - 1M token context window, 64K token output
 * - Available in Google AI Studio with free tier limits
 *
 * Status: Preview (stable release expected by end of 2025)
 *
 * When Gemini 3 Pro exits preview:
 * - Update to: 'gemini-3-pro' (without '-preview' suffix)
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs/gemini-3
 * - https://deepmind.google/models/gemini/pro/
 */
export const GEMINI_MODEL = 'gemini-3-pro-preview' as const

/**
 * Alternative model names for different use cases
 */
export const AI_MODELS = {
  /** Primary model for complex reasoning, multimodal tasks, and workout plan generation */
  GEMINI_PRO: GEMINI_MODEL,

  /** Fallback to stable version if preview has issues (uncomment if needed) */
  // GEMINI_PRO_STABLE: 'gemini-2.5-pro' as const,
} as const

/**
 * Model metadata for monitoring and debugging
 */
export const MODEL_INFO = {
  name: GEMINI_MODEL,
  version: '3.0-preview',
  releaseDate: '2025-11-18',
  contextWindow: 1_000_000, // 1M tokens
  maxOutput: 64_000, // 64K tokens
  status: 'preview' as const,
} as const
