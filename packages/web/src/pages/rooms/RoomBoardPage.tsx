import { useRoomBoard } from '@/hooks/useRoomBoard';
import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '@/utils/constants';
import { RoomGrid } from '@/components/shared/RoomGrid';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';
import type { RoomStatus } from '@/types';

export function RoomBoardPage() {
  const { rooms, loading, error } = useRoomBoard();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Error: {error}</div>
      </div>
    );
  }

  // Status summary
  const counts: Partial<Record<RoomStatus, number>> = {};
  rooms.forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Room Board</h1>
        <p className="text-sm text-gray-500">{rooms.length} rooms &middot; Real-time updates</p>
      </div>

      {/* Summary bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.entries(counts) as [RoomStatus, number][]).map(([status, count]) => {
          const colors = ROOM_STATUS_COLORS[status];
          return (
            <div
              key={status}
              className={cn('flex items-center gap-1.5 rounded-full px-3 py-1', colors.bg)}
            >
              <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
              <span className={cn('text-xs font-semibold', colors.text)}>
                {ROOM_STATUS_LABELS[status]}: {count}
              </span>
            </div>
          );
        })}
      </div>

      <RoomGrid rooms={rooms} />
    </div>
  );
}
