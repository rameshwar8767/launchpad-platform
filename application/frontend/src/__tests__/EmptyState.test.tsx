import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EmptyState } from '../components/ui/EmptyState'

describe('EmptyState component', () => {
  it('renders title, description and triggers action', () => {
    const handleAction = vi.fn()
    render(
      <EmptyState
        title="No items found"
        description="Try creating a new task to get started."
        actionLabel="Create Now"
        onAction={handleAction}
      />
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText(/try creating a new task/i)).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /create now/i })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })
})
