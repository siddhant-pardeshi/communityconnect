interface LogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

/** The Gather Mark: three nodes gathering around an open shared center. */
export function Logo({ size = 28, animated = false, className = '' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`cc-logo ${animated ? 'cc-logo-anim' : ''} ${className}`}
      role="img"
      aria-label="CommunityConnect"
    >
      <path className="cc-arc" d="M23 24 C 28 28, 36 28, 41 24" fill="none" stroke="var(--logo-arc, #E9EEFF)" strokeWidth="2.6" strokeLinecap="round" />
      <path className="cc-arc" d="M23 41 C 28 37, 36 37, 41 41" fill="none" stroke="var(--logo-arc, #E9EEFF)" strokeWidth="2.6" strokeLinecap="round" />
      <circle className="cc-node cc-node-1" cx="19.5" cy="20" r="6.5" fill="#E98D73" />
      <circle className="cc-node cc-node-2" cx="44.5" cy="20" r="6.5" fill="#E6BC56" />
      <circle className="cc-node cc-node-3" cx="32" cy="46.5" r="6.5" fill="#A9C4B2" />
      <circle className="cc-node cc-center" cx="32" cy="31.5" r="4.6" fill="var(--logo-center, #F5F3ED)" />
    </svg>
  );
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="cc-wordmark" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Logo size={size} />
      <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: size * 0.66 }}>
        Community<span style={{ color: 'var(--accent)' }}>Connect</span>
      </span>
    </span>
  );
}
