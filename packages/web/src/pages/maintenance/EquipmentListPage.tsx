import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/formatters';
import type { Equipment } from '@/types';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
  operational: 'success',
  needs_maintenance: 'warning',
  out_of_service: 'danger',
  decommissioned: 'muted',
};

export function EquipmentListPage() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.equipment.list().then(setEquipment).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = equipment.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  // Warranty alerts
  const warrantyAlerts = equipment.filter(e => {
    if (!e.warrantyExpiry) return false;
    const exp = new Date(e.warrantyExpiry);
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return exp.getTime() - now.getTime() < thirtyDays && exp.getTime() > now.getTime();
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
        <Button onClick={() => navigate('/maintenance/equipment/new')}>
          <Plus className="h-4 w-4" /> Add Equipment
        </Button>
      </div>

      {/* Warranty alerts */}
      {warrantyAlerts.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            {warrantyAlerts.length} equipment item(s) with warranty expiring soon
          </div>
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search equipment..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(eq => (
          <button
            key={eq.id}
            onClick={() => navigate(`/maintenance/equipment/${eq.id}`)}
            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-gray-900">{eq.name}</h3>
              <Badge variant={statusVariant[eq.status] || 'muted'}>
                {eq.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-gray-500">{eq.category} &middot; {eq.location}</p>
            {eq.warrantyExpiry && (
              <p className="mt-2 text-xs text-gray-400">Warranty: {formatDate(eq.warrantyExpiry)}</p>
            )}
            {eq.nextPmDate && (
              <p className="text-xs text-gray-400">Next PM: {formatDate(eq.nextPmDate)}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
