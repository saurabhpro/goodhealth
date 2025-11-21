'use client'

import { useMemo } from 'react'
import { Quote } from 'lucide-react'

const quotes = [
  {
    text: "The only bad workout is the one that didn't happen.",
    author: "Unknown"
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier"
  },
  {
    text: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn"
  },
  {
    text: "The body achieves what the mind believes.",
    author: "Unknown"
  },
  {
    text: "Don't wish for it, work for it.",
    author: "Unknown"
  },
  {
    text: "Push yourself because no one else is going to do it for you.",
    author: "Unknown"
  },
  {
    text: "Your health is an investment, not an expense.",
    author: "Unknown"
  },
  {
    text: "Believe in yourself and all that you are.",
    author: "Unknown"
  },
  {
    text: "The difference between try and triumph is a little umph.",
    author: "Unknown"
  },
  {
    text: "Strive for progress, not perfection.",
    author: "Unknown"
  }
]

export function MotivationalQuote() {
  // Get a consistent quote for the day based on date
  const quote = useMemo(() => {
    const today = new Date().toDateString()
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = hash % quotes.length
    return quotes[index]
  }, [])

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 p-4 sm:p-6">
      <div className="relative flex gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <div className="rounded-full bg-primary/10 p-2 sm:p-3">
            <Quote className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            &mdash; {quote.author}
          </p>
        </div>
      </div>
    </div>
  )
}
