import { cn } from '../utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  it('should handle tailwind-merge conflicts', () => {
    const result = cn('px-4 py-2', 'px-6')
    // tailwind-merge should resolve conflicting padding
    expect(result).toContain('px-6')
    expect(result).toContain('py-2')
  })

  it('should filter out falsy values', () => {
    const result = cn('class1', false, 'class2', null, undefined, 'class3')
    expect(result).toBe('class1 class2 class3')
  })
})
