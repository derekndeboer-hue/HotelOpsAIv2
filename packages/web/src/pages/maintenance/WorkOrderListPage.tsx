import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { WorkOrder, WOStatus, WOPriority, WOCategory } from '@/types';

type Tab = 'my' | 'all' | 'queue';

const priorityVariant: Record<WOPriority, 'danger' | 'warning' | 'default' | 'info'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'default',
  low: 'info',
};

const statusVariant: Record<WOStatus, 'danger' | 'warning' | 'info' | 'success' | 'muted' | 'default'> = {
  open: 'danger',
  assigned: 'info',
  in_progress: 'warning',
  on_hold: 'muted',
  pending_review: 'info',
  completed: 'success',
  cancelled: 'muted',
};

const STATUS_FILTER_OPTIONS: { value: WOStatus | ''; label: string }[] = [
  { value: '', label: 'Any status' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_FILTER_OPTIONS: { value: WOPriority | ''; label: string }[] = [
  { value: '', label: 'Any priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const CATEGORY_FILTER_OPTIONS: { value: WOCategory | ''; label: string }[] = [
  { value: '', label: 'Any category' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'safety', label: 'Safety' },
  { value: 'cosmetic', label: 'Cosmetic' },
  { value: 'general', label: 'General' },
];

function displayTarget(row: WorkOrder): string {
  const roomNumber = row.roomNumber ?? row.room_number;
  if (roomNumber) return `Rm ${roomNumber}`;
  const locName = row.locationName ?? row.location_name;
  if (locName) return locName;
  return '—';
}

function displayAssignee(row: WorkOrder): string {
  if (row.assigneeName) return row.assigneeName;
  if (row.assignee_first_name) return `${row.assignee_first_name} ${row.assignee_last_name ?? ''}`.trim();
  return 'Unassigned';
}

export function WorkOrderListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('my');
  const [status, setStatus] = useState<WOStatus | ''>('');
  const [priority, setPriority] = useState<WOPriority | ''>('');
  const [category, setCategory] = useState<WOCategory | ''>('');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filterParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (status) p.status = status;
    if (priority) p.priority = priority;
    if (category) p.category = category;
    if (tab === 'my' && user?.id) p.assignedTo = user.id;
    return p;
  }, [status, priority, category, tab, user?.id]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const loader: Promise<WorkOrder[]> =
      tab === 'queue'
        ? api.workOrders.queue()
        : api.workOrders.list(filterParams).then(r => r.items);

    loader
      .then(setWorkOrders)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load work orders'))
      .finally(() => setLoading(false));
  }, [tab, filterParams]);

  const columns: Column<WorkOrder & Record<string, unknown>>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.title}</span>,
    },
    {
      key: 'target',
      header: 'Target',
      render: (row) => <span className="text-gray-700">{displayTarget(row)}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (row) => <Badge variant={priorityVariant[row.priority]}>{row.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant[row.status]}>{row.status.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (row) => <span className="text-gray-600">{displayAssignee(row)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-gray-500">
          {formatRelativeTime(row.createdAt ?? row.created_at ?? '')}
        </span>
      ),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'my', label: 'My WOs' },
    { key: 'all', label: 'All' },
    { key: 'queue', label: 'Review Queue' },
  ];

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <Button onClick={() => navigate('/maintenance/work-orders/new')}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'queue' && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            value={status}
            onChange={e => setStatus(e.target.value as WOStatus | '')}
          />
          <Select
            label="Priority"
            options={PRIORITY_FILTER_OPTIONS}
            value={priority}
            onChange={e => setPriority(e.target.value as WOPriority | '')}
          />
          <Select
            label="Category"
            options={CATEGORY_FILTER_OPTIONS}
            value={category}
            onChange={e => setCategory(e.target.value as WOCategory | '')}
          />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card padding={false}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : workOrders.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">
            No work orders match the current filters.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={workOrders as (WorkOrder & Record<string, unknown>)[]}
            keyExtractor={r => r.id}
            onRowClick={r => navigate(`/maintenance/work-orders/${r.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
