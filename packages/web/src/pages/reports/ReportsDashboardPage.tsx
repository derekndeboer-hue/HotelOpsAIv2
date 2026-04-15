import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { BarChart3, Clock, Home, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';

interface KpiData {
  occupancy_pct: number | null;
  adr: number | null;
  avg_wo_resolution_hours: number | null;
  avg_hk_clean_minutes: number | null;
  guest_request_resolution_median_minutes: number | null;
  open_critical_wo_count: number;
}

const DRILL_LINKS = [
  { label: 'Occupancy', path: '/reports/occupancy' },
  { label: 'Work Orders', path: '/reports/work-orders' },
  { label: 'Housekeeping', path: '/reports/housekeeping' },
  { label: 'Guest Requests', path: '/reports/guest-requests' },
  { label: 'Labor', path: '/reports/labor' },
  { label: 'Response Times', path: '/reports/response-times' },
];

export function ReportsDashboardPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    setError(false);
    api.reports
      .kpi({ from, to })
      .then((d) => setKpi(d as KpiData))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [from, to]);

  const fmt = (v: number | null, suffix = '') =>
    v != null ? `${v}${suffix}` : '—';

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Operational analytics</p>
      </div>

      {/* Date range */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load KPIs</p>
      ) : kpi ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <KpiCard icon={Home} label="Occupancy" value={fmt(kpi.occupancy_pct, '%')} color="blue" />
          <KpiCard
            icon={Clock}
            label="Avg WO Resolution"
            value={fmt(kpi.avg_wo_resolution_hours, 'h')}
            color="amber"
          />
          <KpiCard
            icon={BarChart3}
            label="Avg HK Clean"
            value={fmt(kpi.avg_hk_clean_minutes, ' min')}
            color="green"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Open Critical WOs"
            value={String(kpi.open_critical_wo_count)}
            color={kpi.open_critical_wo_count > 0 ? 'red' : 'gray'}
          />
        </div>
      ) : null}

      {/* Drill-down links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Drill-down reports</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DRILL_LINKS.map((l) => (
            <button
              key={l.path}
              onClick={() => navigate(`${l.path}?from=${from}&to=${to}`)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 hover:shadow-sm transition-shadow"
            >
              {l.label} →
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-500',
  };
  return (
    <Card>
      <div className="p-4">
        <div className={`mb-3 inline-flex rounded-lg p-2 ${colors[color] ?? colors.gray}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}
