import { useState, useMemo } from 'react';
import type { Room, RoomStatus } from '@/types';
import { ROOM_STATUS_LABELS } from '@/utils/constants';
import { Select } from '@/components/ui/Select';
import { RoomStatusCard } from './RoomStatusCard';

interface RoomGridProps {
  rooms: Room[];
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const FLOOR_OPTIONS = [
  { value: '', label: 'All Floors' },
  { value: '1', label: 'Floor 1' },
  { value: '2', label: 'Floor 2' },
  { value: '3', label: 'Floor 3' },
  { value: '4', label: 'Floor 4' },
];

const ZONE_OPTIONS = [
  { value: '', label: 'All Zones' },
  { value: 'north', label: 'North Wing' },
  { value: 'south', label: 'South Wing' },
  { value: 'east', label: 'East Wing' },
  { value: 'west', label: 'West Wing' },
  { value: 'main', label: 'Main Building' },
];

export function RoomGrid({ rooms }: RoomGridProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  const filtered = useMemo(() => {
    return rooms.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (floorFilter && r.floor !== Number(floorFilter)) return false;
      if (zoneFilter && r.zone !== zoneFilter) return false;
      return true;
    });
  }, [rooms, statusFilter, floorFilter, zoneFilter]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-40">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RoomStatus | '')}
          />
        </div>
        <div className="w-32">
          <Select
            options={FLOOR_OPTIONS}
            value={floorFilter}
            onChange={e => setFloorFilter(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            options={ZONE_OPTIONS}
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
          />
        </div>
        <span className="self-center text-sm text-gray-500">
          {filtered.length} of {rooms.length} rooms
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map(room => (
          <RoomStatusCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
