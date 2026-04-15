import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import type { Alert } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

const alertStyles: Record<string, { bg: string; border: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'bg-red-50',   border: 'border-red-200',   icon: AlertCircle },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
  medium:   { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: AlertTriangle },
  low:      { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: CheckCircle },
};

export function AlertPanel({ alerts, onAcknowledge }: AlertPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
        No active alerts
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alerts.map(alert => {
        const style = alertStyles[alert.priority] || alertStyles.low;
        const Icon = style.icon;
        return (
          <div
            key={alert.id}
            className={cn('flex items-start gap-3 rounded-lg border p-3', style.bg, style.border)}
          >
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-current opacity-70" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
              <p className="text-xs text-gray-600">{alert.message}</p>
              {alert.roomNumber && (
                <p className="mt-0.5 text-xs text-gray-500">Room {alert.roomNumber}</p>
              )}
              <p className="mt-1 text-[10px] text-gray-400">{formatRelativeTime(alert.createdAt)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
              className="flex-shrink-0"
            >
              Ack
            </Button>
          </div>
        );
      })}
    </div>
  );
}
