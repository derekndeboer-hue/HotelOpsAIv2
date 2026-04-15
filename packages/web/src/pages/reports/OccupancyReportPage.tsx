import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface OccupancyRow {
  date: string;
  occupied_rooms: number;
  total_rooms: number;
  occupancy_pct: number;
}

export function OccupancyReportPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [from, setFrom] = useState(search.get('from') ?? format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(search.get('to') ?? format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<OccupancyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    setError(false);
    (api.reports.occupancy({ from, to }) as unknown as Promise<OccupancyRow[]>)
      .then(setRows)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [from, to]);

  const maxPct = Math.max(...rows.map((r) => r.occupancy_pct), 1);

  return (
    <div className="page-container">
      <button
        onClick={() => navigate('/reports')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Occupancy Report</h1>
        <Button variant="outline" size="sm" onClick={() => api.reports.export('occupancy', { from, to, format: 'csv' })}>
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
      ) : (
        <Card>
          <CardHeader title="Daily Occupancy" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium text-right">Occupied</th>
                  <th className="py-2 pr-4 font-medium text-right">Total</th>
                  <th className="py-2 font-medium text-right">Occ %</th>
                  <th className="py-2 pl-4 font-medium">Visual</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date} className="border-b border-gray-50">
                    <td className="py-2 pr-4 tabular-nums">{r.date}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.occupied_rooms}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.total_rooms}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">
                      {r.occupancy_pct}%
                    </td>
                    <td className="py-2 pl-4">
                      <div className="h-3 w-48 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${(r.occupancy_pct / maxPct) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                      No data for selected range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
