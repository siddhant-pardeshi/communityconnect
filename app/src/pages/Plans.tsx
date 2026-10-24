import { useStore, me, respondPlan } from '../lib/store';
import { fmtEventTime, eventIcs, download } from '../lib/util';
import { Btn, Card, Chip, EmptyState, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';

export default function Plans() {
  const s = useStore();
  const user = me(s);
  if (!user) return null;
  const myCircleIds = Object.values(s.circles).filter((c) => c.memberIds.includes(user.id)).map((c) => c.id);
  const withPlans = Object.values(s.decisions)
    .filter((d) => d.plan && myCircleIds.includes(d.circleId))
    .sort((a, b) => b.plan!.createdAt - a.plan!.createdAt);

  const active = withPlans.filter((d) => ['awaiting', 'confirmed', 'review_needed'].includes(d.plan!.status));
  const past = withPlans.filter((d) => ['completed', 'canceled'].includes(d.plan!.status));

  const PlanRow = ({ d }: { d: (typeof withPlans)[number] }) => {
    const plan = d.plan!;
    const ev = s.events[plan.eventId];
    if (!ev) return null;
    const confirmed = Object.values(plan.confirmations).filter((v) => v === 'confirmed').length;
    const mine = plan.confirmations[user.id];
    return (
      <Card>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>{ev.title}</strong>
            <p className="small muted" style={{ margin: '2px 0 0' }}>
              {fmtEventTime(ev.startUtc, ev.endUtc, ev.tz)} · {s.circles[d.circleId]?.name} · {confirmed} confirmed
            </p>
          </div>
          <span className={`status-pill st-${plan.status}`}>
            {plan.status === 'awaiting' ? 'awaiting confirmations' : plan.status === 'review_needed' ? 'review needed' : plan.status}
          </span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          {['awaiting', 'review_needed'].includes(plan.status) && (
            <>
              <Btn size="sm" onClick={() => { respondPlan(d.id, 'confirmed'); showToast('Confirmed 👋'); }} disabled={mine === 'confirmed'}>✅ Confirm</Btn>
              <Btn size="sm" variant="outline" onClick={() => respondPlan(d.id, 'declined')} disabled={mine === 'declined'}>Decline</Btn>
            </>
          )}
          <Btn size="sm" variant="ghost" onClick={() => navigate(`/app/decisions/${d.id}`)}>Open decision room</Btn>
          <Btn size="sm" variant="ghost" onClick={() => { download(`${ev.title.replace(/[^a-z0-9]+/gi, '-')}.ics`, eventIcs(ev, window.location.href), 'text/calendar'); showToast('Calendar file downloaded.'); }}>📅 .ics</Btn>
          {ev.sourceUrl && <a className="btn btn-ghost btn-sm" href={ev.sourceUrl} target="_blank" rel="noreferrer">Register ↗</a>}
        </div>
        {plan.meetupNote && <p className="small" style={{ margin: '8px 0 0' }}>📍 <strong>Meetup:</strong> {plan.meetupNote}</p>}
        {plan.status === 'confirmed' && (
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            ✅ Confirmed group plan — {confirmed} people independently confirmed. This is not a ticket; register on the organizer’s site if required.
          </p>
        )}
      </Card>
    );
  };

  return (
    <div>
      <SectionHead title="Plans" sub="Finalized group decisions and their confirmations. Confirmations are always independent and per person." />
      {active.length === 0 ? (
        <Card>
          <EmptyState
            title="No active plans"
            body="Open a decision in one of your circles, vote with your people, and finalize a plan — that’s how options become plans."
            action={<Link to="/app/circles" className="btn btn-primary">Go to circles</Link>}
          />
        </Card>
      ) : (
        <div className="stack">
          {active.map((d) => <PlanRow key={d.id} d={d} />)}
        </div>
      )}
      {past.length > 0 && (
        <>
          <SectionHead title="Earlier" sub="Completed means the scheduled window ended — attendance was never verified." />
          <div className="stack">
            {past.map((d) => <PlanRow key={d.id} d={d} />)}
          </div>
        </>
      )}
    </div>
  );
}
