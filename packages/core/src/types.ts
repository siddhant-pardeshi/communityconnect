// ─── CommunityConnect domain types ──────────────────────────────────────────
// Pure data shapes shared by apps/web and future backend workers. No DOM, no
// React, no storage — this file is the contract between every layer.

export type Intent =
  | 'building'
  | 'learning'
  | 'open_to_work'
  | 'seeking_referral'
  | 'hiring'
  | 'between_roles'
  | 'seeking_feedback'
  | 'open_to_meet';

export const INTENT_LABELS: Record<Intent, string> = {
  building: 'Building something',
  learning: 'Learning',
  open_to_work: 'Open to work',
  seeking_referral: 'Seeking referrals',
  hiring: 'Hiring',
  between_roles: 'Between roles — open to support',
  seeking_feedback: 'Seeking feedback',
  open_to_meet: 'Open to meeting people',
};

/** Site-level roles. founder + up to 2 cofounders hold full administrative control. */
export type SiteRole = 'founder' | 'cofounder' | 'moderator' | 'member';

export const MAX_COFOUNDERS = 2;

export interface Privacy {
  showCollege: boolean;
  showCompany: boolean;
  showBackground: boolean;
  directoryOptIn: boolean;   // appear in People directory & public search
  showIntent: boolean;       // show job/hiring intent chips
}

export interface ProfileLinks {
  label: string;
  url: string;
}

export interface UserAccount {
  id: string;
  name: string;
  pronouns?: string;
  city: string;
  timezone: string;          // reward timezone, fixed at signup, changeable monthly
  bio?: string;
  role?: string;             // display role, e.g. "Senior Product Designer"
  college?: string;
  course?: string;           // pursuing/attended course, peer-verifiable claim
  company?: string;
  background?: string;       // free-text professional background
  intents: Intent[];
  links: ProfileLinks[];
  avatarHue: number;
  privacy: Privacy;
  email: string;
  passHash: string;          // salted SHA-256 (demo-grade auth; swap for real provider)
  salt: string;
  createdAt: number;
  referralCode: string;
  referredBy?: string;       // user id of referrer
  boostUntil?: number;       // directory boost earned via referrals
  streak: { lastDay: string | null; count: number; graceWeek: string | null };
  xp: number;
  ledger: XpEntry[];
  badges: string[];
  accent: 'cobalt' | 'coral' | 'sage' | 'saffron';
  notifPrefs: { decisions: boolean; connections: boolean; plans: boolean; events: boolean };
  siteRole: SiteRole;
  suspended?: boolean;       // set only via the founder console; blocks login & actions
  blocked?: string[];
  demo?: boolean;
  deleted?: boolean;
}

export interface XpEntry {
  id: string;
  action: string;            // e.g. 'referral', 'vote', 'checkin', 'connection', 'plan_confirm', 'buddy'
  key: string;               // dedupe key
  amount: number;
  at: number;
}

export type EventMode = 'in_person' | 'online' | 'hybrid';
export type EventStatus = 'active' | 'canceled';

export interface EventItem {
  id: string;
  title: string;
  summary: string;
  organizer: string;
  sourceUrl?: string;
  sourceProvider?: string;
  mode: EventMode;
  city?: string;
  venue?: string;
  startUtc: string;          // ISO instant
  endUtc: string;            // ISO instant
  tz: string;                // original IANA zone
  price: number | null;      // null = unknown, never inferred as free
  currency: string;
  tags: string[];
  accessibility?: string;    // undefined = not supplied
  visibility: 'public' | 'circle';
  circleId?: string;
  createdBy: string;
  status: EventStatus;
  moderation: 'approved' | 'pending' | 'removed';
  createdAt: number;
  demo?: boolean;
}

export type RsvpStatus = 'planning' | 'registered';
export interface Rsvp {
  id: string;
  eventId: string;
  userId: string;
  status: RsvpStatus;
  at: number;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: number;
  demo?: boolean;
}

export interface ActivityEntry {
  id: string;
  circleId: string;
  actorId: string;
  text: string;
  at: number;
}

