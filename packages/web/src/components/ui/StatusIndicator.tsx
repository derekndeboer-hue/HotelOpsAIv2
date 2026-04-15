import type { RoomStatus } from '@/types';
import { ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from '@/utils/constants';
import { cn } from '@/utils/cn';

interface StatusIndicatorProps {
  status: RoomStatus;
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ status, showLabel = true, className }: StatusIndicatorProps) {
  const colors = ROOM_STATUS_COLORS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('h-2.5 w-2.5 rounded-full', colors.dot)} />
      {showLabel && (
        <span className={cn('text-xs font-medium', colors.text)}>
          {ROOM_STATUS_LABELS[status]}
        </span>
      )}
    </span>
  );
}
