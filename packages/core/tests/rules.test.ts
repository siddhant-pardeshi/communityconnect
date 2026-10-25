import { describe, it, expect } from 'vitest';
import {
  awardXp, contributionXpToday, DAILY_CONTRIBUTION_CAP, canAwardConnection,
  applyCheckin, scoreDecision, referralOutcome, isStaff, isFounderTeam,
  canSetRole, cofounderSlotsTaken, computeTrust, hasActiveVouch, TRUST_WINDOW_DAYS,
} from '../src/rules';
import type { Decision, UserAccount, Vouch, XpEntry, SiteRole } from '../src/types';

const NOW = new Date('2026-11-02T10:00:00Z').getTime(); // a Monday

const mkUser = (id: string, siteRole: SiteRole = 'member'): UserAccount => ({
  id, name: id, city: '', timezone: 'UTC', intents: [], links: [], avatarHue: 0,
  privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true, showNameOnAttendeeLists: true },
  email: `${id}@x`, passHash: 'h', salt: 's', createdAt: NOW, referralCode: 'X-0000',
  streak: { lastDay: null, count: 0, graceWeek: null }, xp: 0, ledger: [], badges: [],
  accent: 'cobalt', notifPrefs: { decisions: true, connections: true, plans: true, events: true }, siteRole,
});

describe('XP awards: dedupe and caps', () => {
  it('awards once per dedupe key', () => {
    const ledger: XpEntry[] = [];
    const r1 = awardXp(ledger, 'vote', 'vote:d1:u1', NOW);
    expect(r1.outcome.awarded).toBe(true);
    expect(r1.outcome.amount).toBe(5);
    const r2 = awardXp(r1.ledger, 'vote', 'vote:d1:u1', NOW + 1000);
    expect(r2.outcome.awarded).toBe(false);
    expect(r2.outcome.reason).toBe('duplicate');
  });

  it('enforces the daily contribution cap', () => {
    let l: XpEntry[] = [];
    for (let i = 0; i < 6; i++) {
      const r = awardXp(l, 'event_posted', `event:e${i}`, NOW);
      l = r.ledger;
    }
    expect(contributionXpToday(l, NOW)).toBe(DAILY_CONTRIBUTION_CAP);
    const blocked = awardXp(l, 'connection', 'conn:a|b', NOW);
    expect(blocked.outcome.reason).toBe('daily_cap');
  });

  it('referral bonus is exempt from the contribution cap and replay-safe', () => {
    let l: XpEntry[] = [];
    for (let i = 0; i < 6; i++) l = awardXp(l, 'event_posted', `event:f${i}`, NOW).ledger;
    expect(contributionXpToday(l, NOW)).toBe(DAILY_CONTRIBUTION_CAP);
    const r1 = awardXp(l, 'referral', 'ref:u_new', NOW);
    expect(r1.outcome.awarded).toBe(true);
    expect(r1.outcome.amount).toBe(75);
    expect(contributionXpToday(r1.ledger, NOW)).toBe(DAILY_CONTRIBUTION_CAP);
    const r2 = awardXp(r1.ledger, 'referral', 'ref:u_new', NOW);
    expect(r2.outcome.reason).toBe('duplicate');
  });

  it('connection XP: once per unordered pair, 2 per week max', () => {
    let l: XpEntry[] = [];
    expect(canAwardConnection(l, 'a|b', NOW)).toBe(true);
    l = awardXp(l, 'connection', 'conn:a|b', NOW).ledger;
    expect(canAwardConnection(l, 'a|b', NOW)).toBe(false);
    expect(canAwardConnection(l, 'a|c', NOW)).toBe(true);
    l = awardXp(l, 'connection', 'conn:a|c', NOW).ledger;
    expect(canAwardConnection(l, 'd|e', NOW)).toBe(false);
    const nextWeek = NOW + 8 * 86400000;
    expect(canAwardConnection(l, 'd|e', nextWeek)).toBe(true);
  });
});

