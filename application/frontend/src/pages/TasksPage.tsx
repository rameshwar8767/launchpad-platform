import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { taskService } from '../services/taskService'
import type { TaskCreatePayload, TaskUpdatePayload } from '../services/taskService'
import type { Task, TaskPriority, TaskStatus } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { TaskModal } from '../components/tasks/TaskModal'

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient()

  // Filter States
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Query Tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', { search, status, priority, overdueOnly, page }],
    queryFn: () =>
      taskService.getTasks({
        search: search || undefined,
        status: (status as TaskStatus) || undefined,
        priority: (priority as TaskPriority) || undefined,
        overdue_only: overdueOnly,
        page,
        page_size: pageSize,
      }),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: TaskCreatePayload) => taskService.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TaskUpdatePayload }) =>
      taskService.updateTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      taskService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleOpenCreate = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Task Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, filter, assign priority, and orchestrate workflow items.
          </p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value)
              setPage(1)
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Overdue Checkbox */}
          <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked)
                setPage(1)
              }}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Overdue Only
            </span>
          </label>
        </div>
      </Card>

      {/* Task List / Table */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Loading tasks...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300">
          Failed to load tasks.
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          title="No tasks match criteria"
          description="Try adjusting your filters, searching for another keyword, or create a new task."
          actionLabel="Create Task"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-3">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-5">Task Details</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Deadline</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="space-y-2">
            {data?.data.map((task) => (
              <Card
                key={task.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center p-4 hover:border-slate-700 transition-colors"
              >
                {/* Title & Description */}
                <div className="lg:col-span-5 min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 truncate">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Status Selector */}
                <div className="lg:col-span-2 flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      statusMutation.mutate({ id: task.id, status: e.target.value as TaskStatus })
                    }
                    className="text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Priority Badge */}
                <div className="lg:col-span-2">
                  <Badge priority={task.priority} />
                </div>

                {/* Due Date */}
                <div className="lg:col-span-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}
                </div>

                {/* Actions */}
                <div className="lg:col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    title="Edit task"
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    title="Delete task"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {data && data.meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 px-2">
              <span className="text-xs text-slate-400">
                Page {data.meta.page} of {data.meta.total_pages} ({data.meta.total_records} total
                items)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.meta.total_pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingTask}
        onSubmit={async (formData) => {
          if (editingTask) {
            await updateMutation.mutateAsync({ id: editingTask.id, payload: formData })
          } else {
            await createMutation.mutateAsync(formData)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
