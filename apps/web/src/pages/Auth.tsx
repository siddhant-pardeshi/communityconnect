import { useState } from 'react';
import { useRoute, navigate } from '../router';
import { signup, login, loginDemo, useStore } from '../lib/store';
import { Wordmark } from '../components/Logo';
import { Btn, Field } from '../components/ui';
import { showToast } from '../components/ui';

export default function Auth({ notice }: { notice?: string }) {
  const route = useRoute();
  const s = useStore();
  const [mode, setMode] = useState<'login' | 'signup'>(route.query.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [company, setCompany] = useState('');
  const [refCode, setRefCode] = useState(route.query.get('ref') ?? '');
  const [conduct, setConduct] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const demoUsers = Object.values(s.users).filter((u) => u.demo);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = mode === 'signup'
        ? await signup({ name, email, password, acceptedConduct: conduct, refCode: refCode || undefined, college: college || undefined, company: company || undefined })
        : await login(email, password);
      if (res.ok) {
        showToast(mode === 'signup' ? 'Welcome to CommunityConnect 🎉' : 'Welcome back 👋');
        navigate('/app');
      } else {
        setError(res.error ?? 'Something went wrong.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }} className="auth-grid">
      <div style={{ padding: '32px clamp(16px,4vw,48px)' }}>
        <a href="#/"><Wordmark size={26} /></a>
        <div style={{ maxWidth: 440, margin: '8vh auto 0' }}>
          <h1 className="display" style={{ fontSize: 'clamp(28px,3.6vw,40px)' }}>
            {mode === 'signup' ? 'Find your event. Bring your people.' : 'Welcome back.'}
          </h1>
          {notice && <div className="banner banner-info">{notice}</div>}
          {route.query.get('ref') && mode === 'signup' && (
            <div className="banner banner-positive">
              🎁 You were invited! You and <strong>{route.query.get('ref')}</strong> both get +75 XP and a profile boost when you join.
            </div>
          )}
          <form onSubmit={submit} noValidate>
            {mode === 'signup' && (
              <Field label="Your name" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="How should people know you?" />
              </Field>
            )}
            <Field label="Email" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
            </Field>
            <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters. Stored salted + hashed in this browser (demo auth).' : undefined} required>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••" />
            </Field>
            {mode === 'signup' && (
              <>
                <div className="form-grid">
                  <Field label="College / university" hint="Optional — you can hide it any time.">
                    <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. IIT Bombay" />
                  </Field>
                  <Field label="Company / workplace" hint="Optional — you can hide it any time.">
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Zerodha" />
                  </Field>
                </div>
                <Field label="Referral code" hint="Have a friend’s code? You both get bonuses.">
                  <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="XXXX-0000" />
                </Field>
                <div className="check-row">
                  <input id="conduct" type="checkbox" checked={conduct} onChange={(e) => setConduct(e.target.checked)} />
                  <label htmlFor="conduct">
                    I accept the <a href="#/conduct" target="_blank">community conduct</a> — respectful, honest, no spam or harassment. Required.
                  </label>
                </div>
              </>
            )}
            {error && <div className="banner banner-danger" role="alert">{error}</div>}
            <Btn type="submit" disabled={busy} style={{ width: '100%', marginTop: 6 }}>
              {busy ? 'One moment…' : mode === 'signup' ? 'Create my free account' : 'Log in'}
            </Btn>
          </form>
          <p className="small muted" style={{ marginTop: 14 }}>
            {mode === 'signup' ? (
              <>Already have an account here? <a href="#/auth" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Log in</a></>
            ) : (
              <>New here? <a href="#/auth?mode=signup" onClick={(e) => { e.preventDefault(); setMode('signup'); }}>Create a free account</a></>
            )}
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--surface-2)', padding: '32px clamp(16px,4vw,48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="auth-side">
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <h2>Or try a demo profile</h2>
          <p className="muted small">
            Fictional Bengaluru accounts with live votes, plans and buddy requests — the fastest way to feel the product.
            <span className="demo-tag" style={{ marginLeft: 6 }}>DEMO DATA</span>
          </p>
          <div className="stack" style={{ gap: 10 }}>
            {demoUsers.slice(0, 4).map((u) => (
              <button
                key={u.id}
                className="card card-clickable"
                style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left' }}
                onClick={() => { loginDemo(u.id); navigate('/app'); }}
              >
                <span className="avatar" style={{ background: `hsl(${u.avatarHue} 62% 46%)`, width: 38, height: 38 }}>
                  {u.name.split(' ').map((w) => w[0]).join('')}
                </span>
                <span>
                  <strong>{u.name}</strong>
                  <span className="muted small" style={{ display: 'block' }}>{u.role ?? 'Community member'}{u.company ? ` · ${u.company}` : ''}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 16 }}>
            In this version each browser holds its own accounts — perfect for trying multi-user flows with
            “switch account” in Settings. Server-side accounts arrive with the Supabase backend swap.
          </p>
        </div>
      </div>
      <style>{`@media (max-width: 860px){ .auth-grid { grid-template-columns: 1fr !important; } .auth-side { padding: 24px 16px 48px !important; } }`}</style>
    </div>
  );
}
