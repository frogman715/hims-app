'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { canAccessOfficePath } from '@/lib/office-access';
import { InlineConfirmStrip } from '@/components/feedback/InlineConfirmStrip';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { WorkspaceEmptyState } from '@/components/feedback/WorkspaceEmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface CrewTask {
  id: string;
  crewId: string;
  taskType: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  assignedTo?: string;
  completedAt?: string;
  remarks?: string;
  crew: {
    id: string;
    fullName: string;
    rank: string;
  };
  assignedToUser?: {
    id: string;
    name: string;
    email: string;
  };
}

const taskTypeColors = {
  MCU: 'bg-purple-100 text-purple-800',
  TRAINING: 'bg-indigo-100 text-indigo-800',
  VISA: 'bg-cyan-100 text-cyan-800',
  CONTRACT: 'bg-orange-100 text-orange-800',
  BRIEFING: 'bg-teal-100 text-teal-800'
};

export default function CrewTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<CrewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    crewName: '',
    status: 'ALL',
    taskType: 'ALL',
    assignedTo: 'ALL'
  });
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, string>>({});

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const params = new URLSearchParams();
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.taskType !== 'ALL') params.append('taskType', filters.taskType);

      const response = await fetch(`/api/crew-tasks?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to fetch tasks');
      }

      const data = await response.json();
      let filtered = data;

      if (filters.crewName) {
        filtered = filtered.filter((t: CrewTask) =>
          t.crew.fullName.toLowerCase().includes(filters.crewName.toLowerCase())
        );
      }

      if (filters.assignedTo !== 'ALL' && filters.assignedTo) {
        filtered = filtered.filter((t: CrewTask) => t.assignedTo === filters.assignedTo);
      }

      setTasks(filtered);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setLoadError(error instanceof Error ? error.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      const allowed = canAccessOfficePath(
        '/api/crew-tasks',
        [...(session?.user?.roles ?? []), session?.user?.role ?? ''].filter(Boolean),
        session?.user?.isSystemAdmin === true,
        'GET'
      );

      if (!allowed) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
      fetchTasks();
    }
  }, [status, session, router, fetchTasks]);

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [taskId]: newStatus }));

      const response = await fetch(`/api/crew-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update task');

      setTasks(tasks.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined }
          : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [taskId]: '' }));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/crew-tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(tasks.filter(t => t.id !== taskId));
      setPendingDeleteTaskId(null);
      setFeedback({ tone: 'success', message: 'Task removed from the support queue.' });
    } catch (error) {
      console.error('Error deleting task:', error);
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Task could not be removed.' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-slate-600">Loading tasks...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <section className="surface-card border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Access to crew task management is restricted for your role.
      </section>
    );
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Support Queue</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Crew task management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Support queue for operational follow-up items connected to crew preparation and desk actions.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.push('/crewing/prepare-joining')}>
            Back to prepare joining
          </Button>
        </div>
      </section>

      <section className="surface-card border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Support queue only. Update task status here when office follow-up changes, but only delete a task if it was created by mistake and is no longer needed in the live queue.
      </section>

      {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}

      {pendingDeleteTaskId ? (
        <InlineConfirmStrip
          tone="error"
          title="Delete this task?"
          message="Remove the task only when it was created by mistake and should not remain in the live support queue."
          confirmLabel="Confirm Delete"
          cancelLabel="Keep Task"
          onCancel={() => setPendingDeleteTaskId(null)}
          onConfirm={() => handleDeleteTask(pendingDeleteTaskId)}
        />
      ) : null}

      {loadError ? (
        <section className="surface-card border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {loadError}
        </section>
      ) : null}

      <section className="surface-card p-5">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="text"
            label="Crew name"
            placeholder="Search by crew name..."
            value={filters.crewName}
            onChange={e => setFilters({ ...filters, crewName: e.target.value })}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'ALL', label: 'All task statuses' },
              { value: 'TODO', label: 'TODO' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'BLOCKED', label: 'Blocked' },
            ]}
          />
          <Select
            label="Task type"
            value={filters.taskType}
            onChange={e => setFilters({ ...filters, taskType: e.target.value })}
            options={[
              { value: 'ALL', label: 'All task categories' },
              { value: 'MCU', label: 'MCU' },
              { value: 'TRAINING', label: 'Training' },
              { value: 'VISA', label: 'Visa' },
              { value: 'CONTRACT', label: 'Contract' },
              { value: 'BRIEFING', label: 'Briefing' },
            ]}
          />
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setFilters({ crewName: '', status: 'ALL', taskType: 'ALL', assignedTo: 'ALL' });
                fetchTasks();
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Crew</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Task Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Due Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Assigned To</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8">
                  <WorkspaceEmptyState
                    title="No support tasks in this view"
                    message="Adjust the current filters or add a new operational task when work needs follow-up."
                  />
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div>
                      <div className="font-medium text-slate-900">{task.crew.fullName}</div>
                      <div className="text-sm text-slate-500">{task.crew.rank}</div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${taskTypeColors[task.taskType as keyof typeof taskTypeColors] || 'bg-gray-100'}`}>
                      {task.taskType}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-slate-500">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-2">
                      <StatusBadge status={task.status} />
                      <select
                        value={task.status}
                        onChange={e => handleStatusUpdate(task.id, e.target.value)}
                        disabled={updatingStatus[task.id] ? true : false}
                        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 ${updatingStatus[task.id] ? 'opacity-50' : ''}`}
                      >
                        <option value="TODO">Open Task</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {task.assignedToUser ? (
                      <div>
                        <div className="text-slate-900">{task.assignedToUser.name}</div>
                        <div className="text-xs text-slate-500">{task.assignedToUser.email}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setPendingDeleteTaskId(task.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete Task
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].map(status => {
          const count = tasks.filter(t => t.status === status).length;
          return (
            <div key={status} className="surface-card p-4">
              <h3 className="text-sm font-medium text-slate-500">{status.replace('_', ' ')}</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
