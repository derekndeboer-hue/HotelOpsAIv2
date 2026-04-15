import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle } from 'lucide-react';
import { checkOutSchema } from '@hotel-ops/shared/validators/front-desk';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';

interface CheckedInRow {
  id: string;
  confirmation_number: string;
  check_in_date: string;
  check_out_date: string;
  guest_first_name: string;
  guest_last_name: string;
  room_number: string | null;
}

export function CheckOutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillId = (location.state as any)?.reservationId as string | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [reservations, setReservations] = useState<CheckedInRow[]>([]);
  const [selectedRes, setSelectedRes] = useState<CheckedInRow | null>(null);
  const [finalChargesReviewed, setFinalChargesReviewed] = useState(false);
  const [folioSettled, setFolioSettled] = useState(false);
  const [keyCardsReturned, setKeyCardsReturned] = useState(0);
  const [departureNotes, setDepartureNotes] = useState('');
  const [forwardingAddress, setForwardingAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillId) {
      api.reservations.get(prefillId).then((r: any) => setSelectedRes(r)).catch(console.error);
    }
  }, [prefillId]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.reservations.search({ guestName: searchQuery });
      setReservations((results as unknown as CheckedInRow[]).filter((r: any) => r.status === 'checked_in'));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const parsed = checkOutSchema.safeParse({
      reservationId: selectedRes?.id,
      finalChargesReviewed,
      folioSettled,
      keyCardsReturned,
      departureNotes: departureNotes || undefined,
      forwardingAddress: forwardingAddress || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api.frontDesk.checkOut(parsed.data as any);
      setSuccess(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.error ?? err?.message ?? 'Check-out failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Check-out Complete</h2>
        <p className="mt-2 text-gray-500">
          {selectedRes?.guest_first_name} {selectedRes?.guest_last_name} has been checked out.
        </p>
        <Button className="mt-6" onClick={() => navigate('/front-desk')}>Back to Front Desk</Button>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Check Out</h1>

      {!prefillId && (
        <Card className="mb-6">
          <CardHeader title="Find In-House Guest" />
          <div className="flex gap-2">
            <Input
              placeholder="Guest name or confirmation #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} loading={searching}>
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>

          {reservations.length > 0 && (
            <div className="mt-4 space-y-2">
              {reservations.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRes(r)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedRes?.id === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {r.guest_first_name} {r.guest_last_name}
                    </p>
                    <Badge variant="info">{r.room_number ? `Rm ${r.room_number}` : 'No room'}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Checked in {formatDate(r.check_in_date)} · Due out {formatDate(r.check_out_date)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {selectedRes && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader title="Checkout Summary" />
            <dl className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Guest</dt>
                <dd className="font-medium text-gray-900">
                  {selectedRes.guest_first_name} {selectedRes.guest_last_name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Room</dt>
                <dd className="font-medium text-gray-900">{selectedRes.room_number ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Stay</dt>
                <dd className="text-gray-700">
                  {formatDate(selectedRes.check_in_date)} — {formatDate(selectedRes.check_out_date)}
                </dd>
              </div>
            </dl>

            {/* TODO: Folio detail — wire when folio module is built */}
            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm italic text-gray-500">
              Folio module not yet available. Verify charges manually before settling.
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={finalChargesReviewed}
                  onChange={(e) => setFinalChargesReviewed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Final charges reviewed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={folioSettled}
                  onChange={(e) => setFolioSettled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Folio settled</span>
              </label>
              {errors.folioSettled && <p className="text-xs text-red-600">{errors.folioSettled}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Key Cards Returned</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={keyCardsReturned}
                  onChange={(e) => setKeyCardsReturned(parseInt(e.target.value, 10) || 0)}
                  className="block w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Departure Notes</label>
                <textarea
                  value={departureNotes}
                  onChange={(e) => setDepartureNotes(e.target.value)}
                  rows={2}
                  placeholder="Any departure notes..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Forwarding Address (optional)</label>
                <Input
                  value={forwardingAddress}
                  onChange={(e) => setForwardingAddress(e.target.value)}
                  placeholder="Guest's forwarding address..."
                />
              </div>
            </div>
          </Card>

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
          )}

          <Button type="submit" fullWidth loading={submitting}>
            Confirm Check-Out
          </Button>
        </form>
      )}
    </div>
  );
}
