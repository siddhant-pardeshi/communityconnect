import type { Decision, SiteRole, UserAccount, Vouch, VouchClaim, XpEntry } from './types';
import { MAX_COFOUNDERS, VOUCH_CLAIMS } from './types';
import { rewardWeekKey, dayKeyInTz, daysBetweenKeys } from './util';

// ─── XP & reward rules (policy v1) ───────────────────────────────────────────
// Append-only ledger, dedupe-keyed per qualifying action. Contribution XP is
// capped at 30/day; growth bonuses (referral) and check-ins are outside the
// contribution cap by design and documented in docs/BUSINESS_MODEL.md.
// NOTE: vouches deliberately award NO XP — paying for reputation invites
// reciprocity spam (see docs/adr/0002-peer-vouches.md).

export const XP_RULES = {
  checkin: 1,
  vote: 5,
  event_posted: 10,
  connection: 10,
  connection_weekly_cap: 2,
  plan_confirm: 15,
  buddy: 10,
  referral: 75,
} as const;

export const DAILY_CONTRIBUTION_CAP = 30;
export const FORMULA_VERSION = 'pref-v1:100*(0.65Y+0.15M+0.20F)/N';

export const LEVELS = [
  { min: 0, name: 'Explorer' },
  { min: 100, name: 'Connector' },
  { min: 250, name: 'Planner' },
  { min: 500, name: 'Constellation' },
];

export function levelOf(xp: number): { name: string; min: number; next?: { name: string; min: number } } {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  return { name: LEVELS[idx].name, min: LEVELS[idx].min, next: LEVELS[idx + 1] };
}

export const BADGES: Record<string, { label: string; how: string }> = {
  founding: { label: 'Founding Member', how: 'Joined through a founder-team invite during launch.' },
  first_plan: { label: 'First Plan', how: 'A plan you joined was confirmed.' },
  connector: { label: 'Connector', how: 'Invited a friend who joined CommunityConnect.' },
  vote_starter: { label: 'First Vote', how: 'Cast your first decision ballot.' },
  helpful_intro: { label: 'Helpful Introduction', how: 'Made your first mutual connection.' },
  curator: { label: 'Thoughtful Curator', how: 'Posted an event that people saved.' },
  crew_buddy: { label: 'Crew Buddy', how: 'Paired up with someone so nobody attends alone.' },
};

// Daily contribution cap: sum of today's entries with actions inside the cap set.
const CAPPED_ACTIONS = new Set(['vote', 'event_posted', 'connection', 'plan_confirm', 'buddy']);

export function contributionXpToday(ledger: XpEntry[], now = Date.now()): number {
  const day = new Date(now).toISOString().slice(0, 10);
  return ledger
    .filter((e) => CAPPED_ACTIONS.has(e.action) && new Date(e.at).toISOString().slice(0, 10) === day)
    .reduce((s, e) => s + e.amount, 0);
}

export interface AwardOutcome {
  awarded: boolean;
  amount: number;
  reason: 'ok' | 'duplicate' | 'daily_cap' | 'weekly_cap';
  entry?: XpEntry;
}

/** Award XP once per dedupe key, honoring the daily contribution cap. */
export function awardXp(
  ledger: XpEntry[],
  action: keyof typeof XP_RULES,
  key: string,
  now = Date.now()
): { ledger: XpEntry[]; outcome: AwardOutcome } {
  const amount = XP_RULES[action];
  if (ledger.some((e) => e.key === key)) {
    return { ledger, outcome: { awarded: false, amount: 0, reason: 'duplicate' } };
  }
  if (CAPPED_ACTIONS.has(action)) {
    const today = contributionXpToday(ledger, now);
    if (today + amount > DAILY_CONTRIBUTION_CAP) {
      return { ledger, outcome: { awarded: false, amount: 0, reason: 'daily_cap' } };
    }
  }
  const entry: XpEntry = { id: `x${now}${Math.random().toString(36).slice(2, 6)}`, action, key, amount, at: now };
  return { ledger: [...ledger, entry], outcome: { awarded: true, amount, reason: 'ok', entry } };
}

/** Connection XP: at most once per unordered pair, ever; 2/week max. */
export function canAwardConnection(ledger: XpEntry[], pairKey: string, now = Date.now()): boolean {
  if (ledger.some((e) => e.action === 'connection' && e.key === `conn:${pairKey}`)) return false;
  const week = rewardWeekKey('UTC', new Date(now));
  const thisWeek = ledger.filter((e) => {
    if (e.action !== 'connection') return false;
    return rewardWeekKey('UTC', new Date(e.at)) === week;
  });
  return thisWeek.length < XP_RULES.connection_weekly_cap;
}

// ─── streaks ─────────────────────────────────────────────────────────────────
export interface StreakResult {
  count: number;
  lastDay: string | null;
  graceUsed: boolean;
  graceWeek: string | null;
  awarded: boolean;
  message: string;
}

