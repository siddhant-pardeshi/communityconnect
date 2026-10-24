import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

/** Adds `.in` once when the element scrolls into view (single shared observer per element). */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', style }: {
  children: ReactNode; delay?: number; as?: 'div' | 'section' | 'header' | 'footer'; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('in');
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as 'div';
  return (
    <Comp ref={ref as never} className={`reveal ${className}`} style={{ ['--reveal-delay' as never]: `${delay}ms`, ...style } as CSSProperties}>
      {children}
    </Comp>
  );
}

/** Animated count-up for stats; snaps instantly under reduced motion. */
export function CountUp({ to, suffix = '', duration = 1200 }: { to: number; suffix?: string; duration?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref} className="mono-num">{v}{suffix}</span>;
}

/** GitHub star prompt — honest ask, no modal nagging. */
export function StarPrompt({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <a href="https://github.com/siddhant-pardeshi/communityconnect" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" aria-label="Star CommunityConnect on GitHub">
        ⭐ Star us on GitHub
      </a>
    );
  }
  return (
    <div className="card" style={{ background: 'var(--surface-2)', border: 'none' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 style={{ marginBottom: 4 }}>⭐ Enjoying it? Star the repo.</h3>
          <p className="small muted" style={{ margin: 0 }}>
            One click, no account needed. Stars push CommunityConnect up on GitHub so more communities find it.
          </p>
        </div>
        <a href="https://github.com/siddhant-pardeshi/communityconnect" target="_blank" rel="noreferrer" className="btn btn-outline">
          ⭐ Star siddhant-pardeshi/communityconnect
        </a>
      </div>
    </div>
  );
}
