import { useSyncExternalStore } from 'react';
import type {
  AppState, Decision, EventItem, Notification, UserAccount, RsvpStatus, Intent, SiteRole, VouchClaim, AuditEntry, Vouch,
} from '@cc/core';
import {
  buildSeed, awardXp, canAwardConnection, applyCheckin, scoreDecision, XP_RULES,
  uid, pairKeyOf, makeReferralCode, overlaps, isStaff, isFounderTeam, canSetRole, levelOf,
  FOUNDER_CLAIM_CODE, COFOUNDER_CLAIM_CODE, isFoundingReferrer, FOUNDING_PERKS,
  cofounderSlotsTaken, MAX_COFOUNDERS, VOUCH_CLAIMS, hasActiveVouch, TRUST_WINDOW_DAYS, computeTrust,
} from '@cc/core';

// ─── persistence ─────────────────────────────────────────────────────────────
const KEY = 'cc_state_v3';

function load(): AppState {
  try {
    // v1 → v2 migration: backfill the vouches/audit collections, then persist under the new key.
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('cc_state_v2') ?? localStorage.getItem('cc_state_v1');
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.users) {
        return { ...parsed, vouches: parsed.vouches ?? [], audit: parsed.audit ?? [], pulse: parsed.pulse ?? [], version: 3 };
      }
    }
  } catch { /* corrupt state → reseed */ }
  return buildSeed();
}

let state: AppState = load();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full */ }
  }, 250);
}

export function getState(): AppState { return state; }
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function useStore(): AppState { return useSyncExternalStore(subscribe, getState); }

export function mutate(fn: (s: AppState) => void) {
  const next: AppState = structuredClone(state);
  fn(next);
  state = next;
  persist();
  listeners.forEach((l) => l());
}

// ─── session helpers ─────────────────────────────────────────────────────────
export function me(s: AppState = state): UserAccount | null {
  return s.currentUserId ? s.users[s.currentUserId] ?? null : null;
}

export function notify(s: AppState, userId: string, n: Omit<Notification, 'id' | 'userId' | 'at' | 'read'>) {
  const prefs = s.users[userId]?.notifPrefs;
  if (prefs && prefs[n.type as keyof typeof prefs] === false) return;
  s.notifications.unshift({ id: uid('n'), userId, at: Date.now(), read: false, ...n });
}

function addXp(s: AppState, userId: string, action: keyof typeof XP_RULES, key: string) {
  const u = s.users[userId];
  if (!u) return;
  const { ledger, outcome } = awardXp(u.ledger, action, key);
  if (outcome.awarded) {
    u.ledger = ledger;
    u.xp += outcome.amount;
    const badgeFor: Partial<Record<keyof typeof XP_RULES, string>> = {
      vote: 'vote_starter', connection: 'helpful_intro', plan_confirm: 'first_plan', buddy: 'crew_buddy', referral: 'connector',
    };
    const b = badgeFor[action];
    if (b && !u.badges.includes(b)) u.badges.push(b);
  }
}

// ─── auth ────────────────────────────────────────────────────────────────────
export async function hashPassword(pass: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pass}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SignupInput {
  name: string; email: string; password: string;
  acceptedConduct: boolean;
  refCode?: string;
  college?: string; company?: string;
  claimCode?: string;        // founder-team access code → claims founder/co-founder role
}

export async function signup(input: SignupInput): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: 'Please use a name people can recognize (at least 2 characters).' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'That email does not look right.' };
  if (input.password.length < 8) return { ok: false, error: 'Password needs at least 8 characters.' };
  if (!input.acceptedConduct) return { ok: false, error: 'Please accept the community conduct to join.' };
  if (Object.values(state.users).some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'An account with this email already exists in this browser. Try logging in.' };
  }
  const salt = Math.random().toString(36).slice(2, 12);
  const passHash = await hashPassword(input.password, salt);
  const id = uid('u_');
  let referrer: UserAccount | undefined;
  if (input.refCode) {
    const code = input.refCode.trim().toUpperCase();
    referrer = Object.values(state.users).find((u) => u.referralCode.toUpperCase() === code);
  }
  // Team claim codes: founder (if the seat is open) or co-founder (max 2). These are
  // launch-phase convenience codes — server-side invitations replace them in v0.3.
  let claim: 'founder' | 'cofounder' | null = null;
  const code = (input.claimCode ?? '').trim().toUpperCase();
  if (code === FOUNDER_CLAIM_CODE.toUpperCase()) {
    if (Object.values(state.users).some((u) => u.siteRole === 'founder')) {
      return { ok: false, error: 'The founder seat is already claimed in this workspace.' };
    }
    claim = 'founder';
  } else if (code === COFOUNDER_CLAIM_CODE.toUpperCase()) {
    if (cofounderSlotsTaken(Object.values(state.users)) >= MAX_COFOUNDERS) {
      return { ok: false, error: `Both co-founder seats are taken.` };
    }
    claim = 'cofounder';
  } else if (code) {
    return { ok: false, error: 'That team access code is not valid.' };
  }
  const founding = isFoundingReferrer(referrer) || claim !== null;
  const user: UserAccount = {
    id, name, city: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    intents: [], links: [], avatarHue: Math.floor(Math.random() * 360),
    privacy: { showCollege: true, showCompany: true, showBackground: true, directoryOptIn: true, showIntent: true },
    email, passHash, salt, createdAt: Date.now(),
    referralCode: makeReferralCode(name),
    referredBy: referrer?.id,
    boostUntil: referrer ? Date.now() + 7 * 86400000 : undefined, // welcome boost for invited friends
    streak: { lastDay: null, count: 0, graceWeek: null },
    xp: 0, ledger: [], badges: founding ? ['founding'] : [], accent: 'cobalt',
    notifPrefs: { decisions: true, connections: true, plans: true, events: true },
    siteRole: claim ?? 'member',
    founding,
  };
  mutate((s) => {
    s.users[id] = user;
    s.currentUserId = id;
    notify(s, id, {
      type: 'referral', title: 'Welcome to CommunityConnect 👋',
      body: 'Pick your interests, join a circle, and post or find your first event. Everything is free while we grow.',
      link: '#/app/profile/edit',
    });
    if (founding) {
      addXp(s, id, 'referral', `ref:${id}`);
      notify(s, id, {
        type: 'referral', title: '⭐ Founding member unlocked',
        body: 'You get +100 XP, every profile accent from day one, top placement in the People directory, and the Founding Member badge — permanent.',
        link: '#/app/rewards',
      });
      s.pulse.unshift({ id: uid('pl'), kind: 'referral', text: `${name} joined as a Founding Member`, at: Date.now() });
    }
    if (claim) {
      s.audit.unshift({ id: uid('aud'), actorId: id, action: 'role_claim', targetId: id, detail: `Claimed ${claim} via team access code`, at: Date.now() });
    }
    if (referrer && s.users[referrer.id]) {
      const r = s.users[referrer.id];
      if (!founding) addXp(s, id, 'referral', `ref:${id}`);
      addXp(s, r.id, 'referral', `ref:${id}`);
      r.boostUntil = Date.now() + 14 * 86400000;
      if (!r.badges.includes('connector')) r.badges.push('connector');
      notify(s, r.id, {
        type: 'referral', title: `${name} joined with your referral 🎉`,
        body: `You both earned bonus XP and your profile is boosted for 14 days.`,
        link: '#/app/rewards',
      });
      s.pulse.unshift({ id: uid('pl'), kind: 'referral', text: `${name} joined with ${r.name}'s invite`, at: Date.now() });
    }
    if (s.pulse.length > 120) s.pulse.length = 120;
  });
  return { ok: true };
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const u = Object.values(state.users).find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.deleted) return { ok: false, error: 'No account with that email in this browser.' };
  if (u.suspended) return { ok: false, error: 'This account is suspended. Contact the founder team if you believe this is a mistake.' };
  const hash = await hashPassword(password, u.salt);
  if (hash !== u.passHash) return { ok: false, error: 'Wrong password. Try again.' };
  mutate((s) => { s.currentUserId = u.id; });
  return { ok: true };
}

