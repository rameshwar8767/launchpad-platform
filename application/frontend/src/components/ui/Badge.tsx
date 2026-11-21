import React from 'react'
import { cn } from '../../utils/cn'
import type { TaskPriority, TaskStatus } from '../../types'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: TaskStatus
  priority?: TaskPriority
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  status,
  priority,
  variant = 'default',
  children,
  ...props
}) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700'
  let label = children

  if (status) {
    switch (status) {
      case 'todo':
        badgeStyle = 'bg-sky-950/60 text-sky-400 border-sky-800/50'
        label = label || 'To Do'
        break
      case 'in_progress':
        badgeStyle = 'bg-amber-950/60 text-amber-400 border-amber-800/50'
        label = label || 'In Progress'
        break
      case 'completed':
        badgeStyle = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
        label = label || 'Completed'
        break
      case 'blocked':
        badgeStyle = 'bg-rose-950/60 text-rose-400 border-rose-800/50'
        label = label || 'Blocked'
        break
    }
  } else if (priority) {
    switch (priority) {
      case 'low':
        badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700'
        label = label || 'Low'
        break
      case 'medium':
        badgeStyle = 'bg-blue-950/60 text-blue-400 border-blue-800/50'
        label = label || 'Medium'
        break
      case 'high':
        badgeStyle = 'bg-orange-950/60 text-orange-400 border-orange-800/50'
        label = label || 'High'
        break
      case 'critical':
        badgeStyle = 'bg-red-950/70 text-red-400 border-red-800/60 font-semibold'
        label = label || 'Critical'
        break
    }
  } else {
    switch (variant) {
      case 'success':
        badgeStyle = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
        break
      case 'warning':
        badgeStyle = 'bg-amber-950/60 text-amber-400 border-amber-800/50'
        break
      case 'danger':
        badgeStyle = 'bg-rose-950/60 text-rose-400 border-rose-800/50'
        break
      case 'info':
        badgeStyle = 'bg-indigo-950/60 text-indigo-400 border-indigo-800/50'
        break
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
        badgeStyle,
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}
