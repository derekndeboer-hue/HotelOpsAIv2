import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Sparkles, ClipboardCheck, Users, Clock, BedDouble } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { useRoomBoard } from '@/hooks/useRoomBoard';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { AlertPanel } from '@/components/shared/AlertPanel';
import { ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from '@/utils/constants';
import { formatDuration } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { DashboardKPI, RoomStatus } from '@/types';

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { alerts } = useAlerts();
  const { rooms } = useRoomBoard();
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect non-management to their primary view
    if (user) {
      if (user.role === 'housekeeper') { navigate('/housekeeping/my-tasks', { replace: true }); return; }
      if (user.role === 'technician') { navigate('/maintenance/work-orders', { replace: true }); return; }
      if (user.role === 'front_desk') { navigate('/front-desk', { replace: true }); return; }
      if (user.role === 'concierge') { navigate('/front-desk/concierge', { replace: true }); return; }
    }
  }, [user, navigate]);

  useEffect(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    api.reports.kpi({ from, to }).then((d) => setKpis(d as unknown as DashboardKPI)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Room status counts
  const statusCounts: Partial<Record<RoomStatus, number>> = {};
  rooms.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const kpiCards = [
    {
      label: 'Occupancy',
      value: `${kpis?.occupancy ?? 0}%`,
      icon: BedDouble,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Open Work Orders',
      value: kpis?.openWorkOrders ?? 0,
      icon: Wrench,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Avg Response Time',
      value: formatDuration(kpis?.avgResponseMinutes ?? 0),
      icon: Clock,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'HK Rooms Left',
      value: kpis?.hkRoomsRemaining ?? 0,
      icon: Sparkles,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      label: 'Inspection Pass Rate',
      value: `${kpis?.inspectionPassRate ?? 0}%`,
      icon: ClipboardCheck,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Staff On Duty',
      value: kpis?.staffOnDuty ?? 0,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50',
    },
  ];

  function handleAcknowledge(id: string) {
    // In production, call API to acknowledge
    console.log('Acknowledge alert:', id);
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]}</p>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="!p-4">
              <div className={cn('mb-2 inline-flex rounded-lg p-2', kpi.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Room pipeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Room Pipeline" subtitle={`${rooms.length} total rooms`} />
            <div className="flex flex-wrap gap-2">
              {(Object.entries(statusCounts) as [RoomStatus, number][]).map(([status, count]) => {
                const colors = ROOM_STATUS_COLORS[status];
                return (
                  <button
                    key={status}
                    onClick={() => navigate('/rooms')}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-opacity hover:opacity-80',
                      colors.bg
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
                    <span className={cn('font-medium', colors.text)}>
                      {ROOM_STATUS_LABELS[status]}: {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Alerts */}
        <div>
          <Card>
            <CardHeader title="Active Alerts" subtitle={`${alerts.length} unresolved`} />
            <AlertPanel alerts={alerts.slice(0, 5)} onAcknowledge={handleAcknowledge} />
          </Card>
        </div>
      </div>
    </div>
  );
}
