import { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PhotoUpload } from './PhotoUpload';
import { api } from '@/services/api';
import { cn } from '@/utils/cn';

export function QuickReportIssue() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!description.trim()) return;
    setSending(true);
    try {
      const wo = await api.workOrders.create({
        title: description.slice(0, 60),
        description,
        category: 'general',
        priority: urgent ? 'high' : 'medium',
      });
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach(f => fd.append('photos', f));
        await api.workOrders.addPhotos(wo.id, fd);
      }
      setDescription('');
      setUrgent(false);
      setFiles([]);
      setOpen(false);
    } catch (err) {
      console.error('Failed to report issue:', err);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 lg:bottom-6',
        )}
      >
        <AlertTriangle className="h-6 w-6" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Report Issue</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            {/* Urgency toggle */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setUrgent(!urgent)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  urgent
                    ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {urgent ? 'Urgent' : 'Normal'}
              </button>
            </div>

            <div className="mt-3">
              <PhotoUpload onChange={setFiles} maxFiles={3} />
            </div>

            <Button
              className="mt-4 w-full"
              loading={sending}
              disabled={!description.trim()}
              onClick={handleSubmit}
            >
              <Send className="h-4 w-4" />
              Submit Report
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