describe('streaks and grace', () => {
  const tz = 'Asia/Kolkata';

  it('first check-in starts the streak', () => {
    const r = applyCheckin({ lastDay: null, count: 0, graceWeek: null }, tz, new Date('2026-11-02T05:00:00Z'));
    expect(r.awarded).toBe(true);
    expect(r.count).toBe(1);
  });

  it('same-day check-in is a no-op', () => {
    const r = applyCheckin({ lastDay: '2026-11-02', count: 3, graceWeek: null }, tz, new Date('2026-11-02T18:00:00Z'));
    expect(r.awarded).toBe(false);
    expect(r.count).toBe(3);
  });

  it('a one-day gap consumes the missed day\'s weekly grace and preserves the streak', () => {
    const r = applyCheckin({ lastDay: '2026-11-02', count: 5, graceWeek: null }, tz, new Date('2026-11-04T05:00:00Z'));
    expect(r.graceUsed).toBe(true);
    expect(r.count).toBe(6);
    expect(r.graceWeek).toBe('2026-11-02');
  });

  it('a second grace in the same week is denied — streak resets honestly', () => {
    const r = applyCheckin({ lastDay: '2026-11-04', count: 6, graceWeek: '2026-11-02' }, tz, new Date('2026-11-06T05:00:00Z'));
    expect(r.graceUsed).toBe(false);
    expect(r.count).toBe(1);
  });

  it('grace belongs to the missed day\'s week (Sunday→Monday case)', () => {
    const r = applyCheckin({ lastDay: '2026-10-31', count: 4, graceWeek: '2026-10-26' }, tz, new Date('2026-11-02T05:00:00Z'));
    expect(r.count).toBe(1);
  });
});

describe('decision scoring', () => {
  const mk = (partial: Partial<Decision>): Decision => ({
    id: 'd', circleId: 'c', title: 't', prompt: '', candidateIds: ['e1', 'e2'],
    eligibleVoters: ['u1', 'u2', 'u3', 'u4', 'u5'], deadlineUtc: new Date(NOW - 1000).toISOString(),
    liveResults: false, quorumPct: 60, status: 'closed', ballots: [], createdBy: 'u1', createdAt: NOW - 86400000,
    ...partial,
  });

  it('computes the disclosed formula and respects quorum', () => {
    const d = mk({
      ballots: [
        { userId: 'u1', responses: { e1: 'can', e2: 'cannot' }, favorite: 'e1', submittedAt: NOW },
        { userId: 'u2', responses: { e1: 'can', e2: 'maybe' }, submittedAt: NOW },
        { userId: 'u3', responses: { e1: 'maybe' }, submittedAt: NOW },
      ],
    });
    const s = scoreDecision(d);
    const e1 = s.ranked.find((r) => r.eventId === 'e1')!;
    const e2 = s.ranked.find((r) => r.eventId === 'e2')!;
    expect(e1.score).toBe(33.0);
    expect(e2.score).toBe(3.0);
    expect(s.quorumMet).toBe(true);
    expect(s.top?.eventId).toBe('e1');
  });

  it('flags ties instead of picking arbitrarily', () => {
    const d = mk({
      ballots: [
        { userId: 'u1', responses: { e1: 'can' }, favorite: 'e1', submittedAt: NOW },
        { userId: 'u2', responses: { e2: 'can' }, favorite: 'e2', submittedAt: NOW },
        { userId: 'u3', responses: { e1: 'can', e2: 'can' }, submittedAt: NOW },
      ],
    });
    const s = scoreDecision(d);
    expect(s.tie).toBe(true);
    expect(s.top).toBeUndefined();
  });

  it('zero positive preference produces no recommendation', () => {
    const d = mk({ ballots: [{ userId: 'u1', responses: { e1: 'cannot', e2: 'cannot' }, submittedAt: NOW }] });
    const s = scoreDecision(d);
    expect(s.top).toBeUndefined();
    expect(s.warnings.some((w) => w.includes('No positive preference'))).toBe(true);
  });

  it('blank responses are never counted as cannot', () => {
    const d = mk({ ballots: [{ userId: 'u1', responses: { e1: 'can' }, submittedAt: NOW }] });
    const s = scoreDecision(d);
    const e2 = s.ranked.find((r) => r.eventId === 'e2')!;
    expect(e2.cannot).toBe(0);
    expect(e2.can).toBe(0);
  });

  it('removed voters are excluded via the eligible filter', () => {
    const d = mk({
      ballots: [
        { userId: 'u1', responses: { e1: 'can' }, submittedAt: NOW },
        { userId: 'u2', responses: { e1: 'can' }, submittedAt: NOW },
        { userId: 'u3', responses: { e1: 'cannot' }, submittedAt: NOW },
      ],
    });
    const s = scoreDecision(d, ['u1', 'u2']);
    expect(s.respondedCount).toBe(2);
  });
});

