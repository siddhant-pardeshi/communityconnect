// Generates scene HTMLs (1920×1080) + narration text files for both videos.
// Design: Warm Constellations — same language as the app and decks.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "scenes");
fs.mkdirSync(path.join(OUT, "user"), { recursive: true });
fs.mkdirSync(path.join(OUT, "founder"), { recursive: true });

const LIVE = "https://siddhant-pardeshi.github.io/communityconnect/";

const USER = [
  { e: "🕵️", kicker: "THE PROBLEM", title: "Your group chat is a crime scene.", sub: "Three event links. Forty opinions. Zero decisions.", bullets: [], n: "Hi there! I'm your CommunityConnect guide — and I'm about to save your weekend. You know the drill: your group chat has three event links, forty opinions, and zero decisions. Let's fix that — together." },
  { e: "🧭", kicker: "THE FIX", title: "Scattered links → one shared plan.", sub: "Share the options. Vote together. Show up with your people.", bullets: ["Every listing keeps its source link", "Votes stay private until the deadline", "The plan is confirmed by real people"], n: "CommunityConnect turns scattered event links into one plan your whole circle actually attends. Share the options, vote together, and show up with your people. Simple as that." },
  { e: "🚀", kicker: "STEP ONE", title: "Getting started takes one minute.", sub: "Free forever while we grow — no credit card, ever.", bullets: ["Create a free account, or try a demo profile", "Add your college, company and interests", "Joining with a friend's code = instant bonus XP"], n: "Getting started takes under a minute. Create a free account — no credit card, ever — or hop in with a demo profile. Joining with a friend's referral code gives you both bonus XP right away.", shot: "02-dashboard.png" },
  { e: "🔍", kicker: "STEP TWO", title: "Discover events worth your weekend.", sub: "Search, city, price and topic filters — real community listings.", bullets: ["Every event keeps its source link", "Price 'unknown' stays unknown — we never guess", "Planning here; tickets on the organizer's site"], n: "Discover lists real community events with search, city, price and topic filters. Every listing keeps its source link, so you can check the facts before you commit. Planning here, tickets on the organizer's site — we never mix the two.", shot: "03-discover.png" },
  { e: "🗳️", kicker: "THE MAGIC", title: "The Decision Room.", sub: "Can. Maybe. Cannot. Pick a favorite.", bullets: ["Clash warnings before your heart does 💔", "Votes are private — always", "The deadline is real, and the formula is public"], n: "Here's the magic: the Decision Room. Mark each event can, maybe, or cannot, pick a favorite, and if something clashes with your plans, we'll warn you before your heart does. Votes stay private, the deadline is real, and the formula is published — no mystery.", shot: "05-decision-ballot.png" },
  { e: "✅", kicker: "STEP THREE", title: "From result to confirmed plan.", sub: "Two people confirm → it's officially happening.", bullets: ["Download the .ics calendar file", "Add a meetup note — find each other at the door", "Registration always happens on the organizer's site"], n: "When voting closes, your circle owner finalizes the winner. The plan becomes real once two people independently confirm. Grab the calendar file, add a meetup note, and you're officially going.", shot: "06-plan-confirm.png" },
  { e: "🫂", kicker: "NEVER ALONE", title: "Bring a buddy. Or find one.", sub: "First event, new city, or just don't want to walk in alone.", bullets: ["Post a buddy request — both sides must accept", "Cancel privately, no explanations owed", "Support hub: job seekers and people between roles"], n: "First event, new city, or just don't feel like walking in alone? Post a buddy request. Both of you say yes, meet at the entrance, and boom — instant crew. And our support hub helps job seekers and people between roles find honest help.", shot: "10-support-hub.png" },
  { e: "❤️", kicker: "PEER TRUST", title: "Vouches: receipts for being decent.", sub: "Hearts, verified claims, and conduct — from real events.", bullets: ["Verify college, company or course claims", "Polite and professional — recorded", "Rolling 14 days, then everyone refreshes"], n: "Met someone lovely? Vouch for them — a heart, verify their college or company, and note that they were polite and professional. Vouches last fourteen days and then refresh, so everyone gets to grow. Fake profiles don't survive here.", shot: "09-people.png" },
  { e: "🪪", kicker: "AT THE EVENT", title: "Your QR networking card.", sub: "Print it. Carry it. One scan = your live profile.", bullets: ["Standard card size — feels premium", "A vCard QR for phones too", "Always respects your privacy settings"], n: "Print your networking card — a real card with your links and a QR code. One scan at an event and people land on your live profile. It even respects your privacy settings. Business cards could never.", shot: "07-networking-card.png" },
  { e: "🎁", kicker: "BOTH OF YOU WIN", title: "Invite friends, earn together.", sub: "+75 XP, boosts and badges — for you AND your friend.", bullets: ["Founder-team links = Founding Member perks", "+100 XP, every theme, top directory placement", "Gentle streaks — zero guilt, weekly grace"], n: "Invite your friends and you both win: bonus XP, profile boosts, and badges. And friends who join through our founders' links become Founding Members — with permanent perks. Streaks? Gentle. Guilt? None.", shot: "08-referrals.png" },
  { e: "📱", kicker: "YOUR MOVE", title: "Scan. Join. Bring your people.", sub: LIVE, bullets: ["Free while we grow — everything included", "⭐ Star us on GitHub to help communities find us"], n: "So — scan the code, join free, and bring your people. Your circle has chosen. Confirm whether you can attend. See you there! Oh — and star us on GitHub, it helps more communities find us.", qr: "../assets/qr-main.png" },
];

