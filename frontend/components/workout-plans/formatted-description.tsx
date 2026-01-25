'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FormattedDescriptionProps {
  readonly description: string
  readonly maxLines?: number
}

export function FormattedDescription({ description, maxLines = 5 }: FormattedDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Smart formatting function
  const formatDescription = (text: string): React.ReactNode[] => {
    // First, split into major sections
    const sections: React.ReactNode[] = []

    // Split by common section headers and preserve them
    const sectionPattern = /(Progression Strategy:|Key Considerations:|Rationale:|Description:)/gi
    const parts = text.split(sectionPattern)

    let key = 0
    for (const part of parts) {
      if (!part?.trim()) continue

      // Check if this is a section header
      if (sectionPattern.test(part)) {
        sections.push(
          <h3 key={key++} className="font-semibold text-foreground mt-4 mb-2 text-base">
            {part.trim()}
          </h3>
        )
      } else {
        // Process the section content
        const content = formatSectionContent(part)
        for (const item of content) {
          sections.push(<div key={key++}>{item}</div>)
        }
      }
    }

    return sections
  }

  const formatSectionContent = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = []

    // Split by line breaks to process line by line
    const lines = text.split('\n').filter(line => line.trim())

    let bulletGroup: string[] = []
    let currentParagraph = ''

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip standalone asterisks, empty lines, or lines with only asterisks
      if (!trimmed || /^\*+$/.test(trimmed)) continue

      // Check if this is a week range header (more flexible pattern)
      if (/^(Weeks? \d+[-–]\d+:?|Weeks? \d+:?)/.test(trimmed)) {
        // Flush any accumulated content
        if (currentParagraph) {
          elements.push(
            <p className="mb-2 text-muted-foreground leading-relaxed">
              {currentParagraph.trim()}
            </p>
          )
          currentParagraph = ''
        }
        if (bulletGroup.length > 0) {
          elements.push(
            <ul className="list-disc ml-6 mb-3 space-y-1">
              {bulletGroup.map((bullet, idx) => (
                <li key={idx} className="text-muted-foreground">{bullet}</li>
              ))}
            </ul>
          )
          bulletGroup = []
        }

        elements.push(
          <div className="font-medium text-foreground mt-3 mb-1">
            {trimmed}
          </div>
        )
      }
      // Check for bullet points (•, *, -, or ** at start)
      else if (/^(\*\*?\s+|[•-]\s+)/.test(trimmed)) {
        // Flush any accumulated paragraph
        if (currentParagraph) {
          elements.push(
            <p className="mb-2 text-muted-foreground leading-relaxed">
              {currentParagraph.trim()}
            </p>
          )
          currentParagraph = ''
        }

        // Clean up the bullet text (remove bullet markers)
        const bulletText = trimmed.replace(/^(\*\*?\s+|[•-]\s+)/, '').trim()
        if (bulletText) {
          bulletGroup.push(bulletText)
        }
      }
      // Regular text - accumulate into paragraph
      else {
        // Flush any bullet group first
        if (bulletGroup.length > 0) {
          elements.push(
            <ul className="list-disc ml-6 mb-3 space-y-1">
              {bulletGroup.map((bullet, idx) => (
                <li key={idx} className="text-muted-foreground">{bullet}</li>
              ))}
            </ul>
          )
          bulletGroup = []
        }

        // Add to current paragraph with space
        if (currentParagraph) {
          currentParagraph += ' ' + trimmed
        } else {
          currentParagraph = trimmed
        }

        // If line ends with sentence-ending punctuation, flush the paragraph
        if (/[.!?]$/.test(trimmed)) {
          elements.push(
            <p className="mb-2 text-muted-foreground leading-relaxed">
              {currentParagraph.trim()}
            </p>
          )
          currentParagraph = ''
        }
      }
    }

    // Flush any remaining content
    if (currentParagraph) {
      elements.push(
        <p className="mb-2 text-muted-foreground leading-relaxed">
          {currentParagraph.trim()}
        </p>
      )
    }
    if (bulletGroup.length > 0) {
      elements.push(
        <ul className="list-disc ml-6 mb-3 space-y-1">
          {bulletGroup.map((bullet, idx) => (
            <li key={idx} className="text-muted-foreground">{bullet}</li>
          ))}
        </ul>
      )
    }

    return elements
  }

  const formattedContent = formatDescription(description)

  const maskStyle = isExpanded
    ? { WebkitMaskImage: 'none', maskImage: 'none' }
    : {
        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
      }

  return (
    <div className="relative">
      {/* Mobile: Collapsible with fade */}
      <div className="md:hidden">
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-none' : 'max-h-[8rem]'
          }`}
          style={maskStyle}
        >
          <div className="prose prose-sm max-w-none">
            {formattedContent}
          </div>
        </div>

        {formattedContent.length > maxLines && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Read more
              </>
            )}
          </Button>
        )}
      </div>

      {/* Desktop: Always expanded */}
      <div className="hidden md:block">
        <div className="prose prose-sm max-w-none">
          {formattedContent}
        </div>
      </div>
    </div>
  )
}
