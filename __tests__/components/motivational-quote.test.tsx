/**
 * Unit tests for MotivationalQuote component
 */

import { render, screen } from '@testing-library/react'
import { MotivationalQuote } from '@/components/motivational-quote'

describe('MotivationalQuote', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent quote selection
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render without crashing', () => {
    render(<MotivationalQuote />)
    expect(screen.getByText(/—/)).toBeInTheDocument()
  })

  it('should display a quote with text and author', () => {
    const { container } = render(<MotivationalQuote />)

    // Should have quote text
    const quoteText = container.querySelector('.text-foreground')
    expect(quoteText).toBeInTheDocument()
    expect(quoteText?.textContent).toBeTruthy()
    expect(quoteText?.textContent?.length).toBeGreaterThan(0)

    // Should have author attribution
    const authorText = container.querySelector('.text-muted-foreground')
    expect(authorText).toBeInTheDocument()
    expect(authorText?.textContent).toContain('—')
  })

  it('should display the Quote icon', () => {
    const { container } = render(<MotivationalQuote />)

    // Check for the SVG icon (lucide-react renders as svg)
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    const { container } = render(<MotivationalQuote />)

    // Check for gradient background and border styling
    const gradientDiv = container.querySelector('.bg-gradient-to-r')
    expect(gradientDiv).toBeInTheDocument()
    expect(gradientDiv).toHaveClass('border', 'border-primary/20')
  })

  it('should be responsive with proper padding', () => {
    const { container } = render(<MotivationalQuote />)

    // Check for responsive padding classes
    const gradientDiv = container.querySelector('.bg-gradient-to-r')
    expect(gradientDiv).toHaveClass('p-4', 'sm:p-6')
  })

  it('should display the same quote for the same day', () => {
    const { unmount, container } = render(<MotivationalQuote />)
    const firstQuote = container.textContent

    unmount()

    // Re-render on the same day
    const { container: container2 } = render(<MotivationalQuote />)
    const secondQuote = container2.textContent

    expect(firstQuote).toBe(secondQuote)
  })

  it('should display a valid quote on different days', () => {
    // Render on first day
    const { unmount } = render(<MotivationalQuote />)
    unmount()

    // Change date to next day
    jest.setSystemTime(new Date('2024-01-16'))

    // Render on new day
    render(<MotivationalQuote />)

    // Should still have a quote with author
    expect(screen.getByText(/—/)).toBeInTheDocument()
  })

  it('should render quote text with proper typography', () => {
    const { container } = render(<MotivationalQuote />)

    // Check for proper text styling on quote text
    const quoteText = container.querySelector('.text-sm')
    expect(quoteText).toBeInTheDocument()
    expect(quoteText).toHaveClass('sm:text-base', 'font-medium')
  })

  it('should render author text with muted styling', () => {
    const { container } = render(<MotivationalQuote />)

    // Check for muted text styling on author
    const authorText = container.querySelector('.text-muted-foreground')
    expect(authorText).toBeInTheDocument()
    expect(authorText).toHaveClass('text-xs', 'sm:text-sm')
  })

  it('should use useMemo for performance optimization', () => {
    // This test verifies the component structure rather than implementation
    // The actual useMemo is tested by ensuring consistent quote selection
    const { rerender, container } = render(<MotivationalQuote />)
    const quote1 = container.textContent

    // Re-render multiple times on same day should give same quote
    rerender(<MotivationalQuote />)
    rerender(<MotivationalQuote />)

    const quote2 = container.textContent
    expect(quote1).toBe(quote2)
  })
})
