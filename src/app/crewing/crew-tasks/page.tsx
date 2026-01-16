'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

const statusColors = {
  TODO: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-yellow-100 text-yellow-800'
};

const taskTypeColors = {
  MCU: 'bg-purple-100 text-purple-800',
  TRAINING: 'bg-indigo-100 text-indigo-800',
  VISA: 'bg-cyan-100 text-cyan-800',
  CONTRACT: 'bg-orange-100 text-orange-800',
  BRIEFING: 'bg-teal-100 text-teal-800'
};

export default function CrewTasksPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<CrewTask[]>([]);
  const [loading, setLoading] = useState(true);
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
      const params = new URLSearchParams();
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.taskType !== 'ALL') params.append('taskType', filters.taskType);

      const response = await fetch(`/api/crew-tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

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
      fetchTasks();
    }
  }, [status, router, fetchTasks]);

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
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/crew-tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Crew Task Management</h1>
        <div className="flex gap-2">
          <Link
            href="/crewing/prepare-joining"
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back to Prepare Joining
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by crew name..."
            value={filters.crewName}
            onChange={e => setFilters({ ...filters, crewName: e.target.value })}
            className="px-4 py-2 border rounded-lg"
            onKeyUp={() => {}}
          />
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="ALL">All Status</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          <select
            value={filters.taskType}
            onChange={e => setFilters({ ...filters, taskType: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="ALL">All Task Types</option>
            <option value="MCU">MCU</option>
            <option value="TRAINING">Training</option>
            <option value="VISA">Visa</option>
            <option value="CONTRACT">Contract</option>
            <option value="BRIEFING">Briefing</option>
          </select>
          <button
            onClick={() => {
              setFilters({ crewName: '', status: 'ALL', taskType: 'ALL', assignedTo: 'ALL' });
              fetchTasks();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{task.crew.fullName}</div>
                      <div className="text-sm text-gray-500">{task.crew.rank}</div>
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
                      <div className="text-xs text-gray-500">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={task.status}
                      onChange={e => handleStatusUpdate(task.id, e.target.value)}
                      disabled={updatingStatus[task.id] ? true : false}
                      className={`px-3 py-1 rounded text-sm font-medium border-0 cursor-pointer ${
                        statusColors[task.status as keyof typeof statusColors] || 'bg-gray-100'
                      } ${updatingStatus[task.id] ? 'opacity-50' : ''}`}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {task.assignedToUser ? (
                      <div>
                        <div className="text-gray-900">{task.assignedToUser.name}</div>
                        <div className="text-xs text-gray-500">{task.assignedToUser.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].map(status => {
          const count = tasks.filter(t => t.status === status).length;
          return (
            <div key={status} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">{status.replace('_', ' ')}</h3>
              <p className="text-3xl font-bold mt-2">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
