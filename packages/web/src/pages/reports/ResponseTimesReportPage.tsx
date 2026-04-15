import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface PctRow { p50: number | null; p90: number | null; p99: number | null }

interface RTReport {
  wo_ack: PctRow;
  wo_resolve: PctRow;
  hk_complete: PctRow;
  guest_request_resolve: PctRow;
}

const ROWS: { key: keyof RTReport; label: string }[] = [
  { key: 'wo_ack', label: 'WO Acknowledge' },
  { key: 'wo_resolve', label: 'WO Resolution' },
  { key: 'hk_complete', label: 'HK Completion' },
  { key: 'guest_request_resolve', label: 'Guest Request Resolution' },
];

export function ResponseTimesReportPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [from, setFrom] = useState(search.get('from') ?? format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(search.get('to') ?? format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<RTReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    setError(false);
    (api.reports.responseTimes({ from, to }) as Promise<RTReport>)
      .then(setReport)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [from, to]);

  const fmt = (v: number | null) => (v != null ? `${v} min` : '—');

  return (
    <div className="page-container">
      <button
        onClick={() => navigate('/reports')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Response Times Report</h1>
        <Button variant="outline" size="sm" onClick={() => api.reports.export('response_times', { from, to, format: 'csv' })}>
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
        <Card>
          <CardHeader title="Percentile Response Times (minutes)" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="py-2 pr-6 font-medium">Metric</th>
                  <th className="py-2 pr-4 text-right font-medium">P50</th>
                  <th className="py-2 pr-4 text-right font-medium">P90</th>
                  <th className="py-2 text-right font-medium">P99</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(({ key, label }) => {
                  const row = report[key];
                  return (
                    <tr key={key} className="border-b border-gray-50">
                      <td className="py-3 pr-6 font-medium text-gray-800">{label}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{fmt(row.p50)}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{fmt(row.p90)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.p99)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 pb-3 pt-1 text-xs text-gray-400">
            All times in minutes. Percentiles via native Postgres percentile_cont.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
