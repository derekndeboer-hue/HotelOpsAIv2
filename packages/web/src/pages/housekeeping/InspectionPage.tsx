import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { inspectionSchema } from '@hotel-ops/shared/validators/housekeeping';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const FAILURE_REASONS = [
  'Dust on surfaces',
  'Bathroom not cleaned',
  'Bed not made properly',
  'Trash not emptied',
  'Missing amenities',
  'Floor not vacuumed',
  'Streaks on mirrors',
  'Stains visible',
];

export function InspectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<'pass' | 'fail'>('pass');
  const [notes, setNotes] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function toggleReason(r: string) {
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError('');

    const payload = {
      result,
      notes: notes.trim() || undefined,
      failureReasons: result === 'fail' ? reasons : undefined,
    };

    const parsed = inspectionSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors.map((e) => e.message).join('; '));
      return;
    }

    setSubmitting(true);
    try {
      await api.housekeeping.inspect(id, parsed.data);
      navigate('/housekeeping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inspection failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Inspect Clean</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Result</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResult('pass')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 py-4 text-sm font-semibold ${
                  result === 'pass'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <CheckCircle2 className="h-5 w-5" /> Pass
              </button>
              <button
                type="button"
                onClick={() => setResult('fail')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 py-4 text-sm font-semibold ${
                  result === 'fail'
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <XCircle className="h-5 w-5" /> Fail
              </button>
            </div>
          </div>

          {result === 'fail' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Failure reasons (at least one)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FAILURE_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleReason(r)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      reasons.includes(r)
                        ? 'border-red-400 bg-red-50 text-red-800'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Optional inspector notes..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>
              Submit Inspection
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
