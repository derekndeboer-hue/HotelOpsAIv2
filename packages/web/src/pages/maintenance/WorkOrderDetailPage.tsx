import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { TimelineEntry } from '@/components/shared/TimelineEntry';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import type { WorkOrder, WOStatus } from '@/types';

const STATUS_OPTIONS: { value: WOStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wo, setWO] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.workOrders.get(id).then(setWO).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!id || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      const updated = await api.workOrders.addComment(id, comment.trim());
      setWO(updated);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function updateStatus(status: WOStatus) {
    if (!id) return;
    try {
      const updated = await api.workOrders.update(id, { status });
      setWO(updated);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!wo) {
    return <div className="page-container text-sm text-gray-500">Work order not found</div>;
  }

  return (
    <div className="page-container max-w-4xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{wo.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={wo.priority === 'urgent' ? 'danger' : wo.priority === 'high' ? 'warning' : 'default'}>
                {wo.priority}
              </Badge>
              <Badge variant="info">{wo.category}</Badge>
              {(wo.roomNumber ?? wo.room_number) && (
                <Badge variant="muted">Rm {wo.roomNumber ?? wo.room_number}</Badge>
              )}
              {(wo.locationName ?? wo.location_name) && (
                <Badge variant="muted">{wo.locationName ?? wo.location_name}</Badge>
              )}
            </div>
          </div>
          <Select
            options={STATUS_OPTIONS}
            value={wo.status}
            onChange={e => updateStatus(e.target.value as WOStatus)}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader title="Description" />
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{wo.description || 'No description provided.'}</p>
          </Card>

          {/* Photos */}
          {(wo.photos?.length ?? 0) > 0 && (
            <Card>
              <CardHeader title="Photos" />
              <div className="flex flex-wrap gap-3">
                {wo.photos?.map((p, i) => {
                  const url = typeof p === 'string' ? p : p.url;
                  return (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </a>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Comments / Timeline */}
          <Card>
            <CardHeader title="Comments" subtitle={`${wo.comments?.length ?? 0} comments`} />
            <div className="space-y-1">
              {wo.comments?.map(c => (
                <TimelineEntry
                  key={c.id}
                  icon={<MessageSquare className="h-4 w-4" />}
                  timestamp={c.createdAt}
                  user={c.userName}
                  description={c.text}
                />
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={addComment} className="mt-4 flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Button type="submit" size="sm" loading={submittingComment} disabled={!comment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-900">{wo.status.replace('_', ' ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Assignee</dt>
                <dd className="font-medium text-gray-900">{wo.assigneeName || 'Unassigned'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Reported by</dt>
                <dd className="font-medium text-gray-900">{wo.reportedByName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-700">{formatDateTime(wo.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-700">{formatRelativeTime(wo.updatedAt ?? wo.createdAt)}</dd>
              </div>
              {wo.completedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Completed</dt>
                  <dd className="text-gray-700">{formatDateTime(wo.completedAt)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader title="Actions" />
            <div className="space-y-2">
              {wo.status === 'open' && (
                <Button fullWidth variant="primary" onClick={() => updateStatus('in_progress')}>
                  Start Working
                </Button>
              )}
              {wo.status === 'in_progress' && (
                <Button fullWidth variant="primary" onClick={() => updateStatus('completed')}>
                  Mark Complete
                </Button>
              )}
              {wo.status !== 'cancelled' && wo.status !== 'completed' && (
                <Button fullWidth variant="ghost" onClick={() => updateStatus('on_hold')}>
                  Put On Hold
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
