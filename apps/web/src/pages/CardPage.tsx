import { useEffect, useState } from 'react';
import { useStore, me } from '../lib/store';
import { qrDataUrl, profileUrl } from '../lib/qr';
import { INTENT_LABELS } from '@cc/core';
import { Btn, Card, SectionHead, showToast } from '../components/ui';
import { Link } from '../router';

export default function CardPage() {
  const s = useStore();
  const user = me(s);
  const [qr, setQr] = useState('');
  const [backQr, setBackQr] = useState('');
  if (!user) return null;

  useEffect(() => {
    let alive = true;
    (async () => {
      const front = await qrDataUrl(profileUrl(user.id));
      const back = await qrDataUrl('BEGIN:VCARD\nVERSION:3.0\n' + `FN:${user.name}\n` + (user.role ? `TITLE:${user.role}\n` : '') + (user.company ? `ORG:${user.company}\n` : '') + (user.college ? `NOTE:College: ${user.college}\n` : '') + user.links.map((l) => `URL:${l.url}`).join('\n') + '\nEND:VCARD');
      if (alive) { setQr(front); setBackQr(back); }
    })();
    return () => { alive = false; };
  }, [user.id, user.links.length]);

  const chips = [
    ...(user.privacy.showCollege && user.college ? [user.college] : []),
    ...(user.privacy.showCompany && user.company ? [user.company] : []),
    ...user.privacy.showIntent ? user.intents.slice(0, 2).map((i) => INTENT_LABELS[i]) : [],
  ];

  return (
    <div>
      <SectionHead
        title="Your networking card"
        sub="Carry it to events. People scan the QR and land on your live CommunityConnect profile — no typos, no paper scraps, privacy settings always respected."
      />
      <div className="netcard-wrap">
        <div className="print-zone">
          <div className="netcard">
            <div className="nc-top">
              <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
                <circle cx="19.5" cy="20" r="7" fill="#E98D73" />
                <circle cx="44.5" cy="20" r="7" fill="#E6BC56" />
                <circle cx="32" cy="46.5" r="7" fill="#A9C4B2" />
                <circle cx="32" cy="31.5" r="5" fill="#F5F3ED" />
              </svg>
              <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.04em' }}>COMMUNITYCONNECT</span>
            </div>
            <div className="nc-name">{user.name}</div>
            <div className="nc-role">{user.role ?? 'Community member'}{user.city ? ` · ${user.city}` : ''}</div>
            <div className="nc-chips">
              {chips.map((c) => <span key={c}>{c}</span>)}
            </div>
            <div className="nc-bottom">
              <div className="nc-links">
                {user.links.slice(0, 3).map((l) => <span key={l.url}>{l.label}: {l.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 28)}</span>)}
                {user.links.length === 0 && <span>Add your links in profile →</span>}
              </div>
              <div>
                {qr && <div className="nc-qr"><img src={qr} alt={`QR code linking to ${user.name}’s profile`} /></div>}
                <div className="nc-scan">scan → profile</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }} className="stack">
          <Card>
            <h3>How to use it</h3>
            <ol className="small" style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Print it</strong> — the print button outputs a standard 85.6 × 54 mm card. Print at 100% scale on 300 gsm for best feel.</li>
              <li><strong>Carry it</strong> — to meetups, placement cells, demo nights.</li>
              <li><strong>Scan & connect</strong> — people land on your real profile; they can send a connection request with a reason, and you control every detail they see.</li>
            </ol>
            <div className="row" style={{ marginTop: 14 }}>
              <Btn onClick={() => window.print()}>🖨️ Print card</Btn>
              <Btn variant="outline" onClick={() => { navigator.clipboard?.writeText(profileUrl(user.id)); showToast('Profile link copied — works on any phone.'); }}>Copy profile link</Btn>
              <Link to="/app/profile/edit" className="btn btn-ghost">Edit what it shows</Link>
            </div>
          </Card>
          <Card>
            <h3>vCard QR (for phones)</h3>
            <p className="small muted">Saves you as a contact directly — useful when someone’s phone is offline.</p>
            {backQr && <img src={backQr} alt="vCard QR code" width={140} height={140} style={{ borderRadius: 12, border: '1px solid var(--border)', background: '#fff', padding: 8 }} />}
          </Card>
          <p className="small muted">
            The QR always shows what your privacy settings allow — hiding your college or company removes it from
            the card automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
