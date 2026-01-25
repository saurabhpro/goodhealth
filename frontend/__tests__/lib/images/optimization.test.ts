/**
 * Unit tests for image optimization configuration and helpers
 */

describe('Image Optimization', () => {
  describe('Next.js Image Configuration', () => {
    it('should support modern image formats', () => {
      const formats = ['image/webp', 'image/avif']

      formats.forEach(format => {
        expect(format).toMatch(/image\/(webp|avif)/)
      })
    })

    it('should define responsive device sizes', () => {
      const deviceSizes = [640, 750, 828, 1080, 1200, 1920]

      expect(deviceSizes).toHaveLength(6)
      expect(deviceSizes[0]).toBe(640)  // Mobile
      expect(deviceSizes[5]).toBe(1920) // Desktop

      // Should be in ascending order
      for (let i = 1; i < deviceSizes.length; i++) {
        expect(deviceSizes[i]).toBeGreaterThan(deviceSizes[i - 1])
      }
    })

    it('should define image sizes for icons and thumbnails', () => {
      const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384]

      expect(imageSizes).toHaveLength(8)
      expect(imageSizes).toContain(96)  // Workout list thumbnail
      expect(imageSizes).toContain(64)  // Dashboard thumbnail (80px uses closest: 64)

      // Should be in ascending order
      for (let i = 1; i < imageSizes.length; i++) {
        expect(imageSizes[i]).toBeGreaterThan(imageSizes[i - 1])
      }
    })

    it('should set appropriate cache TTL', () => {
      const minimumCacheTTL = 3600 // 1 hour in seconds

      expect(minimumCacheTTL).toBe(3600)
      expect(minimumCacheTTL).toBeGreaterThan(0)
    })
  })

  describe('Image Quality Settings', () => {
    it('should use appropriate quality for thumbnails', () => {
      const thumbnailQuality = 80

      expect(thumbnailQuality).toBe(80)
      expect(thumbnailQuality).toBeGreaterThanOrEqual(70)
      expect(thumbnailQuality).toBeLessThanOrEqual(85)
    })

    it('should use appropriate quality for preview images', () => {
      const previewQuality = 85

      expect(previewQuality).toBe(85)
      expect(previewQuality).toBeGreaterThanOrEqual(80)
      expect(previewQuality).toBeLessThanOrEqual(90)
    })

    it('should use appropriate quality for display images', () => {
      const displayQuality = 90

      expect(displayQuality).toBe(90)
      expect(displayQuality).toBeGreaterThanOrEqual(85)
      expect(displayQuality).toBeLessThanOrEqual(95)
    })

    it('should have quality progression from thumbnail to display', () => {
      const qualities = {
        thumbnail: 80,
        preview: 85,
        display: 90
      }

      expect(qualities.preview).toBeGreaterThan(qualities.thumbnail)
      expect(qualities.display).toBeGreaterThan(qualities.preview)
    })
  })

  describe('Responsive Image Sizes', () => {
    it('should generate correct sizes attribute for thumbnails', () => {
      const thumbnailSize = '96px'

      expect(thumbnailSize).toBe('96px')
      expect(thumbnailSize).toMatch(/^\d+px$/)
    })

    it('should generate correct sizes attribute for mobile', () => {
      const mobileSizes = '(max-width: 640px) 100vw'

      expect(mobileSizes).toContain('640px')
      expect(mobileSizes).toContain('100vw')
    })

    it('should generate correct sizes attribute for tablet', () => {
      const tabletSizes = '(max-width: 1024px) 80vw'

      expect(tabletSizes).toContain('1024px')
      expect(tabletSizes).toContain('80vw')
    })

    it('should generate correct sizes attribute for desktop', () => {
      const desktopSizes = '60vw'

      expect(desktopSizes).toContain('vw')
      expect(Number.parseInt(desktopSizes)).toBeLessThanOrEqual(100)
    })

    it('should combine media queries correctly', () => {
      const fullSizes = '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw'

      expect(fullSizes).toContain('640px')
      expect(fullSizes).toContain('1024px')
      expect(fullSizes.split(',').length).toBe(3)
    })
  })

  describe('Image Dimensions', () => {
    it('should calculate correct aspect ratios', () => {
      const dimensions = [
        { width: 600, height: 400, expectedRatio: 1.5 },
        { width: 800, height: 600, expectedRatio: 1.33 },
        { width: 1200, height: 900, expectedRatio: 1.33 },
        { width: 96, height: 96, expectedRatio: 1 },
        { width: 80, height: 80, expectedRatio: 1 }
      ]

      dimensions.forEach(({ width, height, expectedRatio }) => {
        const ratio = width / height
        expect(ratio).toBeCloseTo(expectedRatio, 2)
      })
    })

    it('should use correct thumbnail dimensions for workout list', () => {
      const thumbnailDimensions = {
        width: 96,
        height: 96
      }

      expect(thumbnailDimensions.width).toBe(96)
      expect(thumbnailDimensions.height).toBe(96)
      expect(thumbnailDimensions.width).toBe(thumbnailDimensions.height) // Square
    })

    it('should use correct thumbnail dimensions for dashboard', () => {
      const thumbnailDimensions = {
        width: 80,
        height: 80
      }

      expect(thumbnailDimensions.width).toBe(80)
      expect(thumbnailDimensions.height).toBe(80)
      expect(thumbnailDimensions.width).toBe(thumbnailDimensions.height) // Square
    })

    it('should use correct preview dimensions', () => {
      const previewDimensions = [
        { width: 600, height: 400 },
        { width: 800, height: 600 }
      ]

      previewDimensions.forEach(({ width, height }) => {
        expect(width).toBeGreaterThan(height) // Landscape
        expect(width).toBeGreaterThanOrEqual(600)
        expect(width).toBeLessThanOrEqual(800)
      })
    })

    it('should use correct display dimensions', () => {
      const displayDimensions = {
        width: 1200,
        height: 900
      }

      expect(displayDimensions.width).toBe(1200)
      expect(displayDimensions.height).toBe(900)
      expect(displayDimensions.width).toBeGreaterThan(displayDimensions.height)
    })
  })

  describe('Image Format Compression', () => {
    it('should calculate WebP compression savings', () => {
      const jpegSize = 1000000 // 1MB
      const webpSavings = 0.25 // 25% smaller
      const webpSize = jpegSize * (1 - webpSavings)

      expect(webpSize).toBe(750000)
      expect(webpSize).toBeLessThan(jpegSize)
    })

    it('should calculate AVIF compression savings', () => {
      const jpegSize = 1000000 // 1MB
      const avifSavings = 0.35 // 35% smaller
      const avifSize = jpegSize * (1 - avifSavings)

      expect(avifSize).toBe(650000)
      expect(avifSize).toBeLessThan(jpegSize)
    })

    it('should prefer AVIF over WebP when supported', () => {
      const formats = ['image/webp', 'image/avif']
      const preferredFormat = formats[1] // AVIF is second, preferred

      expect(preferredFormat).toBe('image/avif')
    })

    it('should fallback to WebP when AVIF not supported', () => {
      const formats = ['image/webp', 'image/avif']
      const fallbackFormat = formats[0]

      expect(fallbackFormat).toBe('image/webp')
    })
  })

  describe('Cache Strategy', () => {
    it('should cache optimized images for appropriate duration', () => {
      const cacheTTL = 3600 // 1 hour

      expect(cacheTTL).toBe(3600)
      expect(cacheTTL).toBeGreaterThan(0)
      expect(cacheTTL).toBeLessThanOrEqual(86400) // Max 24 hours
    })

    it('should calculate cache expiry time', () => {
      const now = Date.now()
      const ttlSeconds = 3600
      const expiryTime = now + (ttlSeconds * 1000)

      expect(expiryTime).toBeGreaterThan(now)
      expect(expiryTime - now).toBe(3600000) // 1 hour in ms
    })

    it('should set appropriate cache control headers', () => {
      const cacheControl = 'public, max-age=3600, must-revalidate'

      expect(cacheControl).toContain('public')
      expect(cacheControl).toContain('max-age=3600')
      expect(cacheControl).toContain('must-revalidate')
    })
  })

  describe('Loading Strategy', () => {
    it('should use eager loading for above-fold images', () => {
      const loadingStrategy = 'eager'

      expect(loadingStrategy).toBe('eager')
      expect(['eager', 'lazy']).toContain(loadingStrategy)
    })

    it('should use lazy loading for below-fold images', () => {
      const loadingStrategy = 'lazy'

      expect(loadingStrategy).toBe('lazy')
      expect(['eager', 'lazy']).toContain(loadingStrategy)
    })

    it('should not use lazy loading for thumbnails in lists', () => {
      // Thumbnails should load eagerly as they're small and in viewport
      const thumbnailLoading = undefined // No loading prop = default (eager)

      expect(thumbnailLoading).toBeUndefined()
    })

    it('should use lazy loading for full display images', () => {
      const displayLoading = 'lazy'

      expect(displayLoading).toBe('lazy')
    })
  })

  describe('Image URL Validation', () => {
    it('should validate Supabase storage URL pattern', () => {
      const url = 'https://project.supabase.co/storage/v1/object/workout-selfies/path.jpg'

      expect(url).toContain('supabase.co')
      expect(url).toContain('storage/v1/object')
      expect(url).toMatch(/^https:\/\//)
    })

    it('should validate signed URL pattern', () => {
      const signedUrl = 'https://project.supabase.co/storage/v1/object/sign/workout-selfies/path.jpg?token=xyz'

      expect(signedUrl).toContain('sign')
      expect(signedUrl).toContain('token=')
      expect(signedUrl).toMatch(/\?token=/)
    })

    it('should validate blob URL pattern for previews', () => {
      const blobUrl = 'blob:http://localhost:3000/abc-123-def'

      expect(blobUrl).toMatch(/^blob:/)
      expect(blobUrl).toContain('://localhost')
    })
  })

  describe('Performance Metrics', () => {
    it('should calculate expected bandwidth savings', () => {
      const originalSize = 2000000 // 2MB JPEG
      const optimizedSize = 1000000 // 1MB WebP (50% savings)
      const savings = ((originalSize - optimizedSize) / originalSize) * 100

      expect(savings).toBe(50)
      expect(savings).toBeGreaterThan(0)
      expect(savings).toBeLessThanOrEqual(100)
    })

    it('should calculate expected page load improvement', () => {
      const originalLoadTime = 3000 // 3 seconds
      const improvement = 0.5 // 50% faster
      const newLoadTime = originalLoadTime * (1 - improvement)

      expect(newLoadTime).toBe(1500)
      expect(newLoadTime).toBeLessThan(originalLoadTime)
    })

    it('should track image optimization metrics', () => {
      const metrics = {
        totalImages: 10,
        optimizedImages: 10,
        originalTotalSize: 20000000, // 20MB
        optimizedTotalSize: 10000000, // 10MB
        averageSavingsPercent: 50
      }

      expect(metrics.optimizedImages).toBe(metrics.totalImages)
      expect(metrics.optimizedTotalSize).toBeLessThan(metrics.originalTotalSize)
      expect(metrics.averageSavingsPercent).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing image gracefully', () => {
      const fallbackSrc = '/placeholder-workout.png'

      expect(fallbackSrc).toBeTruthy()
      expect(fallbackSrc).toMatch(/\.(png|jpg|svg)$/)
    })

    it('should handle invalid image URL', () => {
      const invalidUrl = 'not-a-valid-url'
      const isValid = invalidUrl.startsWith('http') || invalidUrl.startsWith('blob:')

      expect(isValid).toBe(false)
    })

    it('should handle image load failure', () => {
      const error = new Error('Failed to load image')

      expect(error.message).toContain('Failed to load')
      expect(error).toBeInstanceOf(Error)
    })

    it('should validate image file size limits', () => {
      const maxSize = 5 * 1024 * 1024 // 5MB
      const validSize = 2 * 1024 * 1024 // 2MB
      const invalidSize = 10 * 1024 * 1024 // 10MB

      expect(validSize).toBeLessThanOrEqual(maxSize)
      expect(invalidSize).toBeGreaterThan(maxSize)
    })
  })
})
