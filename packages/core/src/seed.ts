import type { AppState, Decision, EventItem, UserAccount, Vouch } from './types';

// Fictional demo data, clearly labeled `demo`. Relative dates so the demo
// environment never goes stale. The founder team (founder + 2 co-founders) is
// seeded so the admin console is explorable; with the server backend the real
// founder account is claimed via a founder invite, not a demo login.

const DAY = 86400000;

function inDays(days: number, startHourIst: number, hours: number): { startUtc: string; endUtc: string } {
  const base = new Date(Date.now() + days * DAY);
  base.setUTCHours(0, 0, 0, 0);
  // IST = UTC+5:30 → subtract from desired local hour to get UTC hour.
  const start = new Date(base.getTime() + (startHourIst - 5.5) * 3600000);
  const end = new Date(start.getTime() + hours * 3600000);
  return { startUtc: start.toISOString(), endUtc: end.toISOString() };
}

function ev(
  id: string, title: string, summary: string, organizer: string, mode: 'in_person' | 'online' | 'hybrid',
  days: number, hour: number, len: number, tags: string[],
  extra: Partial<EventItem> = {}
): EventItem {
  const t = inDays(days, hour, len);
  return {
    id, title, summary, organizer, mode,
    city: mode === 'online' ? undefined : 'Bengaluru',
    startUtc: t.startUtc, endUtc: t.endUtc, tz: 'Asia/Kolkata',
    price: null, currency: 'INR', tags,
    visibility: 'public', createdBy: 'u_sana', status: 'active', moderation: 'approved',
    createdAt: Date.now() - 5 * DAY, demo: true,
    ...extra,
  };
}

