import { useNavigate } from 'react-router-dom';
import type { Room } from '@/types';
import { ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from '@/utils/constants';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface RoomStatusCardProps {
  room: Room;
}

export function RoomStatusCard({ room }: RoomStatusCardProps) {
  const navigate = useNavigate();
  const colors = ROOM_STATUS_COLORS[room.status];

  return (
    <button
      onClick={() => navigate(`/rooms/${room.id}`)}
      className={cn(
        'flex flex-col rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]',
      )}
    >
      {/* Top: room number + status color block */}
      <div className="flex items-start justify-between">
        <span className="text-xl font-bold text-gray-900">{room.number}</span>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            colors.bg,
            colors.text
          )}
        >
          {ROOM_STATUS_LABELS[room.status]}
        </span>
      </div>

      {/* Guest name */}
      {room.guestName && (
        <p className="mt-1.5 truncate text-sm font-medium text-gray-700">{room.guestName}</p>
      )}

      {/* Assignment */}
      {room.assignedToName && (
        <p className="mt-0.5 truncate text-xs text-gray-500">
          Assigned: {room.assignedToName}
        </p>
      )}

      {/* Last updated */}
      <p className="mt-auto pt-2 text-[10px] text-gray-400">
        {formatRelativeTime(room.lastUpdated)}
      </p>
    </button>
  );
}
