import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import type { RoomStatus } from '@/types';

interface BoardRoom {
  id: string;
  room_number: string;
  floor: number;
  zone: string;
  status: RoomStatus;
  assignment_id: string | null;
  assignment_status: string | null;
  assignee_first_name: string | null;
  assignee_last_name: string | null;
  cleaning_type: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  vacant_dirty: 'bg-rose-100 text-rose-800 border-rose-300',
  cleaning_in_progress: 'bg-amber-100 text-amber-800 border-amber-300',
  inspection_pending: 'bg-blue-100 text-blue-800 border-blue-300',
  vacant_clean: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  vacant_inspected: 'bg-emerald-200 text-emerald-900 border-emerald-400',
  ready_for_checkin: 'bg-emerald-200 text-emerald-900 border-emerald-400',
  occupied: 'bg-slate-100 text-slate-700 border-slate-300',
  out_of_order: 'bg-zinc-300 text-zinc-800 border-zinc-400',
  out_of_service: 'bg-zinc-300 text-zinc-800 border-zinc-400',
};

const TRANSITIONS: Record<string, { value: RoomStatus; label: string }[]> = {
  vacant_dirty: [
    { value: 'cleaning_in_progress' as RoomStatus, label: 'Start Cleaning' },
    { value: 'out_of_service' as RoomStatus, label: 'Out of Service' },
  ],
  cleaning_in_progress: [
    { value: 'inspection_pending' as RoomStatus, label: 'Ready for Inspection' },
    { value: 'vacant_dirty' as RoomStatus, label: 'Back to Dirty' },
  ],
  inspection_pending: [
    { value: 'cleaning_in_progress' as RoomStatus, label: 'Re-clean' },
  ],
  vacant_clean: [
    { value: 'cleaning_in_progress' as RoomStatus, label: 'Re-clean' },
  ],
  out_of_order: [{ value: 'vacant_dirty' as RoomStatus, label: 'Return to Service' }],
  out_of_service: [{ value: 'vacant_dirty' as RoomStatus, label: 'Return to Service' }],
};

const ZONE_OPTIONS = [
  { value: '', label: 'All Zones' },
  { value: 'fleming', label: 'Fleming (27)' },
  { value: 'simonton', label: 'Simonton (17)' },
];

export function HousekeepingBoardPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<BoardRoom[]>([]);
  const [zone, setZone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<BoardRoom | null>(null);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(() => {
    setError('');
    api.housekeeping
      .board(zone ? { zone } : undefined)
      .then((r) => setRooms(r as unknown as BoardRoom[]))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load board'))
      .finally(() => setLoading(false));
  }, [zone]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rooms) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rooms]);

  async function updateStatus(next: RoomStatus) {
    if (!selected) return;
    setMutating(true);
    try {
      await api.housekeeping.updateRoomStatus(selected.id, {
        status: next,
        fromStatus: selected.status,
      });
      setSelected(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setMutating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Housekeeping Board</h1>
          <p className="text-sm text-gray-500">
            {rooms.length} rooms &middot; {counts.vacant_dirty ?? 0} dirty &middot;{' '}
            {counts.cleaning_in_progress ?? 0} cleaning &middot;{' '}
            {counts.inspection_pending ?? 0} pending inspection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={ZONE_OPTIONS}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          />
          <Button variant="outline" onClick={() => navigate('/housekeeping/assignments')}>
            Assignments
          </Button>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {rooms.map((r) => {
            const cls = STATUS_STYLES[r.status] ?? STATUS_STYLES.vacant_clean;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 px-2 py-3 text-center transition-transform hover:scale-105',
                  cls,
                )}
              >
                <div className="text-lg font-bold">{r.room_number}</div>
                <div className="text-[10px] uppercase tracking-wide opacity-80">
                  {r.status.replace(/_/g, ' ')}
                </div>
                {r.assignee_first_name && (
                  <div className="mt-1 truncate text-[10px] opacity-70">
                    {r.assignee_first_name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Room ${selected.room_number}` : ''}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge>{selected.status.replace(/_/g, ' ')}</Badge>
              {selected.zone && <Badge variant="info">{selected.zone}</Badge>}
              {selected.cleaning_type && <Badge>{selected.cleaning_type}</Badge>}
            </div>
            {selected.assignee_first_name && (
              <p className="text-sm text-gray-600">
                Assigned to {selected.assignee_first_name} {selected.assignee_last_name}
              </p>
            )}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-gray-500">Update Status</p>
              {(TRANSITIONS[selected.status] ?? []).map((opt) => (
                <Button
                  key={opt.value}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateStatus(opt.value)}
                  disabled={mutating}
                >
                  {opt.label}
                </Button>
              ))}
              {(TRANSITIONS[selected.status] ?? []).length === 0 && (
                <p className="text-sm text-gray-500">No legal transitions for this status.</p>
              )}
            </div>
            {selected.assignment_id && (
              <Button
                variant="outline"
                onClick={() => navigate(`/housekeeping/inspect/${selected.assignment_id}`)}
              >
                Inspect
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
