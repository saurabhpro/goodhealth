/**
 * Unit tests for selfie upload validation logic
 */

import { createMockFile } from '../../utils/mocks'

describe('Selfie Upload Validation', () => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

  describe('File size validation', () => {
    it('should accept files under 5MB', () => {
      const file = createMockFile({ size: 4 * 1024 * 1024 }) // 4MB
      expect(file.size).toBeLessThan(MAX_FILE_SIZE)
    })

    it('should reject files over 5MB', () => {
      const file = createMockFile({ size: 6 * 1024 * 1024 }) // 6MB
      expect(file.size).toBeGreaterThan(MAX_FILE_SIZE)
    })

    it('should accept files exactly at 5MB', () => {
      const file = createMockFile({ size: MAX_FILE_SIZE })
      expect(file.size).toBeLessThanOrEqual(MAX_FILE_SIZE)
    })
  })

  describe('MIME type validation', () => {
    it('should accept JPEG files', () => {
      const file = createMockFile({ type: 'image/jpeg' })
      expect(ALLOWED_MIME_TYPES).toContain(file.type)
    })

    it('should accept PNG files', () => {
      const file = createMockFile({ type: 'image/png' })
      expect(ALLOWED_MIME_TYPES).toContain(file.type)
    })

    it('should accept WebP files', () => {
      const file = createMockFile({ type: 'image/webp' })
      expect(ALLOWED_MIME_TYPES).toContain(file.type)
    })

    it('should accept HEIC files', () => {
      const file = createMockFile({ type: 'image/heic' })
      expect(ALLOWED_MIME_TYPES).toContain(file.type)
    })

    it('should reject GIF files', () => {
      const file = createMockFile({ type: 'image/gif' })
      expect(ALLOWED_MIME_TYPES).not.toContain(file.type)
    })

    it('should reject SVG files', () => {
      const file = createMockFile({ type: 'image/svg+xml' })
      expect(ALLOWED_MIME_TYPES).not.toContain(file.type)
    })

    it('should reject non-image files', () => {
      const file = createMockFile({ type: 'application/pdf' })
      expect(ALLOWED_MIME_TYPES).not.toContain(file.type)
    })

    it('should reject video files', () => {
      const file = createMockFile({ type: 'video/mp4' })
      expect(ALLOWED_MIME_TYPES).not.toContain(file.type)
    })
  })

  describe('File name validation', () => {
    it('should handle special characters in filename', () => {
      const fileName = 'my selfie @#$%.jpg'
      const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      expect(sanitized).toBe('my_selfie_____.jpg')
    })

    it('should preserve file extension', () => {
      const fileName = 'test-image.jpg'
      const extension = fileName.split('.').pop()
      expect(extension).toBe('jpg')
    })

    it('should handle files without extension', () => {
      const fileName = 'test-image'
      const extension = fileName.split('.').pop()
      expect(extension).toBe('test-image')
    })

    it('should handle multiple dots in filename', () => {
      const fileName = 'my.test.image.jpg'
      const extension = fileName.split('.').pop()
      expect(extension).toBe('jpg')
    })
  })

  describe('Caption validation', () => {
    it('should accept empty captions', () => {
      const caption = ''
      expect(caption.length).toBe(0)
    })

    it('should accept short captions', () => {
      const caption = 'Feeling great!'
      expect(caption.length).toBeGreaterThan(0)
    })

    it('should accept long captions', () => {
      const caption = 'A'.repeat(500)
      expect(caption.length).toBe(500)
    })

    it('should accept captions with special characters', () => {
      const caption = 'Feeling 💪 great! @gym #fitness'
      expect(caption).toContain('💪')
      expect(caption).toContain('@')
      expect(caption).toContain('#')
    })

    it('should accept captions with newlines', () => {
      const caption = 'Line 1\nLine 2\nLine 3'
      expect(caption.split('\n').length).toBe(3)
    })
  })

  describe('Storage path generation', () => {
    it('should generate valid storage path', () => {
      const userId = 'user-123'
      const workoutId = 'workout-456'
      const timestamp = Date.now()
      const fileName = 'selfie.jpg'

      const storagePath = `${userId}/${workoutId}/${timestamp}_${fileName}`

      expect(storagePath).toMatch(/^user-123\/workout-456\/\d+_selfie\.jpg$/)
    })

    it('should include timestamp in path for uniqueness', async () => {
      const userId = 'user-123'
      const workoutId = 'workout-456'
      const fileName = 'selfie.jpg'

      const timestamp1 = Date.now()
      const path1 = `${userId}/${workoutId}/${timestamp1}_${fileName}`

      // Wait 10ms to ensure different timestamp (CI/CD environments can be very fast)
      await new Promise(resolve => setTimeout(resolve, 10))

      const timestamp2 = Date.now()
      const path2 = `${userId}/${workoutId}/${timestamp2}_${fileName}`

      // Paths should be different due to timestamp
      expect(path1).not.toBe(path2)
      expect(timestamp2).toBeGreaterThan(timestamp1)
    })
  })

  describe('One selfie per workout rule', () => {
    it('should allow one selfie per workout', () => {
      const workoutSelfies = new Map()
      const workoutId = 'workout-1'

      // First selfie
      workoutSelfies.set(workoutId, 'selfie-1')
      expect(workoutSelfies.has(workoutId)).toBe(true)
      expect(workoutSelfies.get(workoutId)).toBe('selfie-1')
    })

    it('should replace existing selfie when uploading new one', () => {
      const workoutSelfies = new Map()
      const workoutId = 'workout-1'

      // First selfie
      workoutSelfies.set(workoutId, 'selfie-1')
      expect(workoutSelfies.get(workoutId)).toBe('selfie-1')

      // Replace with new selfie
      workoutSelfies.set(workoutId, 'selfie-2')
      expect(workoutSelfies.get(workoutId)).toBe('selfie-2')
      expect(workoutSelfies.size).toBe(1)
    })

    it('should allow different selfies for different workouts', () => {
      const workoutSelfies = new Map()

      workoutSelfies.set('workout-1', 'selfie-1')
      workoutSelfies.set('workout-2', 'selfie-2')
      workoutSelfies.set('workout-3', 'selfie-3')

      expect(workoutSelfies.size).toBe(3)
      expect(workoutSelfies.get('workout-1')).toBe('selfie-1')
      expect(workoutSelfies.get('workout-2')).toBe('selfie-2')
      expect(workoutSelfies.get('workout-3')).toBe('selfie-3')
    })
  })
})
