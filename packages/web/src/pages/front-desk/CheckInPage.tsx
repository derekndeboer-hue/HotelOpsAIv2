import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle } from 'lucide-react';
import { checkInSchema } from '@hotel-ops/shared/validators/front-desk';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import type { Room } from '@/types';

interface ReservationRow {
  id: string;
  confirmation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  guest_first_name: string;
  guest_last_name: string;
  adults: number;
  children: number;
  room_id?: string;
}

const PAYMENT_OPTIONS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'corporate_account', label: 'Corporate Account' },
  { value: 'comp', label: 'Comp' },
];

export function CheckInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillId = (location.state as any)?.reservationId as string | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [selectedRes, setSelectedRes] = useState<ReservationRow | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [assignedRoomId, setAssignedRoomId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [keyCardsIssued, setKeyCardsIssued] = useState(1);
  const [incidentalsAuthorized, setIncidentalsAuthorized] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillId) {
      api.reservations.get(prefillId).then((r: any) => {
        setSelectedRes(r);
        if (r.room_id) setAssignedRoomId(r.room_id);
        loadRooms(r.check_in_date, r.check_out_date);
      }).catch(console.error);
    }
  }, [prefillId]);

  async function loadRooms(arrivalDate: string, departureDate: string) {
    try {
      const rooms = await api.reservations.availability({ arrivalDate, departureDate });
      setAvailableRooms(rooms as Room[]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.reservations.search({ guestName: searchQuery });
      setReservations((results as unknown as ReservationRow[]).filter((r) => ['confirmed', 'pending'].includes(r.status)));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  function selectReservation(r: ReservationRow) {
    setSelectedRes(r);
    if (r.room_id) setAssignedRoomId(r.room_id);
    loadRooms(r.check_in_date, r.check_out_date);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const parsed = checkInSchema.safeParse({
      reservationId: selectedRes?.id,
      assignedRoomId,
      idVerified: idVerified || undefined,
      paymentMethod,
      incidentalsAuthorized,
      keyCardsIssued,
      arrivalNotes: arrivalNotes || undefined,
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
      await api.frontDesk.checkIn(parsed.data as any);
      setSuccess(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.error ?? err?.message ?? 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Check-in Complete</h2>
        <p className="mt-2 text-gray-500">
          {selectedRes?.guest_first_name} {selectedRes?.guest_last_name} has been checked in.
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

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Check In</h1>

      {!prefillId && (
        <Card className="mb-6">
          <CardHeader title="Find Reservation" />
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
                  onClick={() => selectReservation(r)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedRes?.id === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {r.guest_first_name} {r.guest_last_name}
                    </p>
                    <Badge variant="info">{r.confirmation_number}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatDate(r.check_in_date)} — {formatDate(r.check_out_date)} · {r.adults}A {r.children}C
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
            <CardHeader title="Room Assignment" subtitle={`${availableRooms.length} rooms available`} />
            <Select
              label="Assign Room"
              options={availableRooms.map((r) => ({
                value: r.id,
                label: `Room ${r.number} — ${String(r.type).replace(/_/g, ' ')} (${r.zone ?? ''})`,
              }))}
              value={assignedRoomId}
              onChange={(e) => setAssignedRoomId(e.target.value)}
              placeholder="Select a room..."
            />
            {errors.assignedRoomId && <p className="mt-1 text-xs text-red-600">{errors.assignedRoomId}</p>}
          </Card>

          <Card>
            <CardHeader title="Check-in Details" />
            <div className="space-y-4">
              <Select
                label="Payment Method"
                options={PAYMENT_OPTIONS}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Select payment method..."
              />
              {errors.paymentMethod && <p className="mt-1 text-xs text-red-600">{errors.paymentMethod}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Key Cards Issued</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={keyCardsIssued}
                  onChange={(e) => setKeyCardsIssued(parseInt(e.target.value, 10) || 1)}
                  className="block w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incidentalsAuthorized}
                  onChange={(e) => setIncidentalsAuthorized(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Incidentals authorized</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">ID verified</span>
              </label>
              {errors.idVerified && <p className="text-xs text-red-600">{errors.idVerified}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Arrival Notes</label>
                <textarea
                  value={arrivalNotes}
                  onChange={(e) => setArrivalNotes(e.target.value)}
                  rows={2}
                  placeholder="Any arrival notes..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
          )}

          <Button type="submit" fullWidth loading={submitting}>
            Confirm Check-In
          </Button>
        </form>
      )}
    </div>
  );
}
