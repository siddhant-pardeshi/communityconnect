import { useStore, me, updateProfile, updatePrivacy, unblockUser, setTimezone, setAccent } from '../lib/store';
import { levelOf } from '../lib/rules';
import { INTENT_LABELS, type Intent, type Privacy } from '../lib/types';
import { COMMON_TZS } from '../lib/util';
import { Btn, Card, Chip, Field, SectionHead, showToast } from '../components/ui';
import { useState } from 'react';

export default function ProfileEdit() {
  const s = useStore();
  const user = me(s);
  const [links, setLinks] = useState(user?.links ?? []);
  if (!user) return null;
  const level = levelOf(user.xp);
  const blocked = (user.blocked ?? []).map((id) => s.users[id]).filter(Boolean);

  const toggleIntent = (i: Intent) => {
    const has = user.intents.includes(i);
    updateProfile({ intents: has ? user.intents.filter((x) => x !== i) : [...user.intents, i] });
  };

  const togglePrivacy = (k: keyof Privacy) => updatePrivacy({ [k]: !user.privacy[k] } as Partial<Privacy>);

  return (
    <div style={{ maxWidth: 760 }} className="stack">
      <SectionHead title="Your profile" sub="You decide what others see. Privacy changes apply instantly everywhere." />

      <Card>
        <h3>Basics</h3>
        <div className="form-grid">
          <Field label="Name"><input type="text" defaultValue={user.name} onBlur={(e) => updateProfile({ name: e.target.value })} /></Field>
          <Field label="Pronouns (optional)"><input type="text" defaultValue={user.pronouns ?? ''} onBlur={(e) => updateProfile({ pronouns: e.target.value })} placeholder="she/her" /></Field>
        </div>
        <div className="form-grid">
          <Field label="City"><input type="text" defaultValue={user.city} onBlur={(e) => updateProfile({ city: e.target.value })} placeholder="Bengaluru" /></Field>
          <Field label="Role"><input type="text" defaultValue={user.role ?? ''} onBlur={(e) => updateProfile({ role: e.target.value })} placeholder="Student · Designer · PM…" /></Field>
        </div>
        <div className="form-grid">
          <Field label="College / university" hint="Shown on events & profile when enabled below.">
            <input type="text" defaultValue={user.college ?? ''} onBlur={(e) => updateProfile({ college: e.target.value })} />
          </Field>
          <Field label="Company / workplace">
            <input type="text" defaultValue={user.company ?? ''} onBlur={(e) => updateProfile({ company: e.target.value })} />
          </Field>
        </div>
        <Field label="Short bio"><textarea defaultValue={user.bio ?? ''} onBlur={(e) => updateProfile({ bio: e.target.value })} placeholder="What should people know about you?" /></Field>
        <Field label="Professional background" hint="One or two lines: experience, domains, what you bring.">
          <textarea defaultValue={user.background ?? ''} onBlur={(e) => updateProfile({ background: e.target.value })} />
        </Field>
      </Card>

      <Card>
        <h3>What are you here for?</h3>
        <p className="small muted">Intent chips help the right people find you — e.g. alumni looking to give referrals. Self-declared, never “verified”.</p>
        <div className="checkbox-chips">
          {(Object.keys(INTENT_LABELS) as Intent[]).map((i) => (
            <Chip key={i} tone={user.intents.includes(i) ? 'accent' : 'outline'} onClick={() => toggleIntent(i)}>
              {INTENT_LABELS[i]}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <h3>Professional links</h3>
        {links.map((l, idx) => (
          <div key={idx} className="row" style={{ marginBottom: 8 }}>
            <input type="text" value={l.label} onChange={(e) => setLinks(links.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} placeholder="Label" style={{ maxWidth: 140 }} aria-label="Link label" />
            <input type="url" value={l.url} onChange={(e) => setLinks(links.map((x, i) => i === idx ? { ...x, url: e.target.value } : x))} placeholder="https://…" aria-label="Link URL" />
            <Btn size="sm" variant="ghost" onClick={() => setLinks(links.filter((_, i) => i !== idx))}>Remove</Btn>
          </div>
        ))}
        <div className="row">
          <Btn size="sm" variant="outline" onClick={() => setLinks([...links, { label: 'LinkedIn', url: '' }])}>+ Add link</Btn>
          <Btn size="sm" onClick={() => { updateProfile({ links: links.filter((l) => l.label && l.url) }); showToast('Links saved'); }}>Save links</Btn>
        </div>
      </Card>

      <Card>
        <h3>Privacy</h3>
        <p className="small muted">Defaults keep you visible enough to plan together, hidden enough to stay comfortable. Change any of this any time — it applies immediately.</p>
        {([
          ['showCollege', 'Show my college / university', 'Appears on events you attend and your profile.'],
          ['showCompany', 'Show my company / workplace', 'Appears on events you attend and your profile.'],
          ['showBackground', 'Show my background text', 'The experience line on your profile.'],
          ['showIntent', 'Show my intent chips', 'Job-seeking, hiring, open-to-meet etc.'],
          ['directoryOptIn', 'Appear in the People directory', 'Off = only people you share a circle with can find you.'],
        ] as [keyof Privacy, string, string][]).map(([k, label, hint]) => (
          <div key={k} className="check-row">
            <input id={k} type="checkbox" checked={user.privacy[k]} onChange={() => togglePrivacy(k)} />
            <label htmlFor={k}><strong>{label}</strong><br /><span className="small muted">{hint}</span></label>
          </div>
        ))}
        <hr className="divider" />
        <Field label="Reward time zone" hint="Used for streaks. Changes are allowed rarely by policy; your history never resets.">
          <select value={user.timezone} onChange={(e) => { setTimezone(e.target.value); showToast('Reward time zone updated.'); }}>
            {[...new Set([user.timezone, ...COMMON_TZS])].map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Field>
      </Card>

      {blocked.length > 0 && (
        <Card>
          <h3>Blocked accounts</h3>
          {blocked.map((b) => (
            <div key={b.id} className="list-row">
              <span style={{ flex: 1 }}><strong>{b.name}</strong> <span className="small muted">· cannot contact you or see you in matches</span></span>
              <Btn size="sm" variant="outline" onClick={() => unblockUser(b.id)}>Unblock</Btn>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <h3>Appearance</h3>
        <p className="small muted">Profile accent themes unlock at Planner (250 XP) — everything safety-related is always free.</p>
        <div className="row">
          {(['cobalt', 'coral', 'sage', 'saffron'] as const).map((a) => (
            <Chip key={a} tone={user.accent === a ? 'accent' : 'outline'} onClick={() => {
              if (user.xp < 250 && a !== 'cobalt') { showToast(`“${a}” unlocks at 250 XP — you’re at ${user.xp}. Keep planning!`, 'err'); return; }
              setAccent(a);
            }}>
              {user.xp < 250 && a !== 'cobalt' ? '🔒 ' : ''}{a}
            </Chip>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>Level: {level.name}{level.next ? ` · next: ${level.next.name} at ${level.next.min} XP` : ' · max'}</p>
      </Card>
    </div>
  );
}