/**
 * Intentional daily check-in. One per account-local day. A return after exactly
 * one missed day consumes that missed day's week's single grace credit (no XP
 * for the grace day itself). Longer gaps reset the streak honestly.
 */
export function applyCheckin(
  streak: UserAccount['streak'],
  tz: string,
  now = new Date()
): StreakResult {
  const today = dayKeyInTz(tz, now);
  const week = rewardWeekKey(tz, now);
  if (streak.lastDay === today) {
    return { ...streak, graceUsed: false, graceWeek: streak.graceWeek, awarded: false, message: 'Already checked in today — see you tomorrow.' };
  }
  const gap = streak.lastDay ? daysBetweenKeys(streak.lastDay, today) : null;
  let count: number;
  let graceUsed = false;
  let graceWeek = streak.graceWeek;
  if (gap === null || gap === 1) {
    count = (streak.count || 0) + 1;
  } else if (gap === 2) {
    // Missed exactly one day → may consume that missed day's week's single grace credit.
    const missedDate = new Date(`${streak.lastDay}T12:00:00Z`);
    missedDate.setUTCDate(missedDate.getUTCDate() + 1);
    const missedWeek = rewardWeekKey(tz, missedDate);
    if (streak.graceWeek !== missedWeek) {
      count = (streak.count || 0) + 1;
      graceUsed = true;
      graceWeek = missedWeek;
    } else {
      count = 1;
    }
  } else {
    count = 1;
  }
  return {
    count,
    lastDay: today,
    graceUsed,
    graceWeek,
    awarded: true,
    message: graceUsed
      ? `Welcome back — your grace credit covered the missed day. Streak continues at ${count}.`
      : `Checked in. Streak: ${count} day${count === 1 ? '' : 's'}.`,
  };
}

// ─── decision scoring ────────────────────────────────────────────────────────
export interface CandidateScore {
  eventId: string;
  can: number; maybe: number; cannot: number; favorite: number;
  score: number;
}

export interface ScoredDecision {
  ranked: CandidateScore[];
  eligibleCount: number;
  respondedCount: number;
  quorumMet: boolean;
  tie: boolean;
  top?: CandidateScore;
  warnings: string[];
}

const W_CAN = 0.65, W_MAYBE = 0.15, W_FAV = 0.20;

/**
 * Disclosed preference score: 100 × (0.65·Y + 0.15·M + 0.20·F) / N where N is
 * the *original* eligible roster. Zero positive preference ⇒ no recommendation
 * rather than an arbitrary winner. Ties stay ties.
 */
export function scoreDecision(
  decision: Decision,
  eligibleVoterIds: string[] = decision.eligibleVoters
): ScoredDecision {
  const ballots = decision.ballots.filter((b) => eligibleVoterIds.includes(b.userId));
  const N = decision.eligibleVoters.length;
  const responded = ballots.length;
  const quorumMet = N >= 2 && responded >= Math.ceil((decision.quorumPct / 100) * N);
  const warnings: string[] = [];

  const ranked: CandidateScore[] = decision.candidateIds.map((eventId) => {
    let can = 0, maybe = 0, cannot = 0, favorite = 0;
    for (const b of ballots) {
      const r = b.responses[eventId];
      if (r === 'can') can++;
      else if (r === 'maybe') maybe++;
      else if (r === 'cannot') cannot++;
      // blank ⇒ recorded as no-response, never as 'cannot'
      if (b.favorite === eventId) favorite++;
    }
    const score = N > 0 ? 100 * (W_CAN * (can / N) + W_MAYBE * (maybe / N) + W_FAV * (favorite / N)) : 0;
    return { eventId, can, maybe, cannot, favorite, score: Math.round(score * 10) / 10 };
  });

  const positives = ranked.filter((c) => c.can > 0 || c.maybe > 0 || c.favorite > 0);
  const max = Math.max(...ranked.map((c) => c.score), 0);
  const atMax = ranked.filter((c) => c.score === max && c.score > 0);
  const tie = atMax.length > 1;
  const top = !tie && max > 0 ? atMax[0] : undefined;
  if (tie) warnings.push('Tie at the top score — run a short runoff or let the organizer choose with a visible reason.');
  if (positives.length === 0) warnings.push('No positive preference recorded — no option is recommended.');
  if (!quorumMet) warnings.push(`Not enough responses: ${responded} of ${N} (quorum ${decision.quorumPct}%). An organizer may still record a clearly labeled override decision.`);
  if (responded < eligibleVoterIds.length) warnings.push('Some eligible members did not respond; blanks count as no-response.');
  return { ranked: [...ranked].sort((a, b) => b.score - a.score), eligibleCount: N, respondedCount: responded, quorumMet, tie, top, warnings };
}

