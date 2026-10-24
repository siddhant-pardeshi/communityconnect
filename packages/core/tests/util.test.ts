import { describe, it, expect } from 'vitest';
import { overlaps, rewardWeekKey, dayKeyInTz, daysBetweenKeys } from '../src/util';

describe('half-open interval overlap', () => {
  const T = (iso: string) => iso;

  it('detects a real overlap', () => {
    expect(overlaps(T('2026-11-01T10:00:00Z'), T('2026-11-01T12:00:00Z'), T('2026-11-01T11:00:00Z'), T('2026-11-01T13:00:00Z'))).toBe(true);
  });

  it('touching endpoints are NOT an overlap (half-open [start,end))', () => {
    expect(overlaps(T('2026-11-01T10:00:00Z'), T('2026-11-01T12:00:00Z'), T('2026-11-01T12:00:00Z'), T('2026-11-01T14:00:00Z'))).toBe(false);
  });

  it('cross-midnight overlap', () => {
    expect(overlaps(T('2026-11-01T23:00:00Z'), T('2026-11-02T01:00:00Z'), T('2026-11-02T00:30:00Z'), T('2026-11-02T02:00:00Z'))).toBe(true);
    expect(overlaps(T('2026-11-01T23:00:00Z'), T('2026-11-02T01:00:00Z'), T('2026-11-02T01:00:00Z'), T('2026-11-02T02:00:00Z'))).toBe(false);
  });

  it('invalid instants never count as overlaps', () => {
    expect(overlaps('not-a-date', T('2026-11-01T12:00:00Z'), T('2026-11-01T10:00:00Z'), T('2026-11-01T12:00:00Z'))).toBe(false);
  });
});

describe('reward week keys and day math', () => {
  it('a Sunday and the next Monday land in different week keys', () => {
    const sunday = new Date('2026-11-01T12:00:00Z'); // Sunday
    const monday = new Date('2026-11-02T12:00:00Z'); // Monday
    expect(rewardWeekKey('UTC', sunday)).toBe('2026-10-26');
    expect(rewardWeekKey('UTC', monday)).toBe('2026-11-02');
  });

  it('dayKeyInTz respects the zone (UTC+5:30 late evening is next day in Kolkata)', () => {
    // 2026-11-01T19:00:00Z = 00:30 IST on Nov 2
    expect(dayKeyInTz('Asia/Kolkata', new Date('2026-11-01T19:00:00Z'))).toBe('2026-11-02');
    expect(dayKeyInTz('UTC', new Date('2026-11-01T19:00:00Z'))).toBe('2026-11-01');
  });

  it('daysBetweenKeys handles month boundaries', () => {
    expect(daysBetweenKeys('2026-10-31', '2026-11-02')).toBe(2);
    expect(daysBetweenKeys('2026-11-02', '2026-10-31')).toBe(-2);
  });
});
