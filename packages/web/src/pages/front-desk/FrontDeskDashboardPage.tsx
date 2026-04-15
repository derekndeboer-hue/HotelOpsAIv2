import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, UserPlus, MessageSquare } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from '@/utils/constants';
import { cn } from '@/utils/cn';
import type { RoomStatus } from '@/types';

interface DashboardData {
  arrivals: any[];
  arrivalsCount: number;
  departures: any[];
  departuresCount: number;
  inHouse: number;
  occupancyPct: number;
  totalRooms: number;
  roomsSummary: Record<string, number>;
  openGuestRequests: any[];
}

const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'muted'> = {
  urgent: 'danger',
  high: 'warning',
  normal: 'info',
  low: 'muted',
};

export function FrontDeskDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.frontDesk.dashboard()
      .then((d) => setData(d as unknown as DashboardData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }
  if (!data) {
    return <div className="page-container text-sm text-red-600">Failed to load dashboard.</div>;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Front Desk</h1>
          <p className="text-sm text-gray-500">
            {data.inHouse} in-house · {data.occupancyPct}% occupancy ({data.totalRooms} rooms)
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/front-desk/check-in')}>
            <LogIn className="h-4 w-4" /> Check In
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/front-desk/check-out')}>
            <LogOut className="h-4 w-4" /> Check Out
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/front-desk/walk-in')}>
            <UserPlus className="h-4 w-4" /> Walk-in
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/front-desk/new-reservation')}>
            + Reservation
          </Button>
        </div>
      </div>

      {/* Room status summary */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(data.roomsSummary).map(([status, count]) => {
          const s = status as RoomStatus;
          const colors = ROOM_STATUS_COLORS[s];
          return (
            <div key={status} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1', colors?.bg ?? 'bg-gray-100')}>
              <span className={cn('h-2 w-2 rounded-full', colors?.dot ?? 'bg-gray-400')} />
              <span className={cn('text-xs font-semibold', colors?.text ?? 'text-gray-700')}>
                {ROOM_STATUS_LABELS[s] ?? status.replace(/_/g, ' ')}: {count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Arrivals */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardHeader title="Today's Arrivals" subtitle={`${data.arrivalsCount} reservations`} />
            <Button size="sm" variant="ghost" onClick={() => navigate('/front-desk/arrivals')}>
              View all
            </Button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.arrivals.slice(0, 8).map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate('/front-desk/check-in', { state: { reservationId: a.id } })}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.first_name} {a.last_name}
                    {a.vip_status && a.vip_status !== 'none' && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-xs text-amber-800">VIP</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{a.room_number ? `Rm ${a.room_number}` : 'No room'}</p>
                </div>
                <Badge variant={a.status === 'checked_in' ? 'success' : 'info'}>
                  {a.status === 'checked_in' ? 'Arrived' : 'Expected'}
                </Badge>
              </div>
            ))}
            {data.arrivalsCount === 0 && (
              <p className="py-4 text-center text-sm text-gray-500">No arrivals today</p>
            )}
          </div>
        </Card>

        {/* Departures */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardHeader title="Today's Departures" subtitle={`${data.departuresCount} checkouts`} />
            <Button size="sm" variant="ghost" onClick={() => navigate('/front-desk/departures')}>
              View all
            </Button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.departures.slice(0, 8).map((d: any) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate('/front-desk/check-out', { state: { reservationId: d.id } })}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.first_name} {d.last_name}</p>
                  <p className="text-xs text-gray-500">{d.room_number ? `Rm ${d.room_number}` : ''}</p>
                </div>
                <Badge variant={d.status === 'checked_out' ? 'muted' : 'warning'}>
                  {d.status === 'checked_out' ? 'Done' : 'Pending'}
                </Badge>
              </div>
            ))}
            {data.departuresCount === 0 && (
              <p className="py-4 text-center text-sm text-gray-500">No departures today</p>
            )}
          </div>
        </Card>

        {/* Open Guest Requests */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardHeader
              title="Open Requests"
              subtitle={`${data.openGuestRequests.length} open`}
            />
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.openGuestRequests.slice(0, 8).map((r: any) => (
              <div key={r.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {r.first_name} {r.last_name}
                      {r.room_number && (
                        <span className="ml-1 text-xs text-gray-500">· Rm {r.room_number}</span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-600">{r.description}</p>
                  </div>
                  <Badge variant={(PRIORITY_BADGE[r.priority] ?? 'info') as any}>
                    {r.request_type}
                  </Badge>
                </div>
              </div>
            ))}
            {data.openGuestRequests.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500">No open requests</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
