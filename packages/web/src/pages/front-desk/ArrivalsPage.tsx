import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/formatters';

interface ArrivalRow {
  id: string;
  confirmation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  first_name: string;
  last_name: string;
  vip_status: string | null;
  room_number: string | null;
  room_type: string | null;
  special_requests: string | null;
}

export function ArrivalsPage() {
  const navigate = useNavigate();
  const [arrivals, setArrivals] = useState<ArrivalRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'checked_in'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.frontDesk.dashboard()
      .then((d) => setArrivals((d as any).arrivals ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? arrivals
    : arrivals.filter((a) => a.status === filter);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="page-container max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Today's Arrivals</h1>
        <Button size="sm" onClick={() => navigate('/front-desk/check-in')}>
          <LogIn className="h-4 w-4" /> Check In
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        {(['all', 'pending', 'checked_in'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'All' : s === 'pending' ? 'Pending' : 'Arrived'}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={`${filtered.length} reservation${filtered.length !== 1 ? 's' : ''}`} />
        <div className="divide-y divide-gray-100">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate('/front-desk/check-in', { state: { reservationId: a.id } })}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {a.first_name} {a.last_name}
                  {a.vip_status && a.vip_status !== 'none' && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">VIP</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {a.confirmation_number} · {formatDate(a.check_out_date)} checkout
                  {a.room_number ? ` · Rm ${a.room_number}` : ' · No room assigned'}
                </p>
                {a.special_requests && (
                  <p className="mt-0.5 text-xs italic text-amber-700">{a.special_requests}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.status === 'checked_in' ? 'success' : 'info'}>
                  {a.status === 'checked_in' ? 'Arrived' : 'Expected'}
                </Badge>
                {a.status !== 'checked_in' && (
                  <Button size="sm" variant="outline">Check In</Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">No arrivals found</p>
          )}
        </div>
      </Card>
    </div>
  );
}
