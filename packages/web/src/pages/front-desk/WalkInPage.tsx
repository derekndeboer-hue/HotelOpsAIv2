import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { walkInSchema } from '@hotel-ops/shared/validators/front-desk';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Room } from '@/types';

const PAYMENT_OPTIONS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'corporate_account', label: 'Corporate Account' },
  { value: 'comp', label: 'Comp' },
];

const RATE_PLAN_OPTIONS = [
  { value: 'rack', label: 'Rack' },
  { value: 'bar', label: 'BAR' },
  { value: 'package', label: 'Package' },
];

export function WalkInPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [departureDate, setDepartureDate] = useState(tomorrow);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [ratePlan, setRatePlan] = useState('rack');
  const [assignedRoomId, setAssignedRoomId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [keyCardsIssued, setKeyCardsIssued] = useState(1);
  const [incidentalsAuthorized, setIncidentalsAuthorized] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ confirmationNumber: string; roomNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    api.reservations.availability({ arrivalDate: today, departureDate: tomorrow })
      .then((r) => setAvailableRooms(r as Room[]))
      .catch(console.error);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const parsed = walkInSchema.safeParse({
      guestFirstName, guestLastName,
      guestEmail: guestEmail || undefined,
      guestPhone: guestPhone || undefined,
      departureDate, adults, children,
      ratePlan: ratePlan as any,
      assignedRoomId,
      paymentMethod: paymentMethod as any,
      keyCardsIssued,
      incidentalsAuthorized,
      idVerified: idVerified || undefined,
      specialRequests: specialRequests || undefined,
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
      const result = await api.frontDesk.walkIn(parsed.data as any);
      setSuccess({ confirmationNumber: result.confirmationNumber, roomNumber: result.roomNumber });
    } catch (err: any) {
      setServerError(err?.response?.data?.error ?? err?.message ?? 'Walk-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Walk-in Complete</h2>
        <p className="mt-2 text-gray-500">
          Confirmation: {success.confirmationNumber} · Room {success.roomNumber}
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

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Walk-in Check-in</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader title="Guest Information" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="First Name" value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} placeholder="First name" />
              {errors.guestFirstName && <p className="mt-1 text-xs text-red-600">{errors.guestFirstName}</p>}
            </div>
            <div>
              <Input label="Last Name" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} placeholder="Last name" />
              {errors.guestLastName && <p className="mt-1 text-xs text-red-600">{errors.guestLastName}</p>}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="guest@example.com" />
            <Input label="Phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+1 305 555 0000" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Stay & Room" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Departure Date</label>
              <input type="date" min={tomorrow} value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              {errors.departureDate && <p className="mt-1 text-xs text-red-600">{errors.departureDate}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Adults</label>
              <input type="number" min={1} max={10} value={adults} onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Children</label>
              <input type="number" min={0} max={10} value={children} onChange={(e) => setChildren(parseInt(e.target.value, 10) || 0)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div className="mt-4">
            <Select
              label="Assign Room"
              options={availableRooms.map((r) => ({
                value: r.id,
                label: `Room ${r.number} — ${String(r.type).replace(/_/g, ' ')} (${r.zone ?? ''})`,
              }))}
              value={assignedRoomId}
              onChange={(e) => setAssignedRoomId(e.target.value)}
              placeholder={availableRooms.length ? 'Select a room...' : 'No rooms available'}
            />
            {errors.assignedRoomId && <p className="mt-1 text-xs text-red-600">{errors.assignedRoomId}</p>}
          </div>

          <div className="mt-4">
            <Select label="Rate Plan" options={RATE_PLAN_OPTIONS} value={ratePlan}
              onChange={(e) => setRatePlan(e.target.value)} />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Special Requests</label>
            <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={2}
              placeholder="Any special requests..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment & Verification" />
          <div className="space-y-3">
            <Select
              label="Payment Method"
              options={PAYMENT_OPTIONS}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Select payment method..."
            />
            {errors.paymentMethod && <p className="mt-1 text-xs text-red-600">{errors.paymentMethod}</p>}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Key Cards</label>
              <input type="number" min={1} max={4} value={keyCardsIssued}
                onChange={(e) => setKeyCardsIssued(parseInt(e.target.value, 10) || 1)}
                className="block w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={incidentalsAuthorized}
                onChange={(e) => setIncidentalsAuthorized(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm text-gray-700">Incidentals authorized</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={idVerified}
                onChange={(e) => setIdVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm text-gray-700">ID verified</span>
            </label>
            {errors.idVerified && <p className="text-xs text-red-600">{errors.idVerified}</p>}
          </div>
        </Card>

        {serverError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>}

        <Button type="submit" fullWidth loading={submitting}>Complete Walk-in Check-in</Button>
      </form>
    </div>
  );
}
