import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createWorkOrderSchema } from '@hotel-ops/shared/validators/work-orders';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PhotoUpload } from '@/components/shared/PhotoUpload';
import type { Room, HotelLocation, WOCategory, WOPriority } from '@/types';

const CATEGORY_OPTIONS: { value: WOCategory; label: string }[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'safety', label: 'Safety' },
  { value: 'cosmetic', label: 'Cosmetic' },
  { value: 'general', label: 'General' },
];

const PRIORITY_OPTIONS: { value: WOPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

type TargetMode = 'room' | 'location';

export function CreateWorkOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRoomId = searchParams.get('roomId') || '';
  const preselectedLocationId = searchParams.get('locationId') || '';

  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<HotelLocation[]>([]);
  const [targetMode, setTargetMode] = useState<TargetMode>(
    preselectedLocationId ? 'location' : 'room',
  );
  const [roomId, setRoomId] = useState(preselectedRoomId);
  const [locationId, setLocationId] = useState(preselectedLocationId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WOCategory>('general');
  const [priority, setPriority] = useState<WOPriority>('medium');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.rooms.list().then(setRooms).catch(console.error);
    api.locations.list().then(setLocations).catch(console.error);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      roomId: targetMode === 'room' ? (roomId || undefined) : undefined,
      locationId: targetMode === 'location' ? (locationId || undefined) : undefined,
    };

    const parsed = createWorkOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors.map(e => e.message).join('; '));
      return;
    }

    setSubmitting(true);
    try {
      const wo = await api.workOrders.create(parsed.data);
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach(f => fd.append('photos', f));
        await api.workOrders.addPhotos(wo.id, fd);
      }
      navigate(`/maintenance/work-orders/${wo.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  }

  const roomOptions = [
    { value: '', label: 'No specific room (building-wide)' },
    ...rooms.map(r => ({ value: r.id, label: `Room ${r.number} (${r.zone})` })),
  ];

  const locationOptions = [
    { value: '', label: 'Select a common area or equipment…' },
    ...locations.map(l => ({
      value: l.id,
      label: `${l.name} (${l.locationType.replace('_', ' ')})`,
    })),
  ];

  return (
    <div className="page-container max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Work Order</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Target</label>
            <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setTargetMode('room')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  targetMode === 'room' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Guest Room
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('location')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  targetMode === 'location' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Common Area / Equipment
              </button>
            </div>
          </div>

          {targetMode === 'room' ? (
            <Select
              label="Room"
              options={roomOptions}
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
            />
          ) : (
            <Select
              label="Location"
              options={locationOptions}
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
            />
          )}

          <Input
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={e => setCategory(e.target.value as WOCategory)}
            />
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={e => setPriority(e.target.value as WOPriority)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Detailed description of the issue..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Photos</label>
            <PhotoUpload onChange={setFiles} maxFiles={5} />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>Create Work Order</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
