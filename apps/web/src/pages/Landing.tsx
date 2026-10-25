import { navigate } from '../router';
import { useStore, loginDemo, publicEvents, me } from '../lib/store';
import { Wordmark } from '../components/Logo';
import { FloatingScene } from '../components/FloatingScene';
import { Btn, Card, Chip } from '../components/ui';
import { Reveal, CountUp, StarPrompt } from '../components/motion';

const STEPS = [
  { n: '1', title: 'Share the options', body: 'Post events or paste any event link — Luma, Meetup, a college portal, anything with a URL. We keep the source so facts stay checkable.' },
  { n: '2', title: 'Decide together', body: 'The Decision Room lines up candidates side by side: who can attend, known clashes, price, topics — then a deadline, a vote, and one clear plan.' },
  { n: '3', title: 'Show up together', body: 'Everyone confirms separately. Need company? Request a buddy. Get a calendar file, a meetup note, and a nudge to register on the organizer’s site.' },
];

const FEATURES = [
  { icon: '🗳️', title: 'Decision Rooms', body: 'Votes, quorum, ties and clashes handled honestly — availability is never mistaken for a commitment.' },
  { icon: '🎁', title: 'Invite & both earn', body: 'Every referral gives you and your friend bonus XP and a 14-day profile boost. Friends who join get a welcome boost too.' },
  { icon: '🪪', title: 'Networking card', body: 'A printable card with your links and a QR code. Carry it to events; one scan and people find your real profile — not a paper scrap.' },
  { icon: '🤝', title: 'Peer trust & vouches', body: 'Met someone genuine? Vouch: hearts, verify their college/company/course claims, and record polite professional conduct. Vouches count 14 days, then refresh — conduct can always improve.' },
  { icon: '🎓', title: 'Backgrounds, with privacy', body: 'See which colleges and companies are attending — and hide yours any time. Your details are yours.' },
  { icon: '🌱', title: 'Support hub', body: 'Job seekers, referral seekers and people between roles can opt in with intent chips — and others can find and help them.' },
  { icon: '✨', title: 'Momentum, not addiction', body: 'A gentle streak with weekly grace, contribution XP, and cosmetic unlocks. Private by default; hide it entirely if you want.' },
];

const MARQUEE: Array<[string, string]> = [
  ['Never event alone.', 'the buddy promise'],
  ['From three links to one plan.', 'the Decision Room'],
  ['Decide together. Show up together.', 'the whole loop'],
  ['Your crew has chosen.', 'plan day'],
  ['Akela nahi. Poore crew ke saath.', 'campus season'],
  ['Who’s coming? — see you there.', 'every weekend'],
];

