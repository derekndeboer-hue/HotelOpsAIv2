import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/formatters';

interface DepartureRow {
  id: string;
  confirmation_number: string;
  check_out_date: string;
  status: string;
  first_name: string;
  last_name: string;
  vip_status: string | null;
  room_number: string | null;
  room_type: string | null;
}

export function DeparturesPage() {
  const navigate = useNavigate();
  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.frontDesk.dashboard()
      .then((d) => setDepartures((d as any).departures ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="page-container max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Today's Departures</h1>
        <Button size="sm" variant="outline" onClick={() => navigate('/front-desk/check-out')}>
          <LogOut className="h-4 w-4" /> Check Out
        </Button>
      </div>

      <Card>
        <CardHeader title={`${departures.length} departure${departures.length !== 1 ? 's' : ''}`} />
        <div className="divide-y divide-gray-100">
          {departures.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate('/front-desk/check-out', { state: { reservationId: d.id } })}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {d.first_name} {d.last_name}
                  {d.vip_status && d.vip_status !== 'none' && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">VIP</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {d.confirmation_number}
                  {d.room_number ? ` · Rm ${d.room_number}` : ''}
                  {d.room_type ? ` · ${d.room_type.replace(/_/g, ' ')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.status === 'checked_out' ? 'muted' : 'warning'}>
                  {d.status === 'checked_out' ? 'Done' : 'Pending'}
                </Badge>
                {d.status !== 'checked_out' && (
                  <Button size="sm" variant="outline">Check Out</Button>
                )}
              </div>
            </div>
          ))}
          {departures.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">No departures today</p>
          )}
        </div>
      </Card>
    </div>
  );
}
