import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createAssignmentSchema } from '@hotel-ops/shared/validators/housekeeping';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Room, HotelLocation, StaffMember } from '@/types';

type TargetMode = 'room' | 'location';

const CLEANING_TYPES = [
  { value: 'checkout', label: 'Checkout clean' },
  { value: 'stayover', label: 'Stayover' },
  { value: 'deep_clean', label: 'Deep clean' },
  { value: 'touch_up', label: 'Touch up' },
  { value: 'turndown', label: 'Turndown' },
  { value: 'common_area', label: 'Common area' },
];

export function CreateAssignmentPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<HotelLocation[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [targetMode, setTargetMode] = useState<TargetMode>('room');
  const [roomId, setRoomId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [cleaningType, setCleaningType] = useState('checkout');
  const [assignmentDate, setAssignmentDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [priority, setPriority] = useState(3);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.rooms.list().then(setRooms).catch(console.error);
    api.locations.list().then(setLocations).catch(console.error);
    api.staff.list({ active: true }).then(setStaff).catch(console.error);
  }, []);

  useEffect(() => {
    if (targetMode === 'location') setCleaningType('common_area');
    else setCleaningType('checkout');
  }, [targetMode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const payload = {
      roomId: targetMode === 'room' ? roomId || undefined : undefined,
      locationId: targetMode === 'location' ? locationId || undefined : undefined,
      cleaningType: cleaningType as 'checkout',
      assignedTo,
      assignmentDate,
      priority,
      estimatedMinutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
      notes: notes.trim() || undefined,
    };

    const parsed = createAssignmentSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors.map((e) => e.message).join('; '));
      return;
    }

    setSubmitting(true);
    try {
      await api.housekeeping.create([parsed.data]);
      navigate('/housekeeping/assignments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  }

  const roomOptions = [
    { value: '', label: 'Select a room…' },
    ...rooms.map((r) => ({ value: r.id, label: `Room ${r.number} (${r.zone})` })),
  ];

  const locationOptions = [
    { value: '', label: 'Select a common area…' },
    ...locations
      .filter((l) => l.locationType !== 'equipment_area')
      .map((l) => ({
        value: l.id,
        label: `${l.name} (${l.locationType.replace(/_/g, ' ')})`,
      })),
  ];

  const staffOptions = [
    { value: '', label: 'Select housekeeper…' },
    ...staff
      .filter((s) =>
        ['housekeeper', 'room_attendant', 'turndown_attendant'].includes(s.role as string),
      )
      .map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="page-container max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Housekeeping Assignment</h1>

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
                Common Area
              </button>
            </div>
          </div>

          {targetMode === 'room' ? (
            <Select
              label="Room"
              options={roomOptions}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          ) : (
            <Select
              label="Location"
              options={locationOptions}
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            />
          )}

          <Select
            label="Cleaning type"
            options={CLEANING_TYPES}
            value={cleaningType}
            onChange={(e) => setCleaningType(e.target.value)}
          />

          <Select
            label="Assign to"
            options={staffOptions}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
              required
            />
            <Input
              label="Priority (0-10)"
              type="number"
              min={0}
              max={10}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />
          </div>

          <Input
            label="Estimated minutes (optional)"
            type="number"
            min={1}
            max={480}
            value={estimatedMinutes}
            onChange={(e) =>
              setEstimatedMinutes(e.target.value === '' ? '' : Number(e.target.value))
            }
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Optional notes for the housekeeper..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>
              Create Assignment
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
