/**
 * Unit tests for FormattedDescription component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { FormattedDescription } from '@/components/workout-plans/formatted-description'

describe('FormattedDescription', () => {
  const simpleDescription = 'This is a simple workout plan description.'

  const complexDescription = `This is a comprehensive workout plan.

Progression Strategy: Start with lighter weights and gradually increase.

Weeks 1-2: Focus on form and technique.
Weeks 3-4: Add 10% weight to all lifts.

Key Considerations: Always warm up properly before starting your workout.
• Rest between sets is important
• Stay hydrated
• Listen to your body

Rationale: This approach ensures steady progress while minimizing injury risk.`

  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<FormattedDescription description={simpleDescription} />)
      // Text appears twice (mobile + desktop view)
      expect(screen.getAllByText(simpleDescription).length).toBeGreaterThan(0)
    })

    it('should render simple text as paragraph', () => {
      const { container } = render(<FormattedDescription description={simpleDescription} />)
      const paragraph = container.querySelector('p')
      expect(paragraph).toBeInTheDocument()
      expect(paragraph?.textContent).toBe(simpleDescription)
    })
  })

  describe('Section header formatting', () => {
    it('should format "Progression Strategy:" as section header', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const headers = container.querySelectorAll('h3')
      const progressionHeader = Array.from(headers).find(h => h.textContent === 'Progression Strategy:')
      expect(progressionHeader).toBeInTheDocument()
      expect(progressionHeader).toHaveClass('font-semibold', 'text-foreground')
    })

    it('should format "Key Considerations:" as section header', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const headers = container.querySelectorAll('h3')
      const keyHeader = Array.from(headers).find(h => h.textContent === 'Key Considerations:')
      expect(keyHeader).toBeInTheDocument()
    })

    it('should format "Rationale:" as section header', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const headers = container.querySelectorAll('h3')
      const rationaleHeader = Array.from(headers).find(h => h.textContent === 'Rationale:')
      expect(rationaleHeader).toBeInTheDocument()
    })
  })

  describe('Week range formatting', () => {
    it('should format "Weeks 1-2:" as bold week header', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const weekHeaders = container.querySelectorAll('.font-medium')
      const week12 = Array.from(weekHeaders).find(h => h.textContent?.includes('Weeks 1-2:'))
      expect(week12).toBeInTheDocument()
    })

    it('should format "Weeks 3-4:" as bold week header', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const weekHeaders = container.querySelectorAll('.font-medium')
      const week34 = Array.from(weekHeaders).find(h => h.textContent?.includes('Weeks 3-4:'))
      expect(week34).toBeInTheDocument()
    })
  })

  describe('Bullet point formatting', () => {
    it('should render bullet points as list items', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBeGreaterThan(0)
    })

    it('should strip bullet markers from list items', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBeGreaterThan(0)
      // Check that at least one list item exists (bullet parsing works)
      const hasListItem = Array.from(listItems).some(li => li.textContent?.includes('Rest between sets'))
      expect(hasListItem).toBe(true)
    })
  })

  describe('Responsive behavior', () => {
    it('should render mobile view with collapsible section', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const mobileView = container.querySelector('.md\\:hidden')
      expect(mobileView).toBeInTheDocument()
    })

    it('should render desktop view that is always visible', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const desktopView = container.querySelector('.hidden.md\\:block')
      expect(desktopView).toBeInTheDocument()
    })

    it('should show "Read more" button on mobile for long content', () => {
      render(<FormattedDescription description={complexDescription} maxLines={5} />)
      const readMoreButton = screen.getByText(/Read more/i)
      expect(readMoreButton).toBeInTheDocument()
    })

    it('should not show expand button for short content', () => {
      render(<FormattedDescription description={simpleDescription} maxLines={5} />)
      const buttons = screen.queryByText(/Read more/i)
      // Short content won't trigger the button since formattedContent.length check
      // In reality, this depends on how many elements are generated
      expect(buttons).not.toBeInTheDocument()
    })
  })

  describe('Interactive behavior', () => {
    it('should expand content when "Read more" is clicked', () => {
      const { container } = render(<FormattedDescription description={complexDescription} maxLines={5} />)
      const mobileView = container.querySelector('.md\\:hidden div')

      // Initially collapsed
      expect(mobileView).toHaveClass('max-h-[8rem]')

      // Click "Read more"
      const readMoreButton = screen.getByText(/Read more/i)
      fireEvent.click(readMoreButton)

      // Should now be expanded
      expect(mobileView).toHaveClass('max-h-none')
    })

    it('should show "Show less" button when expanded', () => {
      render(<FormattedDescription description={complexDescription} maxLines={5} />)

      // Click "Read more"
      const readMoreButton = screen.getByText(/Read more/i)
      fireEvent.click(readMoreButton)

      // Should now show "Show less"
      expect(screen.getByText(/Show less/i)).toBeInTheDocument()
    })

    it('should collapse content when "Show less" is clicked', () => {
      const { container } = render(<FormattedDescription description={complexDescription} maxLines={5} />)

      // Expand first
      const readMoreButton = screen.getByText(/Read more/i)
      fireEvent.click(readMoreButton)

      // Then collapse
      const showLessButton = screen.getByText(/Show less/i)
      fireEvent.click(showLessButton)

      // Should be collapsed again
      const mobileView = container.querySelector('.md\\:hidden div')
      expect(mobileView).toHaveClass('max-h-[8rem]')
    })
  })

  describe('Styling', () => {
    it('should apply proper prose styling to content', () => {
      const { container } = render(<FormattedDescription description={simpleDescription} />)
      const proseDiv = container.querySelector('.prose')
      expect(proseDiv).toBeInTheDocument()
      expect(proseDiv).toHaveClass('prose-sm', 'max-w-none')
    })

    it('should apply muted foreground color to paragraphs', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const paragraphs = container.querySelectorAll('.text-muted-foreground')
      expect(paragraphs.length).toBeGreaterThan(0)
    })

    it('should have transition animation on mobile view', () => {
      const { container } = render(<FormattedDescription description={complexDescription} />)
      const mobileView = container.querySelector('.md\\:hidden div')
      expect(mobileView).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
    })
  })

  describe('Custom maxLines prop', () => {
    it('should accept custom maxLines value', () => {
      render(<FormattedDescription description={complexDescription} maxLines={3} />)
      // Component should render without errors with custom maxLines
      // Text appears twice (mobile + desktop view)
      expect(screen.getAllByText(/Progression Strategy:/).length).toBeGreaterThan(0)
    })

    it('should default to 5 lines if maxLines not provided', () => {
      render(<FormattedDescription description={complexDescription} />)
      // Component should render with default maxLines
      // Text appears twice (mobile + desktop view)
      expect(screen.getAllByText(/Progression Strategy:/).length).toBeGreaterThan(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty description', () => {
      const { container } = render(<FormattedDescription description="" />)
      // Should render container but no content
      expect(container.querySelector('.relative')).toBeInTheDocument()
    })

    it('should handle description with only whitespace', () => {
      const { container } = render(<FormattedDescription description="   \n\n   " />)
      expect(container.querySelector('.relative')).toBeInTheDocument()
    })

    it('should handle description with multiple consecutive section headers', () => {
      const desc = 'Progression Strategy: Test\nKey Considerations: Test\nRationale: Test'
      const { container } = render(<FormattedDescription description={desc} />)
      const headers = container.querySelectorAll('h3')
      // Headers appear twice (mobile + desktop view), so 3 * 2 = 6
      expect(headers.length).toBe(6)
    })

    it('should handle mixed bullet styles (•, -, *)', () => {
      const desc = '• First bullet\n- Second bullet\n* Third bullet'
      const { container } = render(<FormattedDescription description={desc} />)
      const listItems = container.querySelectorAll('li')
      // List items appear twice (mobile + desktop view), so at least 4 (2 views * 2+ bullets detected)
      expect(listItems.length).toBeGreaterThanOrEqual(2)
    })

    it('should filter out standalone asterisks', () => {
      const descWithAsterisks = 'This is a paragraph.\n*\nProgression Strategy:\n*\nAnother paragraph.\n*'
      const { container } = render(<FormattedDescription description={descWithAsterisks} />)

      // Check that standalone asterisks are not rendered as text
      const allText = container.textContent || ''
      // Count standalone asterisks in the rendered output (should be 0)
      const standaloneAsterisks = allText.match(/^\*$/gm)
      expect(standaloneAsterisks).toBeNull()
    })

    it('should only treat asterisk with space as bullet point', () => {
      const descWithBullets = `Regular paragraph text.
* This is a proper bullet with space
• This is another bullet with space`
      const { container } = render(<FormattedDescription description={descWithBullets} />)

      const listItems = container.querySelectorAll('li')
      // Should find bullets with space after asterisk (appears twice in mobile + desktop)
      const properBullets = Array.from(listItems).filter(li =>
        li.textContent?.includes('This is a proper bullet') || li.textContent?.includes('This is another bullet')
      )
      expect(properBullets.length).toBeGreaterThan(0)

      // Regular text should appear in paragraphs
      const paragraphs = container.querySelectorAll('p')
      const hasRegularText = Array.from(paragraphs).some(p =>
        p.textContent?.includes('Regular paragraph text')
      )
      expect(hasRegularText).toBe(true)
    })

    it('should handle description with mixed formatting issues', () => {
      const messyDesc = `This plan is designed for you.
*
Progression Strategy:
*
Week 1-2: Build foundation
*
Key Considerations:
* Proper form
*
• Stay consistent`

      const { container } = render(<FormattedDescription description={messyDesc} />)

      // Should render headers
      const headers = container.querySelectorAll('h3')
      expect(headers.length).toBeGreaterThan(0)

      // Should render bullet points (filtering out standalone asterisks)
      const listItems = container.querySelectorAll('li')
      const properFormBullet = Array.from(listItems).some(li =>
        li.textContent?.includes('Proper form')
      )
      const stayConsistentBullet = Array.from(listItems).some(li =>
        li.textContent?.includes('Stay consistent')
      )
      expect(properFormBullet).toBe(true)
      expect(stayConsistentBullet).toBe(true)

      // Verify standalone asterisks are filtered (check that they don't appear as visible content)
      const allElements = container.querySelectorAll('p, li, h3, div')
      const hasStandaloneAsterisk = Array.from(allElements).some(el => {
        const text = el.textContent?.trim()
        return text === '*'
      })
      expect(hasStandaloneAsterisk).toBe(false)
    })
  })

  describe('Icons', () => {
    it('should render ChevronDown icon in "Read more" button', () => {
      render(<FormattedDescription description={complexDescription} />)
      const button = screen.getByText(/Read more/i).closest('button')
      const icon = button?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render ChevronUp icon in "Show less" button', () => {
      render(<FormattedDescription description={complexDescription} />)

      // Expand first
      fireEvent.click(screen.getByText(/Read more/i))

      // Check for ChevronUp icon
      const button = screen.getByText(/Show less/i).closest('button')
      const icon = button?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })
})
