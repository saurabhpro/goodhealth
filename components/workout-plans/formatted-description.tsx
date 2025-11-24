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

    // Split into sentences/phrases while preserving week patterns
    const weekPattern = /(Weeks? \d+[-–]\d+:|Weeks? \d+:)/g
    const parts = text.split(weekPattern)

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part?.trim()) continue

      // Check if this is a week range header
      const weekRegex = /^(Weeks? \d+[-–]\d+:|Weeks? \d+:)$/
      if (weekRegex.exec(part)) {
        elements.push(
          <div className="font-medium text-foreground mt-3 mb-1">
            {part.trim()}
          </div>
        )
      } else {
        // Split by common delimiters but keep them grouped logically
        const sentences = part
          .split(/(?<=[.!?])\s+/)
          .filter(s => s.trim())

        for (const [idx, sentence] of sentences.entries()) {
          const trimmed = sentence.trim()
          if (!trimmed) continue

          // Check for bullet point indicators
          if (trimmed.match(/^[-•*]/)) {
            elements.push(
              <li className="ml-6 mb-1 text-muted-foreground">
                {trimmed.replace(/^[-•*]\s*/, '')}
              </li>
            )
          } else if (trimmed.length > 20 || (idx === 0 && i === 1)) {
            // Regular paragraph for longer content or first sentence after a header
            elements.push(
              <p className="mb-2 text-muted-foreground leading-relaxed">
                {trimmed}
              </p>
            )
          }
        }
      }
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
