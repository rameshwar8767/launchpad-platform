import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { taskService } from '../services/taskService'
import type { TaskCreatePayload } from '../services/taskService'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { TaskModal } from '../components/tasks/TaskModal'

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => taskService.getDashboardMetrics(),
    refetchInterval: 30000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: TaskCreatePayload) => taskService.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Loading metrics...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p className="text-sm mt-1">
          {(error as any)?.message || 'Failed to connect to backend service.'}
        </p>
      </div>
    )
  }

  const { stats, priority_distribution, status_distribution, recent_tasks } = data.data

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time workload metrics, task distribution, and platform activity.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="md">
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/70 text-indigo-400 border border-indigo-800/60 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </p>
            <h3 className="text-2xl font-black text-white mt-0.5">{stats.total_tasks}</h3>
          </div>
        </Card>

        {/* In Progress */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Progress
            </p>
            <h3 className="text-2xl font-black text-white mt-0.5">{stats.in_progress_tasks}</h3>
          </div>
        </Card>

        {/* Completed */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </p>
            <h3 className="text-2xl font-black text-white mt-0.5">{stats.completed_tasks}</h3>
          </div>
        </Card>

        {/* Overdue */}
        <Card className="flex items-center gap-4 border-rose-900/40 bg-rose-950/10">
          <div className="w-12 h-12 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-800/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Overdue
            </p>
            <h3 className="text-2xl font-black text-rose-200 mt-0.5">{stats.overdue_tasks}</h3>
          </div>
        </Card>
      </div>

      {/* Distribution Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Priority Distribution
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Critical', count: priority_distribution.critical || 0, color: 'bg-red-500' },
              { label: 'High', count: priority_distribution.high || 0, color: 'bg-orange-500' },
              { label: 'Medium', count: priority_distribution.medium || 0, color: 'bg-blue-500' },
              { label: 'Low', count: priority_distribution.low || 0, color: 'bg-slate-500' },
            ].map((p) => {
              const pct = stats.total_tasks > 0 ? Math.round((p.count / stats.total_tasks) * 100) : 0
              return (
                <div key={p.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{p.label}</span>
                    <span className="text-slate-400">
                      {p.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${p.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Workflow Status Breakdown
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'To Do', count: status_distribution.todo || 0, color: 'bg-sky-500' },
              { label: 'In Progress', count: status_distribution.in_progress || 0, color: 'bg-amber-500' },
              { label: 'Completed', count: status_distribution.completed || 0, color: 'bg-emerald-500' },
              { label: 'Blocked', count: status_distribution.blocked || 0, color: 'bg-rose-500' },
            ].map((s) => {
              const pct = stats.total_tasks > 0 ? Math.round((s.count / stats.total_tasks) * 100) : 0
              return (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{s.label}</span>
                    <span className="text-slate-400">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Recent Work Items</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest tasks created or updated in this workspace.
            </p>
          </div>
          <Link
            to="/tasks"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
          >
            View all tasks
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {recent_tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Get started by creating your first task in this workspace."
            actionLabel="Create Task"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-slate-800/80 mt-2">
            {recent_tasks.map((task) => (
              <div
                key={task.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/20 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-200 truncate">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge priority={task.priority} />
                  <Badge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data)
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}
