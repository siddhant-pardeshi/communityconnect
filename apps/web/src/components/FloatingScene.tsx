import { useEffect, useRef } from 'react';
import { Constellation } from './Constellation';

/**
 * Hero scene: the constellation art plus a layer of floating, hoverable
 * emblems (votes, buddies, QR cards, discussions), a looping "event
 * collision → clash detected → resolve into a plan" vignette, and gentle
 * mouse parallax. Purely decorative — everything is disabled under
 * prefers-reduced-motion and nothing essential lives here.
 */

const EMBLEMS: { e: string; x: number; y: number; s: number; d: number; label: string; depth: number }[] = [
  { e: '🗳️', x: 4, y: 12, s: 30, d: 0, label: 'Vote together', depth: 26 },
  { e: '🤝', x: 92, y: 8, s: 28, d: 0.9, label: 'Find a buddy', depth: 18 },
  { e: '🪪', x: 88, y: 62, s: 26, d: 1.8, label: 'QR networking card', depth: 30 },
  { e: '🎉', x: 8, y: 74, s: 26, d: 1.2, label: 'Show up together', depth: 14 },
  { e: '🗓️', x: 48, y: 2, s: 24, d: 2.6, label: 'One shared plan', depth: 22 },
  { e: '⭐', x: 70, y: 90, s: 20, d: 3.1, label: 'Founding perks', depth: 20 },
];

export function FloatingScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width - 0.5) * 2;  // -1..1
      const my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      el.style.setProperty('--mx', String(Math.max(-1, Math.min(1, mx))));
      el.style.setProperty('--my', String(Math.max(-1, Math.min(1, my))));
    };
    const onLeave = () => { el.style.setProperty('--mx', '0'); el.style.setProperty('--my', '0'); };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  return (
    <div className="float-scene" ref={ref} aria-hidden="true">
      <div className="parallax-layer" style={{ ['--depth' as never]: 12 }}>
        <Constellation />
      </div>

      {EMBLEMS.map((n) => (
        <span
          key={n.label}
          className="parallax-layer float-emoji"
          style={{
            left: `${n.x}%`, top: `${n.y}%`, fontSize: n.s,
            animationDelay: `${n.d}s`,
            ['--depth' as never]: n.depth,
          }}
          title={n.label}
        >
          {n.e}
        </span>
      ))}

      {/* event collision vignette: two plans drift together, clash, resolve */}
      <div className="collision">
        <div className="mini-event me-l"><span className="me-bar" style={{ background: 'var(--coral)' }} /> Sat · Run+Chai</div>
        <div className="me-spark">⚡ clash!</div>
        <div className="mini-event me-r"><span className="me-bar" style={{ background: 'var(--saffron)' }} /> Sat · Demo Night</div>
      </div>

      <div className="chat-bubble">
        <span className="cb-name">Meera</span> voting…
        <span className="typing"><i /><i /><i /></span>
      </div>
    </div>
  );
}
