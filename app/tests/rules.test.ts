import { describe, it, expect } from 'vitest';
import { awardXp, contributionXpToday, DAILY_CONTRIBUTION_CAP, canAwardConnection, applyCheckin, scoreDecision } from '../src/lib/rules';
import type { Decision, XpEntry, UserAccount } from '../src/lib/types';

const NOW = new Date('2026-11-02T10:00:00Z').getTime(); // a Monday

describe('XP awards: dedupe and caps', () => {
  const ledger: XpEntry[] = [];

  it('awards once per dedupe key', () => {
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
    // 5 × 10 = 50 would exceed 30 → only first three fit (10+10+10)
    expect(contributionXpToday(l, NOW)).toBe(DAILY_CONTRIBUTION_CAP);
    const blocked = awardXp(l, 'connection', 'conn:a|b', NOW);
    expect(blocked.outcome.reason).toBe('daily_cap');
  });

  it('referral bonus is exempt from the contribution cap and replay-safe', () => {
    // Fill the daily cap with contribution XP first.
    let l: XpEntry[] = [];
    for (let i = 0; i < 6; i++) l = awardXp(l, 'event_posted', `event:f${i}`, NOW).ledger;
    expect(contributionXpToday(l, NOW)).toBe(DAILY_CONTRIBUTION_CAP);
    // Referral still lands despite the full cap…
    const r1 = awardXp(l, 'referral', 'ref:u_new', NOW);
    expect(r1.outcome.awarded).toBe(true);
    expect(r1.outcome.amount).toBe(75);
    // …is not counted toward the cap…
    expect(contributionXpToday(r1.ledger, NOW)).toBe(DAILY_CONTRIBUTION_CAP);
    // …and never double-awards.
    const r2 = awardXp(r1.ledger, 'referral', 'ref:u_new', NOW);
    expect(r2.outcome.reason).toBe('duplicate');
  });

  it('connection XP: once per unordered pair, 2 per week max', () => {
    let l: XpEntry[] = [];
    expect(canAwardConnection(l, 'a|b', NOW)).toBe(true);
    l = awardXp(l, 'connection', 'conn:a|b', NOW).ledger;
    expect(canAwardConnection(l, 'a|b', NOW)).toBe(false);        // same pair forever
    expect(canAwardConnection(l, 'a|c', NOW)).toBe(true);
    l = awardXp(l, 'connection', 'conn:a|c', NOW).ledger;
    expect(canAwardConnection(l, 'd|e', NOW)).toBe(false);        // weekly cap (2) reached
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

  it('a one-day gap consumes the weekly grace and preserves the streak', () => {
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

  it('grace does not carry across weeks (Sunday→Monday boundary case)', () => {
    // missed Sat+Sun after grace in previous week: gap of 2 days into a NEW week — still resets
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
    // N=5: e1 → 0.65·2 + 0.15·1 + 0.20·1 = 1.65 → 33.0 ; e2 → 0.15·1 = 3.0
    const e1 = s.ranked.find((r) => r.eventId === 'e1')!;
    const e2 = s.ranked.find((r) => r.eventId === 'e2')!;
    expect(e1.score).toBe(33.0);
    expect(e2.score).toBe(3.0);
    expect(s.quorumMet).toBe(true); // ceil(0.6·5)=3 responses
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
    const d = mk({
      ballots: [{ userId: 'u1', responses: { e1: 'can' }, submittedAt: NOW }],
    });
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
    const s = scoreDecision(d, ['u1', 'u2']); // u3 removed from circle after opening
    expect(s.respondedCount).toBe(2);
  });
});

describe('signup-level referral outcome guard', () => {
  it('rejects self-referral', async () => {
    const { referralOutcome } = await import('../src/lib/rules');
    const u: Pick<UserAccount, 'id'> = { id: 'u1' };
    expect(referralOutcome(u as UserAccount, 'u1', [])).toBe('self');
    expect(referralOutcome(u as UserAccount, 'u2', [{ id: 'x', action: 'referral', key: 'ref:u2', amount: 75, at: NOW }])).toBe('duplicate');
    expect(referralOutcome(u as UserAccount, 'u2', [])).toBe('ok');
  });
});