const FOUNDER = [
  { e: "👑", kicker: "CONFIDENTIAL · FOUNDER TEAM", title: "Welcome, Arya & Avani.", sub: "Ten minutes — and you'll know exactly what we run together.", bullets: ["The live console and what every number means", "The invite program that makes people love our links", "Moderation, security, and our event playbook"], n: "Hi Arya, hi Avani — welcome to the founder briefing. This is everything the three of us run together: the live console, the invite program, moderation, and our event playbook. Ten minutes, and you'll know exactly what to do." },
  { e: "📊", kicker: "STATUS", title: "Where the platform stands.", sub: "Live, free, open source — v0.4.", bullets: ["Events, votes, plans, vouches, QR cards — all working", "One honest limit: data lives per browser for now", "Events run from one 'event console' device until the backend swap"], n: "Quick status: the platform is live, free, and open source. Events, votes, plans, vouches and the QR cards all work today. One honest limit: data lives per browser for now, so during events we run from one device — the event console. The server upgrade is our next milestone." },
  { e: "📊", kicker: "FOUNDER CONSOLE", title: "Live telemetry — read it like this.", sub: "Every number, and what it tells us.", bullets: ["Members and joins this week → growth pulse", "Confirmed plans → the north-star metric", "Open reports → check every evening; welcome new members by name"], n: "This is our founder console. Live telemetry: members, joins this week, founding members, confirmed plans — that's our north star — and open reports. The pulse feed below shows everything happening, in real time. Check it every evening and welcome new members by name.", shot: "F1-console-live.png" },
  { e: "🥇", kicker: "GROWTH", title: "Invite leaderboard — who brought whom.", sub: "Team links create Founding Members, permanently.", bullets: ["Top three promoters get public thanks, every week", "Team links are copy-ready in the console", "Founding perks: +100 XP, every theme, top placement"], n: "The invite leaderboard shows exactly who brought whom. Every join through one of our team links makes that person a Founding Member — bonus XP, every profile theme, and top directory placement, permanently. After every event, we thank our top promoters by name. Recognition is free — and it works.", shot: "F2-console-leaderboard.png" },
  { e: "🛡️", kicker: "ACCOUNTS", title: "Edit, roles, suspend — all audited.", sub: "Power with receipts.", bullets: ["Founder → co-founders (us two) → moderators → members", "Every admin change lands in the audit log", "Suspend blocks login instantly; unsuspend restores"], n: "We can edit any account, change roles, and suspend bad actors — and every single action lands in the audit log. Siddhant is the founder; you two are co-founders; moderators help with reports. Power with receipts.", shot: "F3-console-accounts.png" },
  { e: "⚖️", kicker: "TRUST & SAFETY", title: "Moderation: calm, noted, confidential.", sub: "Read → inspect → resolve with a note.", bullets: ["The reporter learns it was handled — nothing more", "Mass reports never auto-ban anyone", "Aim: every report resolved within 24 hours"], n: "When someone reports content, we read, inspect, and resolve with a note. The reporter is told it was handled — nothing more. Mass reports never auto-ban anyone. We judge every case calmly.", shot: "F4-moderation.png" },
  { e: "🔐", kicker: "SECURITY", title: "Access codes — hashed, rotated, private.", sub: "The repo stores hashes only. Plaintext lives in FOUNDER_PRIVATE.md.", bullets: ["Founder code → Siddhant only", "Co-founder code → Arya & Avani", "Rotate after each event season — instructions included"], n: "Our team access codes claim admin roles at signup. The repo only stores hashes — the real codes live in the confidential folder. Rotate them after each event season: generate a new code, swap the hash, deploy. Simple, and it keeps us safe." },
  { e: "🎪", kicker: "EVENT DAY", title: "The playbook — three of us, one room.", sub: "60-second demo · QR cards · welcome every scan.", bullets: ["Siddhant demos the Decision Room live", "One of us works the room with QR cards", "The other welcomes newcomers and matches buddies — same evening"], n: "Event day playbook: Siddhant demos the Decision Room in sixty seconds, one of us works the room with QR cards, and the other welcomes every newcomer and matches buddies the same evening. The ask is simple: scan, join free, invite two friends — everyone wins." },
  { e: "🔁", kicker: "THE RHYTHM", title: "Our week, on repeat.", sub: "Consistency beats intensity.", bullets: ["Monday: post 2–3 fresh source-linked events", "Wednesday: nudge stalled votes", "Weekend: events. Sunday: leaderboard + thank top promoters"], n: "Our weekly rhythm: post fresh events Monday, nudge votes Wednesday, run events on the weekend, and review the leaderboard Sunday. Confirmed group plans per week is the number that matters. Everything else is support." },
  { e: "🚀", kicker: "CLOSING", title: "Founders in the wild.", sub: "Bring your warmth. Bring your honesty.", bullets: ["Nobody events alone — that's the whole mission", "Ask anything, anytime — this is ours to build"], n: "That's the whole machine. Bring your warmth, bring your honesty, and let's make sure nobody ever events alone. Founders in the wild — let's go!", photo: "team-stage" },
];

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function sceneHtml(sc, idx, total, kind) {
  const bullets = sc.bullets.map((b) => `<div class="b"><span class="dot"></span>${esc(b)}</div>`).join("");
  const shot = sc.shot ? `<div class="shotwrap"><img src="shots/${sc.shot}" /><div class="shotbar"></div></div>` : "";
  const qr = sc.qr ? `<div class="qrwrap"><img src="${sc.qr}" /><div class="qrlabel">scan → join free</div></div>` : "";
  const photo = sc.photo === "team-stage" ? `<div class="photowrap"><img src="../team-stage.png" /></div>` : "";
  const emojiBlock = sc.e && !sc.photo ? `<div class="big-e">${sc.e}</div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1920px; height: 1080px; overflow: hidden; position: relative; background: #14231C;
         font-family: Verdana, sans-serif; color: #F2F4EE; }
  .glow1 { position: absolute; width: 900px; height: 900px; border-radius: 999px; left: -260px; top: -300px;
           background: radial-gradient(circle, rgba(36,73,216,.32), transparent 70%); }
  .glow2 { position: absolute; width: 760px; height: 760px; border-radius: 999px; right: -200px; bottom: -260px;
           background: radial-gradient(circle, rgba(233,141,115,.22), transparent 70%); }
  .wm { position: absolute; top: 54px; left: 90px; font-family: Georgia, serif; font-size: 30px; font-weight: bold; }
  .wm span { color: #B7C8FF; }
  .kicker { position: absolute; top: 130px; left: 92px; font-size: 22px; font-weight: bold; letter-spacing: 6px; color: #B7C8FF; }
  .title { position: absolute; top: 200px; left: 90px; width: ${sc.shot || sc.qr ? "1020px" : "1500px"}; font-family: Georgia, serif; font-size: ${(sc.shot || sc.qr) ? 74 : (sc.title.length > 40 ? 82 : 96)}px; line-height: 1.08; font-weight: bold; }
  .sub { position: absolute; top: ${sc.title.length > 40 ? 560 : 540}px; left: 92px; width: ${sc.shot || sc.qr ? "1000px" : "1400px"}; font-size: 34px; color: #B5C2B7; }
  .bullets { position: absolute; top: 680px; left: 92px; width: ${sc.shot || sc.qr ? "900px" : "1250px"}; }
  .b { font-size: 30px; margin-bottom: 26px; display: flex; align-items: center; gap: 20px; }
  .dot { width: 14px; height: 14px; border-radius: 999px; background: #B7C8FF; flex: none; }
  .big-e { position: absolute; right: 120px; top: 170px; font-size: 170px; filter: drop-shadow(0 14px 34px rgba(0,0,0,.45)); }
  .shotwrap { position: absolute; right: 70px; top: 210px; width: 640px; border-radius: 22px; overflow: hidden;
              border: 2px solid #3C5143; box-shadow: 0 30px 80px rgba(0,0,0,.5); background: #fff; }
  .shotwrap img { width: 100%; display: block; }
  .shotbar { height: 16px; background: linear-gradient(90deg, #2449D8, #E98D73); }
  .qrwrap { position: absolute; right: 250px; top: 430px; width: 380px; background: #fff; border-radius: 28px; padding: 26px;
            box-shadow: 0 30px 90px rgba(0,0,0,.5); text-align: center; }
  .qrwrap img { width: 100%; display: block; }
  .qrlabel { font-size: 26px; font-weight: bold; color: #17291F; margin-top: 16px; font-family: Verdana, sans-serif; }
  .photowrap { position: absolute; inset: 0; }
  .photowrap img { width: 100%; height: 100%; object-fit: cover; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; height: 74px; background: rgba(11,18,14,.72);
            display: flex; align-items: center; padding: 0 90px; justify-content: space-between; }
  .footer .brand { font-family: Georgia, serif; font-size: 22px; color: #B5C2B7; }
  .footer .live { font-size: 20px; color: #8FA093; }
  .progress { position: absolute; bottom: 74px; left: 0; height: 6px; background: linear-gradient(90deg, #2449D8, #E98D73); width: ${Math.round(((idx + 1) / total) * 100)}%; }
  </style></head><body>
  <div class="glow1"></div><div class="glow2"></div>
  ${photo}
  <div class="wm">Community<span>Connect</span></div>
  <div class="kicker">${esc(sc.kicker)}</div>
  <div class="title">${esc(sc.title)}</div>
  <div class="sub">${esc(sc.sub)}</div>
  <div class="bullets">${bullets}</div>
  ${emojiBlock}${shot}${qr}
  <div class="progress"></div>
  <div class="footer"><span class="brand">Find your event. Bring your people.</span><span class="live">${kind === "user" ? LIVE : "CONFIDENTIAL · founder team only"}</span></div>
  </body></html>`;
}

function writeVideo(kind, scenes, shotsDir) {
  const dir = path.join(OUT, kind);
  scenes.forEach((sc, i) => {
    fs.writeFileSync(path.join(dir, `scene${String(i + 1).padStart(2, "0")}.html`), sceneHtml(sc, i, scenes.length, kind));
    fs.writeFileSync(path.join(dir, `narration${String(i + 1).padStart(2, "0")}.txt`), sc.n);
  });
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ kind, total: scenes.length, shotsDir }, null, 2));
  console.log(`${kind}: ${scenes.length} scenes written`);
}

writeVideo("user", USER);
writeVideo("founder", FOUNDER);
console.log("done");