export type Attendance = 'can' | 'maybe' | 'cannot';

export interface Ballot {
  userId: string;
  responses: Record<string, Attendance>; // eventId -> attendance
  favorite?: string;
  acknowledgedClashes?: string[];
  submittedAt: number;
}

export interface DecisionResult {
  chosenEventId: string;
  score: number;
  counts: Record<string, { can: number; maybe: number; cannot: number; favorite: number }>;
  eligibleCount: number;
  respondedCount: number;
  quorumMet: boolean;
  formulaVersion: string;
  finalizedBy: string;
  finalizedAt: number;
  overrideReason?: string;
  tie?: boolean;
  noPreference?: boolean;
  warnings: string[];
}

export interface Plan {
  id: string;
  decisionId: string;
  circleId: string;
  eventId: string;
  status: 'awaiting' | 'confirmed' | 'review_needed' | 'canceled' | 'completed';
  confirmations: Record<string, 'confirmed' | 'declined'>;
  meetupNote?: string;
  createdAt: number;
  completedAt?: number;
}

export interface Decision {
  id: string;
  circleId: string;
  title: string;
  prompt: string;
  candidateIds: string[];
  eligibleVoters: string[];   // roster snapshotted at open
  deadlineUtc: string;
  liveResults: boolean;
  quorumPct: number;
  status: 'open' | 'closed' | 'finalized' | 'canceled';
  ballots: Ballot[];
  result?: DecisionResult;
  plan?: Plan;
  createdBy: string;
  createdAt: number;
}

export interface Connection {
  id: string;
  pairKey: string;            // canonical sorted "a|b"
  from: string;
  to: string;
  reason: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  respondedAt?: number;
}

export interface ThreadMessage {
  id: string;
  pairKey: string;
  from: string;
  text: string;
  at: number;
}

export interface BuddyRequest {
  id: string;
  eventId: string;
  fromUserId: string;
  toUserId: string | null;    // null = open board request
  note: string;
  meetupPoint?: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'decision' | 'connection' | 'plan' | 'event' | 'buddy' | 'moderation' | 'referral';
  title: string;
  body: string;
  link?: string;
  at: number;
  read: boolean;
}

export interface Report {
  id: string;
  kind: 'event' | 'user' | 'message';
  targetId: string;
  reporterId: string;
  reason: string;
  detail?: string;
  status: 'received' | 'actioned' | 'dismissed' | 'appealed';
  createdAt: number;
  resolvedBy?: string;
  resolutionNote?: string;
}

// ─── Peer vouches (trust) ────────────────────────────────────────────────────
/** Claims a vouching participant can verify about the target. */
export type VouchClaim = 'college' | 'company' | 'course';
export const VOUCH_CLAIMS: VouchClaim[] = ['college', 'company', 'course'];

export interface Vouch {
  id: string;
  from: string;              // voucher (must share an attended event with `to`)
  to: string;                // recipient
  eventId: string;
  hearts: boolean;
  claims: VouchClaim[];      // claims the voucher personally verified
  conduct: Array<'polite' | 'professional'>;
  note?: string;             // private context — visible to moderators only
  at: number;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;            // 'role_change' | 'admin_edit' | 'suspend' | 'report_resolved' | ...
  targetId: string;
  detail: string;
  at: number;
}

export interface InterestFormEntry {
  id: string;
  email: string;
  plan: string;
  at: number;
}

export interface AppState {
  version: number;
  users: Record<string, UserAccount>;
  events: Record<string, EventItem>;
  rsvps: Rsvp[];
  circles: Record<string, Circle>;
  activity: ActivityEntry[];
  decisions: Record<string, Decision>;
  connections: Connection[];
  threads: Record<string, ThreadMessage[]>;
  buddyRequests: BuddyRequest[];
  notifications: Notification[];
  reports: Report[];
  vouches: Vouch[];
  audit: AuditEntry[];
  interestForms: InterestFormEntry[];
  currentUserId: string | null;
  conductVersion: string;
}
