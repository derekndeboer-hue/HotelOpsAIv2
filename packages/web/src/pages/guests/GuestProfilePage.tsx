import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Mail, Phone, User, ClipboardList, MessageSquare, MapPin } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';
import type { Guest, GuestPractice, Interaction, ConciergeInquiry } from '@/types';

type Tab = 'info' | 'stays' | 'practices' | 'interactions' | 'concierge';

export function GuestProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [practices, setPractices] = useState<GuestPractice[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [conciergeHistory, setConciergeHistory] = useState<ConciergeInquiry[]>([]);
  const [tab, setTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.guests.profile(id),
      api.guests.practices(id),
      api.frontDesk.interactions({ guestId: id }),
      api.concierge.history(id),
    ])
      .then(([g, p, i, c]) => {
        setGuest(g);
        setPractices(p);
        setInteractions(i);
        setConciergeHistory(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  if (!guest) return <div className="page-container text-sm text-gray-500">Guest not found</div>;

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'info', label: 'Info', icon: User },
    { key: 'stays', label: 'Stays', icon: ClipboardList },
    { key: 'practices', label: 'Practices', icon: Star },
    { key: 'interactions', label: 'Interactions', icon: MessageSquare },
    { key: 'concierge', label: 'Concierge', icon: MapPin },
  ];

  return (
    <div className="page-container max-w-4xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
          {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{guest.firstName} {guest.lastName}</h1>
            {guest.vip && <Badge variant="warning"><Star className="mr-1 h-3 w-3 fill-current" />VIP</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
            {guest.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{guest.email}</span>}
            {guest.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{guest.phone}</span>}
            <span>{guest.totalStays} total stays</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'info' && (
        <Card>
          <CardHeader title="Guest Information" action={<Button variant="outline" size="sm">Edit</Button>} />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium">{guest.firstName} {guest.lastName}</dd></div>
            {guest.email && <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{guest.email}</dd></div>}
            {guest.phone && <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{guest.phone}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-500">VIP</dt><dd>{guest.vip ? 'Yes' : 'No'}</dd></div>
            {guest.notes && <div><dt className="text-gray-500 mb-1">Notes</dt><dd className="text-gray-700 whitespace-pre-wrap">{guest.notes}</dd></div>}
            {guest.preferences && Object.keys(guest.preferences).length > 0 && (
              <div>
                <dt className="text-gray-500 mb-1">Preferences</dt>
                <dd className="flex flex-wrap gap-2">
                  {Object.entries(guest.preferences).map(([k, v]) => (
                    <Badge key={k} variant="info">{k}: {v}</Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {tab === 'practices' && (
        <Card>
          <CardHeader title="Guest Practices" subtitle={`${practices.length} recorded`} action={<Button size="sm">Add</Button>} />
          {practices.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No practices recorded</p>
          ) : (
            <div className="space-y-3">
              {practices.map(p => (
                <div key={p.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="info">{p.category}</Badge>
                    <span className="text-xs text-gray-400">{p.createdAt}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{p.description}</p>
                  <p className="mt-1 text-xs text-gray-500">Reported by: {p.reportedBy}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'interactions' && (
        <Card>
          <CardHeader title="Interactions" subtitle={`${interactions.length} recorded`} />
          {interactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No interactions</p>
          ) : (
            <div className="space-y-3">
              {interactions.map(i => (
                <div key={i.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={i.type === 'complaint' ? 'danger' : i.type === 'request' ? 'warning' : 'info'}>
                      {i.type}
                    </Badge>
                    <Badge variant={i.status === 'resolved' ? 'success' : 'warning'}>{i.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{i.description}</p>
                  <p className="mt-1 text-xs text-gray-500">By: {i.staffName}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'stays' && (
        <Card>
          <CardHeader title="Stay History" />
          <p className="py-8 text-center text-sm text-gray-500">{guest.totalStays} total stays on record</p>
        </Card>
      )}

      {tab === 'concierge' && (
        <Card>
          <CardHeader title="Concierge History" subtitle={`${conciergeHistory.length} inquiries`} />
          {conciergeHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No concierge requests</p>
          ) : (
            <div className="space-y-3">
              {conciergeHistory.map(c => (
                <div key={c.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="text-sm font-medium text-gray-900">{c.query}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={c.status === 'booked' ? 'success' : c.status === 'open' ? 'warning' : 'muted'}>
                      {c.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{c.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