export function buildSeed(): AppState {
  const now = Date.now();
  const e1 = ev('e_satsat', 'Bengaluru Startup Saturday #42', 'Founders, builders and first-time operators meet over filter coffee. Lightning demos at 6 pm, open networking after.', 'Startup Saturday BLR', 'in_person', 4, 17, 3, ['startups', 'networking', 'founders'], { venue: 'Indiranagar Coffee House', price: 0, sourceUrl: 'https://lu.ma/example-startup-saturday', sourceProvider: 'Luma (example)', createdBy: 'u_aarav' });
  const e2 = ev('e_aidemo', 'AI Builders Demo Night', 'Eight builders demo what they shipped this month. Feedback-first room; bring a problem you are stuck on.', 'AI Builders BLR', 'in_person', 6, 18.5, 2.5, ['ai', 'demos', 'engineering'], { venue: 'Koramangala WorkHall', price: 199, sourceUrl: 'https://example.org/ai-builders-demo-night', createdBy: 'u_kabir' });
  const e3 = ev('e_dsmeet', 'Design Systems Meetup: Tokens in Practice', 'How three Bengaluru teams run their design token pipelines. Q&A with the panel after.', 'Design BLR', 'in_person', 8, 10, 2.5, ['design', 'systems'], { venue: 'HSR Layout Layout Club', price: 0, accessibility: 'Step-free entrance; accessible washroom on-site', sourceUrl: 'https://example.org/designblr-tokens', createdBy: 'u_meera' });
  const e4 = ev('e_ossprint', 'Open Source India Sprint — Good First Issues', 'Guided sprint for first-time contributors. Maintainers online to review your first PR.', 'OSS India', 'online', 5, 19, 3, ['open-source', 'engineering'], { price: 0, sourceUrl: 'https://example.org/oss-india-sprint', createdBy: 'u_kabir' });
  const e5 = ev('e_prodtank', 'Product Tank Bengaluru: Pricing Experiments', 'Talks on pricing pages that convert, followed by open Q&A with local PMs.', 'Product Tank BLR', 'in_person', 10, 18, 2, ['product', 'pricing'], { venue: 'Domlur Community Hall', price: 149, createdBy: 'u_sana' });
  const e6 = ev('e_placed', 'Campus Placement Prep Workshop', 'Resume teardowns, mock HR rounds and alumni referral Q&A — built for final-year students.', 'Placement Partners Collective', 'online', 3, 18, 2.5, ['careers', 'students'], { price: 0, sourceUrl: 'https://example.org/placement-prep', createdBy: 'u_ananya' });
  const e7 = ev('e_runchai', 'Sunday Run + Chai Club', 'Easy 5K at talking pace around Cubbon Park, then chai. All paces welcome; nobody runs alone.', 'BLR Run Club', 'in_person', 7, 6.5, 2, ['fitness', 'social'], { venue: 'Cubbon Park Bandstand gate', price: 0, accessibility: 'Paved, mostly flat route', createdBy: 'u_dev' });
  const e8 = ev('e_figma', 'Figma Hands-on: Prototyping for Real Products', 'Bring a laptop. You leave with a clickable prototype of your own idea.', 'Design BLR', 'in_person', 12, 10, 4, ['design', 'workshop'], { venue: 'Indiranagar Studio 9', price: 299, createdBy: 'u_meera' });
  const e9 = ev('e_jsblr', 'JavaScript BLR Monthly: Edge Runtime Deep Dive', 'Two talks on running JS at the edge, plus hiring booth for two teams that are growing.', 'JS BLR', 'in_person', 9, 18, 2.5, ['javascript', 'engineering', 'careers'], { venue: 'MG Road TechHub', price: 0, createdBy: 'u_kabir' });
  const e10 = ev('e_indie', 'Indie Founders Roundtable (circle only)', 'Monthly closed roundtable for the Startup Saturday crew: revenue check-ins and one hard problem each.', 'Crew', 'hybrid', 14, 11, 2, ['founders'], { price: 0, visibility: 'circle', circleId: 'c1', createdBy: 'u_aarav' });
  const e11 = ev('e_mixer', 'Indie Hackers Mixer — October edition', 'Casual last-Friday mixer: 60 builders, zero pitch decks. Name tags at the door.', 'BLR Indie Hackers', 'in_person', -6, 18, 3, ['startups', 'networking'], { venue: 'Indiranagar Social', price: 0, createdBy: 'u_aarav' });

  const users: UserAccount[] = [
    {
      id: 'u_founder', name: 'Siddhant Pardeshi', pronouns: 'he/him', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Founder of CommunityConnect. Building the place where groups decide and nobody attends alone.',
      role: 'Founder & CEO', college: 'Savitribai Phule Pune University', course: 'B.E. Computer Engineering',
      company: 'CommunityConnect',
      background: 'Founder. Ships the product, meets the community, answers every report personally.',
      intents: ['building', 'open_to_meet'], links: [{ label: 'GitHub', url: 'https://github.com/siddhant-pardeshi' }, { label: 'LinkedIn', url: 'https://linkedin.com/in/example-siddhant' }],
      avatarHue: 210, privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'founder@communityconnect.app', passHash: 'seed-demo', salt: 'seed', createdAt: now - 45 * DAY,
      referralCode: 'SIDH-2026', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 500, ledger: [], badges: ['connector', 'first_plan'], accent: 'cobalt',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'founder', founding: true, demo: true,
    },
    {
      id: 'u_priya', name: 'Priya Nair', pronouns: 'she/her', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Co-founder & Operations. Runs city partnerships, organizer onboarding and the pilot playbook.',
      role: 'Co-founder & Operations', company: 'CommunityConnect', college: 'IIM Kozhikode', course: 'MBA',
      background: 'Ex-operations lead; built two community programs from 0 to 5,000 members.',
      intents: ['building', 'seeking_feedback'], links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/example-priya' }],
      avatarHue: 290, privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'priya@communityconnect.app', passHash: 'seed-demo', salt: 'seed', createdAt: now - 44 * DAY,
      referralCode: 'PRIY-7302', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 300, ledger: [], badges: ['connector'], accent: 'sage',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'cofounder', founding: true, demo: true,
    },
    {
      id: 'u_rohan', name: 'Rohan Gupta', pronouns: 'he/him', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Co-founder & Engineering. Keeps the Decision Room honest, fast and accessible.',
      role: 'Co-founder & Engineering', company: 'CommunityConnect', college: 'VJTI Mumbai', course: 'B.Tech Computer Engineering',
      background: 'Distributed systems engineer; reviews every schema migration personally.',
      intents: ['building', 'learning'], links: [{ label: 'GitHub', url: 'https://github.com/example-rohan' }],
      avatarHue: 150, privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'rohan@communityconnect.app', passHash: 'seed-demo', salt: 'seed', createdAt: now - 44 * DAY,
      referralCode: 'ROHA-9184', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 300, ledger: [], badges: ['curator'], accent: 'coral',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'cofounder', founding: true, demo: true,
    },
    {
      id: 'u_aarav', name: 'Aarav Shah', pronouns: 'he/him', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Fin-tech engineer who organizes Startup Saturday. Ask me about first demos and filter coffee.',
      role: 'Engineer & community organizer', college: 'IIT Bombay', course: 'B.Tech CSE', company: 'Zerodha',
      background: '6 years across payments infra; now mentoring first-time founders.',
      intents: ['building', 'open_to_meet', 'hiring'], links: [{ label: 'GitHub', url: 'https://github.com/example-aarav' }, { label: 'LinkedIn', url: 'https://linkedin.com/in/example-aarav' }],
      avatarHue: 16, privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'aarav@example.com', passHash: 'seed-demo', salt: 'seed', createdAt: now - 40 * DAY,
      referralCode: 'AARA-2026', boostUntil: now + 10 * DAY, streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 320, ledger: [], badges: ['first_plan', 'connector', 'helpful_intro'], accent: 'cobalt',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'moderator', demo: true,
    },
    {
      id: 'u_meera', name: 'Meera Krishnan', pronouns: 'she/her', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Product designer. I run the Design Systems meetup and I am always up for portfolio reviews.',
      role: 'Senior Product Designer', college: 'BITS Pilani', course: 'B.E. Computer Science', company: 'Razorpay',
      background: 'Design systems, accessibility, mentored 12 juniors into their first design roles.',
      intents: ['seeking_feedback', 'open_to_meet'], links: [{ label: 'Portfolio', url: 'https://example.com/meera' }],
      avatarHue: 265, privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'meera@example.com', passHash: 'seed-demo', salt: 'seed', createdAt: now - 35 * DAY,
      referralCode: 'MEER-8841', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 210, ledger: [], badges: ['curator'], accent: 'sage',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'member', demo: true,
    },
    {
      id: 'u_kabir', name: 'Kabir Mehta', pronouns: 'he/him', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Backend at Google by day, open-source maintainer by night. Hiring two SDE-2s.',
      role: 'Senior Software Engineer', college: 'NIT Trichy', course: 'B.Tech EEE', company: 'Google',
      background: 'Distributed systems; reviews 100+ resumes a quarter and shares notes publicly.',
      intents: ['hiring', 'learning'], links: [{ label: 'GitHub', url: 'https://github.com/example-kabir' }],
      avatarHue: 205, privacy: { showCollege: false, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'kabir@example.com', passHash: 'seed-demo', salt: 'seed', createdAt: now - 30 * DAY,
      referralCode: 'KABI-5502', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 150, ledger: [], badges: [], accent: 'cobalt',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'member', demo: true,
    },
    {
      id: 'u_ananya', name: 'Ananya Rao', pronouns: 'she/her', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Final-year CSE. Hunting for my first engineering role and building a tiny study-buddy app.',
      role: 'Student & aspiring SDE', college: 'Christ University', course: 'B.Tech CSE (final year)',
      background: 'Placement-prep volunteer; DSA + React.',
      intents: ['open_to_work', 'seeking_referral', 'learning', 'open_to_meet'], links: [{ label: 'GitHub', url: 'https://github.com/example-ananya' }],
      avatarHue: 340, privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'ananya@example.com', passHash: 'seed-demo', salt: 'seed', createdAt: now - 12 * DAY,
      referralCode: 'ANAN-7719', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 60, ledger: [], badges: [], accent: 'coral',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'member', demo: true,
    },
    {
      id: 'u_dev', name: 'Dev Kapoor', pronouns: 'he/him', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'Supply-chain PM, recently between roles after a reorg. Running again and meeting people while I figure out the next thing.',
      role: 'Product Manager', company: 'Stealth (was Flipkart)',
      background: '8 years product; open to intros, contract work and cofounder conversations.',
      intents: ['between_roles', 'open_to_meet', 'seeking_feedback'], links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/example-dev' }],
      avatarHue: 95, privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
      email: 'dev@example.com', passHash: 'seed-demo', salt: 'seed', createdAt: now - 20 * DAY,
      referralCode: 'DEVK-3301', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 40, ledger: [], badges: [], accent: 'saffron',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'member', demo: true,
    },
    {
      id: 'u_sana', name: 'Sana Iqbal', pronouns: 'she/her', city: 'Bengaluru', timezone: 'Asia/Kolkata',
      bio: 'PM at Swiggy. Learning design; posting the good meetups I find so friends stop missing them.',
      role: 'Product Manager', college: 'VIT Vellore', course: 'B.Tech IT', company: 'Swiggy',
      background: 'Growth PM; host of a tiny letter about Bengaluru events.',
      intents: ['learning', 'building'], links: [],
      avatarHue: 40, privacy: { showCollege: true, showCompany: true, showBackground: false, directoryOptIn: true, showIntent: false },
      email: 'sana@example.com', passHash: 'seed-demo', salt: 'seed', createdAt: now - 25 * DAY,
      referralCode: 'SANA-6160', streak: { lastDay: null, count: 0, graceWeek: null },
      xp: 90, ledger: [], badges: [], accent: 'cobalt',
      notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole: 'member', demo: true,
    },
  ];

  const circles = [
    { id: 'c1', name: 'Startup Saturday Crew', description: 'We pick one good event per weekend and actually show up together.', ownerId: 'u_aarav', memberIds: ['u_aarav', 'u_meera', 'u_kabir'], inviteCode: 'SSCR-42XA', createdAt: now - 30 * DAY, demo: true },
    { id: 'c2', name: 'Design & Coffee', description: 'Designers, students and design-curious folks. Monthly pick + portfolio swaps.', ownerId: 'u_meera', memberIds: ['u_meera', 'u_sana', 'u_ananya'], inviteCode: 'DSGN-9KQ2', createdAt: now - 22 * DAY, demo: true },
  ];

  const decisions: Decision[] = [
    {
      id: 'd1', circleId: 'c1', title: 'Which weekend plan?', prompt: 'Three good options this fortnight. Vote honestly — availability is not a commitment.',
      candidateIds: ['e_satsat', 'e_aidemo', 'e_jsblr'],
      eligibleVoters: ['u_aarav', 'u_meera', 'u_kabir'],
      deadlineUtc: new Date(now + 2 * DAY).toISOString(),
      liveResults: false, quorumPct: 60, status: 'open' as const,
      ballots: [
        { userId: 'u_meera', responses: { e_satsat: 'can', e_aidemo: 'maybe', e_jsblr: 'cannot' }, favorite: 'e_satsat', submittedAt: now - 1 * DAY },
        { userId: 'u_kabir', responses: { e_satsat: 'maybe', e_aidemo: 'can' }, favorite: 'e_aidemo', submittedAt: now - DAY / 2 },
      ],
      createdBy: 'u_aarav', createdAt: now - 2 * DAY,
    },
    {
      id: 'd2', circleId: 'c2', title: 'Design weekend pick', prompt: 'Meetup vs hands-on workshop — where do we go as a group?',
      candidateIds: ['e_dsmeet', 'e_figma'],
      eligibleVoters: ['u_meera', 'u_sana', 'u_ananya'],
      deadlineUtc: new Date(now - DAY).toISOString(),
      liveResults: true, quorumPct: 60, status: 'finalized' as const,
      ballots: [
        { userId: 'u_meera', responses: { e_dsmeet: 'can', e_figma: 'maybe' }, favorite: 'e_dsmeet', submittedAt: now - 3 * DAY },
        { userId: 'u_sana', responses: { e_dsmeet: 'can', e_figma: 'cannot' }, submittedAt: now - 2.5 * DAY },
        { userId: 'u_ananya', responses: { e_dsmeet: 'maybe', e_figma: 'can' }, favorite: 'e_figma', submittedAt: now - 2 * DAY },
      ],
      result: {
        chosenEventId: 'e_dsmeet', score: 78.3, tie: false,
        counts: { e_dsmeet: { can: 2, maybe: 1, cannot: 0, favorite: 1 }, e_figma: { can: 1, maybe: 1, cannot: 1, favorite: 1 } },
        eligibleCount: 3, respondedCount: 3, quorumMet: true,
        formulaVersion: 'pref-v1:100*(0.65Y+0.15M+0.20F)/N',
        finalizedBy: 'u_meera', finalizedAt: now - DAY, warnings: [],
      },
      plan: {
        id: 'p_d2', decisionId: 'd2', circleId: 'c2', eventId: 'e_dsmeet', status: 'awaiting' as const,
        confirmations: { u_meera: 'confirmed' as const }, meetupNote: 'Main entrance, 09:50, look for the sage tote bag.',
        createdAt: now - DAY,
      },
      createdBy: 'u_meera', createdAt: now - 4 * DAY,
    },
    {
      id: 'd3', circleId: 'c1', title: 'Closed vote — tie example', prompt: 'Historic: two options finished level and the crew ran a runoff offline. Kept for reference.',
      candidateIds: ['e_runchai', 'e_prodtank'],
      eligibleVoters: ['u_aarav', 'u_meera', 'u_kabir'],
      deadlineUtc: new Date(now - 6 * DAY).toISOString(),
      liveResults: true, quorumPct: 60, status: 'closed' as const,
      ballots: [
        { userId: 'u_meera', responses: { e_runchai: 'can', e_prodtank: 'cannot' }, favorite: 'e_runchai', submittedAt: now - 7 * DAY },
        { userId: 'u_kabir', responses: { e_runchai: 'cannot', e_prodtank: 'can' }, favorite: 'e_prodtank', submittedAt: now - 7 * DAY },
      ],
      createdBy: 'u_aarav', createdAt: now - 8 * DAY,
    },
  ];

  const rsvps = [
    { id: 'r1', eventId: 'e_satsat', userId: 'u_aarav', status: 'planning' as const, at: now - 2 * DAY },
    { id: 'r2', eventId: 'e_satsat', userId: 'u_kabir', status: 'registered' as const, at: now - DAY },
    { id: 'r3', eventId: 'e_aidemo', userId: 'u_meera', status: 'planning' as const, at: now - DAY },
    { id: 'r4', eventId: 'e_dsmeet', userId: 'u_meera', status: 'planning' as const, at: now - 3 * DAY },
    { id: 'r5', eventId: 'e_ossprint', userId: 'u_sana', status: 'planning' as const, at: now - 2 * DAY },
    { id: 'r6', eventId: 'e_placed', userId: 'u_ananya', status: 'planning' as const, at: now - DAY },
    { id: 'r7', eventId: 'e_runchai', userId: 'u_dev', status: 'planning' as const, at: now - 4 * DAY },
    { id: 'r8', eventId: 'e_figma', userId: 'u_sana', status: 'registered' as const, at: now - 3 * DAY },
    { id: 'r9', eventId: 'e_jsblr', userId: 'u_kabir', status: 'planning' as const, at: now - DAY },
    // past mixer — the vouching demo runs on this event
    { id: 'r10', eventId: 'e_mixer', userId: 'u_aarav', status: 'registered' as const, at: now - 8 * DAY },
    { id: 'r11', eventId: 'e_mixer', userId: 'u_meera', status: 'planning' as const, at: now - 8 * DAY },
    { id: 'r12', eventId: 'e_mixer', userId: 'u_dev', status: 'registered' as const, at: now - 7 * DAY },
    { id: 'r13', eventId: 'e_mixer', userId: 'u_sana', status: 'registered' as const, at: now - 7 * DAY },
  ];

  // Peer vouches from the October mixer — hearts, claim verification, conduct signals.
  const vouches: Vouch[] = [
    { id: 'v1', from: 'u_meera', to: 'u_aarav', eventId: 'e_mixer', hearts: true, claims: ['college', 'company', 'course'], conduct: ['polite', 'professional'], at: now - 5 * DAY },
    { id: 'v2', from: 'u_dev', to: 'u_aarav', eventId: 'e_mixer', hearts: true, claims: [], conduct: ['polite'], at: now - 5 * DAY + 600000 },
    { id: 'v3', from: 'u_sana', to: 'u_meera', eventId: 'e_mixer', hearts: true, claims: ['college'], conduct: ['professional'] as const, at: now - 4 * DAY },
    { id: 'v4', from: 'u_aarav', to: 'u_dev', eventId: 'e_mixer', hearts: true, claims: ['company'], conduct: ['polite', 'professional'], note: 'Asked great questions, respected the room.', at: now - 4 * DAY + 300000 },
  ];

  const connections = [
    { id: 'cn1', pairKey: 'u_aarav|u_meera', from: 'u_meera', to: 'u_aarav', reason: 'Your Saturday crew sounds exactly like what my friends needed.', status: 'accepted' as const, createdAt: now - 10 * DAY, respondedAt: now - 10 * DAY + 3600000 },
    { id: 'cn2', pairKey: 'u_aarav|u_sana', from: 'u_sana', to: 'u_aarav', reason: 'I posted the placement workshop — open to co-hosting one with the crew?', status: 'pending' as const, createdAt: now - DAY },
  ];

  const threads: Record<string, { id: string; pairKey: string; from: string; text: string; at: number }[]> = {
    'u_aarav|u_meera': [
      { id: 'm1', pairKey: 'u_aarav|u_meera', from: 'u_meera', text: 'Bringing two juniors from BITS to the next one — they need this more than I do.', at: now - 9 * DAY },
      { id: 'm2', pairKey: 'u_aarav|u_meera', from: 'u_aarav', text: 'Perfect. I will intro them to Kabir, he reviews resumes for fun.', at: now - 9 * DAY + 7200000 },
    ],
  };

  const buddyRequests = [
    { id: 'b1', eventId: 'e_runchai', fromUserId: 'u_dev', toUserId: null, note: 'First time joining this club — would love someone to pace with.', status: 'pending' as const, createdAt: now - 2 * DAY },
  ];

  const notifications = [
    { id: 'n1', userId: 'u_aarav', type: 'connection' as const, title: 'Sana Iqbal wants to connect', body: '“I posted the placement workshop — open to co-hosting one with the crew?”', link: '#/app/people', at: now - DAY, read: false },
    { id: 'n2', userId: 'u_aarav', type: 'decision' as const, title: 'Votes are in progress', body: 'Startup Saturday Crew: “Which weekend plan?” closes in 2 days.', link: '#/app/decisions/d1', at: now - DAY / 2, read: false },
  ];

  const reports = [
    { id: 'rep1', kind: 'event' as const, targetId: 'e_aidemo', reporterId: 'u_dev', reason: 'wrong_details', detail: 'Ticket price changed on the source page.', status: 'received' as const, createdAt: now - 6 * 3600000 },
  ];

  const audit = [
    { id: 'a_a1', actorId: 'u_founder', action: 'role_change', targetId: 'u_aarav', detail: 'Granted moderator (event-organizer trust)', at: now - 15 * DAY },
    { id: 'a_a2', actorId: 'u_founder', action: 'role_change', targetId: 'u_priya', detail: 'Appointed co-founder (Operations)', at: now - 40 * DAY },
    { id: 'a_a3', actorId: 'u_founder', action: 'role_change', targetId: 'u_rohan', detail: 'Appointed co-founder (Engineering)', at: now - 40 * DAY },
  ];

  const activity = [
    { id: 'a1', circleId: 'c1', actorId: 'u_aarav', text: 'opened the decision “Which weekend plan?” with 3 candidates.', at: now - 2 * DAY },
    { id: 'a2', circleId: 'c1', actorId: 'u_meera', text: 'submitted a ballot.', at: now - DAY },
    { id: 'a3', circleId: 'c2', actorId: 'u_meera', text: 'finalized “Design weekend pick” → Design Systems Meetup.', at: now - DAY },
  ];

  return {
    version: 1,
    users: Object.fromEntries(users.map((u) => [u.id, u])),
    events: Object.fromEntries([e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11].map((e) => [e.id, e])),
    rsvps,
    circles: Object.fromEntries(circles.map((c) => [c.id, c])),
    activity,
    decisions: Object.fromEntries(decisions.map((d) => [d.id, d])),
    connections,
    threads,
    buddyRequests,
    notifications,
    reports,
    pulse: [
      { id: 'pl1', kind: 'vouch', text: 'Meera vouched for Aarav at Indie Hackers Mixer', at: now - 5 * DAY },
      { id: 'pl2', kind: 'plan', text: 'Design & Coffee confirmed a plan — Design Systems Meetup', at: now - DAY },
      { id: 'pl3', kind: 'signup', text: 'Ananya Rao joined with Meera2019s invite', at: now - 12 * DAY },
    ],
    vouches: [...vouches],
    audit,
    interestForms: [],
    currentUserId: null,
    conductVersion: 'v1.0 · 25 Oct 2026',
  };
}
