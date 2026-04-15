import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { WorkOrder } from '@/types';
import { PRIORITY_COLORS } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface WorkOrderCardProps {
  wo: WorkOrder;
}

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'> = {
  open: 'danger',
  assigned: 'info',
  in_progress: 'warning',
  on_hold: 'muted',
  completed: 'success',
  cancelled: 'muted',
};

export function WorkOrderCard({ wo }: WorkOrderCardProps) {
  const navigate = useNavigate();
  const pColors = PRIORITY_COLORS[wo.priority];

  return (
    <button
      onClick={() => navigate(`/maintenance/work-orders/${wo.id}`)}
      className="flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition-all hover:shadow-md"
    >
      {/* Priority color strip */}
      <div className={cn('w-1.5 flex-shrink-0', pColors.bg)} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title + Priority */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{wo.title}</h4>
          <Badge
            variant={wo.priority === 'urgent' ? 'danger' : wo.priority === 'high' ? 'warning' : 'default'}
          >
            {wo.priority}
          </Badge>
        </div>

        {/* Room + Category */}
        <div className="flex flex-wrap items-center gap-2">
          {wo.roomNumber && (
            <span className="text-xs font-medium text-gray-600">Rm {wo.roomNumber}</span>
          )}
          <Badge variant="muted">{wo.category}</Badge>
          <Badge variant={statusBadgeVariant[wo.status] || 'default'}>{wo.status.replace('_', ' ')}</Badge>
        </div>

        {/* Assignee + Age */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{wo.assigneeName || 'Unassigned'}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(wo.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