export function loginDemo(userId: string) {
  const u = state.users[userId];
  if (!u || !u.demo) return;
  mutate((s) => { s.currentUserId = userId; });
}

export function logout() {
  mutate((s) => { s.currentUserId = null; });
}

/** Multi-account testing convenience: accounts already created in this browser. */
export function switchUser(userId: string) {
  if (state.users[userId]) mutate((s) => { s.currentUserId = userId; });
}

export function setAccent(accent: UserAccount['accent']) {
  mutate((s) => { const u = me(s); if (u && (u.xp >= 250 || accent === 'cobalt')) u.accent = accent; });
}

export function setNotifPrefs(p: Partial<UserAccount['notifPrefs']>) {
  mutate((s) => { const u = me(s); if (u) Object.assign(u.notifPrefs, p); });
}

export function setTimezone(tz: string) {
  mutate((s) => { const u = me(s); if (u) u.timezone = tz; });
}

// ─── profile & privacy ───────────────────────────────────────────────────────
export function updateProfile(patch: Partial<Pick<UserAccount, 'name' | 'pronouns' | 'city' | 'bio' | 'role' | 'college' | 'company' | 'background' | 'intents' | 'links' | 'avatarHue'>>) {
  mutate((s) => {
    const u = me(s); if (!u) return;
    Object.assign(u, patch);
  });
}

export function updatePrivacy(patch: Partial<UserAccount['privacy']>) {
  mutate((s) => { const u = me(s); if (u) Object.assign(u.privacy, patch); });
}

export function blockUser(targetId: string) {
  mutate((s) => {
    const u = me(s); if (!u || u.id === targetId) return;
    if (!u.blocked) u.blocked = [];
    if (!u.blocked.includes(targetId)) u.blocked.push(targetId);
    // Decline any pending connection between the pair; stop direct contact.
    const pk = pairKeyOf(u.id, targetId);
    s.connections = s.connections.map((c) =>
      c.pairKey === pk && c.status === 'pending' ? { ...c, status: 'declined' } : c);
  });
}

export function unblockUser(targetId: string) {
  mutate((s) => {
    const u = me(s); if (!u || !u.blocked) return;
    u.blocked = u.blocked.filter((b) => b !== targetId);
  });
}

export function isBlocked(s: AppState, viewerId: string, targetId: string): boolean {
  return (s.users[viewerId]?.blocked ?? []).includes(targetId) || (s.users[targetId]?.blocked ?? []).includes(viewerId);
}

// ─── events ──────────────────────────────────────────────────────────────────
export interface EventInput {
  title: string; summary: string; organizer: string; mode: EventItem['mode'];
  city?: string; venue?: string; sourceUrl?: string; sourceProvider?: string;
  startLocal: string; endLocal: string; tz: string;
  price: number | null; currency: string; tags: string[];
  accessibility?: string; visibility: 'public' | 'circle'; circleId?: string;
}

export function postEvent(input: EventInput): { ok: boolean; error?: string; eventId?: string } {
  if (input.title.trim().length < 4) return { ok: false, error: 'Give the event a clear title (4+ characters).' };
  const start = new Date(input.startLocal).toISOString();
  const end = new Date(input.endLocal).toISOString();
  if (Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime())) {
    return { ok: false, error: 'Pick a valid start and end date-time.' };
  }
  if (new Date(end) <= new Date(start)) return { ok: false, error: 'The end must be after the start.' };
  if (!input.summary.trim()) return { ok: false, error: 'Write a one-line summary so people know what this is.' };
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  const id = uid('e_');
  mutate((s) => {
    const ev: EventItem = {
      id, title: input.title.trim(), summary: input.summary.trim(), organizer: input.organizer.trim() || u.name,
      sourceUrl: input.sourceUrl?.trim() || undefined, sourceProvider: input.sourceProvider?.trim() || undefined,
      mode: input.mode, city: input.mode === 'online' ? undefined : input.city?.trim() || undefined,
      venue: input.mode === 'online' ? undefined : input.venue?.trim() || undefined,
      startUtc: start, endUtc: end, tz: input.tz,
      price: input.price, currency: input.currency, tags: input.tags,
      accessibility: input.accessibility?.trim() || undefined,
      visibility: input.visibility, circleId: input.visibility === 'circle' ? input.circleId : undefined,
      createdBy: u.id, status: 'active', moderation: 'approved', createdAt: Date.now(),
    };
    s.events[id] = ev;
    pulseLog(s, 'event', `${u.name} posted “${ev.title}”`);
    if (input.visibility === 'circle' && input.circleId) {
      const c = s.circles[input.circleId];
      if (c) {
        c.memberIds.filter((m) => m !== u.id).forEach((m) =>
          notify(s, m, { type: 'event', title: `${u.name} added a circle event`, body: ev.title, link: `#/app/events/${id}` }));
        s.activity.unshift({ id: uid('a'), circleId: c.id, actorId: u.id, text: `added circle event “${ev.title}”.`, at: Date.now() });
      }
    }
    addXp(s, u.id, 'event_posted', `event:${id}`);
  });
  return { ok: true, eventId: id };
}

