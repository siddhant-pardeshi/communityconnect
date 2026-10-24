import { useState } from 'react';
import { postEvent, me, myCircles, useStore } from '../lib/store';
import { COMMON_TZS } from '../lib/util';
import { Btn, Card, Field, SectionHead, showToast } from '../components/ui';
import { navigate } from '../router';

export default function PostEvent() {
  const s = useStore();
  const user = me(s);
  const circles = myCircles(s);
  const [f, setF] = useState({
    title: '', summary: '', organizer: user?.name ?? '', sourceUrl: '', sourceProvider: '',
    mode: 'in_person' as 'in_person' | 'online' | 'hybrid',
    city: user?.city ?? 'Bengaluru', venue: '',
    startLocal: '', endLocal: '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    price: 0, priceUnknown: false, priceFree: false,
    tags: '', accessibility: '',
    visibility: 'public' as 'public' | 'circle', circleId: circles[0]?.id ?? '',
  });

  const set = (k: keyof typeof f, v: string | boolean | number) => setF({ ...f, [k]: v } as typeof f);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = f.priceUnknown ? null : f.priceFree ? 0 : f.price;
    const res = postEvent({
      title: f.title, summary: f.summary, organizer: f.organizer,
      mode: f.mode, city: f.city, venue: f.venue,
      sourceUrl: f.sourceUrl, sourceProvider: f.sourceProvider,
      startLocal: f.startLocal, endLocal: f.endLocal, tz: f.tz,
      price, currency: 'INR',
      tags: f.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 6),
      accessibility: f.accessibility,
      visibility: f.visibility, circleId: f.circleId || undefined,
    });
    if (res.ok && res.eventId) {
      showToast('Event shared 🎉 +10 XP when it’s part of your rhythm');
      navigate(`/app/events/${res.eventId}`);
    } else {
      showToast(res.error ?? 'Could not post', 'err');
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <SectionHead
        title="Share an event"
        sub="Manual posting with a source link is the reliable path — no scraping, no guessing. Every field stays editable later."
      />
      <Card>
        <form onSubmit={submit}>
          <Field label="Event title" required>
            <input type="text" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Bengaluru Startup Saturday #42" />
          </Field>
          <Field label="One-line summary" hint="What happens, for whom. This is what people scan." required>
            <textarea value={f.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Founders, builders and first-time operators meet over filter coffee…" />
          </Field>
          <div className="form-grid">
            <Field label="Organizer name">
              <input type="text" value={f.organizer} onChange={(e) => set('organizer', e.target.value)} />
            </Field>
            <Field label="Source URL" hint="Where you found it — Luma, Meetup, a college portal…">
              <input type="url" value={f.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Format">
              <select value={f.mode} onChange={(e) => set('mode', e.target.value)} aria-label="Event format">
                <option value="in_person">In person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Original time zone" hint="We show event-local and your-local times.">
              <select value={f.tz} onChange={(e) => set('tz', e.target.value)} aria-label="Time zone">
                {[...new Set([f.tz, ...COMMON_TZS])].map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </Field>
          </div>
          {f.mode !== 'online' && (
            <div className="form-grid">
              <Field label="City">
                <input type="text" value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="Bengaluru" />
              </Field>
              <Field label="Venue / area">
                <input type="text" value={f.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Indiranagar Coffee House" />
              </Field>
            </div>
          )}
          <div className="form-grid">
            <Field label="Starts (your local time)" required>
              <input type="datetime-local" value={f.startLocal} onChange={(e) => set('startLocal', e.target.value)} />
            </Field>
            <Field label="Ends (your local time)" required>
              <input type="datetime-local" value={f.endLocal} onChange={(e) => set('endLocal', e.target.value)} />
            </Field>
          </div>
          <Field label="Price">
            <div className="row">
              <input type="number" min={0} style={{ maxWidth: 140 }} value={f.price} disabled={f.priceUnknown || f.priceFree} onChange={(e) => set('price', Number(e.target.value))} aria-label="Price in rupees" />
              <span className="check-row" style={{ margin: 0 }}><input id="free" type="checkbox" checked={f.priceFree} disabled={f.priceUnknown} onChange={(e) => set('priceFree', e.target.checked)} /><label htmlFor="free">Free</label></span>
              <span className="check-row" style={{ margin: 0 }}><input id="unknown" type="checkbox" checked={f.priceUnknown} onChange={(e) => set('priceUnknown', e.target.checked)} /><label htmlFor="unknown">Unknown</label></span>
            </div>
          </Field>
          <Field label="Tags" hint="Comma-separated, up to 6: startups, design, careers…">
            <input type="text" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="startups, networking" />
          </Field>
          <Field label="Accessibility information" hint="Leave empty if not supplied — we never assume.">
            <input type="text" value={f.accessibility} onChange={(e) => set('accessibility', e.target.value)} placeholder="Step-free entrance; accessible washroom on-site" />
          </Field>
          <Field label="Visibility" hint={f.visibility === 'circle' ? 'Only circle members can see this event — it never appears in public search.' : 'Anyone can discover this event.'}>
            <select value={f.visibility} onChange={(e) => set('visibility', e.target.value)} aria-label="Visibility">
              <option value="public">Public</option>
              <option value="circle" disabled={circles.length === 0}>Circle only {circles.length === 0 ? '(join a circle first)' : ''}</option>
            </select>
          </Field>
          {f.visibility === 'circle' && circles.length > 0 && (
            <Field label="Which circle">
              <select value={f.circleId} onChange={(e) => set('circleId', e.target.value)} aria-label="Circle">
                {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <Btn type="submit">Share event</Btn>
          <p className="small muted" style={{ marginTop: 10 }}>
            By posting you confirm the details are accurate to the best of your knowledge. Listings can be
            corrected or canceled any time — participants get notified of material changes.
          </p>
        </form>
      </Card>
    </div>
  );
}