export default function Landing() {
  const s = useStore();
  const user = me(s);
  const demoUsers = ['u_founder', 'u_aarav', 'u_meera', 'u_ananya']
    .map((id) => s.users[id])
    .filter(Boolean);
  const eventCount = publicEvents(s).length;

  return (
    <div>
      <nav className="landing-nav">
        <Wordmark size={26} />
        <span className="spacer" style={{ flex: 1 }} />
        <a href="#/about" className="muted small" style={{ fontWeight: 700 }}>About</a>
        <a href="#/app/pricing" className="muted small" style={{ fontWeight: 700 }}>Pricing</a>
        {user
          ? <a href="#/app" className="btn btn-primary btn-sm">Open app</a>
          : <>
              <a href="#/auth" className="btn btn-ghost btn-sm">Log in</a>
              <a href="#/auth?mode=signup" className="btn btn-primary btn-sm">Join free</a>
            </>}
      </nav>

      <header className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="aurora" aria-hidden="true" />
        <span className="float-orb" aria-hidden="true" style={{ width: 120, height: 120, background: 'var(--accent-soft)', top: '8%', left: '46%' }} />
        <span className="float-orb" aria-hidden="true" style={{ width: 70, height: 70, background: 'color-mix(in srgb, var(--coral) 24%, transparent)', bottom: '12%', left: '58%', animationDelay: '2.4s' }} />
        <div>
          <p style={{ marginBottom: 10 }}><Chip tone="accent">Free while we grow</Chip> <Chip tone="outline">⭐ Open source</Chip></p>
          <h1 className="display">Great events are better when your people show&nbsp;up.</h1>
          <p className="hero-sub">
            Share the options, spot the clashes, and choose a plan your circle can actually attend.
            CommunityConnect turns scattered event links into confirmed group plans — and introductions
            that turn into real connections.
          </p>
          <div className="hero-ctas">
            <a href="#/auth?mode=signup" className="btn btn-primary">Plan with your circle — free</a>
            <a href="#/discover" className="btn btn-outline">Explore upcoming events</a>
          </div>
          <p className="small muted" style={{ marginTop: 14 }}>
            No credit card. Students, job seekers and people between roles are always welcome.
          </p>
        </div>
        <div><FloatingScene /></div>
      </header>

      <Reveal as="section" aria-label="Taglines">
        <div className="marquee" role="marquee" aria-label="CommunityConnect taglines">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map(([t, sub], i) => (
              <span key={i} className="marquee-item"><span className="star" aria-hidden="true">✦</span> <strong>{t}</strong> <span className="small">{sub}</span></span>
            ))}
          </div>
        </div>
      </Reveal>

      <section className="landing-section" aria-label="Why CommunityConnect">
        <Reveal>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            {[
              { n: 75, suffix: ' XP', label: 'bonus for you AND your friend on every invite' },
              { n: 14, suffix: ' days', label: 'of profile boost when someone joins with your link' },
              { n: eventCount, suffix: '+', label: 'upcoming community events listed in the demo' },
              { n: 0, suffix: ' ₹', label: 'cost today, during the entire growth phase' },
            ].map((st, i) => (
              <Reveal key={st.label} delay={i * 90}>
                <div style={{ textAlign: 'center', minWidth: 150 }}>
                  <div className="stat-num"><CountUp to={st.n} suffix={st.suffix} /></div>
                  <div className="stat-label" style={{ maxWidth: 190 }}>{st.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="landing-section" aria-label="How it works">
        <Reveal><h2>Three good events. One shared plan.</h2></Reveal>
        <Reveal><p className="muted" style={{ maxWidth: '64ch' }}>Here is the whole loop:</p></Reveal>
        <div className="steps" style={{ marginTop: 18 }}>
          {STEPS.map((st, i) => (
            <Reveal key={st.n} delay={i * 110}>
              <Card style={{ height: '100%' }}>
                <div className="step-num" aria-hidden="true">{st.n}</div>
                <h3>{st.title}</h3>
                <p className="muted small">{st.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="landing-section alt" aria-label="Features">
        <Reveal><h2>Built for how communities actually decide</h2></Reveal>
        <div className="feature-grid" style={{ marginTop: 18 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <Card style={{ height: '100%' }}>
                <div style={{ fontSize: 26, marginBottom: 6 }} aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p className="muted small">{f.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-label="Try the demo">
        <Reveal>
          <div className="card" style={{ background: 'var(--surface-2)', border: 'none' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 24 }}>Try it right now — no signup</h2>
                <p className="muted small" style={{ maxWidth: '56ch', marginBottom: 0 }}>
                  Step into a fictional Bengaluru crew with live votes, a finalized plan and open buddy requests.
                  <span className="demo-tag" style={{ marginLeft: 8 }}>DEMO DATA</span>
                </p>
              </div>
              <div className="row">
                {demoUsers.map((u) => (
                  <Btn key={u.id} variant={u.id === 'u_founder' ? 'primary' : 'outline'} size="sm" onClick={() => { loginDemo(u.id); navigate('/app'); }}>
                    {u.id === 'u_founder' ? '👑 Founder view' : `Explore as ${u.name.split(' ')[0]}`}
                  </Btn>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="landing-section" aria-label="Who it is for">
        <Reveal><h2>Made for the people who keep communities alive</h2></Reveal>
        <div className="feature-grid" style={{ marginTop: 18 }}>
          {[
            ['🎓', 'Students', 'Find campus-adjacent events, split planning with friends, and get referral help from alumni who’ve been there.'],
            ['💼', 'Professionals', 'Decide with your team, meet people from other companies, and carry a QR card instead of 20 paper ones.'],
            ['🧭', 'Between roles', 'Opt in with a “between roles — open to support” chip. Communities are surprisingly good at opening doors when asked honestly.'],
            ['🚀', 'Founders & builders', 'Post asks, find feedback partners, and turn a room full of strangers into a follow-up list that actually happens.'],
          ].map(([icon, t, b], i) => (
            <Reveal key={t as string} delay={(i % 3) * 90}>
              <Card style={{ height: '100%' }}>
                <div style={{ fontSize: 24 }} aria-hidden="true">{icon}</div>
                <h3>{t}</h3>
                <p className="muted small">{b}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="landing-section alt" aria-label="Pricing">
        <Reveal>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="reading">
              <h2>Free now. Fair later. That’s a promise in writing.</h2>
              <p className="muted">
                Planning, voting, buddies, connections, safety tools and the networking card are free during our
                growth phase. When we introduce a minimal subscription, it will cover organizer tooling — and
                students and people between roles will always have a subsidized or free path.
              </p>
            </div>
            <a href="#/app/pricing" className="btn btn-outline">See the plan</a>
          </div>
        </Reveal>
      </section>

      <section className="landing-section" style={{ paddingBottom: 0 }}>
        <Reveal><StarPrompt /></Reveal>
      </section>

      <section className="landing-section" style={{ textAlign: 'center' }}>
        <Reveal>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
            Your circle has chosen.<br />Confirm whether you can attend.
          </h1>
          <div className="hero-ctas" style={{ justifyContent: 'center' }}>
            <a href="#/auth?mode=signup" className="btn btn-primary">Join free — bring your people</a>
          </div>
        </Reveal>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} CommunityConnect (working name). Apache-2.0.</span>
        <span className="links">
          <a href="#/about">About</a>
          <a href="#/conduct">Community conduct</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
          <a href="#/accessibility">Accessibility</a>
          <a href="https://github.com/siddhant-pardeshi/communityconnect/blob/main/marketing/CommunityConnect-User-Walkthrough.pdf" target="_blank" rel="noreferrer">Walkthrough 📖</a>
          <a href="https://github.com/siddhant-pardeshi/communityconnect/blob/main/marketing/CommunityConnect-Feature-Deck.pptx" target="_blank" rel="noreferrer">Feature deck 🎞️</a>
          <a href="https://github.com/siddhant-pardeshi/communityconnect/blob/main/marketing/CommunityConnect-Feature-Deck.pptx" <a href="https://github.com/siddhant-pardeshi/communityconnect/blob/main/marketing/CommunityConnect-User-Video-Walkthrough.mp4" target="_blank" rel="noreferrer">Video tour 🎬</a>
          <a href="https://github.com/siddhant-pardeshi/communityconnect" target="_blank" rel="noreferrer">GitHub ⭐</a>
        </span>
      </footer>
    </div>
  );
}