export function updateEvent(id: string, patch: Partial<EventInput> & { status?: EventItem['status'] }): { ok: boolean; error?: string } {
  const u = me();
  const ev = state.events[id];
  if (!ev || !u) return { ok: false, error: 'Not found.' };
  if (ev.createdBy !== u.id && !isStaff(u)) return { ok: false, error: 'Only the poster or a moderator can edit this event.' };
  mutate((s) => {
    const e = s.events[id];
    const materialBefore = `${e.title}|${e.startUtc}|${e.endUtc}|${e.status}`;
    if (patch.title !== undefined) e.title = patch.title.trim();
    if (patch.summary !== undefined) e.summary = patch.summary.trim();
    if (patch.organizer !== undefined) e.organizer = patch.organizer.trim();
    if (patch.sourceUrl !== undefined) e.sourceUrl = patch.sourceUrl.trim() || undefined;
    if (patch.venue !== undefined) e.venue = patch.venue?.trim() || undefined;
    if (patch.price !== undefined) e.price = patch.price;
    if (patch.tags !== undefined) e.tags = patch.tags;
    if (patch.accessibility !== undefined) e.accessibility = patch.accessibility?.trim() || undefined;
    if (patch.startLocal) e.startUtc = new Date(patch.startLocal).toISOString();
    if (patch.endLocal) e.endUtc = new Date(patch.endLocal).toISOString();
    if (patch.status) e.status = patch.status;
    const materialAfter = `${e.title}|${e.startUtc}|${e.endUtc}|${e.status}`;
    if (materialBefore !== materialAfter) {
      // Material change: plans go to review-needed and participants re-confirm.
      for (const d of Object.values(s.decisions)) {
        if (d.plan && d.plan.eventId === id && ['awaiting', 'confirmed'].includes(d.plan.status)) {
          d.plan.status = patch.status === 'canceled' ? 'canceled' : 'review_needed';
          d.eligibleVoters.forEach((m) => {
            if (m !== u.id) notify(s, m, {
              type: 'plan', title: patch.status === 'canceled' ? 'Your plan was canceled' : 'Event details changed — plan needs review',
              body: `${e.title}: ${patch.status === 'canceled' ? 'the organizer canceled it.' : 'time/details were corrected. Please re-confirm.'}`,
              link: `#/app/decisions/${d.id}`,
            });
          });
        }
      }
      const rsvpUsers = s.rsvps.filter((r) => r.eventId === id).map((r) => r.userId);
      rsvpUsers.forEach((m) => {
        if (m !== u.id) notify(s, m, {
          type: 'event', title: patch.status === 'canceled' ? 'Event canceled' : 'Event details changed',
          body: e.title, link: `#/app/events/${id}`,
        });
      });
    }
  });
  return { ok: true };
}

export function toggleRsvp(eventId: string, status: RsvpStatus): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  mutate((s) => {
    const existing = s.rsvps.find((r) => r.eventId === eventId && r.userId === u.id);
    if (existing && existing.status === status) {
      s.rsvps = s.rsvps.filter((r) => r !== existing);
      return;
    }
    if (existing) { existing.status = status; existing.at = Date.now(); }
    else s.rsvps.push({ id: uid('r'), eventId, userId: u.id, status, at: Date.now() });
    // Curator badge: an event you posted that others plan to attend.
    const ev = s.events[eventId];
    if (ev && ev.createdBy === u.id) {
      const others = s.rsvps.filter((r) => r.eventId === eventId && r.userId !== u.id).length;
      if (others >= 2 && !u.badges.includes('curator')) u.badges.push('curator');
    }
  });
  return { ok: true };
}

// ─── circles ─────────────────────────────────────────────────────────────────
export function createCircle(name: string, description: string): { ok: boolean; error?: string; circleId?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (name.trim().length < 3) return { ok: false, error: 'Circle needs a name (3+ characters).' };
  const id = uid('c_');
  mutate((s) => {
    s.circles[id] = {
      id, name: name.trim(), description: description.trim(), ownerId: u.id,
      memberIds: [u.id], inviteCode: makeReferralCode(name), createdAt: Date.now(),
    };
    s.activity.unshift({ id: uid('a'), circleId: id, actorId: u.id, text: 'created the circle.', at: Date.now() });
  });
  return { ok: true, circleId: id };
}

