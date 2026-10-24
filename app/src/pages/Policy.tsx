import { SectionHead } from '../components/ui';
import { Wordmark } from '../components/Logo';
import { Link } from '../router';

const CONTENT: Record<string, { title: string; body: JSX.Element }> = {
  about: {
    title: 'About CommunityConnect',
    body: (
      <>
        <p>
          CommunityConnect (working name) turns scattered event links into shared plans and useful professional
          relationships. Its core loop: <strong>discover/post → shortlist with a circle → compare clashes → discuss
          and vote → finalize → confirm → find company → attend → follow up.</strong>
        </p>
        <p>
          The signature idea is the <strong>Decision Room</strong>: a calm, collaborative place where a group chooses
          among competing events using explicit availability, interests and participation — with a disclosed scoring
          formula, quorum rules, and honest handling of ties, low turnout and clashes.
        </p>
        <p>
          Principles: consent-based introductions, privacy by default, source-linked facts over vibes, attendance
          that is never overclaimed, and a service that succeeds when people make plans — even if they spend less
          time on the site.
        </p>
        <p className="small muted">Open source under Apache-2.0. Built first for Bengaluru as a demo context; made to expand city by city.</p>
      </>
    ),
  },
  conduct: {
    title: 'Community conduct',
    body: (
      <>
        <p className="muted">Version v1.0 · 25 Oct 2026. Accepting this policy is part of signup; material updates are re-accepted once.</p>
        <h3>Do</h3>
        <ul>
          <li>Disagree respectfully. Critique ideas, not people.</li>
          <li>Post accurate event details; correct or cancel promptly when things change.</li>
          <li>Ask before sharing someone’s photos, contact details, or plans.</li>
          <li>Keep professional spaces professional — no unsolicited sales floods, no scams, no deceptive listings.</li>
          <li>Claim affiliations honestly. Intent chips are self-declared, never verified credentials.</li>
        </ul>
        <h3>Don’t</h3>
        <ul>
          <li>Harass, discriminate, dox, or impersonate.</li>
          <li>Mass-DM, scrape member lists, or spam invites.</li>
          <li>Pressure anyone about attendance, votes, or “showing up” — availability is not a commitment.</li>
          <li>Use CommunityConnect to promise funding, investment outcomes, or job guarantees.</li>
        </ul>
        <h3>Enforcement</h3>
        <p>
          Reports go to moderators with a recorded outcome and appeal path; reporter identities stay confidential.
          Actions range from content removal to temporary suspension or permanent ban. A purchase, points, or a
          large audience never exempts anyone from these rules. Coordinated mass-reports do not auto-ban anyone.
        </p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy',
    body: (
      <>
        <p className="muted">Plain-language summary for v0.1.0. The full policy binds the production deployment and its actual providers.</p>
        <h3>What we collect</h3>
        <ul>
          <li>Account basics (name, email) and the profile fields you choose to add.</li>
          <li>Content you create: events, votes, plans, connections, messages.</li>
          <li>In this browser build: everything stays in your browser’s local storage and never leaves your device.</li>
        </ul>
        <h3>Defaults that protect you</h3>
        <ul>
          <li>Circles, votes and busy intervals are private; attendance is non-public by default.</li>
          <li>College/company/background appear only when you allow them — toggleable any time, applies instantly.</li>
          <li>Your email is never a public profile field. Contact exchange is mutual (accepted connections only).</li>
          <li>No GPS tracking, no address-book uploads, no face recognition, no sale of personal data, ever.</li>
        </ul>
        <h3>Your controls</h3>
        <p>Export all your data as JSON from Settings. Deletion removes your participation and pseudonymizes authored content; narrowly-scoped abuse records are retained per published policy. Analytics exclude message contents, private event names and exact locations.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms of service (summary)',
    body: (
      <>
        <p className="muted">Summary for v0.1.0; the production version will identify the operating entity and jurisdiction before charging anyone money.</p>
        <ul>
          <li><strong>Eligibility:</strong> 18+. We do not collect government IDs just to make an account.</li>
          <li><strong>The service:</strong> planning and introductions. CommunityConnect is not a ticketing platform; a confirmed plan is not a ticket, and registration happens on organizers’ own sites.</li>
          <li><strong>No guarantees:</strong> no promise of jobs, funding, introductions that convert, or event accuracy. Listings are community-submitted with source links — verify before registering or paying anyone.</li>
          <li><strong>Conduct:</strong> the community conduct policy is part of these terms; breaking it can end access.</li>
          <li><strong>Pricing:</strong> free during the growth phase. Any future subscription will be announced in advance, with subsidized/free paths for students and people between roles. Safety and privacy tools stay free.</li>
          <li><strong>License:</strong> the code is open source under Apache-2.0; “CommunityConnect” as a brand name is provisional and not yet trademark-cleared.</li>
        </ul>
      </>
    ),
  },
  accessibility: {
    title: 'Accessibility',
    body: (
      <>
        <p>We build to WCAG-informed practice and verify rendered contrast in both themes:</p>
        <ul>
          <li>Full keyboard navigation; visible focus rings; 44px minimum touch targets.</li>
          <li>States are never color-only — every positive/negative/conflict status has text (and usually an icon).</li>
          <li><strong>prefers-reduced-motion</strong> removes all decorative animation, including the logo formation and hero art.</li>
          <li>Responsive from 360px to desktop; complex comparisons become readable stacked layouts on mobile.</li>
          <li>Alt text on meaningful images, empty alt on decoration, tabular numbers for times and scores.</li>
        </ul>
        <p className="small muted">Found a barrier? Report it via a GitHub issue with the page and what happened — accessibility regressions are treated as bugs, not feature requests.</p>
      </>
    ),
  },
};

export default function Policy({ kind }: { kind: string }) {
  const c = CONTENT[kind] ?? CONTENT.about;
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 18px 80px' }}>
      <p><Link to="/"><Wordmark size={24} /></Link></p>
      <SectionHead title={c.title} />
      <div className="reading">{c.body}</div>
      <div className="row" style={{ marginTop: 28 }}>
        <Link to="/conduct" className="btn btn-ghost btn-sm">Conduct</Link>
        <Link to="/privacy" className="btn btn-ghost btn-sm">Privacy</Link>
        <Link to="/terms" className="btn btn-ghost btn-sm">Terms</Link>
        <Link to="/accessibility" className="btn btn-ghost btn-sm">Accessibility</Link>
        <Link to="/about" className="btn btn-ghost btn-sm">About</Link>
      </div>
    </div>
  );
}
