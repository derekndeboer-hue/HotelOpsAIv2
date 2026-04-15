import { useEffect, useState } from 'react';
import { MapPin, Phone, Globe, Star } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { ConciergeEntry } from '@/types';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'tour', label: 'Tours & Activities' },
  { value: 'transport', label: 'Transportation' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'water_sports', label: 'Water Sports' },
  { value: 'attraction', label: 'Attractions' },
];

export function ConciergePage() {
  const [directory, setDirectory] = useState<ConciergeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [inquiryGuest, setInquiryGuest] = useState('');
  const [inquiryQuery, setInquiryQuery] = useState('');

  useEffect(() => {
    api.concierge.directory({ category: category || undefined, q: search || undefined })
      .then(setDirectory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search]);

  async function handleInquiry() {
    if (!inquiryGuest || !inquiryQuery) return;
    try {
      await api.concierge.inquiry({ guestId: inquiryGuest, query: inquiryQuery });
      setInquiryGuest('');
      setInquiryQuery('');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Concierge</h1>
        <p className="text-sm text-gray-500">Key West directory and guest services</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Directory browser */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Local Directory" subtitle={`${directory.length} listings`} />
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search directory..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Select
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center"><Spinner /></div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {directory.map(entry => (
                  <div key={entry.id} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{entry.name}</h3>
                        <Badge variant="muted" className="mt-1">{entry.category}</Badge>
                      </div>
                      {entry.rating && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium">{entry.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{entry.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      {entry.address && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.address}</span>
                      )}
                      {entry.phone && (
                        <a href={`tel:${entry.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Phone className="h-3 w-3" />{entry.phone}
                        </a>
                      )}
                      {entry.website && (
                        <a href={entry.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Globe className="h-3 w-3" />Website
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {directory.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-500">No results found</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Inquiry form */}
        <div>
          <Card>
            <CardHeader title="Guest Inquiry" />
            <div className="space-y-4">
              <Input
                label="Guest ID"
                value={inquiryGuest}
                onChange={e => setInquiryGuest(e.target.value)}
                placeholder="Guest ID or name"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Request</label>
                <textarea
                  value={inquiryQuery}
                  onChange={e => setInquiryQuery(e.target.value)}
                  rows={4}
                  placeholder="What is the guest looking for?"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <Button fullWidth onClick={handleInquiry} disabled={!inquiryGuest || !inquiryQuery}>
                Submit Inquiry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
