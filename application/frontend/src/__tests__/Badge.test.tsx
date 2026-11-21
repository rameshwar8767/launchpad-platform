import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '../components/ui/Badge'

describe('Badge component', () => {
  it('renders status badges with appropriate text', () => {
    const { rerender } = render(<Badge status="todo" />)
    expect(screen.getByText(/to do/i)).toBeInTheDocument()

    rerender(<Badge status="in_progress" />)
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()

    rerender(<Badge status="completed" />)
    expect(screen.getByText(/completed/i)).toBeInTheDocument()

    rerender(<Badge status="blocked" />)
    expect(screen.getByText(/blocked/i)).toBeInTheDocument()
  })

  it('renders priority badges with appropriate text', () => {
    const { rerender } = render(<Badge priority="critical" />)
    expect(screen.getByText(/critical/i)).toBeInTheDocument()

    rerender(<Badge priority="high" />)
    expect(screen.getByText(/high/i)).toBeInTheDocument()

    rerender(<Badge priority="medium" />)
    expect(screen.getByText(/medium/i)).toBeInTheDocument()

    rerender(<Badge priority="low" />)
    expect(screen.getByText(/low/i)).toBeInTheDocument()
  })
})
