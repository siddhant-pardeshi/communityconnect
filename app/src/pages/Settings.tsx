import { useStore, me, logout, exportMyData, deleteAccount, switchUser, setNotifPrefs } from '../lib/store';
import { download } from '../lib/util';
import { Btn, Card, Field, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';
import { useState } from 'react';

export default function Settings() {
  const s = useStore();
  const user = me(s);
  const [confirmDelete, setConfirmDelete] = useState('');
  if (!user) return null;

  const otherAccounts = Object.values(s.users).filter((u) => u.id !== user.id && !u.deleted);

  return (
    <div style={{ maxWidth: 680 }} className="stack">
      <SectionHead title="Settings" sub="Account, notifications, and honest controls." />

      <Card>
        <h3>Notifications</h3>
        {([
          ['decisions', 'Decision Room updates', 'Open votes, closing reminders, results.'],
          ['connections', 'Connections', 'Requests, acceptances, new messages.'],
          ['plans', 'Plans & confirmations', 'Finalized plans, event changes, review-needed flags.'],
          ['events', 'Event updates', 'Changes or cancellations of events you follow.'],
        ] as const).map(([k, label, hint]) => (
          <div key={k} className="check-row">
            <input
              id={`np-${k}`} type="checkbox" checked={user.notifPrefs[k]}
              onChange={(e) => { setNotifPrefs({ [k]: e.target.checked }); showToast('Preference saved.'); }}
            />
            <label htmlFor={`np-${k}`}><strong>{label}</strong><br /><span className="small muted">{hint}</span></label>
          </div>
        ))}
      </Card>

      <Card>
        <h3>Your data</h3>
        <p className="small muted">Export everything that belongs to you — profile, events, RSVPs, circles, decisions, connections — as JSON.</p>
        <div className="row">
          <Btn variant="outline" onClick={() => { download('communityconnect-export.json', exportMyData(), 'application/json'); showToast('Export downloaded.'); }}>⬇️ Export my data</Btn>
        </div>
        <hr className="divider" />
        <h3>Danger zone</h3>
        <p className="small muted">
          Deleting your account removes your participation and pseudonymizes content you authored. This cannot be
          undone in this browser. Shared circles transfer ownership to another member if one exists.
        </p>
        <Field label={`Type DELETE to confirm`}>
          <input type="text" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm account deletion" />
        </Field>
        <Btn variant="danger" disabled={confirmDelete !== 'DELETE'} onClick={() => { deleteAccount(); showToast('Account deleted. Goodbye 👋'); navigate('/'); }}>
          Delete my account
        </Btn>
      </Card>

      <Card>
        <h3>Multi-account testing</h3>
        <p className="small muted">
          This build stores accounts per browser — handy for trying both sides of a referral, a vote, or a buddy
          request. Switch to another account here.
        </p>
        <div className="row">
          {otherAccounts.slice(0, 6).map((u) => (
            <Btn key={u.id} size="sm" variant="outline" onClick={() => { switchUser(u.id); showToast(`Switched to ${u.name}`); }}>
              {u.name}
            </Btn>
          ))}
        </div>
        <hr className="divider" />
        <div className="row">
          <Btn variant="outline" onClick={() => { logout(); navigate('/'); }}>Log out</Btn>
          <Link to="/app/moderation" className="btn btn-ghost">Moderation console {user.siteRole === 'moderator' ? '' : '(members can view reports about their own content)'}</Link>
        </div>
      </Card>

      <Card>
        <h3>About this build</h3>
        <p className="small muted">
          CommunityConnect v0.1.0 · open source under Apache-2.0 · working name, not trademark-cleared.
          Auth in this build is browser-local (salted + hashed). Server-backed accounts, cross-device sync and
          email notifications arrive with the documented Supabase swap — see the repository README.
        </p>
        <div className="row">
          <Link to="/conduct" className="btn btn-ghost btn-sm">Conduct</Link>
          <Link to="/privacy" className="btn btn-ghost btn-sm">Privacy</Link>
          <Link to="/terms" className="btn btn-ghost btn-sm">Terms</Link>
          <Link to="/accessibility" className="btn btn-ghost btn-sm">Accessibility</Link>
        </div>
      </Card>
    </div>
  );
}
