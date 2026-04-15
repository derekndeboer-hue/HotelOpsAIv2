import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Clock, AlertTriangle, Users, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { WorkOrderCard } from '@/components/shared/WorkOrderCard';
import { formatDuration } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { WorkOrder } from '@/types';

export function MaintenanceDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ open: number; inProgress: number; overdue: number; avgResponse: number; avgCompletion: number } | null>(null);
  const [queue, setQueue] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.workOrders.stats(), api.workOrders.queue()])
      .then(([s, q]) => { setStats(s); setQueue(q); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  // Chart data for WOs by priority
  const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  queue.forEach(wo => { priorityCounts[wo.priority]++; });

  const chartData = [
    { name: 'Critical', count: priorityCounts.critical, fill: '#dc2626' },
    { name: 'High', count: priorityCounts.high, fill: '#f97316' },
    { name: 'Medium', count: priorityCounts.medium, fill: '#fbbf24' },
    { name: 'Low', count: priorityCounts.low, fill: '#93c5fd' },
  ];

  const overdueWOs = queue.filter(wo => wo.status === 'open' || wo.status === 'assigned');

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500">{queue.length} open work orders</p>
        </div>
        <Button onClick={() => navigate('/maintenance/work-orders/new')}>
          <Plus className="h-4 w-4" /> New Work Order
        </Button>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Open', value: stats?.open ?? 0, icon: Wrench, color: 'text-blue-600 bg-blue-50' },
          { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Avg Response', value: formatDuration(stats?.avgResponse ?? 0), icon: Clock, color: 'text-purple-600 bg-purple-50' },
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
        {/* Priority chart */}
        <Card>
          <CardHeader title="Work Orders by Priority" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Bar key={i} dataKey="count" fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Overdue panel */}
        <Card>
          <CardHeader title="Needs Attention" subtitle={`${overdueWOs.length} items`} />
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {overdueWOs.slice(0, 5).map(wo => (
              <WorkOrderCard key={wo.id} wo={wo} />
            ))}
            {overdueWOs.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">All caught up</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
