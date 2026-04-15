import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { createReservationSchema } from '@hotel-ops/shared/validators/front-desk';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const SOURCE_OPTIONS = [
  { value: 'direct', label: 'Direct' },
  { value: 'ota', label: 'OTA' },
  { value: 'phone', label: 'Phone' },
  { value: 'group', label: 'Group' },
];

const RATE_PLAN_OPTIONS = [
  { value: 'rack', label: 'Rack' },
  { value: 'bar', label: 'BAR' },
  { value: 'package', label: 'Package' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'gov', label: 'Government' },
  { value: 'comp', label: 'Comp' },
];

const ROOM_TYPE_OPTIONS = [
  { value: 'standard_king', label: 'Standard King' },
  { value: 'standard_double', label: 'Standard Double' },
  { value: 'deluxe_king', label: 'Deluxe King' },
  { value: 'suite', label: 'Suite' },
];

export function NewReservationPage() {
  const navigate = useNavigate();
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [roomType, setRoomType] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [ratePlan, setRatePlan] = useState('rack');
  const [source, setSource] = useState('direct');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ confirmationNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const parsed = createReservationSchema.safeParse({
      guestFirstName, guestLastName,
      guestEmail: guestEmail || undefined,
      guestPhone: guestPhone || undefined,
      roomType, arrivalDate, departureDate,
      adults, children,
      ratePlan: ratePlan as any,
      source: source as any,
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
      const result = await api.reservations.create(parsed.data as any);
      setSuccess({ confirmationNumber: result.confirmationNumber });
    } catch (err: any) {
      setServerError(err?.response?.data?.error ?? err?.message ?? 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Reservation Created</h2>
        <p className="mt-2 text-gray-500">Confirmation: {success.confirmationNumber}</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate('/front-desk/check-in')}>Check In Now</Button>
          <Button variant="outline" onClick={() => navigate('/front-desk')}>Front Desk</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Reservation</h1>

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
            <div>
              <Input label="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="guest@example.com" />
              {errors.guestEmail && <p className="mt-1 text-xs text-red-600">{errors.guestEmail}</p>}
            </div>
            <Input label="Phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+1 305 555 0000" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Stay Details" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Arrival Date</label>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              {errors.arrivalDate && <p className="mt-1 text-xs text-red-600">{errors.arrivalDate}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Departure Date</label>
              <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              {errors.departureDate && <p className="mt-1 text-xs text-red-600">{errors.departureDate}</p>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <Select label="Room Type" options={ROOM_TYPE_OPTIONS} value={roomType}
                onChange={(e) => setRoomType(e.target.value)} placeholder="Select type..." />
              {errors.roomType && <p className="mt-1 text-xs text-red-600">{errors.roomType}</p>}
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

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Select label="Rate Plan" options={RATE_PLAN_OPTIONS} value={ratePlan}
              onChange={(e) => setRatePlan(e.target.value)} />
            <Select label="Source" options={SOURCE_OPTIONS} value={source}
              onChange={(e) => setSource(e.target.value)} />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Special Requests</label>
            <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={2}
              placeholder="Dietary needs, room preferences..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </Card>

        {serverError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>}

        <Button type="submit" fullWidth loading={submitting}>Create Reservation</Button>
      </form>
    </div>
  );
}
