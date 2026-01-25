import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should apply default variant', () => {
    const { container } = render(<Button>Default</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('should apply outline variant', () => {
    const { container } = render(<Button variant="outline">Outline</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('border')
  })

  it('should apply ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('hover:bg-accent')
  })

  it('should apply small size', () => {
    const { container } = render(<Button size="sm">Small</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('h-8')
  })

  it('should apply large size', () => {
    const { container } = render(<Button size="lg">Large</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('h-10')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
  })

  it('should accept custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })
})