describe('referral guard', () => {
  it('rejects self-referral and duplicates', () => {
    const u = mkUser('u1');
    expect(referralOutcome(u, 'u1', [])).toBe('self');
    expect(referralOutcome(u, 'u2', [{ id: 'x', action: 'referral', key: 'ref:u2', amount: 75, at: NOW }])).toBe('duplicate');
    expect(referralOutcome(u, 'u2', [])).toBe('ok');
  });
});

describe('roles and access', () => {
  it('classifies staff and founder team', () => {
    expect(isStaff(mkUser('a', 'founder'))).toBe(true);
    expect(isStaff(mkUser('a', 'cofounder'))).toBe(true);
    expect(isStaff(mkUser('a', 'moderator'))).toBe(true);
    expect(isStaff(mkUser('a', 'member'))).toBe(false);
    expect(isFounderTeam(mkUser('a', 'cofounder'))).toBe(true);
    expect(isFounderTeam(mkUser('a', 'moderator'))).toBe(false);
  });

  it('founder role is immutable; only the founder appoints co-founders; slots are capped', () => {
    const founder = mkUser('f', 'founder');
    const cofounder = mkUser('c1', 'cofounder');
    const member = mkUser('m', 'member');
    expect(canSetRole(actor(member), target(founder), 'member').ok).toBe(false);
    expect(canSetRole(actor(cofounder), target(member), 'cofounder').ok).toBe(false);
    expect(canSetRole(actor(founder), target(member), 'cofounder').ok).toBe(true);
    expect(canSetRole(actor(cofounder), target(member), 'moderator').ok).toBe(true);
    const full = [mkUser('c1', 'cofounder'), mkUser('c2', 'cofounder')];
    expect(cofounderSlotsTaken(full)).toBe(2);
    expect(cofounderSlotsTaken(full, 'c2')).toBe(1);
  });

  function actor(u: UserAccount) { return u; }
  function target(u: UserAccount) { return u; }
});

describe('peer trust: rolling window', () => {
  const inWindow = (id: string, from: string, to: string, daysAgo: number, extra: Partial<Vouch> = {}): Vouch => ({
    id, from, to, eventId: 'e1', hearts: true, claims: ['college'], conduct: ['polite'], at: NOW - daysAgo * 86400000, ...extra,
  });

  it('counts only vouches inside the 14-day window', () => {
    const vouches = [
      inWindow('v1', 'a', 't', 1),
      inWindow('v2', 'b', 't', 13, { conduct: ['polite', 'professional'], claims: ['college', 'company'] }),
      inWindow('v3', 'c', 't', 20),           // expired — must be ignored
    ];
    const t = computeTrust(vouches, 't', NOW);
    expect(t.vouchCount).toBe(2);
    expect(t.hearts).toBe(2);
    expect(t.claims.college).toBe(2);
    expect(t.claims.company).toBe(1);
    expect(t.conductProfessional).toBe(1);
    expect(t.windowDays).toBe(TRUST_WINDOW_DAYS);
  });

  it('one active vouch per pair per window', () => {
    const vouches = [inWindow('v1', 'a', 't', 2)];
    expect(hasActiveVouch(vouches, 'a', 't', NOW)).toBe(true);
    expect(hasActiveVouch(vouches, 'a', 'other', NOW)).toBe(false);
    // expired vouch does not block a fresh one
    const expired = [inWindow('v1', 'a', 't', TRUST_WINDOW_DAYS + 1)];
    expect(hasActiveVouch(expired, 'a', 't', NOW)).toBe(false);
  });

  it('empty window produces a clean slate (conduct recovery)', () => {
    const t = computeTrust([], 't', NOW);
    expect(t.hearts).toBe(0);
    expect(t.vouchCount).toBe(0);
    expect(t.claims.college).toBe(0);
  });
});
