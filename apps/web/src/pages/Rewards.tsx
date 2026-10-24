import { useStore, me } from '../lib/store';
import { levelOf, BADGES } from '@cc/core';
import { Bar, Card, Chip, SectionHead } from '../components/ui';
import { dayKeyInTz } from '@cc/core';

export default function Rewards() {
  const s = useStore();
  const user = me(s);
  if (!user) return null;
  const level = levelOf(user.xp);
  const last14: { key: string; active: boolean }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = dayKeyInTz(user.timezone, d);
    last14.push({ key, active: streakCovers(user.streak.count, user.streak.lastDay, key) });
  }

  return (
    <div style={{ maxWidth: 720 }} className="stack">
      <SectionHead
        title="Momentum"
        sub="A gentle record of your participation — private to you, hideable, never affecting anyone’s trust or reach."
      />

      <Card>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>🔥 Check-in streak</h3>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              One intentional check-in per day ({user.timezone}). Miss a day? Each week includes one grace day that covers it — no shame, no XP lost.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{user.streak.count}</div>
            <span className="small muted">day streak</span>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 4 }}>
          {last14.map((d) => (
            <div key={d.key} title={d.key}
              style={{
                width: 26, height: 26, borderRadius: 8, fontSize: 10, display: 'grid', placeItems: 'center',
                background: d.active ? 'var(--accent)' : 'var(--surface-2)',
                color: d.active ? 'var(--on-accent)' : 'var(--muted)',
              }}>
              {d.key.slice(8)}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3>Level — {level.name}</h3>
        <p className="small muted">
          {level.next
            ? `${user.xp} XP · ${level.next.min - user.xp} XP to ${level.next.name}. Earn XP by voting (+5), posting events (+10), connections (+10), confirming plans (+15), buddy matches (+10) and referrals (+75 each). Daily contribution is capped at 30 XP — quality over grinding.`
            : `${user.xp} XP — top level. You’re a constellation.`}
        </p>
        {level.next && <Bar value={user.xp - level.min} max={level.next.min - level.min} />}      </Card>

      <Card>
        <h3>Badges</h3>
        {user.badges.length === 0 ? (
          <p className="muted small">None yet — vote in your first decision or confirm a plan to start.</p>
        ) : (
          <div className="agg">
            {user.badges.map((b) => (
              <Chip key={b} tone="positive" title={BADGES[b]?.how}>🏅 {BADGES[b]?.label ?? b}</Chip>
            ))}
          </div>
        )}
        <p className="small muted" style={{ marginTop: 10 }}>
          Badges describe what you actually did. There is no “verified expert” badge bought with points — trust
          here comes from behavior, not accumulation.
        </p>
      </Card>

      <Card>
        <h3>Cosmetics</h3>
        <p className="small muted">Profile accent themes unlock at Planner (250 XP). Open <strong>Profile → Appearance</strong> to switch. Privacy and accessibility tools are always free for everyone.</p>
      </Card>
    </div>
  );
}

function daysSince(key: string, lastDay: string | null): number {
  if (!lastDay) return 0;
  return Math.round((+new Date(key) - +new Date(lastDay)) / 86400000);
}

/** Whether a streak of `count` ending at `lastDay` covers the given day key. */
function streakCovers(count: number, lastDay: string | null, key: string): boolean {
  if (!lastDay) return false;
  const diff = Math.round((+new Date(lastDay) - +new Date(key)) / 86400000);
  return diff >= 0 && diff < count;
}
