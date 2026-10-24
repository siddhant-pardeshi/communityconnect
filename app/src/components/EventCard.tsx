import type { EventItem } from '../lib/types';
import { useStore, attendeesOf, backgroundAgg, me } from '../lib/store';
import { fmtEventTime, priceLabel } from '../lib/util';
import { Link } from '../router';
import { Chip } from './ui';

export function EventCard({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  const s = useStore();
  const user = me(s);
  const attendees = attendeesOf(s, ev.id);
  const agg = backgroundAgg(s, ev.id);
  const going = user ? attendees.some((a) => a.user.id === user.id) : false;

  return (
    <article className="card card-clickable event-card">
      <Link to={`/app/events/${ev.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div className="when">{fmtEventTime(ev.startUtc, ev.endUtc, ev.tz)}</div>
        <div className="title">{ev.title} {ev.visibility === 'circle' && <Chip tone="outline">circle only</Chip>}</div>
        <div className="meta">
          <Chip tone="outline">{ev.mode === 'in_person' ? `📍 ${ev.city ?? 'In person'}` : ev.mode === 'online' ? '💻 Online' : ` Hybrid · ${ev.city ?? ''}`}</Chip>
          <Chip tone="outline">{priceLabel(ev)}</Chip>
          {ev.tags.slice(0, 2).map((t) => <Chip key={t}>{t}</Chip>)}
        </div>
        {!compact && (
          <div className="agg">
            <Chip tone="default">{attendees.length} planning or going</Chip>
            {Object.entries(agg.colleges).filter(([, n]) => n > 0).slice(0, 2).map(([c, n]) => (
              <Chip key={c} tone="accent">🎓 {c} ×{n}</Chip>
            ))}
            {Object.entries(agg.companies).filter(([, n]) => n > 0).slice(0, 2).map(([c, n]) => (
              <Chip key={c} tone="accent">🏢 {c} ×{n}</Chip>
            ))}
            {agg.hidden > 0 && <Chip tone="outline" title="People who chose to keep their background private">{agg.hidden} private</Chip>}
          </div>
        )}
      </Link>
      <div className="foot">
        <span className="small muted">{ev.organizer}{ev.sourceUrl ? ' · source linked' : ''}</span>
        {going ? <Chip tone="positive">You’re in the plan</Chip> : user ? (
          <Link to={`/app/events/${ev.id}`} className="btn btn-soft btn-sm">Details</Link>
        ) : (
          <Link to="/auth" className="btn btn-soft btn-sm">Log in to join</Link>
        )}
      </div>
    </article>
  );
}
