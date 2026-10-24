import { useState } from 'react';
import { navigate, useRoute } from '../router';
import { joinByInvite, me, useStore } from '../lib/store';
import { Btn, Card } from '../components/ui';
import { showToast } from '../components/ui';

export default function Join({ code }: { code: string }) {
  const s = useStore();
  const route = useRoute();
  const user = me(s);
  const [busy, setBusy] = useState(false);
  const circle = Object.values(s.circles).find((c) => c.inviteCode.toUpperCase() === code.toUpperCase());

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 460 }}>
          <h1 style={{ fontSize: 26 }}>You’re invited to a circle</h1>
          <p className="muted">
            Circle invites are private. Log in or create your free account first — we’ll bring you straight back here.
          </p>
          <div className="row">
            <Btn onClick={() => navigate(`/auth?mode=signup`)}>Join free</Btn>
            <Btn variant="outline" onClick={() => navigate('/auth')}>Log in</Btn>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>Invite code: <span className="kbd">{code}</span></p>
        </Card>
      </div>
    );
  }

  const doJoin = () => {
    setBusy(true);
    const res = joinByInvite(code);
    setBusy(false);
    if (res.ok && res.circleId) {
      showToast(`Welcome to ${circle?.name ?? 'the circle'} 👋`);
      navigate(`/app/circles/${res.circleId}`);
    } else {
      showToast(res.error ?? 'Could not join.', 'err');
    }
  };

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 26 }}>{circle ? circle.name : 'Circle invite'}</h1>
        {circle ? (
          <>
            <p className="muted">{circle.description}</p>
            <p className="small muted">
              {circle.memberIds.length} member{circle.memberIds.length === 1 ? '' : 's'} · invited with code{' '}
              <span className="kbd">{code}</span>
            </p>
            {circle.memberIds.includes(user.id) ? (
              <Btn onClick={() => navigate(`/app/circles/${circle.id}`)}>Open circle</Btn>
            ) : (
              <Btn onClick={doJoin} disabled={busy}>{busy ? 'Joining…' : 'Join this circle'}</Btn>
            )}
          </>
        ) : (
          <>
            <div className="banner banner-caution">
              This invite is not valid — it may have expired or been revoked by the owner.
            </div>
            <Btn variant="outline" onClick={() => navigate('/app/circles')}>Go to my circles</Btn>
          </>
        )}
        <p className="small muted" style={{ marginTop: 12 }}>
          Joining is always your explicit choice. Invites never subscribe you to marketing.
        </p>
      </Card>
    </div>
  );
}
