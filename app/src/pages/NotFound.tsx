import { Link } from '../router';
import { Btn } from '../components/ui';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 56, marginBottom: 0 }}>404</p>
        <h1 style={{ fontSize: 26 }}>This page wandered off the map.</h1>
        <p className="muted">The link may be old, or the content was removed at its owner’s request.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/app"><Btn>Go home</Btn></Link>
          <Link to="/discover"><Btn variant="outline">Explore events</Btn></Link>
        </div>
      </div>
    </div>
  );
}