export function joinByInvite(code: string): { ok: boolean; error?: string; circleId?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first, then open the invite again.' };
  const c = Object.values(state.circles).find((x) => x.inviteCode.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { ok: false, error: 'That invite code is not valid or was revoked.' };
  mutate((s) => {
    const circle = s.circles[c.id];
    if (!circle.memberIds.includes(u.id)) {
      circle.memberIds.push(u.id);
      s.activity.unshift({ id: uid('a'), circleId: c.id, actorId: u.id, text: 'joined the circle.', at: Date.now() });
      notify(s, circle.ownerId, { type: 'connection', title: `${u.name} joined ${circle.name}`, body: 'They accepted your invite.', link: `#/app/circles/${c.id}` });
    }
  });
  return { ok: true, circleId: c.id };
}

export function rotateInviteCode(circleId: string) {
  mutate((s) => {
    const c = s.circles[circleId]; const u = me(s);
    if (c && u && c.ownerId === u.id) c.inviteCode = makeReferralCode(c.name);
  });
}

export function removeMember(circleId: string, memberId: string) {
  mutate((s) => {
    const c = s.circles[circleId]; const u = me(s);
    if (!c || !u || c.ownerId !== u.id || memberId === c.ownerId) return;
    c.memberIds = c.memberIds.filter((m) => m !== memberId);
    s.activity.unshift({ id: uid('a'), circleId, actorId: u.id, text: `removed a member. Their access ends immediately; past ballots are retained per policy.`, at: Date.now() });
  });
}

export function leaveCircle(circleId: string) {
  mutate((s) => {
    const c = s.circles[circleId]; const u = me(s);
    if (!c || !u || c.ownerId === u.id) return; // owners transfer or delete instead
    c.memberIds = c.memberIds.filter((m) => m !== u.id);
  });
}

// ─── decisions ───────────────────────────────────────────────────────────────
export interface DecisionInput {
  circleId: string; title: string; prompt: string;
  candidateIds: string[]; deadlineLocal: string; liveResults: boolean; quorumPct: number;
}

export function createDecision(input: DecisionInput): { ok: boolean; error?: string; decisionId?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  const c = state.circles[input.circleId];
  if (!c || !c.memberIds.includes(u.id)) return { ok: false, error: 'Only circle members can open a decision.' };
  if (input.candidateIds.length < 2 || input.candidateIds.length > 8) {
    return { ok: false, error: 'Pick between 2 and 8 candidate events.' };
  }
  const deadline = new Date(input.deadlineLocal);
  if (Number.isNaN(deadline.getTime()) || deadline.getTime() < Date.now() + 3600000) {
    return { ok: false, error: 'Give the vote at least one hour before the deadline.' };
  }
  const id = uid('d_');
  mutate((s) => {
    s.decisions[id] = {
      id, circleId: input.circleId, title: input.title.trim() || 'Group decision',
      prompt: input.prompt.trim(), candidateIds: input.candidateIds,
      eligibleVoters: [...c.memberIds], deadlineUtc: deadline.toISOString(),
      liveResults: input.liveResults, quorumPct: input.quorumPct, status: 'open',
      ballots: [], createdBy: u.id, createdAt: Date.now(),
    };
    c.memberIds.filter((m) => m !== u.id).forEach((m) =>
      notify(s, m, { type: 'decision', title: `${u.name} opened “${input.title.trim()}”`, body: 'Mark each option can / maybe / cannot and pick a favorite before the deadline.', link: `#/app/decisions/${id}` }));
    s.activity.unshift({ id: uid('a'), circleId: input.circleId, actorId: u.id, text: `opened the decision “${input.title.trim()}”.`, at: Date.now() });
  });
  return { ok: true, decisionId: id };
}

/** Lazy state transitions: close votes past deadline, complete plans past window. */
export function sweep(s: AppState) {
  const now = Date.now();
  for (const d of Object.values(s.decisions)) {
    if (d.status === 'open' && new Date(d.deadlineUtc).getTime() <= now) {
      d.status = 'closed';
      notify(s, d.createdBy, { type: 'decision', title: 'Voting closed', body: `“${d.title}” — results are ready to finalize.`, link: `#/app/decisions/${d.id}` });
    }
    if (d.plan && ['awaiting', 'confirmed', 'review_needed'].includes(d.plan.status)) {
      const ev = s.events[d.plan.eventId];
      if (ev && ev.status === 'canceled') d.plan.status = 'canceled';
      else if (ev && new Date(ev.endUtc).getTime() < now) {
        d.plan.status = 'completed'; d.plan.completedAt = now;
      }
    }
  }
}

export function submitBallot(
  decisionId: string,
  responses: Record<string, 'can' | 'maybe' | 'cannot'>,
  favorite: string | undefined,
  acknowledgedClashes: string[]
): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  const d = state.decisions[decisionId];
  if (!d) return { ok: false, error: 'Decision not found.' };
  if (d.status === 'finalized' || d.status === 'canceled') return { ok: false, error: 'This decision is already finalized.' };
  if (new Date(d.deadlineUtc).getTime() <= Date.now()) {
    return { ok: false, error: 'The voting deadline has passed — the server clock wins, not your browser.' };
  }
  if (!d.eligibleVoters.includes(u.id)) return { ok: false, error: 'You are not on the eligible roster for this vote.' };
  if (!d.candidateIds.some((c) => responses[c])) return { ok: false, error: 'Answer at least one candidate to submit.' };
  if (favorite && !['can', 'maybe'].includes(responses[favorite] ?? '')) {
    return { ok: false, error: 'Your favorite must be an option you marked can-attend or maybe.' };
  }
  mutate((s) => {
    const dd = s.decisions[decisionId];
    const existing = dd.ballots.find((b) => b.userId === u.id);
    const ballot = { userId: u.id, responses, favorite, acknowledgedClashes, submittedAt: Date.now() };
    if (existing) Object.assign(existing, ballot);
    else dd.ballots.push(ballot);
    addXp(s, u.id, 'vote', `vote:${decisionId}:${u.id}`);
  });
  return { ok: true };
}

export function finalizeDecision(
  decisionId: string,
  chosenEventId: string | undefined,
  overrideReason: string
): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  const d = state.decisions[decisionId];
  if (!d) return { ok: false, error: 'Decision not found.' };
  const circle = state.circles[d.circleId];
  if (!circle || circle.ownerId !== u.id) return { ok: false, error: 'Only the circle owner can finalize.' };
  if (d.status !== 'closed') return { ok: false, error: 'Voting is still open — wait for the deadline or it is not a fair vote.' };
  // Eligibility at finalize time = snapshot ∩ current members. Roster changes are surfaced as warnings.
  const current = d.eligibleVoters.filter((v) => circle.memberIds.includes(v));
  const scored = scoreDecision(d, current);
  let chosen = chosenEventId;
  if (!chosen) {
    if (!scored.top) return { ok: false, error: scored.tie ? 'Tied result — pick one option or write an override reason.' : 'No recommended option — pick one or write an override reason.' };
    chosen = scored.top.eventId;
  }
  if (!d.candidateIds.includes(chosen)) return { ok: false, error: 'Choose one of the candidates.' };
  const chosenScore = scored.ranked.find((r) => r.eventId === chosen);
  if (!scored.quorumMet && !overrideReason.trim()) return { ok: false, error: 'Quorum not met. Write a short reason to record a labeled organizer override.' };
  const isOverride = overrideReason.trim() && (!scored.top || scored.top.eventId !== chosen || scored.tie);
  const warnings = [...scored.warnings];
  if (current.length < d.eligibleVoters.length) warnings.push('Roster changed after opening — result computed over current eligible members.');
  mutate((s) => {
    const dd = s.decisions[decisionId];
    dd.status = 'finalized';
    dd.result = {
      chosenEventId: chosen!, score: chosenScore?.score ?? 0,
      counts: Object.fromEntries(scored.ranked.map((r) => [r.eventId, { can: r.can, maybe: r.maybe, cannot: r.cannot, favorite: r.favorite }])),
      eligibleCount: scored.eligibleCount, respondedCount: scored.respondedCount,
      quorumMet: scored.quorumMet, formulaVersion: 'pref-v1:100*(0.65Y+0.15M+0.20F)/N',
      finalizedBy: u.id, finalizedAt: Date.now(),
      overrideReason: isOverride ? overrideReason.trim() : undefined,
      tie: scored.tie, noPreference: scored.ranked.every((r) => r.score === 0), warnings,
    };
    dd.plan = {
      id: uid('p_'), decisionId, circleId: d.circleId, eventId: chosen!,
      status: 'awaiting', confirmations: {}, createdAt: Date.now(),
      meetupNote: undefined,
    };
    d.eligibleVoters.forEach((m) => {
      if (m !== u.id) notify(s, m, {
        type: 'plan', title: `Your circle chose: ${s.events[chosen!]?.title ?? 'a plan'}`,
        body: 'Confirm whether you can attend. Confirmations are separate from registration on the organizer site.',
        link: `#/app/decisions/${decisionId}`,
      });
    });
    s.activity.unshift({ id: uid('a'), circleId: d.circleId, actorId: u.id, text: `finalized “${dd.title}” → ${s.events[chosen!]?.title ?? 'a plan'}${isOverride ? ' (organizer override)' : ''}.`, at: Date.now() });
  });
  return { ok: true };
}

