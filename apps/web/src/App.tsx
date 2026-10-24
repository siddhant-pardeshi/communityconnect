import { useEffect } from 'react';
import { useRoute, navigate } from './router';
import { useStore, getState, sweep, me, notificationsFor, mutate, logout } from './lib/store';
import { Wordmark, Logo } from './components/Logo';
import { Toasts, Avatar, Btn } from './components/ui';
import { isStaff, isFounderTeam } from '@cc/core';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Join from './pages/Join';
import PublicProfile from './pages/PublicProfile';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import EventDetail from './pages/EventDetail';
import PostEvent from './pages/PostEvent';
import Circles from './pages/Circles';
import CircleDetail from './pages/CircleDetail';
import DecisionDetail from './pages/DecisionDetail';
import Plans from './pages/Plans';
import People from './pages/People';
import ProfileEdit from './pages/ProfileEdit';
import CardPage from './pages/CardPage';
import Rewards from './pages/Rewards';
import Referrals from './pages/Referrals';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Moderation from './pages/Moderation';
import AdminConsole from './pages/AdminConsole';
import Support from './pages/Support';
import Policy from './pages/Policy';
import NotFound from './pages/NotFound';
import type { AppState } from '@cc/core';

function sweepIfDue() {
  const s = getState();
  const now = Date.now();
  const due = Object.values(s.decisions).some((d) =>
    (d.status === 'open' && new Date(d.deadlineUtc).getTime() <= now) ||
    (d.plan && ['awaiting', 'confirmed', 'review_needed'].includes(d.plan.status) &&
      s.events[d.plan.eventId] &&
      (s.events[d.plan.eventId].status === 'canceled' || new Date(s.events[d.plan.eventId].endUtc).getTime() < now))
  );
  if (due) mutate((st) => sweep(st));
}

function useTheme() {
  useEffect(() => {
    const saved = localStorage.getItem('cc-theme');
    const apply = () => {
      const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = theme;
    };
    apply();
    if (!saved) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, []);
}

const RAIL = [
  { to: '/app', icon: '🏠', label: 'Home' },
  { to: '/app/discover', icon: '🔍', label: 'Discover' },
  { to: '/app/circles', icon: '⭕', label: 'Circles' },
  { to: '/app/plans', icon: '🗓️', label: 'Plans' },
  { to: '/app/people', icon: '👥', label: 'People' },
  { to: '/app/support', icon: '🌱', label: 'Support hub' },
  { to: '/app/rewards', icon: '✨', label: 'Momentum' },
  { to: '/app/card', icon: '🪪', label: 'My card' },
  { to: '/app/referrals', icon: '🎁', label: 'Invite & earn' },
];

const MOBILE = [
  { to: '/app', icon: '🏠', label: 'Home' },
  { to: '/app/discover', icon: '🔍', label: 'Discover' },
  { to: '/app/circles', icon: '⭕', label: 'Circles' },
  { to: '/app/people', icon: '👥', label: 'People' },
  { to: '/app/settings', icon: '🙂', label: 'You' },
];

function Rail({ path, staff, founderTeam }: { path: string; staff: boolean; founderTeam: boolean }) {
  return (
    <nav className="rail" aria-label="Primary">
      <a href="#/app" className="rail-item" style={{ marginBottom: 12 }}>
        <Wordmark size={24} />
      </a>
      {RAIL.map((r) => (
        <a key={r.to} href={`#${r.to}`} className={`rail-item ${path === r.to ? 'active' : ''}`}>
          <span className="icon" aria-hidden="true">{r.icon}</span> {r.label}
        </a>
      ))}
      {staff && (
        <a href="#/app/moderation" className={`rail-item ${path === '/app/moderation' ? 'active' : ''}`}>
          <span className="icon" aria-hidden="true">🛡️</span> Moderation
        </a>
      )}
      {founderTeam && (
        <a href="#/app/admin" className={`rail-item ${path === '/app/admin' ? 'active' : ''}`}>
          <span className="icon" aria-hidden="true">👑</span> Founder console
        </a>
      )}
      <a href="#/app/pricing" className="rail-item">
        <span className="icon" aria-hidden="true">💜</span> Pricing
      </a>
      <div className="rail-footer">Free while we grow.<br />Apache-2.0 · v0.2.0</div>
    </nav>
  );
}

function TopBar({ user }: { user: { name: string; avatarHue: number } | null }) {
  const s = useStore();
  const unread = user ? notificationsFor(s, user.name ? getState().currentUserId! : '').filter((n) => !n.read).length : 0;
  return (
    <header className="topbar">
      <a href="#/app" style={{ color: 'inherit', textDecoration: 'none' }}>
        <Wordmark size={22} />
      </a>
      <span className="spacer" />
      <a href="#/app/events/new" className="btn btn-primary btn-sm">+ Share an event</a>
      <a href="#/app/notifications" className="icon-btn bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        🔔{unread > 0 && <span className="dot" aria-hidden="true" />}
      </a>
      {user && (
        <a href="#/app/profile/edit" aria-label="Edit your profile" style={{ textDecoration: 'none' }}>
          <Avatar name={user.name} hue={user.avatarHue} size={34} />
        </a>
      )}
    </header>
  );
}

function BottomNav({ path }: { path: string }) {
  return (
    <nav className="bottom-nav" aria-label="Primary mobile">
      {MOBILE.map((r) => (
        <a key={r.to} href={`#${r.to}`} className={path === r.to ? 'active' : ''}>
          <span className="icon" aria-hidden="true">{r.icon}</span>
          {r.label}
        </a>
      ))}
    </nav>
  );
}

function Suspended() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <Logo size={48} />
        <h1 style={{ fontSize: 26, marginTop: 16 }}>Account suspended</h1>
        <p className="muted" style={{ maxWidth: 440 }}>
          A suspension was applied to this account by the founder team, with a recorded reason in the audit log.
          If you believe this is a mistake, contact the founder team.
        </p>
        <Btn onClick={() => { logout(); navigate('/'); }}>Log out</Btn>
      </div>
    </div>
  );
}

