import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface WOReport {
  by_status: { status: string; count: number }[];
  by_category: { category: string; count: number }[];
  by_priority: { priority: string; count: number }[];
  by_zone: { zone: string | null; count: number }[];
  avg_time_to_acknowledge_hours: number | null;
  avg_time_to_complete_hours: number | null;
  sla_compliance_pct: number | null;
  time_series: { date: string; opens: number; closes: number }[];
}

function BreakdownTable({ title, rows, keyLabel }: {
  title: string;
  rows: { label: string; count: number }[];
  keyLabel: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <Card>
      <CardHeader title={title} />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
            <th className="py-2 pr-4 font-medium">{keyLabel}</th>
            <th className="py-2 text-right font-medium">Count</th>
            <th className="py-2 pl-4 font-medium">Visual</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-gray-50">
              <td className="py-2 pr-4 capitalize">{r.label ?? '—'}</td>
              <td className="py-2 text-right tabular-nums font-semibold">{r.count}</td>
              <td className="py-2 pl-4">
                <div className="h-3 w-32 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function WorkOrdersReportPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [from, setFrom] = useState(search.get('from') ?? format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(search.get('to') ?? format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<WOReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    setError(false);
    (api.reports.workOrders({ from, to }) as Promise<WOReport>)
      .then(setReport)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [from, to]);

  return (
    <div className="page-container">
      <button
        onClick={() => navigate('/reports')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders Report</h1>
        <Button variant="outline" size="sm" onClick={() => api.reports.export('work_orders', { from, to, format: 'csv' })}>
          <Download className="mr-1 h-4 w-4" /> CSV
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner size="lg" /></div>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load report</p>
      ) : report ? (
        <div className="space-y-6">
          {/* SLA + timing summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Avg Time to Ack" value={report.avg_time_to_acknowledge_hours != null ? `${report.avg_time_to_acknowledge_hours}h` : '—'} />
            <StatCard label="Avg Resolution" value={report.avg_time_to_complete_hours != null ? `${report.avg_time_to_complete_hours}h` : '—'} />
            <StatCard label="SLA Compliance" value={report.sla_compliance_pct != null ? `${report.sla_compliance_pct}%` : '—'} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <BreakdownTable title="By Status" rows={report.by_status.map((r) => ({ label: r.status, count: r.count }))} keyLabel="Status" />
            <BreakdownTable title="By Category" rows={report.by_category.map((r) => ({ label: r.category, count: r.count }))} keyLabel="Category" />
            <BreakdownTable title="By Priority" rows={report.by_priority.map((r) => ({ label: r.priority, count: r.count }))} keyLabel="Priority" />
            <BreakdownTable title="By Zone" rows={report.by_zone.map((r) => ({ label: r.zone ?? 'Unknown', count: r.count }))} keyLabel="Zone" />
          </div>

          {/* Time series */}
          <Card>
            <CardHeader title="Opens vs Closes Over Time" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 text-right font-medium">Opens</th>
                    <th className="py-2 text-right font-medium">Closes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.time_series.map((r) => (
                    <tr key={r.date} className="border-b border-gray-50">
                      <td className="py-2 pr-4 tabular-nums">{r.date}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{r.opens}</td>
                      <td className="py-2 text-right tabular-nums">{r.closes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