export function respondPlan(decisionId: string, choice: 'confirmed' | 'declined'): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  const d = state.decisions[decisionId];
  if (!d?.plan) return { ok: false, error: 'Plan not found.' };
  if (!d.eligibleVoters.includes(u.id)) return { ok: false, error: 'Only invited participants confirm this plan.' };
  mutate((s) => {
    const plan = s.decisions[decisionId].plan!;
    if (plan.status === 'canceled' || plan.status === 'completed') return;
    plan.confirmations[u.id] = choice;
    if (choice === 'confirmed') addXp(s, u.id, 'plan_confirm', `plan:${decisionId}:${u.id}`);
    const confirmedCount = Object.values(plan.confirmations).filter((v) => v === 'confirmed').length;
    if (plan.status === 'awaiting' || plan.status === 'review_needed') {
      plan.status = confirmedCount >= 2 ? 'confirmed' : 'awaiting';
      if (plan.status === 'confirmed') {
        const others = Object.keys(plan.confirmations).filter((k) => k !== u.id);
        others.forEach((m) => notify(s, m, { type: 'plan', title: 'Group plan confirmed ✅', body: `${u.name} confirmed — you have enough people. Register on the organizer site if needed.`, link: `#/app/decisions/${decisionId}` }));
        s.activity.unshift({ id: uid('a'), circleId: plan.circleId, actorId: u.id, text: 'confirmed the plan — it is now a confirmed group plan.', at: Date.now() });
        pulseLog(s, 'plan', `${s.circles[plan.circleId]?.name ?? 'A circle'} confirmed a plan — ${s.events[plan.eventId]?.title ?? ''}`);
      }
    }
    const owner = s.circles[plan.circleId]?.ownerId;
    if (owner && owner !== u.id) notify(s, owner, { type: 'plan', title: `${u.name} ${choice === 'confirmed' ? 'confirmed' : 'declined'}`, body: s.decisions[decisionId].title, link: `#/app/decisions/${decisionId}` });
  });
  return { ok: true };
}

export function setMeetupNote(decisionId: string, note: string) {
  mutate((s) => {
    const d = s.decisions[decisionId];
    const u = me(s);
    if (d?.plan && u && d.eligibleVoters.includes(u.id)) d.plan.meetupNote = note.trim() || undefined;
  });
}

// ─── buddy requests ──────────────────────────────────────────────────────────
export function postBuddyRequest(eventId: string, note: string, toUserId: string | null): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (!note.trim()) return { ok: false, error: 'Add a one-line note so people know who is asking.' };
  if (toUserId && isBlocked(state, u.id, toUserId)) return { ok: false, error: 'You cannot send this request.' };
  mutate((s) => {
    s.buddyRequests.unshift({ id: uid('b'), eventId, fromUserId: u.id, toUserId, note: note.trim(), status: 'pending', createdAt: Date.now() });
    if (toUserId) notify(s, toUserId, { type: 'buddy', title: `${u.name} would like company at an event`, body: note.trim(), link: `#/app/events/${eventId}` });
  });
  return { ok: true };
}

export function respondBuddy(id: string, accept: boolean) {
  mutate((s) => {
    const b = s.buddyRequests.find((x) => x.id === id);
    const u = me(s);
    if (!b || !u) return;
    if (b.toUserId && b.toUserId !== u.id) return;
    if (b.status !== 'pending') return;
    b.status = accept ? 'accepted' : 'declined';
    if (accept) {
      addXp(s, b.fromUserId, 'buddy', `buddy:${b.eventId}:${[b.fromUserId, u.id].sort().join('|')}`);
      addXp(s, u.id, 'buddy', `buddy:${b.eventId}:${[b.fromUserId, u.id].sort().join('|')}`);
      notify(s, b.fromUserId, { type: 'buddy', title: `${u.name} accepted your buddy request 🤝`, body: 'Coordinate the meetup point in the event discussion.', link: `#/app/events/${b.eventId}` });
    }
  });
}

export function cancelBuddy(id: string) {
  mutate((s) => {
    const b = s.buddyRequests.find((x) => x.id === id);
    const u = me(s);
    if (b && u && b.fromUserId === u.id && b.status === 'pending') b.status = 'canceled';
  });
}

// ─── event discussion ────────────────────────────────────────────────────────
export function postEventComment(eventId: string, text: string): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (!text.trim()) return { ok: false, error: 'Write something first.' };
  mutate((s) => {
    const key = `event:${eventId}`;
    if (!s.threads[key]) s.threads[key] = [];
    s.threads[key].push({ id: uid('m'), pairKey: key, from: u.id, text: text.trim(), at: Date.now() });
  });
  return { ok: true };
}

// ─── connections & messages ──────────────────────────────────────────────────
export function sendConnection(toId: string, reason: string): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (u.id === toId) return { ok: false, error: 'You are already on your own side. 🙂' };
  if (isBlocked(state, u.id, toId)) return { ok: false, error: 'You cannot send this request.' };
  const pk = pairKeyOf(u.id, toId);
  const existing = state.connections.filter((c) => c.pairKey === pk);
  if (existing.some((c) => c.status === 'pending' || c.status === 'accepted')) {
    return { ok: false, error: 'There is already a connection or pending request between you two.' };
  }
  const declined = existing.filter((c) => c.status === 'declined').sort((a, b) => (b.respondedAt ?? 0) - (a.respondedAt ?? 0))[0];
  if (declined && (declined.respondedAt ?? 0) > Date.now() - 7 * 86400000) {
    return { ok: false, error: 'They declined recently. Give it some time before asking again.' };
  }
  if (!reason.trim()) return { ok: false, error: 'Add a short reason — it makes yes far more likely.' };
  mutate((s) => {
    s.connections.unshift({ id: uid('cn'), pairKey: pk, from: u.id, to: toId, reason: reason.trim(), status: 'pending', createdAt: Date.now() });
    notify(s, toId, { type: 'connection', title: `${u.name} wants to connect`, body: reason.trim(), link: '#/app/people' });
  });
  return { ok: true };
}

