import { useStore, me, notificationsFor, mutate } from '../lib/store';
import { timeAgo } from '../lib/util';
import { Card, EmptyState, SectionHead } from '../components/ui';
import { Link } from '../router';
import { navigate } from '../router';

const TYPE_ICON: Record<string, string> = {
  decision: '🗳️', connection: '🤝', plan: '🗓️', event: '📌', buddy: '🫂', moderation: '🛡️', referral: '🎁',
};

export default function Notifications() {
  const s = useStore();
  const user = me(s);
  if (!user) return null;
  const items = notificationsFor(s, user.id);

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHead
        title="Notifications"
        action={items.some((n) => !n.read) ? (
          <button className="btn btn-ghost btn-sm" onClick={() => mutate((st) => { st.notifications.filter((n) => n.userId === user.id).forEach((n) => { n.read = true; }); })}>
            Mark all read
          </button>
        ) : undefined}
      />
      <Card>
        {items.length === 0 ? (
          <EmptyState title="All quiet" body="Invites, votes, plans and connection requests will land here." />
        ) : (
          items.slice(0, 40).map((n) => (
            <div
              key={n.id}
              className="list-row"
              style={{ cursor: n.link ? 'pointer' : undefined }}
              onClick={() => {
                mutate((st) => { const t = st.notifications.find((x) => x.id === n.id); if (t) t.read = true; });
                if (n.link) navigate(n.link.replace('#', ''));
              }}
              role={n.link ? 'link' : undefined}
            >
              {!n.read && <span className="unread" aria-label="unread" />}
              <span aria-hidden="true" style={{ fontSize: 18 }}>{TYPE_ICON[n.type] ?? '🔔'}</span>
              <div style={{ flex: 1 }}>
                <strong className="small">{n.title}</strong>
                <p className="small muted" style={{ margin: '2px 0 0' }}>{n.body}</p>
              </div>
              <span className="small muted">{timeAgo(n.at)}</span>
            </div>
          ))
        )}
      </Card>
      <p className="small muted" style={{ marginTop: 12 }}>
        Quiet hours and email digests arrive with the server backend — see <Link to="/app/settings">notification preferences</Link>.
      </p>
    </div>
  );
}
