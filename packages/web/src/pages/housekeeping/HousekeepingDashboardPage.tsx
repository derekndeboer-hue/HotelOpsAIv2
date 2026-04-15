import { useEffect, useState } from 'react';
import { Sparkles, Clock, CheckCircle, Ban } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/formatters';
import type { HKDashboardData } from '@/types';

export function HousekeepingDashboardPage() {
  const [data, setData] = useState<HKDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.housekeeping.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!data) {
    return <div className="page-container text-sm text-red-600">Failed to load dashboard</div>;
  }

  const overallPct = data.totalRooms > 0 ? Math.round((data.cleaned / data.totalRooms) * 100) : 0;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
        <p className="text-sm text-gray-500">{data.cleaned} of {data.totalRooms} rooms cleaned ({overallPct}%)</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Cleaned', value: data.cleaned, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'In Progress', value: data.inProgress, icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
          { label: 'Pending', value: data.pending, icon: Clock, color: 'text-blue-600 bg-blue-50' },
          { label: 'Inspected', value: data.inspected, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'DND', value: data.dnd, icon: Ban, color: 'text-purple-600 bg-purple-50' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="!p-4">
              <div className={cn('mb-2 inline-flex rounded-lg p-2', c.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Zone progress */}
        <Card>
          <CardHeader title="Progress by Zone" />
          <div className="space-y-4">
            {data.zones.map(zone => {
              const pct = zone.total > 0 ? Math.round((zone.done / zone.total) * 100) : 0;
              return (
                <div key={zone.zone}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 capitalize">{zone.zone}</span>
                    <span className="text-gray-500">{zone.done}/{zone.total}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Housekeeper progress */}
        <Card>
          <CardHeader title="Housekeeper Progress" />
          <div className="space-y-3">
            {data.housekeepers.map(hk => {
              const pct = hk.total > 0 ? Math.round((hk.completed / hk.total) * 100) : 0;
              return (
                <div key={hk.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{hk.name}</p>
                      <p className="text-xs text-gray-500">{hk.completed}/{hk.total} rooms &middot; Avg {formatDuration(hk.avgMinutes)}</p>
                    </div>
                    <Badge variant={pct === 100 ? 'success' : pct > 50 ? 'info' : 'warning'}>
                      {pct}%
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
