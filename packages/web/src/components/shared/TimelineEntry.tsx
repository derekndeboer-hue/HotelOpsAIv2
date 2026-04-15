import type { ReactNode } from 'react';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface TimelineEntryProps {
  icon: ReactNode;
  timestamp: string;
  user: string;
  description: string;
  className?: string;
}

export function TimelineEntry({ icon, timestamp, user, description, className }: TimelineEntryProps) {
  return (
    <div className={cn('relative flex gap-3 pb-6 last:pb-0', className)}>
      {/* Connector line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200 last:hidden" />

      {/* Icon bubble */}
      <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{user}</span>{' '}
          <span className="text-gray-600">{description}</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{formatRelativeTime(timestamp)}</p>
      </div>
    </div>
  );
}
