import { useMemo, useState } from 'react';
import { useStore, publicEvents, me } from '../lib/store';
import { EventCard } from '../components/EventCard';
import { Card, Chip, EmptyState, SectionHead } from '../components/ui';
import { Link } from '../router';
import type { EventItem } from '@cc/core';

export default function Discover() {
  const s = useStore();
  const user = me(s);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [mode, setMode] = useState('');
  const [price, setPrice] = useState('');
  const [tag, setTag] = useState('');

  const all = publicEvents(s);
  const cities = [...new Set(all.map((e) => e.city).filter(Boolean))] as string[];
  const tags = [...new Set(all.flatMap((e) => e.tags))].sort().slice(0, 14);

  const filtered = useMemo(() => {
    return all.filter((e) => {
      if (q && !(`${e.title} ${e.summary} ${e.organizer}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (city && e.city !== city) return false;
      if (mode && e.mode !== mode) return false;
      if (tag && !e.tags.includes(tag)) return false;
      if (price === 'free' && e.price !== 0) return false;
      if (price === 'paid' && (e.price === null || e.price === 0)) return false;
      if (price === 'unknown' && e.price !== null) return false;
      return true;
    });
  }, [all, q, city, mode, price, tag]);

  return (
    <div>
      <SectionHead
        title="Discover upcoming events"
        sub="Community-submitted listings with source links. Always confirm details on the organizer’s page before registering."
        action={user ? <Link to="/app/events/new" className="btn btn-primary">+ Share an event</Link> : <Link to="/auth" className="btn btn-primary">Join to plan with friends</Link>}
      />
      <div className="filters" role="search">
        <input type="search" placeholder="Search events, organizers…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" style={{ minWidth: 220 }} />
        <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city">
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Filter by format">
          <option value="">Any format</option>
          <option value="in_person">In person</option>
          <option value="online">Online</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <select value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Filter by price">
          <option value="">Any price</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="unknown">Price unknown</option>
        </select>
        {(q || city || mode || price || tag) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setCity(''); setMode(''); setPrice(''); setTag(''); }}>Reset</button>
        )}
      </div>
      <div className="checkbox-chips" style={{ marginBottom: 18 }}>
        {tags.map((t) => (
          <Chip key={t} tone={tag === t ? 'accent' : 'outline'} onClick={() => setTag(tag === t ? '' : t)}>{t}</Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={all.length === 0 ? 'Nothing here yet' : 'No events match those filters'}
            body={all.length === 0
              ? 'Be the first: post an event you’re planning to attend — with its source link — and your circle can decide on it together.'
              : 'Try widening the filters, or post the event you were hoping to find.'}
            action={<Link to={user ? '/app/events/new' : '/auth'} className="btn btn-primary">Post an event</Link>}
          />
        </Card>
      ) : (
        <div className="event-grid">
          {filtered.map((e: EventItem) => <EventCard key={e.id} ev={e} />)}
        </div>
      )}
      <p className="small muted" style={{ marginTop: 20 }}>
        Listings are community-submitted and moderation-reviewed. “Planning to attend” is not a ticket, and
        opening a source link never registers you — registration always happens on the organizer’s site.
      </p>
    </div>
  );
}
