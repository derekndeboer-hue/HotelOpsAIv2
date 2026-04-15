import { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Send, RefreshCw } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { ScheduleEntry } from '@/types';

export function SchedulePage() {
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    setLoading(true);
    api.schedule.review(dateStr).then(setEntries).catch(console.error).finally(() => setLoading(false));
  }, [dateStr]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const generated = await api.schedule.generate(dateStr);
      setEntries(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await api.schedule.publish(dateStr);
      // Refresh
      const updated = await api.schedule.review(dateStr);
      setEntries(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  }

  const isPublished = entries.length > 0 && entries.every(e => e.published);

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-sm text-gray-500">Manage daily staff schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <RefreshCw className="h-4 w-4" /> Generate
          </Button>
          <Button size="sm" loading={publishing} disabled={entries.length === 0 || isPublished} onClick={handlePublish}>
            <Send className="h-4 w-4" /> Publish
          </Button>
        </div>
      </div>

      {/* Date picker */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => setDate(subDays(date, 1))} className="rounded-lg p-2 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">{format(date, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <button onClick={() => setDate(addDays(date, 1))} className="rounded-lg p-2 hover:bg-gray-100">
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
        {isPublished && <Badge variant="success">Published</Badge>}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner /></div>
      ) : entries.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">No schedule generated for this date</p>
            <Button size="sm" className="mt-4" onClick={handleGenerate}>Generate Schedule</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(entry => (
            <Card key={entry.id}>
              <CardHeader
                title={entry.staffName}
                subtitle={`${entry.shift} shift`}
                action={
                  <Badge variant={entry.published ? 'success' : 'muted'}>
                    {entry.published ? 'Published' : 'Draft'}
                  </Badge>
                }
              />
              <div className="space-y-2">
                {entry.tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{task.description}</p>
                      {task.roomNumber && <p className="text-xs text-gray-500">Rm {task.roomNumber}</p>}
                    </div>
                    <Badge
                      variant={
                        task.status === 'completed' ? 'success' :
                        task.status === 'in_progress' ? 'warning' : 'muted'
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
                {entry.tasks.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">No tasks assigned</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
