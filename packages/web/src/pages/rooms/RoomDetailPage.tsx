import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Wrench, Clock, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { TimelineEntry } from '@/components/shared/TimelineEntry';
import { WorkOrderCard } from '@/components/shared/WorkOrderCard';
import { ROOM_STATUS_LABELS } from '@/utils/constants';
import type { Room, WorkOrder, RoomStatus } from '@/types';

const PIPELINE_STEPS: RoomStatus[] = [
  'checkout_pending', 'vacant_dirty', 'cleaning_in_progress', 'vacant_clean', 'inspected', 'ready', 'occupied',
];

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [pipeline, setPipeline] = useState<{ status: RoomStatus; timestamp: string; user: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.rooms.get(id),
      api.workOrders.list({ roomId: id }),
      api.rooms.pipeline(id),
    ])
      .then(([r, wos, pl]) => {
        setRoom(r);
        setWorkOrders(wos.items ?? []);
        setPipeline(pl);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!room) {
    return <div className="page-container text-sm text-gray-500">Room not found</div>;
  }

  const currentStepIdx = PIPELINE_STEPS.indexOf(room.status);

  return (
    <div className="page-container">
      {/* Back + Header */}
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Room {room.number}</h1>
            <StatusIndicator status={room.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {room.type.replace('_', ' ')} &middot; Floor {room.floor} &middot; {room.zone} Wing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/maintenance/work-orders/new?roomId=${room.id}`)}>
            <Wrench className="h-4 w-4" /> Create WO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Guest info */}
          {room.guestName && (
            <Card>
              <CardHeader title="Current Guest" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{room.guestName}</p>
                  {room.guestId && (
                    <button
                      onClick={() => navigate(`/guests/${room.guestId}`)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View profile
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Pipeline visualization */}
          <Card>
            <CardHeader title="Room Pipeline" />
            <div className="flex items-center overflow-x-auto py-2">
              {PIPELINE_STEPS.map((step, i) => {
                const isActive = i === currentStepIdx;
                const isDone = i < currentStepIdx;
                return (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : isDone
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="mt-1 max-w-[80px] text-center text-[10px] text-gray-500">
                        {ROOM_STATUS_LABELS[step]}
                      </span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity timeline */}
          <Card>
            <CardHeader title="Activity" />
            {pipeline.length === 0 ? (
              <p className="text-sm text-gray-500">No activity recorded</p>
            ) : (
              <div>
                {pipeline.map((entry, i) => (
                  <TimelineEntry
                    key={i}
                    icon={<Clock className="h-4 w-4" />}
                    timestamp={entry.timestamp}
                    user={entry.user}
                    description={`changed status to ${ROOM_STATUS_LABELS[entry.status]}`}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: open work orders */}
        <div>
          <Card>
            <CardHeader
              title="Open Work Orders"
              subtitle={`${workOrders.filter(w => w.status !== 'completed' && w.status !== 'cancelled').length} active`}
            />
            <div className="space-y-3">
              {workOrders
                .filter(w => w.status !== 'completed' && w.status !== 'cancelled')
                .map(wo => (
                  <WorkOrderCard key={wo.id} wo={wo} />
                ))}
              {workOrders.filter(w => w.status !== 'completed' && w.status !== 'cancelled').length === 0 && (
                <p className="text-sm text-gray-500">No open work orders</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