// ─── referral ────────────────────────────────────────────────────────────────
export const REFERRAL_BONUS = XP_RULES.referral; // +75 both sides
export const BOOST_DAYS = 14;

export function referralOutcome(referrer: UserAccount, inviteeId: string, ledger: XpEntry[], now = Date.now()): 'ok' | 'duplicate' | 'self' {
  if (referrer.id === inviteeId) return 'self';
  if (ledger.some((e) => e.action === 'referral' && e.key === `ref:${inviteeId}`)) return 'duplicate';
  return 'ok';
}

// ─── roles & access ──────────────────────────────────────────────────────────
/** Staff = anyone who can act on reports and edit/remove content. */
export function isStaff(u: Pick<UserAccount, 'siteRole'> | null | undefined): boolean {
  return u?.siteRole === 'founder' || u?.siteRole === 'cofounder' || u?.siteRole === 'moderator';
}

/** Founder team = the people with full administrative control (founder + ≤2 cofounders). */
export function isFounderTeam(u: Pick<UserAccount, 'siteRole'> | null | undefined): boolean {
  return u?.siteRole === 'founder' || u?.siteRole === 'cofounder';
}

/** Which roles `actor` may grant to `target` at their current role. */
export function canSetRole(actor: UserAccount, target: UserAccount, role: SiteRole): { ok: boolean; error?: string } {
  if (target.siteRole === 'founder') return { ok: false, error: 'The founder role cannot be changed.' };
  if (actor.siteRole === 'founder') {
    if (role === 'founder') return { ok: false, error: 'There is exactly one founder.' };
    if (role === 'cofounder') {
      // count existing cofounders, excluding the target if they already are one
      return { ok: true };
    }
    return { ok: true };
  }
  if (actor.siteRole === 'cofounder') {
    if (role === 'cofounder' || role === 'founder') return { ok: false, error: 'Only the founder can appoint co-founders.' };
    return { ok: true };
  }
  return { ok: false, error: 'You do not have permission to change roles.' };
}

/** Whether `role` is available given the current cofounder count (checked by the caller against state). */
export function cofounderSlotsTaken(users: UserAccount[], excludeId?: string): number {
  return users.filter((u) => u.siteRole === 'cofounder' && u.id !== excludeId).length;
}

export function canAppointCofounder(users: UserAccount[], excludeId?: string): boolean {
  return cofounderSlotsTaken(users, excludeId) < MAX_COFOUNDERS;
}

// ─── peer vouches / trust ────────────────────────────────────────────────────
/**
 * Rolling trust window: only vouches newer than this count toward the public
 * summary. Old vouches fade, so everyone's conduct record refreshes on a
 * regular cycle and people can always recover from a bad or false rating.
 */
export const TRUST_WINDOW_DAYS = 14;

export interface TrustSummary {
  hearts: number;
  claims: Record<VouchClaim, number>;
  conductPolite: number;
  conductProfessional: number;
  vouchCount: number;
  windowDays: number;
}

export function computeTrust(allVouches: Vouch[], userId: string, now = Date.now()): TrustSummary {
  const cutoff = now - TRUST_WINDOW_DAYS * 86400000;
  const recent = allVouches.filter((v) => v.to === userId && v.at > cutoff);
  const claims: Record<VouchClaim, number> = { college: 0, company: 0, course: 0 };
  let hearts = 0, polite = 0, professional = 0;
  for (const v of recent) {
    if (v.hearts) hearts++;
    for (const c of v.claims) if (VOUCH_CLAIMS.includes(c)) claims[c]++;
    if (v.conduct.includes('polite')) polite++;
    if (v.conduct.includes('professional')) professional++;
  }
  return {
    hearts,
    claims,
    conductPolite: polite,
    conductProfessional: professional,
    vouchCount: recent.length,
    windowDays: TRUST_WINDOW_DAYS,
  };
}

/** Is there an active (in-window) vouch from `from` to `to`? One per pair per window. */
export function hasActiveVouch(allVouches: Vouch[], from: string, to: string, now = Date.now()): boolean {
  const cutoff = now - TRUST_WINDOW_DAYS * 86400000;
  return allVouches.some((v) => v.from === from && v.to === to && v.at > cutoff);
}

// ─── founding members & growth ───────────────────────────────────────────────
/** People who join through a founder-team invite get permanent founding perks. */
export const FOUNDING_PERKS = {
  welcomeXp: 100,          // vs +75 for a standard referral
  allAccents: true,        // every profile accent unlocked from day one
  directoryPriority: true, // surfaced first in the People directory
  badge: 'founding',
} as const;

export const FOUNDING_BADGE_LABEL = 'Founding Member';

export function isFoundingReferrer(referrer: UserAccount | undefined): boolean {
  return !!referrer && isFounderTeam(referrer);
}
