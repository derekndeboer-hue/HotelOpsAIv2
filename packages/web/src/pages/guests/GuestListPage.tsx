import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Plus } from 'lucide-react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Guest } from '@/types';

export function GuestListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [vipOnly, setVipOnly] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const results = await api.guests.search(query);
      setGuests(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = vipOnly ? guests.filter(g => g.vip) : guests;

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
        <Button size="sm" onClick={() => navigate('/guests/new')}>
          <Plus className="h-4 w-4" /> Add Guest
        </Button>
      </div>

      {/* Search bar */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} loading={loading}>
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>

      {/* VIP filter */}
      <div className="mb-4">
        <button
          onClick={() => setVipOnly(!vipOnly)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            vipOnly ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${vipOnly ? 'fill-current' : ''}`} /> VIP Only
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner /></div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(guest => (
            <button
              key={guest.id}
              onClick={() => navigate(`/guests/${guest.id}`)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {guest.firstName} {guest.lastName}
                  </p>
                  {guest.email && <p className="mt-0.5 text-xs text-gray-500">{guest.email}</p>}
                </div>
                {guest.vip && (
                  <Badge variant="warning">
                    <Star className="mr-1 h-3 w-3 fill-current" /> VIP
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span>{guest.totalStays} stay{guest.totalStays !== 1 ? 's' : ''}</span>
                {guest.lastStay && <span>Last: {guest.lastStay}</span>}
              </div>
            </button>
          ))}
        </div>
      ) : searched ? (
        <EmptyState title="No guests found" description="Try a different search term" />
      ) : (
        <EmptyState title="Search for guests" description="Enter a name, email, or phone number above" />
      )}
    </div>
  );
}
