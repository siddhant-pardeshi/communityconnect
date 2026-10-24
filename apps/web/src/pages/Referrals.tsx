import { useStore, me } from '../lib/store';
import { profileUrl } from '../lib/qr';
import { Avatar, Btn, Card, Chip, SectionHead, showToast } from '../components/ui';
import { timeAgo } from '@cc/core';
import { XP_RULES } from '@cc/core';

export default function Referrals() {
  const s = useStore();
  const user = me(s);
  if (!user) return null;

  const invited = Object.values(s.users).filter((u) => u.referredBy === user.id);
  const link = `${profileUrl(user.id).split('#')[0]}#/auth?mode=signup&ref=${user.referralCode}`;
  const boosted = user.boostUntil && user.boostUntil > Date.now();

  const share = async () => {
    const text = `I'm planning events with my circle on CommunityConnect — join with my code ${user.referralCode} and we both get bonuses: ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'CommunityConnect', text, url: link }); return; } catch { /* fall through */ }
    }
    navigator.clipboard?.writeText(text);
    showToast('Invite message copied — paste it anywhere.');
  };

  return (
    <div style={{ maxWidth: 720 }} className="stack">
      <SectionHead
        title="Invite & both earn"
        sub="Growth should reward the people who make it happen — you and your friend, equally."
      />

      <Card style={{ background: 'linear-gradient(135deg, var(--accent-soft), var(--surface))', borderColor: 'var(--accent)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>Your referral code</h3>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 30, fontWeight: 800, margin: '6px 0', letterSpacing: '0.06em' }}>{user.referralCode}</p>
          </div>
          {boosted && <Chip tone="boost" title="Active boost">🚀 boosted till {new Date(user.boostUntil!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Chip>}
        </div>
        <div className="row">
          <Btn onClick={share}>📤 Share invite</Btn>
          <Btn variant="outline" onClick={() => { navigator.clipboard?.writeText(link); showToast('Invite link copied'); }}>Copy link</Btn>
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <h3>What you get</h3>
          <ul className="small" style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>+{XP_RULES.referral} XP</strong> for every friend who joins</li>
            <li><strong>14-day profile boost</strong> — you surface first in the People directory</li>
            <li><strong>Connector badge</strong> on your profile</li>
            <li>Stack freely — invite 5 friends, get 5 boosts</li>
          </ul>
        </Card>
        <Card>
          <h3>What your friend gets</h3>
          <ul className="small" style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>+{XP_RULES.referral} XP</strong> the moment they join</li>
            <li><strong>7-day welcome boost</strong> so people discover them</li>
            <li><strong>Connector badge</strong> — they start their history in style</li>
            <li>The full platform is free — no trial, no card</li>
          </ul>
        </Card>
      </div>

      <Card>
        <h3>Friends you brought in ({invited.length})</h3>
        {invited.length === 0 ? (
          <p className="muted small">None yet. Pro tip: share it in your class group, team channel, or right after an event you attended together.</p>
        ) : (
          invited.map((u) => (
            <div key={u.id} className="list-row">
              <Avatar name={u.name} hue={u.avatarHue} size={30} />
              <span style={{ flex: 1 }}><strong>{u.name}</strong> <span className="small muted">· joined {timeAgo(u.createdAt)}</span></span>
              <Chip tone="positive">+{XP_RULES.referral} XP</Chip>
            </div>
          ))
        )}
      </Card>

      <p className="small muted">
        Fair-play rules: bonuses are once per person, and coordinated farming is reversed by moderation.
        XP never buys trust, reach beyond boosts, or moderation power.
      </p>
    </div>
  );
}