export function respondConnection(id: string, accept: boolean) {
  mutate((s) => {
    const c = s.connections.find((x) => x.id === id);
    const u = me(s);
    if (!c || !u || c.to !== u.id || c.status !== 'pending') return;
    c.status = accept ? 'accepted' : 'declined';
    c.respondedAt = Date.now();
    if (accept) {
      const pk = pairKeyOf(c.from, c.to);
      if (!s.threads[pk]) s.threads[pk] = [];
      pulseLog(s, 'connection', `${u.name} and ${s.users[c.from]?.name ?? 'a member'} connected`);
      for (const party of [c.from, c.to]) {
        if (canAwardConnection(s.users[party].ledger, pk)) addXp(s, party, 'connection', `conn:${pk}`);
      }
      notify(s, c.from, { type: 'connection', title: `${u.name} accepted your connection 🤝`, body: 'Say hi — you can now message each other.', link: '#/app/people' });
    }
  });
}

export function sendMessage(pairKey: string, text: string): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (!text.trim()) return { ok: false, error: 'Write something first.' };
  const accepted = state.connections.find((c) => c.pairKey === pairKey && c.status === 'accepted');
  if (!accepted) return { ok: false, error: 'You can message accepted connections only.' };
  if (isBlocked(state, u.id, pairKey.split('|')[0]) || isBlocked(state, u.id, pairKey.split('|')[1] ?? '')) {
    return { ok: false, error: 'Messaging is not available between you two.' };
  }
  mutate((s) => {
    if (!s.threads[pairKey]) s.threads[pairKey] = [];
    s.threads[pairKey].push({ id: uid('m'), pairKey, from: u.id, text: text.trim(), at: Date.now() });
  });
  return { ok: true };
}

// ─── reports & moderation ────────────────────────────────────────────────────
export function submitReport(kind: 'event' | 'user' | 'message', targetId: string, reason: string, detail: string): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  mutate((s) => {
    s.reports.unshift({ id: uid('rep'), kind, targetId, reporterId: u.id, reason, detail: detail.trim(), status: 'received', createdAt: Date.now() });
    pulseLog(s, 'report', 'A new report was filed — moderator review needed');
  });
  return { ok: true };
}

export function resolveReport(id: string, action: 'actioned' | 'dismissed', note: string) {
  const u = me();
  if (!u || !isStaff(u)) return;
  mutate((s) => {
    const r = s.reports.find((x) => x.id === id);
    if (!r || r.status !== 'received') return;
    r.status = action;
    r.resolvedBy = u.id;
    r.resolutionNote = note.trim();
    s.audit.unshift({ id: uid('a_'), actorId: u.id, action: 'report_resolved', targetId: r.id, detail: `${action}${note.trim() ? `: ${note.trim()}` : ''}`, at: Date.now() });
    if (action === 'actioned') {
      if (r.kind === 'event' && s.events[r.targetId]) {
        s.events[r.targetId].moderation = 'removed';
        s.events[r.targetId].status = 'canceled';
      }
      const author = r.kind === 'event' ? s.events[r.targetId]?.createdBy : r.targetId;
      if (author && s.users[author]) notify(s, author, { type: 'moderation', title: 'Content removed by moderators', body: note.trim() || 'A moderator reviewed a report and removed the content. You can appeal from Settings.', link: '#/app/settings' });
    }
    notify(s, r.reporterId, { type: 'moderation', title: 'Your report was reviewed', body: 'Thank you for helping keep CommunityConnect safe. Action was taken per policy — details stay confidential.', link: '#/app/notifications' });
  });
}

// ─── rewards ─────────────────────────────────────────────────────────────────
export function checkin(): { ok: boolean; message: string } {
  const u = me();
  if (!u) return { ok: false, message: 'Log in first.' };
  let message = '';
  mutate((s) => {
    const user = s.users[s.currentUserId!]!;
    const res = applyCheckin(user.streak, user.timezone);
    user.streak = { lastDay: res.lastDay, count: res.count, graceWeek: res.graceWeek };
    message = res.message;
    if (res.awarded) addXp(s, user.id, 'checkin', `checkin:${res.lastDay}:${user.timezone}`);
  });
  return { ok: true, message };
}

// ─── data ownership ──────────────────────────────────────────────────────────
export function exportMyData(): string {
  const u = me();
  if (!u) return '{}';
  const s = state;
  const out = {
    exportedAt: new Date().toISOString(),
    account: { ...u, passHash: undefined, salt: undefined },
    myEvents: Object.values(s.events).filter((e) => e.createdBy === u.id),
    myRsvps: s.rsvps.filter((r) => r.userId === u.id),
    myCircles: Object.values(s.circles).filter((c) => c.memberIds.includes(u.id)),
    myDecisions: Object.values(s.decisions).filter((d) => d.eligibleVoters.includes(u.id)),
    myConnections: s.connections.filter((c) => c.pairKey.includes(u.id)),
    myNotifications: s.notifications.filter((n) => n.userId === u.id),
  };
  return JSON.stringify(out, null, 2);
}

export function deleteAccount() {
  mutate((s) => {
    const u = me(s);
    if (!u) return;
    // Pseudonymize authored public records; remove private participation.
    for (const e of Object.values(s.events)) if (e.createdBy === u.id) e.createdBy = 'deleted-user';
    s.rsvps = s.rsvps.filter((r) => r.userId !== u.id);
    s.buddyRequests = s.buddyRequests.filter((b) => b.fromUserId !== u.id);
    s.connections = s.connections.filter((c) => !c.pairKey.includes(u.id));
    s.notifications = s.notifications.filter((n) => n.userId !== u.id);
    for (const c of Object.values(s.circles)) {
      if (c.ownerId === u.id && c.memberIds.length > 1) {
        c.ownerId = c.memberIds.find((m) => m !== u.id)!;
        s.activity.unshift({ id: uid('a'), circleId: c.id, actorId: c.ownerId, text: 'became the owner after the previous owner deleted their account.', at: Date.now() });
      } else if (c.ownerId === u.id) {
        delete s.circles[c.id];
      } else {
        c.memberIds = c.memberIds.filter((m) => m !== u.id);
      }
    }
    delete s.users[u.id];
    s.currentUserId = null;
  });
}

export function saveInterestForm(email: string, plan: string) {
  mutate((s) => {
    s.interestForms.unshift({ id: uid('if'), email: email.trim().toLowerCase(), plan, at: Date.now() });
  });
}

