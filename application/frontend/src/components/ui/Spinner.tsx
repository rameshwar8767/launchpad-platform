import React from 'react'
import { cn } from '../../utils/cn'

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }

  return (
    <div
      className={cn(
        'rounded-full border-slate-700 border-t-indigo-500 animate-spin',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
