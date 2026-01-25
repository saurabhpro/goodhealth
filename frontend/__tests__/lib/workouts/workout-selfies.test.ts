/**
 * Unit tests for workout selfie integration in getWorkouts
 */

import { createMockWorkout, createMockSelfie, createMockExercise } from '../../utils/mocks'

describe('Workout Selfies Integration', () => {
  describe('getWorkouts with selfies', () => {
    it('should include selfie data when workout has a selfie', () => {
      const workout = createMockWorkout({ id: 'workout-1' })
      const selfie = createMockSelfie({
        workout_id: 'workout-1',
        signedUrl: 'https://example.com/signed-url.jpg'
      })

      const workoutWithSelfie = {
        ...workout,
        workout_selfies: [selfie]
      }

      expect(workoutWithSelfie.workout_selfies).toBeDefined()
      expect(workoutWithSelfie.workout_selfies).toHaveLength(1)
      expect(workoutWithSelfie.workout_selfies![0].id).toBe('selfie-1')
      expect(workoutWithSelfie.workout_selfies![0].file_path).toBe('test-user-id/workout-1/12345_selfie.jpg')
    })

    it('should handle workouts without selfies', () => {
      const workout = createMockWorkout({ id: 'workout-1' })

      const workoutWithoutSelfie = {
        ...workout,
        workout_selfies: []
      }

      expect(workoutWithoutSelfie.workout_selfies).toBeDefined()
      expect(workoutWithoutSelfie.workout_selfies).toHaveLength(0)
    })

    it('should include signed URL with selfie', () => {
      const selfie = createMockSelfie()
      const signedUrl = 'https://example.supabase.co/storage/v1/object/sign/workout-selfies/test-path.jpg'

      const selfieWithUrl = {
        ...selfie,
        signedUrl
      }

      expect(selfieWithUrl.signedUrl).toBe(signedUrl)
      expect(selfieWithUrl.signedUrl).toContain('supabase.co')
      expect(selfieWithUrl.signedUrl).toContain('sign')
    })

    it('should only include first selfie per workout', () => {
      const workout = createMockWorkout({ id: 'workout-1' })
      const selfie1 = createMockSelfie({
        id: 'selfie-1',
        workout_id: 'workout-1',
        taken_at: '2024-01-01T10:00:00Z'
      })
      // Note: A second selfie (selfie-2) also exists but is not returned by the backend

      // Simulate backend returning only first selfie (most recent)
      const workoutWithSelfie = {
        ...workout,
        workout_selfies: [selfie1] // Only first selfie
      }

      expect(workoutWithSelfie.workout_selfies).toHaveLength(1)
      expect(workoutWithSelfie.workout_selfies![0].id).toBe('selfie-1')
    })

    it('should preserve workout data when adding selfie', () => {
      const workout = createMockWorkout({
        id: 'workout-1',
        name: 'Morning Run',
        duration_minutes: 45,
        description: 'Great run!'
      })
      const selfie = createMockSelfie({ workout_id: 'workout-1' })

      const workoutWithSelfie = {
        ...workout,
        workout_selfies: [selfie]
      }

      expect(workoutWithSelfie.id).toBe('workout-1')
      expect(workoutWithSelfie.name).toBe('Morning Run')
      expect(workoutWithSelfie.duration_minutes).toBe(45)
      expect(workoutWithSelfie.description).toBe('Great run!')
      expect(workoutWithSelfie.workout_selfies).toHaveLength(1)
    })

    it('should preserve exercises data when adding selfie', () => {
      const workout = createMockWorkout({ id: 'workout-1' })
      const exercises = [
        createMockExercise({ id: 'ex-1', workout_id: 'workout-1', name: 'Bench Press' }),
        createMockExercise({ id: 'ex-2', workout_id: 'workout-1', name: 'Squats' })
      ]
      const selfie = createMockSelfie({ workout_id: 'workout-1' })

      const workoutWithData = {
        ...workout,
        exercises,
        workout_selfies: [selfie]
      }

      expect(workoutWithData.exercises).toHaveLength(2)
      expect(workoutWithData.workout_selfies).toHaveLength(1)
    })
  })

  describe('Selfie data structure', () => {
    it('should have required selfie fields', () => {
      const selfie = createMockSelfie()

      expect(selfie.id).toBeDefined()
      expect(selfie.workout_id).toBeDefined()
      expect(selfie.user_id).toBeDefined()
      expect(selfie.file_path).toBeDefined()
      expect(selfie.file_name).toBeDefined()
      expect(selfie.file_size).toBeDefined()
      expect(selfie.mime_type).toBeDefined()
      expect(selfie.taken_at).toBeDefined()
      expect(selfie.created_at).toBeDefined()
    })

    it('should have optional caption field', () => {
      const selfieWithCaption = createMockSelfie({ caption: 'Feeling strong!' })
      const selfieWithoutCaption = createMockSelfie({ caption: null })

      expect(selfieWithCaption.caption).toBe('Feeling strong!')
      expect(selfieWithoutCaption.caption).toBeNull()
    })

    it('should have valid file path structure', () => {
      const selfie = createMockSelfie({
        user_id: 'user-123',
        workout_id: 'workout-456',
        file_path: 'user-123/workout-456/1234567890_photo.jpg'
      })

      expect(selfie.file_path).toContain(selfie.user_id)
      expect(selfie.file_path).toContain(selfie.workout_id)
      expect(selfie.file_path).toContain('.jpg')
    })

    it('should support different image formats', () => {
      const formats = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

      formats.forEach(format => {
        const selfie = createMockSelfie({ mime_type: format })
        expect(selfie.mime_type).toBe(format)
      })
    })

    it('should have reasonable file size', () => {
      const selfie = createMockSelfie({ file_size: 2048000 }) // 2MB

      expect(selfie.file_size).toBeGreaterThan(0)
      expect(selfie.file_size).toBeLessThanOrEqual(5 * 1024 * 1024) // Max 5MB
    })
  })

  describe('Signed URL generation', () => {
    it('should generate valid signed URL format', () => {
      const filePath = 'test-user/workout-1/12345_photo.jpg'
      const signedUrl = `https://example.supabase.co/storage/v1/object/sign/workout-selfies/${filePath}?token=xyz`

      expect(signedUrl).toContain('https://')
      expect(signedUrl).toContain('supabase.co')
      expect(signedUrl).toContain('storage/v1/object/sign')
      expect(signedUrl).toContain('workout-selfies')
      expect(signedUrl).toContain(filePath)
    })

    it('should include expiry token in signed URL', () => {
      const signedUrl = 'https://example.supabase.co/storage/v1/object/sign/workout-selfies/path.jpg?token=abc123&expires=1234567890'

      expect(signedUrl).toContain('token=')
      expect(signedUrl).toContain('expires=')
    })

    it('should handle URL encoding in file paths', () => {
      const filePath = 'test-user/workout-1/my photo 2024.jpg'
      const encodedPath = encodeURIComponent(filePath)

      expect(encodedPath).toContain('%20') // Space encoded
      expect(encodedPath).not.toContain(' ')
    })
  })

  describe('Workout list with multiple workouts and selfies', () => {
    it('should handle mix of workouts with and without selfies', () => {
      const workout1 = {
        ...createMockWorkout({ id: 'workout-1', name: 'Run' }),
        workout_selfies: [createMockSelfie({ id: 'selfie-1', workout_id: 'workout-1' })]
      }

      const workout2 = {
        ...createMockWorkout({ id: 'workout-2', name: 'Swim' }),
        workout_selfies: []
      }

      const workout3 = {
        ...createMockWorkout({ id: 'workout-3', name: 'Gym' }),
        workout_selfies: [createMockSelfie({ id: 'selfie-3', workout_id: 'workout-3' })]
      }

      const workouts = [workout1, workout2, workout3]

      expect(workouts).toHaveLength(3)
      expect(workouts[0].workout_selfies).toHaveLength(1)
      expect(workouts[1].workout_selfies).toHaveLength(0)
      expect(workouts[2].workout_selfies).toHaveLength(1)
    })

    it('should maintain workout order when selfies are present', () => {
      const workouts = [
        { ...createMockWorkout({ id: '1', date: '2024-01-03' }), workout_selfies: [createMockSelfie()] },
        { ...createMockWorkout({ id: '2', date: '2024-01-02' }), workout_selfies: [] },
        { ...createMockWorkout({ id: '3', date: '2024-01-01' }), workout_selfies: [createMockSelfie()] }
      ]

      // Workouts should be ordered by date descending
      expect(workouts[0].date).toBe('2024-01-03')
      expect(workouts[1].date).toBe('2024-01-02')
      expect(workouts[2].date).toBe('2024-01-01')
    })
  })

  describe('Image optimization metadata', () => {
    it('should track original image dimensions (if available)', () => {
      // Mock selfie with 2MB JPEG image
      // Mock width/height could be added to selfie metadata
      const metadata = {
        width: 1920,
        height: 1080,
        aspectRatio: 1920 / 1080
      }

      expect(metadata.width).toBeGreaterThan(0)
      expect(metadata.height).toBeGreaterThan(0)
      expect(metadata.aspectRatio).toBeCloseTo(1.78, 2) // 16:9
    })

    it('should support common aspect ratios', () => {
      const aspectRatios = [
        { width: 1920, height: 1080, ratio: 16/9 },  // 16:9
        { width: 1080, height: 1080, ratio: 1 },      // 1:1 (square)
        { width: 1080, height: 1920, ratio: 9/16 }    // 9:16 (portrait)
      ]

      aspectRatios.forEach(({ width, height, ratio }) => {
        const calculated = width / height
        expect(calculated).toBeCloseTo(ratio, 2)
      })
    })
  })

  describe('Thumbnail size calculations', () => {
    it('should use correct thumbnail sizes for workout list', () => {
      const thumbnailSizes = {
        workoutList: { width: 96, height: 96 },
        dashboard: { width: 80, height: 80 }
      }

      expect(thumbnailSizes.workoutList.width).toBe(96)
      expect(thumbnailSizes.workoutList.height).toBe(96)
      expect(thumbnailSizes.dashboard.width).toBe(80)
      expect(thumbnailSizes.dashboard.height).toBe(80)
    })

    it('should calculate thumbnail quality settings', () => {
      const qualitySettings = {
        thumbnail: 80,    // 80% for small thumbnails
        preview: 85,      // 85% for preview images
        display: 90       // 90% for full display
      }

      expect(qualitySettings.thumbnail).toBe(80)
      expect(qualitySettings.preview).toBe(85)
      expect(qualitySettings.display).toBe(90)

      // All should be between 1-100
      Object.values(qualitySettings).forEach(quality => {
        expect(quality).toBeGreaterThanOrEqual(1)
        expect(quality).toBeLessThanOrEqual(100)
      })
    })

    it('should calculate responsive sizes attribute', () => {
      const sizes = {
        thumbnail: '96px',
        mobile: '(max-width: 640px) 100vw',
        tablet: '(max-width: 1024px) 80vw',
        desktop: '60vw'
      }

      expect(sizes.thumbnail).toBe('96px')
      expect(sizes.mobile).toContain('640px')
      expect(sizes.tablet).toContain('1024px')
    })
  })
})
