/**
 * Test utilities and mocks for unit tests
 */

import type { Database } from '@/types/database'

export type MockSupabaseClient = {
  from: jest.Mock
  storage: {
    from: jest.Mock
  }
  auth: {
    getUser: jest.Mock
  }
}

export function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
    auth: {
      getUser: jest.fn(),
    },
  }
}

export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  }
}

export function createMockWorkout(overrides = {}): Database['public']['Tables']['workouts']['Row'] {
  return {
    id: 'workout-1',
    user_id: 'test-user-id',
    name: 'Test Workout',
    description: 'Test description',
    date: '2024-01-01',
    duration_minutes: 60,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockGoal(overrides = {}): Database['public']['Tables']['goals']['Row'] {
  return {
    id: 'goal-1',
    user_id: 'test-user-id',
    title: 'Test Goal',
    description: 'Test goal description',
    target_value: 100,
    current_value: 50,
    unit: 'kg',
    target_date: '2024-12-31',
    achieved: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockExercise(overrides = {}): Database['public']['Tables']['exercises']['Row'] {
  return {
    id: 'exercise-1',
    workout_id: 'workout-1',
    name: 'Bench Press',
    sets: 3,
    reps: 10,
    weight: 80,
    weight_unit: 'kg',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockSelfie(overrides = {}): Database['public']['Tables']['workout_selfies']['Row'] {
  return {
    id: 'selfie-1',
    workout_id: 'workout-1',
    user_id: 'test-user-id',
    file_path: 'test-user-id/workout-1/12345_selfie.jpg',
    file_name: 'selfie.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    caption: 'Test caption',
    taken_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockFile(overrides: Partial<{ size: number; type: string; name: string }> = {}): File {
  const size = overrides.size || 1024
  const content = new Uint8Array(size)
  const type = overrides.type || 'image/jpeg'
  const name = overrides.name || 'test-image.jpg'

  const blob = new Blob([content], { type })

  return new File([blob], name, {
    type,
    lastModified: Date.now(),
  })
}

// Mock query chain builder
/* eslint-disable @typescript-eslint/no-unused-vars */
export class MockQueryBuilder {
  private data: unknown = null
  private err: unknown = null

  select(_columns?: string) {
    return this
  }

  eq(_column: string, _value: unknown) {
    return this
  }

  gte(_column: string, _value: unknown) {
    return this
  }

  lte(_column: string, _value: unknown) {
    return this
  }

  gt(_column: string, _value: unknown) {
    return this
  }

  lt(_column: string, _value: unknown) {
    return this
  }

  in(_column: string, _values: unknown[]) {
    return this
  }

  not(_column: string, _operator: string, _value: unknown) {
    return this
  }

  ilike(_column: string, _pattern: string) {
    return this
  }

  order(_column: string, _options?: { ascending?: boolean }) {
    return this
  }

  limit(_count: number) {
    return this
  }

  single() {
    return Promise.resolve({
      data: this.data,
      error: this.err,
    })
  }

  insert(_values: unknown) {
    return this
  }

  update(_values: unknown) {
    return this
  }

  delete() {
    return this
  }

  // Helper methods for testing
  mockData(data: unknown) {
    this.data = data
    return this
  }

  mockError(error: unknown) {
    this.err = error
    return this
  }

  then(resolve: (value: { data: unknown; error: unknown }) => unknown) {
    return Promise.resolve({
      data: this.data,
      error: this.err,
    }).then(resolve)
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// Helper to create mock query chain
export function createMockQueryBuilder(data?: unknown, error?: unknown): MockQueryBuilder {
  const builder = new MockQueryBuilder()
  if (data !== undefined) builder.mockData(data)
  if (error !== undefined) builder.mockError(error)
  return builder
}
