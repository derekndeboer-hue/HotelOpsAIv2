import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, Shield } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/formatters';
import type { Equipment } from '@/types';

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [eq, setEq] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.equipment.profile(id).then(setEq).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  if (!eq) return <div className="page-container text-sm text-gray-500">Equipment not found</div>;

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
    operational: 'success', needs_maintenance: 'warning', out_of_service: 'danger', decommissioned: 'muted',
  };

  return (
    <div className="page-container max-w-4xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{eq.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{eq.category} &middot; {eq.location}</p>
        </div>
        <Badge variant={statusVariant[eq.status] || 'muted'} className="text-sm">
          {eq.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Specs */}
        <Card>
          <CardHeader title="Specifications" />
          <dl className="space-y-3 text-sm">
            {eq.manufacturer && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Manufacturer</dt>
                <dd className="font-medium text-gray-900">{eq.manufacturer}</dd>
              </div>
            )}
            {eq.model && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Model</dt>
                <dd className="font-medium text-gray-900">{eq.model}</dd>
              </div>
            )}
            {eq.serialNumber && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Serial Number</dt>
                <dd className="font-mono text-gray-900">{eq.serialNumber}</dd>
              </div>
            )}
            {eq.installDate && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Install Date</dt>
                <dd className="text-gray-900">{formatDate(eq.installDate)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Warranty */}
        <Card>
          <CardHeader title="Warranty & Service" />
          <dl className="space-y-3 text-sm">
            {eq.warrantyExpiry && (
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1 text-gray-500">
                  <Shield className="h-4 w-4" /> Warranty Expiry
                </dt>
                <dd className="font-medium text-gray-900">{formatDate(eq.warrantyExpiry)}</dd>
              </div>
            )}
            {eq.lastServiceDate && (
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1 text-gray-500">
                  <Wrench className="h-4 w-4" /> Last Service
                </dt>
                <dd className="text-gray-900">{formatDate(eq.lastServiceDate)}</dd>
              </div>
            )}
            {eq.nextPmDate && (
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1 text-gray-500">
                  <Calendar className="h-4 w-4" /> Next PM
                </dt>
                <dd className="text-gray-900">{formatDate(eq.nextPmDate)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Photos */}
        {eq.photos.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader title="Photos" />
            <div className="flex flex-wrap gap-3">
              {eq.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-32 w-32 overflow-hidden rounded-lg border border-gray-200">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Button onClick={() => navigate(`/maintenance/work-orders/new?equipmentId=${eq.id}`)}>
          <Wrench className="h-4 w-4" /> Create Work Order
        </Button>
        {eq.status !== 'decommissioned' && (
          <Button variant="danger" onClick={async () => {
            if (confirm('Decommission this equipment?')) {
              await api.equipment.decommission(eq.id, 'Decommissioned by user');
              navigate('/maintenance/equipment');
            }
          }}>
            Decommission
          </Button>
        )}
      </div>
    </div>
  );
}
