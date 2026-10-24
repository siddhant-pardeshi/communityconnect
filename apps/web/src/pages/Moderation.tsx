import { useState } from 'react';
import { useStore, me, resolveReport, mutate } from '../lib/store';
import { timeAgo, isStaff } from '@cc/core';
import { Btn, Card, Chip, EmptyState, Field, SectionHead, showToast } from '../components/ui';
import { Link } from '../router';

export default function Moderation() {
  const s = useStore();
  const user = me(s);
  const [note, setNote] = useState<Record<string, string>>({});
  if (!user) return null;

  if (!isStaff(user)) {
    return (
      <EmptyState
        title="Moderator access required"
        body="Moderation actions are restricted to moderator accounts (site-level role — separate from circle ownership). Report anything that breaks the conduct rules; moderators review every report."
        action={<Link to="/app/discover" className="btn btn-primary">Back to discover</Link>}
      />
    );
  }

  const open = s.reports.filter((r) => r.status === 'received');
  const resolved = s.reports.filter((r) => r.status !== 'received');

  const label = (kind: string, targetId: string) => {
    if (kind === 'event') return `Event: ${s.events[targetId]?.title ?? targetId}`;
    if (kind === 'user') return `User: ${s.users[targetId]?.name ?? targetId}`;
    return `Message: ${targetId}`;
  };

  return (
    <div style={{ maxWidth: 760 }} className="stack">
      <SectionHead
        title="Moderation console"
        sub="Reports in, decisions out — every action recorded with a reason. Reporter identity is never disclosed to the reported person."
      />

      {open.length === 0 ? (
        <Card><EmptyState title="Queue is clear" body="No open reports. This is the quiet every moderator hopes for." /></Card>
      ) : (
        open.map((r) => (
          <Card key={r.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{label(r.kind, r.targetId)}</strong>
              <Chip tone="caution">{r.status}</Chip>
            </div>
            <p className="small muted" style={{ margin: '6px 0' }}>
              Reason: <strong>{r.reason}</strong> · reported {timeAgo(r.createdAt)}{r.detail ? ` · “${r.detail}”` : ''}
            </p>
            <Field label="Resolution note" hint="Stored with the case; shown to the author if content is removed.">
              <input type="text" value={note[r.id] ?? ''} onChange={(e) => setNote({ ...note, [r.id]: e.target.value })} placeholder="e.g. Confirmed wrong ticket price — author notified to correct." />
            </Field>
            <div className="row">
              <Btn size="sm" onClick={() => {
                resolveReport(r.id, 'actioned', note[r.id] ?? '');
                mutate((st) => { st.reports.find((x) => x.id === r.id)!.status = 'actioned'; });
                showToast('Action taken — content removed where applicable.');
              }}>Take action (remove content)</Btn>
              <Btn size="sm" variant="outline" onClick={() => {
                resolveReport(r.id, 'dismissed', note[r.id] ?? '');
                mutate((st) => { st.reports.find((x) => x.id === r.id)!.status = 'dismissed'; });
                showToast('Report dismissed with note.');
              }}>Dismiss</Btn>
              {r.kind === 'event' && s.events[r.targetId] && (
                <Link to={`/app/events/${r.targetId}`} className="btn btn-ghost btn-sm">Inspect event</Link>
              )}
            </div>
          </Card>
        ))
      )}

      {resolved.length > 0 && (
        <>
          <SectionHead title="Case history" />
          <Card>
            {resolved.map((r) => (
              <div key={r.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <strong className="small">{label(r.kind, r.targetId)}</strong>
                  <p className="small muted" style={{ margin: '2px 0 0' }}>
                    {r.status} by {s.users[r.resolvedBy ?? '']?.name ?? 'moderator'} · {r.resolutionNote || 'no note'} · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <Chip tone={r.status === 'actioned' ? 'destructive' : 'outline'}>{r.status}</Chip>
              </div>
            ))}
          </Card>
        </>
      )}

      <p className="small muted">
        Coordinated mass-reports never auto-ban anyone. Purchases, points and audience size never exempt accounts
        from these rules — and never accelerate them either.
      </p>
    </div>
  );
}
