import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface GRReport {
  by_type: { request_type: string; count: number }[];
  by_destination: { routed_to: string | null; count: number }[];
  median_resolution_minutes: number | null;
  auto_routed_to_wo_pct: number | null;
  open_count: number;
}

export function GuestRequestsReportPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [from, setFrom] = useState(search.get('from') ?? format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(search.get('to') ?? format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<GRReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    setError(false);
    (api.reports.guestRequests({ from, to }) as Promise<GRReport>)
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
        <h1 className="text-2xl font-bold text-gray-900">Guest Requests Report</h1>
        <Button variant="outline" size="sm" onClick={() => api.reports.export('guest_requests', { from, to, format: 'csv' })}>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Open Requests" value={String(report.open_count)} />
            <StatCard label="Median Resolution" value={report.median_resolution_minutes != null ? `${report.median_resolution_minutes} min` : '—'} />
            <StatCard label="Auto-routed to Maint." value={report.auto_routed_to_wo_pct != null ? `${report.auto_routed_to_wo_pct}%` : '—'} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="By Type" />
              <SimpleTable rows={report.by_type.map((r) => [r.request_type, r.count])} headers={['Type', 'Count']} />
            </Card>
            <Card>
              <CardHeader title="By Destination" />
              <SimpleTable rows={report.by_destination.map((r) => [r.routed_to ?? '—', r.count])} headers={['Routed To', 'Count']} />
            </Card>
          </div>
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

function SimpleTable({ rows, headers }: { rows: [string | number, string | number][]; headers: [string, string] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
          <th className="py-2 pr-4 font-medium">{headers[0]}</th>
          <th className="py-2 text-right font-medium">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b border-gray-50">
            <td className="py-2 pr-4 capitalize">{k}</td>
            <td className="py-2 text-right tabular-nums font-semibold">{v}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={2} className="py-6 text-center text-sm text-gray-400">No data</td></tr>
        )}
      </tbody>
    </table>
  );
}
