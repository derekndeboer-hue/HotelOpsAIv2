import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface LaborReport {
  headcount_by_role: { role: string; active_staff: number }[];
  hk_tasks_per_hour: { staff_id: string; name: string; tasks_per_hour: number | null }[];
  maint_wo_per_day: { staff_id: string; name: string; wo_per_day: number | null }[];
  overtime_flags: { staff_id: string; overtime_hours: number }[];
}

export function LaborReportPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [from, setFrom] = useState(search.get('from') ?? format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(search.get('to') ?? format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<LaborReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    setError(false);
    (api.reports.labor({ from, to }) as Promise<LaborReport>)
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
        <h1 className="text-2xl font-bold text-gray-900">Labor Report</h1>
        <Button variant="outline" size="sm" onClick={() => api.reports.export('labor', { from, to, format: 'csv' })}>
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
          <Card>
            <CardHeader title="Active Headcount by Role" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 text-right font-medium">Active Staff</th>
                </tr>
              </thead>
              <tbody>
                {report.headcount_by_role.map((r) => (
                  <tr key={r.role} className="border-b border-gray-50">
                    <td className="py-2 pr-4 capitalize">{r.role.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{r.active_staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <CardHeader title="Housekeeper Productivity (tasks/hour)" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 text-right font-medium">Tasks/hr</th>
                </tr>
              </thead>
              <tbody>
                {report.hk_tasks_per_hour.map((r) => (
                  <tr key={r.staff_id} className="border-b border-gray-50">
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 text-right tabular-nums">{r.tasks_per_hour ?? '—'}</td>
                  </tr>
                ))}
                {report.hk_tasks_per_hour.length === 0 && (
                  <tr><td colSpan={2} className="py-6 text-center text-sm text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card>
            <CardHeader title="Maintenance Productivity (WOs/day)" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 text-right font-medium">WOs/day</th>
                </tr>
              </thead>
              <tbody>
                {report.maint_wo_per_day.map((r) => (
                  <tr key={r.staff_id} className="border-b border-gray-50">
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 text-right tabular-nums">{r.wo_per_day ?? '—'}</td>
                  </tr>
                ))}
                {report.maint_wo_per_day.length === 0 && (
                  <tr><td colSpan={2} className="py-6 text-center text-sm text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
            <p className="mt-2 px-4 pb-3 text-xs text-gray-400">
              Overtime tracking requires a shift schedule table — not available in Phase 1.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