// ─── selectors ───────────────────────────────────────────────────────────────
export function publicEvents(s: AppState): EventItem[] {
  const now = Date.now();
  return Object.values(s.events)
    .filter((e) => e.visibility === 'public' && e.moderation === 'approved' && e.status === 'active' && new Date(e.endUtc).getTime() > now)
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());
}

export function myCircles(s: AppState): import('@cc/core').Circle[] {
  const u = me(s);
  if (!u) return [];
  return Object.values(s.circles).filter((c) => c.memberIds.includes(u.id));
}

export function attendeesOf(s: AppState, eventId: string): { user: UserAccount; status: RsvpStatus | 'plan_confirmed' }[] {
  const out = new Map<string, { user: UserAccount; status: RsvpStatus | 'plan_confirmed' }>();
  for (const d of Object.values(s.decisions)) {
    if (d.plan && d.plan.eventId === eventId && ['confirmed', 'awaiting'].includes(d.plan.status)) {
      for (const [uidStr, c] of Object.entries(d.plan.confirmations)) {
        if (c === 'confirmed' && s.users[uidStr]) out.set(uidStr, { user: s.users[uidStr], status: 'plan_confirmed' });
      }
    }
  }
  for (const r of s.rsvps) {
    if (r.eventId === eventId && s.users[r.userId] && !out.has(r.userId)) {
      out.set(r.userId, { user: s.users[r.userId], status: r.status });
    }
  }
  return [...out.values()];
}

/** Aggregate “who is coming” by college/company, honoring each person's privacy settings. */
export function backgroundAgg(s: AppState, eventId: string): { colleges: Record<string, number>; companies: Record<string, number>; hidden: number } {
  const colleges: Record<string, number> = {};
  const companies: Record<string, number> = {};
  let hidden = 0;
  for (const a of attendeesOf(s, eventId)) {
    if (a.user.privacy.showCollege && a.user.college) colleges[a.user.college] = (colleges[a.user.college] ?? 0) + 1;
    if (a.user.privacy.showCompany && a.user.company) companies[a.user.company] = (companies[a.user.company] ?? 0) + 1;
    if ((!a.user.privacy.showCollege || !a.user.college) && (!a.user.privacy.showCompany || !a.user.company)) hidden++;
  }
  return { colleges, companies, hidden };
}

export function myOpenTasks(s: AppState): { decisions: Decision[]; plansAwaiting: Decision[]; connections: number; buddies: number } {
  const u = me(s);
  if (!u) return { decisions: [], plansAwaiting: [], connections: 0, buddies: 0 };
  const now = Date.now();
  const decisions = Object.values(s.decisions).filter((d) =>
    d.status === 'open' && d.eligibleVoters.includes(u.id) && !d.ballots.some((b) => b.userId === u.id));
  const plansAwaiting = Object.values(s.decisions).filter((d) =>
    d.plan && ['awaiting', 'review_needed'].includes(d.plan.status) && d.eligibleVoters.includes(u.id) && !d.plan.confirmations[u.id]);
  const connections = s.connections.filter((c) => c.to === u.id && c.status === 'pending').length;
  const buddies = s.buddyRequests.filter((b) => b.status === 'pending' && (b.toUserId === u.id)).length +
    s.buddyRequests.filter((b) => b.status === 'pending' && b.toUserId === null && s.users[b.fromUserId] && b.fromUserId !== u.id && new Date(s.events[b.eventId]?.startUtc ?? 0).getTime() > now).length;
  return { decisions, plansAwaiting, connections, buddies };
}

export function notificationsFor(s: AppState, userId: string): Notification[] {
  return s.notifications.filter((n) => n.userId === userId);
}

export function levelInfo(u: UserAccount) { return levelOf(u.xp); }

export function intentList(intents: Intent[]) { return intents; }

export function conflictsForEvent(s: AppState, eventId: string): EventItem[] {
  const u = me(s);
  const ev = s.events[eventId];
  if (!u || !ev) return [];
  const busy: EventItem[] = [];
  for (const r of s.rsvps) {
    if (r.userId === u.id && s.events[r.eventId]) busy.push(s.events[r.eventId]);
  }
  for (const d of Object.values(s.decisions)) {
    if (d.plan && ['confirmed', 'awaiting'].includes(d.plan.status) && d.plan.confirmations[u.id] === 'confirmed' && s.events[d.plan.eventId]) {
      busy.push(s.events[d.plan.eventId]);
    }
  }
  return busy.filter((b) => b.id !== eventId && overlaps(ev.startUtc, ev.endUtc, b.startUtc, b.endUtc));
}

// ─── peer vouches (trust) ────────────────────────────────────────────────────
/** Events where BOTH users have a participation record (RSVP or plan confirmation), started already. */
export function sharedEvents(s: AppState, aId: string, bId: string): EventItem[] {
  const participated = (userId: string, eventId: string): boolean =>
    s.rsvps.some((r) => r.userId === userId && r.eventId === eventId) ||
    Object.values(s.decisions).some((d) =>
      d.plan && d.plan.eventId === eventId && d.plan.confirmations[userId] === 'confirmed');
  const out: EventItem[] = [];
  for (const e of Object.values(s.events)) {
    if (new Date(e.startUtc).getTime() > Date.now()) continue; // vouching opens when the event starts
    if (participated(aId, e.id) && participated(bId, e.id)) out.push(e);
  }
  return out.sort((a, b) => +new Date(b.startUtc) - +new Date(a.startUtc));
}

export function vouchTargets(s: AppState, viewerId: string, targetId: string): EventItem[] {
  if (viewerId === targetId) return [];
  if (isBlocked(s, viewerId, targetId)) return [];
  return sharedEvents(s, viewerId, targetId);
}

export interface VouchInput {
  hearts: boolean;
  claims: VouchClaim[];
  conduct: Array<'polite' | 'professional'>;
  note?: string;
}

export function vouchUser(targetId: string, eventId: string, input: VouchInput): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (u.id === targetId) return { ok: false, error: 'You cannot vouch for yourself.' };
  if (isBlocked(state, u.id, targetId)) return { ok: false, error: 'Vouching is not available between you two.' };
  const ev = state.events[eventId];
  if (!ev) return { ok: false, error: 'Event not found.' };
  if (new Date(ev.startUtc).getTime() > Date.now()) return { ok: false, error: 'Vouches open once the event has started.' };
  const shared = sharedEvents(state, u.id, targetId).some((e) => e.id === eventId);
  if (!shared) return { ok: false, error: 'You can only vouch for people you attended an event with.' };
  if (hasActiveVouch(state.vouches, u.id, targetId)) {
    return { ok: false, error: `You already vouched for them — each vouch counts for ${TRUST_WINDOW_DAYS} days.` };
  }
  mutate((s) => {
    const v: Vouch = {
      id: uid('v_'), from: u.id, to: targetId, eventId,
      hearts: !!input.hearts,
      claims: input.claims.filter((c) => VOUCH_CLAIMS.includes(c)),
      conduct: input.conduct.filter((c) => c === 'polite' || c === 'professional'),
      note: input.note?.trim() || undefined,
      at: Date.now(),
    };
    s.vouches.unshift(v);
    pulseLog(s, 'vouch', `${u.name} vouched for ${s.users[targetId]?.name ?? 'a member'}`);
    notify(s, targetId, {
      type: 'connection', title: `${u.name} vouched for you 🤝`,
      body: 'Hearts and peer-verified claims now show on your profile for the next 14 days.',
      link: `#/app/people/${targetId}`,
    });
  });
  return { ok: true };
}

