import { useEffect, useState } from 'react';
import { Play, CheckCircle, Clock, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';
import type { ScheduleEntry } from '@/types';

export function MySchedulePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    api.schedule.my({ date: format(new Date(), 'yyyy-MM-dd') })
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeTaskId) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [activeTaskId]);

  async function handleClock(action: 'in' | 'out') {
    try {
      await api.schedule.clock(action);
      setClockedIn(action === 'in');
    } catch (err) {
      console.error(err);
    }
  }

  async function startTask(entryId: string, taskId: string) {
    try {
      await api.schedule.updateTask(entryId, taskId, 'in_progress');
      setActiveTaskId(taskId);
      setElapsed(0);
      const updated = await api.schedule.my({ date: format(new Date(), 'yyyy-MM-dd') });
      setEntries(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function completeTask(entryId: string, taskId: string) {
    try {
      await api.schedule.updateTask(entryId, taskId, 'completed');
      setActiveTaskId(null);
      setElapsed(0);
      const updated = await api.schedule.my({ date: format(new Date(), 'yyyy-MM-dd') });
      setEntries(updated);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  const entry = entries[0]; // Today's schedule

  return (
    <div className="page-container max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Clock in/out */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Status</p>
            <p className={cn('text-lg font-bold', clockedIn ? 'text-green-600' : 'text-gray-400')}>
              {clockedIn ? 'Clocked In' : 'Clocked Out'}
            </p>
          </div>
          <Button
            variant={clockedIn ? 'danger' : 'primary'}
            onClick={() => handleClock(clockedIn ? 'out' : 'in')}
          >
            {clockedIn ? <><LogOut className="h-4 w-4" /> Clock Out</> : <><LogIn className="h-4 w-4" /> Clock In</>}
          </Button>
        </div>
      </Card>

      {!entry ? (
        <Card>
          <div className="py-12 text-center text-sm text-gray-500">No schedule for today</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {entry.tasks.map(task => {
            const isActive = task.id === activeTaskId;
            return (
              <Card
                key={task.id}
                className={cn(isActive && 'border-2 !border-blue-500')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{task.description}</p>
                    {task.roomNumber && <p className="text-xs text-gray-500">Room {task.roomNumber}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="flex items-center gap-1 font-mono text-sm font-bold text-blue-600">
                        <Clock className="h-4 w-4" />
                        {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                      </span>
                    )}
                    {task.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => startTask(entry.id, task.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button size="sm" onClick={() => completeTask(entry.id, task.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Badge variant="success">Done</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
