import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { cn } from '@/utils/cn';
import type { HKAssignment } from '@/types';

type TargetType = '' | 'room' | 'common';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Any status' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'inspection_pending', label: 'Pending inspection' },
  { value: 'inspected', label: 'Inspected' },
  { value: 'failed_inspection', label: 'Failed' },
  { value: 'dnd_pending', label: 'DND pending' },
  { value: 'dnd_escalated', label: 'DND escalated' },
];

const TARGET_OPTIONS: { value: TargetType; label: string }[] = [
  { value: '', label: 'Any target' },
  { value: 'room', label: 'Guest rooms' },
  { value: 'common', label: 'Common areas' },
];

const STATUS_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'muted' | 'default'> = {
  assigned: 'info',
  in_progress: 'warning',
  completed: 'success',
  inspection_pending: 'info',
  inspected: 'success',
  failed_inspection: 'danger',
  dnd_pending: 'warning',
  dnd_escalated: 'danger',
};

function displayTarget(row: HKAssignment): string {
  const rn = row.roomNumber ?? row.room_number;
  if (rn) return `Rm ${rn}`;
  const ln = row.locationName ?? row.location_name;
  if (ln) return ln;
  return '—';
}

function displayAssignee(row: HKAssignment): string {
  if (row.assigneeName) return row.assigneeName;
  if (row.staff_first_name) return `${row.staff_first_name} ${row.staff_last_name ?? ''}`.trim();
  return 'Unassigned';
}

export function AssignmentListPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('');
  const [rows, setRows] = useState<HKAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const filterParams = useMemo(() => {
    const p: Parameters<typeof api.housekeeping.assignments>[0] = { date };
    if (status) p.status = status;
    if (targetType) p.targetType = targetType;
    return p;
  }, [date, status, targetType]);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.housekeeping
      .assignments(filterParams)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filterParams]);

  async function generateSchedule() {
    setGenerating(true);
    setError('');
    try {
      await api.housekeeping.generate({ date, strategy: 'by_zone', includeCommonAreas: true });
      const fresh = await api.housekeeping.assignments(filterParams);
      setRows(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Schedule generation failed');
    } finally {
      setGenerating(false);
    }
  }

  const columns: Column<HKAssignment & Record<string, unknown>>[] = [
    {
      key: 'target',
      header: 'Target',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{displayTarget(row)}</span>
          {row.is_fixed && <Badge variant="warning">Fixed</Badge>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="text-sm capitalize text-gray-700">
          {(row.type ?? row.cleaningType ?? '—').toString().replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status as string] ?? 'default'}>
          {row.status.toString().replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (row) => <span className="text-gray-600">{displayAssignee(row)}</span>,
    },
    {
      key: 'est',
      header: 'Est.',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {row.estimated_minutes ?? row.estimatedMinutes ?? '—'} min
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Housekeeping Assignments</h1>
          <p className="text-sm text-gray-500">{rows.length} items for {date}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateSchedule} loading={generating}>
            <Sparkles className="h-4 w-4" /> Generate Day
          </Button>
          <Button onClick={() => navigate('/housekeeping/assignments/new')}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Select
          label="Target type"
          options={TARGET_OPTIONS}
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as TargetType)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card padding={false}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <div className={cn('flex h-64 items-center justify-center text-sm text-gray-500')}>
            No assignments match the current filters.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows as (HKAssignment & Record<string, unknown>)[]}
            keyExtractor={(r) => r.id}
            onRowClick={(r) => navigate(`/housekeeping/inspect/${r.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