export function trustFor(s: AppState, userId: string) {
  return computeTrust(s.vouches, userId);
}

// ─── founder team: administration & audit ────────────────────────────────────
function audit(s: AppState, actorId: string, action: string, targetId: string, detail: string) {
  const entry: AuditEntry = { id: uid('aud_'), actorId, action, targetId, detail, at: Date.now() };
  s.audit.unshift(entry);
}

/** Founder-team only: edit any user's profile details. Every change is audited. */
export function adminUpdateUser(
  targetId: string,
  patch: Partial<Pick<UserAccount, 'name' | 'pronouns' | 'city' | 'bio' | 'role' | 'college' | 'course' | 'company' | 'background' | 'intents' | 'privacy'>>
): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (!isFounderTeam(u)) return { ok: false, error: 'Only the founder and co-founders can edit accounts.' };
  if (!state.users[targetId]) return { ok: false, error: 'Account not found.' };
  mutate((s) => {
    const t = s.users[targetId];
    const changed: string[] = [];
    for (const [k, v] of Object.entries(patch)) {
      const before = JSON.stringify((t as unknown as Record<string, unknown>)[k]);
      const after = JSON.stringify(v);
      if (before !== after) {
        (t as unknown as Record<string, unknown>)[k] = v;
        changed.push(k);
      }
    }
    if (changed.length > 0) audit(s, u.id, 'admin_edit', targetId, `Updated: ${changed.join(', ')}`);
  });
  return { ok: true };
}

/** Founder-team: change a member's site role, honoring the cofounder cap and immovable founder. */
export function adminSetRole(targetId: string, role: SiteRole): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  const target = state.users[targetId];
  if (!target) return { ok: false, error: 'Account not found.' };
  const check = canSetRole(u, target, role);
  if (!check.ok) return { ok: false, error: check.error };
  if (role === 'cofounder' && cofounderSlotsTaken(Object.values(state.users), targetId) >= MAX_COFOUNDERS) {
    return { ok: false, error: `There can be at most ${MAX_COFOUNDERS} co-founders.` };
  }
  mutate((s) => {
    const t = s.users[targetId];
    const from = t.siteRole;
    t.siteRole = role;
    audit(s, u.id, 'role_change', targetId, `${from} → ${role}`);
    notify(s, targetId, { type: 'moderation', title: 'Your access changed', body: `You are now: ${role}.`, link: '#/app' });
  });
  return { ok: true };
}

export function adminSetSuspended(targetId: string, suspended: boolean): { ok: boolean; error?: string } {
  const u = me();
  if (!u) return { ok: false, error: 'Log in first.' };
  if (!isFounderTeam(u)) return { ok: false, error: 'Only the founder and co-founders can suspend accounts.' };
  const target = state.users[targetId];
  if (!target) return { ok: false, error: 'Account not found.' };
  if (isFounderTeam(target)) return { ok: false, error: 'Founder-team accounts cannot be suspended from the console.' };
  mutate((s) => {
    s.users[targetId].suspended = suspended || undefined;
    audit(s, u.id, suspended ? 'suspend' : 'unsuspend', targetId, suspended ? 'Account suspended' : 'Suspension lifted');
    if (suspended && s.currentUserId === targetId) s.currentUserId = null;
  });
  return { ok: true };
}

// ─── live pulse (founder console telemetry) ──────────────────────────────────
function pulseLog(s: AppState, kind: import('@cc/core').PulseEvent['kind'], text: string) {
  s.pulse.unshift({ id: uid('pl'), kind, text, at: Date.now() });
  if (s.pulse.length > 120) s.pulse.length = 120;
}

export interface AdminStats {
  users: number; usersToday: number; users7d: number;
  events: number; rsvps: number;
  openDecisions: number; votes: number; confirmedPlans: number;
  vouches: number; hearts: number; connections: number;
  openReports: number; foundingMembers: number;
}

export function adminStats(s: AppState): AdminStats {
  const now = Date.now();
  const users = Object.values(s.users).filter((u) => !u.deleted);
  const countSince = (ms: number) => users.filter((u) => u.createdAt > now - ms).length;
  return {
    users: users.length,
    usersToday: countSince(86400000),
    users7d: countSince(7 * 86400000),
    events: Object.values(s.events).filter((e) => e.status === 'active').length,
    rsvps: s.rsvps.length,
    openDecisions: Object.values(s.decisions).filter((d) => d.status === 'open').length,
    votes: Object.values(s.decisions).reduce((n, d) => n + d.ballots.length, 0),
    confirmedPlans: Object.values(s.decisions).filter((d) => d.plan?.status === 'confirmed').length,
    vouches: s.vouches.length,
    hearts: s.vouches.filter((v) => v.hearts).length,
    connections: s.connections.filter((c) => c.status === 'accepted').length,
    openReports: s.reports.filter((r) => r.status === 'received').length,
    foundingMembers: users.filter((u) => u.founding).length,
  };
}

export interface ReferralRow {
  user: UserAccount;
  invites: number;
  invitees: UserAccount[];
  boostActive: boolean;
}

/** "Who brought how many people" — sorted leaderboard of referral links. */
export function referralLeaderboard(s: AppState): ReferralRow[] {
  const rows = Object.values(s.users)
    .filter((u) => !u.deleted)
    .map((u) => ({
      user: u,
      invitees: Object.values(s.users).filter((x) => x.referredBy === u.id && !x.deleted),
      boostActive: !!u.boostUntil && u.boostUntil > Date.now(),
    }))
    .map((r) => ({ ...r, invites: r.invitees.length }))
    .sort((a, b) => b.invites - a.invites || b.user.xp - a.user.xp);
  return rows;
}

export function inviteLinkFor(u: UserAccount): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/auth?mode=signup&ref=${u.referralCode}`;
}