export default function App() {
  const s = useStore() as AppState;
  const route = useRoute();
  const user = me(s);
  useTheme();

  useEffect(() => { sweepIfDue(); }, [route.path]);

  useEffect(() => {
    if (user) document.documentElement.dataset.accent = user.accent;
    else delete document.documentElement.dataset.accent;
  }, [user?.accent, user]);

  const seg = route.segments;

  // ─── public routes ───
  let content: React.ReactNode;
  if (seg.length === 0) content = <Landing />;
  else if (seg[0] === 'auth') content = <Auth />;
  else if (seg[0] === 'join' && seg[1]) content = <Join code={seg[1]} />;
  else if (seg[0] === 'u' && seg[1]) content = <PublicProfile userId={seg[1]} />;
  else if (['conduct', 'privacy', 'terms', 'about', 'accessibility'].includes(seg[0])) content = <Policy kind={seg[0]} />;
  else if (seg[0] === 'app') {
    if (!user) {
      content = <Auth notice="Log in to open your workspace. New here? Creating an account takes under a minute." />;
    } else if (user.suspended) {
      content = <Suspended />;
    } else {
      const sub = seg.slice(1);
      let page: React.ReactNode;
      if (sub.length === 0) page = <Dashboard />;
      else if (sub[0] === 'discover') page = <Discover />;
      else if (sub[0] === 'events' && sub[1] === 'new') page = <PostEvent />;
      else if (sub[0] === 'events' && sub[1]) page = <EventDetail eventId={sub[1]} />;
      else if (sub[0] === 'circles' && sub[1]) page = <CircleDetail circleId={sub[1]} />;
      else if (sub[0] === 'circles') page = <Circles />;
      else if (sub[0] === 'decisions' && sub[1]) page = <DecisionDetail decisionId={sub[1]} />;
      else if (sub[0] === 'plans') page = <Plans />;
      else if (sub[0] === 'people' && sub[1]) page = <PublicProfile userId={sub[1]} />;
      else if (sub[0] === 'people') page = <People />;
      else if (sub[0] === 'profile' && sub[1] === 'edit') page = <ProfileEdit />;
      else if (sub[0] === 'card') page = <CardPage />;
      else if (sub[0] === 'rewards') page = <Rewards />;
      else if (sub[0] === 'referrals') page = <Referrals />;
      else if (sub[0] === 'pricing') page = <Pricing />;
      else if (sub[0] === 'settings') page = <Settings />;
      else if (sub[0] === 'notifications') page = <Notifications />;
      else if (sub[0] === 'moderation') page = <Moderation />;
      else if (sub[0] === 'admin') page = <AdminConsole />;
      else if (sub[0] === 'support') page = <Support />;
      else page = <NotFound />;
      content = (
        <div className="shell">
          <Rail path={route.path} staff={isStaff(user)} founderTeam={isFounderTeam(user)} />
          <div>
            <TopBar user={user} />
            <main className="main">{page}</main>
            <BottomNav path={route.path} />
          </div>
        </div>
      );
    }
  } else content = <NotFound />;

  return (
    <>
      {content}
      <Toasts />
    </>
  );
}
