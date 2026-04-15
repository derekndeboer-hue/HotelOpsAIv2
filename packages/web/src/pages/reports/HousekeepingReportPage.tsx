import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface HKReport {
  completed_count: number;
  avg_clean_minutes_by_type: { type: string; avg_minutes: number | null }[];
  inspection_pass_rate_pct: number | null;
  common_area_completion_pct: number | null;
  dnd_reattempt_count: number;
}

export function HousekeepingReportPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [from, setFrom] = useState(search.get('from') ?? format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(search.get('to') ?? format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<HKReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    setError(false);
    (api.reports.housekeeping({ from, to }) as Promise<HKReport>)
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
        <h1 className="text-2xl font-bold text-gray-900">Housekeeping Report</h1>
        <Button variant="outline" size="sm" onClick={() => api.reports.export('housekeeping', { from, to, format: 'csv' })}>
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
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Completed', value: String(report.completed_count) },
              { label: 'Inspection Pass Rate', value: report.inspection_pass_rate_pct != null ? `${report.inspection_pass_rate_pct}%` : '—' },
              { label: 'Common Area Completion', value: report.common_area_completion_pct != null ? `${report.common_area_completion_pct}%` : '—' },
              { label: 'DND Re-attempts', value: String(report.dnd_reattempt_count) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Avg clean time by type */}
          <Card>
            <CardHeader title="Avg Clean Time by Type (minutes)" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 text-right font-medium">Avg Minutes</th>
                </tr>
              </thead>
              <tbody>
                {report.avg_clean_minutes_by_type.map((r) => (
                  <tr key={r.type} className="border-b border-gray-50">
                    <td className="py-2 pr-4 capitalize">{r.type}</td>
                    <td className="py-2 text-right tabular-nums">
                      {r.avg_minutes != null ? r.avg_minutes : '—'}
                    </td>
                  </tr>
                ))}
                {report.avg_clean_minutes_by_type.length === 0 && (
                  <tr><td colSpan={2} className="py-6 text-center text-sm text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
