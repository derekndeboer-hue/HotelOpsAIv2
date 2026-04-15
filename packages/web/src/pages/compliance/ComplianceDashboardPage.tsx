import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Plus } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { ComplianceItem } from '@/types';

export function ComplianceDashboardPage() {
  const [data, setData] = useState<{ overdue: ComplianceItem[]; dueSoon: ComplianceItem[]; current: ComplianceItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.compliance.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  if (!data) return <div className="page-container text-sm text-red-600">Failed to load</div>;

  async function handleComplete(id: string) {
    try {
      await api.compliance.complete(id);
      const updated = await api.compliance.dashboard();
      setData(updated);
    } catch (err) {
      console.error(err);
    }
  }

  const sections: { title: string; items: ComplianceItem[]; icon: typeof AlertTriangle; color: string; badgeVariant: 'danger' | 'warning' | 'success' }[] = [
    { title: 'Overdue', items: data.overdue, icon: AlertTriangle, color: 'text-red-600', badgeVariant: 'danger' },
    { title: 'Due Soon', items: data.dueSoon, icon: Clock, color: 'text-amber-600', badgeVariant: 'warning' },
    { title: 'Current', items: data.current, icon: CheckCircle, color: 'text-green-600', badgeVariant: 'success' },
  ];

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
          <p className="text-sm text-gray-500">
            {data.overdue.length} overdue, {data.dueSoon.length} due soon, {data.current.length} current
          </p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4" /> Add Item</Button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="!p-4">
              <Icon className={cn('mb-2 h-6 w-6', s.color)} />
              <p className="text-2xl font-bold text-gray-900">{s.items.length}</p>
              <p className="text-xs text-gray-500">{s.title}</p>
            </Card>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map(s => (
          <Card key={s.title}>
            <CardHeader title={s.title} subtitle={`${s.items.length} items`} />
            {s.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No items</p>
            ) : (
              <div className="space-y-2">
                {s.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <Badge variant={s.badgeVariant}>{item.category}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Due: {formatDate(item.dueDate)}
                        {item.assigneeName && ` | Assigned: ${item.assigneeName}`}
                      </p>
                    </div>
                    {item.status !== 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => handleComplete(item.id)}>
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
