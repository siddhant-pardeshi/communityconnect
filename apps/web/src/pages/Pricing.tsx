import { useState } from 'react';
import { saveInterestForm } from '../lib/store';
import { Btn, Card, Field, SectionHead, showToast } from '../components/ui';

const TIERS = [
  {
    name: 'Free', price: '₹0', tag: 'Everyone, during our growth phase', highlight: true,
    features: ['Event discovery & posting', 'Circles & Decision Rooms', 'Buddy matching', 'Connections & messaging', 'Networking card with QR', 'Referral rewards', 'All privacy & safety tools'],
  },
  {
    name: 'Community Pro', price: '≈₹99/mo', tag: 'Planned — price under research', highlight: false,
    features: ['Everything in Free', 'Larger circles & templates', 'Scheduled digests', 'Aggregate circle insights', 'Priority support'],
    note: 'Students and people between roles: substantially subsidized or free, always.',
  },
  {
    name: 'Organizer / Team', price: '≈₹499/mo', tag: 'Planned — for communities & companies', highlight: false,
    features: ['Everything in Pro', 'Multi-community management', 'Co-branded pages', 'Staff roles & exports', 'Support integrations'],
    note: 'Never paywalled: core planning, voting, safety and privacy.',
  },
];

export default function Pricing() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('Community Pro');

  return (
    <div style={{ maxWidth: 900 }}>
      <SectionHead
        title="Pricing"
        sub="Free while we grow. When we add paid plans, they’ll be minimal and honest — and the parts that keep people safe stay free forever."
      />
      <div className="feature-grid">
        {TIERS.map((t) => (
          <Card key={t.name} style={t.highlight ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' } : undefined}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{t.name}</h3>
              {t.highlight && <span className="chip chip-positive">current</span>}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, margin: '8px 0 2px' }}>{t.price}</p>
            <p className="small muted" style={{ marginTop: 0 }}>{t.tag}</p>
            <ul className="small" style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {t.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            {t.note && <p className="small" style={{ marginTop: 10, fontWeight: 600 }}>{t.note}</p>}
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 20 }}>
        <h3>Shape the pricing (interest list)</h3>
        <p className="small muted">
          We’re interviewing students, professionals and organizers about what a fair price looks like.
          Leave your email and preference — stored locally in this demo build; the production form persists to our database.
        </p>
        <form className="row" onSubmit={(e) => {
          e.preventDefault();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('That email does not look right.', 'err'); return; }
          saveInterestForm(email, plan);
          showToast('Thanks! You’re on the interest list — we’ll only email you about pricing research.');
          setEmail('');
        }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, minWidth: 200 }} aria-label="Email" />
          <Field label="">
            <select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plan of interest">
              <option>Community Pro</option>
              <option>Organizer / Team</option>
              <option>Just want it to stay free</option>
            </select>
          </Field>
          <Btn type="submit">Keep me posted</Btn>
        </form>
        <p className="small muted" style={{ marginTop: 8 }}>
          No spam, no selling data, unsubscribe any time. Paid checkout is not enabled — nothing is charged today.
        </p>
      </Card>
    </div>
  );
}
