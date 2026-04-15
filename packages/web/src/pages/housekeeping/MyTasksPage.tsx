import { useEffect, useState, useCallback } from 'react';
import { Lock, Play, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { QuickReportIssue } from '@/components/shared/QuickReportIssue';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/formatters';
import type { HKAssignment } from '@/types';

export function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<HKAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.housekeeping.assignments({ assigneeId: user.id });
      setTasks(data.sort((a, b) => (a.order ?? a.sort_order ?? 0) - (b.order ?? b.sort_order ?? 0)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Timer
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  async function startTask(id: string) {
    try {
      await api.housekeeping.start(id);
      setActiveTimer(id);
      setElapsed(0);
      await loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async function completeTask(id: string) {
    try {
      await api.housekeeping.complete(id);
      setActiveTimer(null);
      setElapsed(0);
      await loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'completed' || t.status === 'inspected');

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500">
          {completed.length}/{tasks.length} completed
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${tasks.length ? (completed.length / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Active task with timer */}
      {inProgress.map(task => (
        <Card key={task.id} className="mb-4 border-2 !border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">Room {task.roomNumber}</span>
                <Badge variant="info">In Progress</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500">Est. {formatDuration(task.estimatedMinutes ?? 0)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-mono font-bold text-blue-600">
                <Clock className="h-5 w-5" />
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              </div>
              <Button size="sm" variant="primary" className="mt-2" onClick={() => completeTask(task.id)}>
                <CheckCircle className="h-4 w-4" /> Complete
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Task list */}
      <div className="space-y-2">
        {pending.map(task => (
          <div
            key={task.id}
            className={cn(
              'flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4',
              task.isFixed && 'border-l-4 border-l-amber-400'
            )}
          >
            <div className="flex items-center gap-3">
              {task.isFixed && <Lock className="h-4 w-4 text-amber-500" />}
              <div>
                <p className="text-sm font-semibold text-gray-900">Room {task.roomNumber}</p>
                <p className="text-xs text-gray-500">Est. {formatDuration(task.estimatedMinutes ?? 0)}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => startTask(task.id)}
              disabled={inProgress.length > 0}
            >
              <Play className="h-4 w-4" /> Start
            </Button>
          </div>
        ))}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Completed</p>
            {completed.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 mb-2"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-gray-600">Room {task.roomNumber}</p>
                </div>
                <Badge variant={task.status === 'inspected' ? 'success' : 'muted'}>
                  {task.status === 'inspected' ? 'Inspected' : 'Done'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickReportIssue />
    </div>
  );
}
