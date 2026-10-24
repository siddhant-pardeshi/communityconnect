import type { EventItem, UserAccount } from './types';

// ─── ids & misc (pure) ───────────────────────────────────────────────────────
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}

export function makeReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CC';
  return `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function pairKeyOf(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export function hueColor(hue: number, s = 62, l = 46): string {
  return `hsl(${hue} ${s}% ${l}%)`;
}

// ─── time ────────────────────────────────────────────────────────────────────
// All instants are stored as ISO UTC strings. Rendering resolves to the event's
// original IANA zone and (when different) the viewer's zone via Intl.

export function fmtEventTime(startUtc: string, endUtc: string, tz: string, viewerTz?: string): string {
  const s = new Date(startUtc);
  const e = new Date(endUtc);
  const fmt = (d: Date, zone: string) =>
    new Intl.DateTimeFormat('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: zone,
    }).format(d);
  const sameDay = (a: Date, b: Date, zone: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(a) ===
    new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(b);
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const main = sameDay(s, e, tz)
    ? `${fmt(s, tz)} – ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(e)} (${tzAbbr(tz)})`
    : `${fmt(s, tz)} → ${fmt(e, tz)} (${tzAbbr(tz)})`;
  if (viewerTz && viewerTz !== tz && local && local !== tz) {
    return `${main} · your time: ${fmt(s, local)}`;
  }
  return main;
}

export function tzAbbr(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value || tz;
  } catch { return tz; }
}

export function dayKeyInTz(tz: string, d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d); // YYYY-MM-DD
}

export function daysBetweenKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function rewardWeekKey(tz: string, d: Date = new Date()): string {
  // Reward weeks run Monday 00:00 → next Monday in the reward zone.
  const key = dayKeyInTz(tz, d);
  const [y, m, dd] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, dd));
  const dow = dt.getUTCDay(); // 0 Sun … 6 Sat
  const back = (dow + 6) % 7; // days since Monday
  dt.setUTCDate(dt.getUTCDate() - back);
  return dt.toISOString().slice(0, 10);
}

// Half-open interval overlap: [aStart, aEnd) ∩ [bStart, bEnd). Touching endpoints do NOT overlap.
export function overlaps(aStart: string | number, aEnd: string | number, bStart: string | number, bEnd: string | number): boolean {
  const as = new Date(aStart).getTime(), ae = new Date(aEnd).getTime();
  const bs = new Date(bStart).getTime(), be = new Date(bEnd).getTime();
  if (Number.isNaN(as) || Number.isNaN(ae) || Number.isNaN(bs) || Number.isNaN(be)) return false;
  return as < be && bs < ae;
}

export function eventOverlapsBusy(ev: EventItem, busyEvents: EventItem[], ignoreIds: string[] = []): EventItem | null {
  for (const b of busyEvents) {
    if (b.id === ev.id || ignoreIds.includes(b.id)) continue;
    if (b.status === 'canceled') continue;
    if (overlaps(ev.startUtc, ev.endUtc, b.startUtc, b.endUtc)) return b;
  }
  return null;
}

// ─── .ics export (pure string builder) ───────────────────────────────────────
function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsFold(line: string): string {
  // RFC 5545 §3.1: lines ≤ 75 octets, continuation lines prefixed with a space.
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

export function eventIcs(ev: EventItem, url: string): string {
  const dt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CommunityConnect//Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.id}@communityconnect.app`,
    `SEQUENCE:0`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt(ev.startUtc)}`,
    `DTEND:${dt(ev.endUtc)}`,
    icsFold(`SUMMARY:${icsEscape(ev.title)}`),
    icsFold(`LOCATION:${icsEscape(ev.mode === 'online' ? 'Online' : ev.venue || ev.city || '')}`),
    icsFold(`DESCRIPTION:${icsEscape(ev.summary + (ev.sourceUrl ? ` Source: ${ev.sourceUrl}` : ''))}`),
    icsFold(`URL:${url}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

// ─── formatting ──────────────────────────────────────────────────────────────
export function timeAgo(at: number): string {
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(at));
}

export function priceLabel(ev: EventItem): string {
  if (ev.price === null) return 'Price unknown — check source';
  if (ev.price === 0) return 'Free';
  return `₹${ev.price.toLocaleString('en-IN')}`;
}

/** ISO instant → value for <input type="datetime-local"> in the viewer's local time. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const COMMON_TZS = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin',
  'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC',
];

// ─── privacy-aware public view ───────────────────────────────────────────────
export function publicView(u: UserAccount) {
  return {
    id: u.id,
    name: u.name,
    pronouns: u.pronouns,
    city: u.city,
    bio: u.bio,
    role: u.role,
    college: u.privacy.showCollege ? u.college : undefined,
    company: u.privacy.showCompany ? u.company : undefined,
    course: u.privacy.showCollege ? u.course : undefined,
    background: u.privacy.showBackground ? u.background : undefined,
    intents: u.privacy.showIntent ? u.intents : u.intents.filter((i) => i === 'open_to_meet'),
    links: u.links,
    avatarHue: u.avatarHue,
  };
}

export function backgroundChips(u: UserAccount): { college?: string; company?: string; course?: string } {
  return {
    college: u.privacy.showCollege ? u.college : undefined,
    company: u.privacy.showCompany ? u.company : undefined,
    course: u.privacy.showCollege ? u.course : undefined,
  };
}
