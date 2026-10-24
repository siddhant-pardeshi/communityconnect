# Builds the two brand PDFs: the founder's operating guide and the A4 event flyer.
# Brand: Warm Constellations. Vector output via ReportLab; QRs embedded as raster.
import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
OUT_GUIDE = os.path.join(HERE, "CommunityConnect-Founder-Guide.pdf")
OUT_FLYER = os.path.join(HERE, "CommunityConnect-Flyer.pdf")

INK = HexColor("#17291F")
PAGE_BG = HexColor("#F5F3ED")
MUTED = HexColor("#536158")
ACCENT = HexColor("#2449D8")
ACCENT_DARK = HexColor("#1737B4")
CORAL = HexColor("#E98D73")
SAFFRON = HexColor("#E6BC56")
SAGE = HexColor("#A9C4B2")
BORDER = HexColor("#D9DFD6")
SOFT = HexColor("#E9EEFF")
DARK_BG = HexColor("#14231C")
DARK_PANEL = HexColor("#1B2E24")
LIGHT = HexColor("#F2F4EE")
LIGHT_MUTED = HexColor("#B5C2B7")

W, H = A4  # 595 x 842 pt
M = 56     # side margin

def register_fonts():
    fonts = {
        "Serif": ["georgia.ttf", "georgia0.ttf"],
        "Serif-B": ["georgiab.ttf", "georgia bold.ttf"],
        "Serif-I": ["georgiai.ttf"],
        "Sans": ["verdana.ttf", "arial.ttf"],
        "Sans-B": ["verdanab.ttf", "arialbd.ttf"],
    }
    w32 = os.environ.get("WINDIR", r"C:\Windows") + "\\Fonts\\"
    for name, candidates in fonts.items():
        for f in candidates:
            p = w32 + f
            if os.path.exists(p):
                pdfmetrics.registerFont(TTFont(name, p))
                break
        else:
            fallback = {"Serif": "Times-Roman", "Serif-B": "Times-Bold", "Serif-I": "Times-Italic",
                        "Sans": "Helvetica", "Sans-B": "Helvetica-Bold"}[name]
            pdfmetrics.registerFont(TTFont(name, fallback))

register_fonts()

def gather_mark(c, x, y, r=1.0):
    """The Gather Mark: three nodes around an open shared center."""
    c.saveState()
    c.translate(x, y)
    c.setStrokeColor(HexColor("#E9EEFF")); c.setLineWidth(2.6 * r); c.setLineCap(1)
    c.setStrokeAlpha(0.85)
    c.bezier(-18 * r, 12 * r, -8 * r, 18 * r, 8 * r, 18 * r, 18 * r, 12 * r)
    c.bezier(-18 * r, -12 * r, -8 * r, -18 * r, 8 * r, -18 * r, 18 * r, -12 * r)
    c.setStrokeAlpha(1)
    for cx, cy, col in [(-24 * r, 24 * r, CORAL), (24 * r, 24 * r, SAFFRON), (0, -30 * r, SAGE)]:
        c.setFillColor(col); c.circle(cx, cy, 12 * r, stroke=0, fill=1)
    c.setFillColor(PAGE_BG); c.circle(0, 0, 8.4 * r, stroke=0, fill=1)
    c.restoreState()

def wordmark(c, x, y, size=22, color=LIGHT, accent=HexColor("#B7C8FF")):
    c.setFont("Serif-B", size)
    c.setFillColor(color)
    c.drawString(x, y, "Community")
    w = c.stringWidth("Community", "Serif-B", size)
    c.setFillColor(accent)
    c.drawString(x + w, y, "Connect")
    return w + c.stringWidth("Connect", "Serif-B", size)

def wrap(c, text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if c.stringWidth(t, font, size) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def para(c, text, x, y, width, font="Sans", size=9.5, leading=14, color=INK):
    c.setFont(font, size); c.setFillColor(color)
    for line in wrap(c, text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y

def bullets(c, items, x, y, width, font="Sans", size=9.5, leading=14, color=INK, dot=ACCENT):
    for it in items:
        c.setFillColor(dot); c.circle(x + 3, y + 3, 2, stroke=0, fill=1)
        y = para(c, it, x + 14, y, width - 14, font, size, leading, color) + 2
    return y

def chip(c, text, x, y, bg, fg, font="Sans-B", size=8):
    w = c.stringWidth(text, font, size) + 16
    c.setFillColor(bg); c.roundRect(x, y - 5, w, 17, 8.5, stroke=0, fill=1)
    c.setFillColor(fg); c.setFont(font, size); c.drawString(x + 8, y, text)
    return x + w + 8

def h2(c, text, x, y, color=INK):
    c.setFont("Serif-B", 19); c.setFillColor(color)
    c.drawString(x, y, text)
    c.setStrokeColor(ACCENT); c.setLineWidth(2); c.line(x, y - 8, x + 42, y - 8)
    return y - 34

def footer(c, n, label):
    c.setFont("Sans", 7.5); c.setFillColor(MUTED)
    c.drawString(M, 30, f"CommunityConnect · Founder's Guide · v0.3.0")
    c.drawRightString(W - M, 30, f"{label} · {n:02d}")
    c.setStrokeColor(BORDER); c.setLineWidth(0.6); c.line(M, 42, W - M, 42)

PAGE_NO = [0]
def page_frame(c, title=None, kicker=None):
    if PAGE_NO[0] >= 2:
        c.showPage()
    PAGE_NO[0] += 1
    c.setFillColor(PAGE_BG); c.rect(0, 0, W, H, stroke=0, fill=1)
    if kicker:
        c.setFont("Sans-B", 8); c.setFillColor(ACCENT)
        c.drawString(M, H - 46, kicker.upper())
    if title:
        c.setFont("Serif-B", 24); c.setFillColor(INK)
        c.drawString(M, H - 74, title)
        c.setStrokeColor(ACCENT); c.setLineWidth(2); c.line(M, H - 84, M + 46, H - 84)
    return H - 110

# ─────────────────────────────────────────────────────────────────────────────
# 1) FOUNDER'S GUIDE
# ─────────────────────────────────────────────────────────────────────────────
def cover():
    PAGE_NO[0] += 1
    c = CANVAS
    c.setFillColor(DARK_BG); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(DARK_PANEL); c.circle(W * 0.92, H * 0.85, 190, stroke=0, fill=1)
    c.setFillColor(HexColor("#20364A")); c.circle(W * 0.06, H * 0.12, 150, stroke=0, fill=1)
    gather_mark(c, W - 150, H - 170, 1.6)
    c.setFont("Sans-B", 10); c.setFillColor(LIGHT_MUTED)
    c.drawString(M, H - 70, "F O U N D E R ' S   O P E R A T I N G   M A N U A L")
    wordmark(c, M, H - 150, 40)
    c.setFont("Serif-I", 20); c.setFillColor(HexColor("#B7C8FF"))
    c.drawString(M, H - 185, "Find your event. Bring your people.")
    c.setStrokeColor(CORAL); c.setLineWidth(2); c.line(M, H - 210, M + 52, H - 210)
    lines = [
        "Everything the platform does today, how each part works, and how to run it:",
        "the live founder console, the referral program, team access codes, the event",
        "playbook, the numbers that matter, and what is honestly still on the roadmap.",
    ]
    y = H - 250
    c.setFont("Sans", 10.5); c.setFillColor(LIGHT)
    for ln in lines:
        c.drawString(M, y, ln); y -= 16
    c.setFont("Sans-B", 9); c.setFillColor(LIGHT_MUTED)
    c.drawString(M, 120, "Version 0.3.0 · October 2026 · Applies to the live deployment")
    c.drawString(M, 104, "Live: https://siddhant-pardeshi.github.io/communityconnect/")
    c.drawString(M, 88, "Repository: https://github.com/siddhant-pardeshi/communityconnect")
    qr = ImageReader(os.path.join(ASSETS, "qr-main.png"))
    c.setFillColor(HexColor("#FFFFFF")); c.roundRect(W - 190, 70, 130, 130, 10, stroke=0, fill=1)
    c.drawImage(qr, W - 185, 75, 120, 120, mask="auto")
    c.setFont("Sans", 7.5); c.setFillColor(LIGHT_MUTED)
    c.drawCentredString(W - 125, 58, "scan - open the live app")
    c.showPage()

def sec_what():
    y = page_frame(CANVAS, "What you are running", "Overview")
    y = para(CANVAS,
        "CommunityConnect turns scattered event links into one confirmed group plan. Groups shortlist "
        "events, see clashes, vote in a Decision Room, and confirm a single plan - then meet people "
        "there through opt-in introductions. The product earns trust by being checkable: every listing "
        "carries its source, every recommendation shows its formula, and attendance is never overstated.",
        M, y, W - 2 * M, size=10.5, leading=16)
    y -= 10
    y = para(CANVAS, "The core loop", M, y, W - 2 * M, "Serif-B", 13, 16)
    loop = ["Discover or post events (with source links)",
            "Shortlist candidates inside a private Circle",
            "Vote can / maybe / cannot before a hard deadline",
            "Finalize one plan; everyone confirms separately",
            "Find a buddy, attend, vouch, repeat"]
    y = bullets(CANVAS, loop, M, y, W - 2 * M, size=10, leading=14)
    y -= 14
    y = h2(CANVAS, "What it deliberately is not", M, y)
    y = bullets(CANVAS, [
        "Not a ticketing platform. A confirmed plan is not a ticket; registration always happens on the organizer's own site.",
        "Not a feed to scroll. XP is capped daily and the dashboard points at actions, not content.",
        "Not a verified-credentials network. College and company claims are peer-vouched, never badged as official.",
        "Not anonymous. Real names, consent-based contact, private-by-default circles and votes.",
    ], M, y, W - 2 * M, size=10, leading=14)
    y -= 14
    CANVAS.setFillColor(SOFT); CANVAS.roundRect(M, y - 92, W - 2 * M, 96, 12, stroke=0, fill=1)
    CANVAS.setFillColor(ACCENT_DARK)
    CANVAS.setFont("Serif-B", 11); CANVAS.drawString(M + 16, y - 22, "The one metric that matters")
    y2 = para(CANVAS,
        "Weekly confirmed group plans - a plan counts once, when two or more people independently confirm it. "
        "Everything else (signups, votes, vouches) is supporting telemetry for this number.",
        M + 16, y - 40, W - 2 * M - 32, size=9.5, leading=13, color=ACCENT_DARK)
    footer(CANVAS, PAGE_NO[0], "Overview")

def sec_features_1():
    y = page_frame(CANVAS, "How the features work · I", "Product reference")
    y = h2(CANVAS, "Accounts, profiles and privacy", M, y)
    y = bullets(CANVAS, [
        "Signup captures name, email, password (salted and hashed), optional college and company, and conduct acceptance.",
        "Privacy toggles - show college / company / background / intents, directory opt-in - apply instantly everywhere, including the printed networking card.",
        "Account export produces a JSON file of everything the user owns. Deletion pseudonymizes authored content and removes participation.",
        "Team access codes at signup can claim the founder seat (single, immutable) or a co-founder seat (maximum two). See the runbook for the codes.",
    ], M, y, W - 2 * M)
    y -= 10
    y = h2(CANVAS, "Events and discovery", M, y)
    y = bullets(CANVAS, [
        "Manual posting with a source URL is the reliable path; listings show the provider, price (or 'unknown' - never assumed free) and accessibility if supplied.",
        "Discovery supports search, city, format, price and tag filters. Circle-only events never appear in public search or previews.",
        "Attendees are shown per person: 'planning', self-reported 'registered', or plan-confirmed. Opening a source link never registers anyone.",
        "Material edits (time, title, cancellation) mark dependent plans 'review needed' and notify every participant and RSVP.",
        "Every event page exports a standards-correct .ics calendar file.",
    ], M, y, W - 2 * M)
    y -= 10
    y = h2(CANVAS, "Circles and Decision Rooms", M, y)
    y = bullets(CANVAS, [
        "Circles are private planning rooms with an owner, revocable invite codes, an activity feed, and circle-only events.",
        "A Decision Room snapshots the voter roster, sets a hard deadline, and accepts ballots: can / maybe / cannot per candidate, plus one favorite. Blank is 'no response', never 'cannot'.",
        "Score = 100 x (0.65 x can + 0.15 x maybe + 0.20 x favorite) / roster. Quorum is 60% of the roster (minimum 2). Ties stay ties; zero preference recommends nothing; overrides require a written reason shown to the circle.",
        "Finalizing creates one plan 'awaiting confirmations'. A plan becomes confirmed only when two or more eligible participants independently confirm. Votes are never shown to anyone before the deadline; individual ballots are never visible to anyone, including circle owners.",
    ], M, y, W - 2 * M)
    footer(CANVAS, PAGE_NO[0], "Product reference")

def sec_features_2():
    y = page_frame(CANVAS, "How the features work · II", "Product reference")
    y = h2(CANVAS, "Peer vouches (trust)", M, y)
    y = bullets(CANVAS, [
        "After an event starts, participants who share that event can vouch for each other: a heart, claim verification (college / company / course - 'I saw the evidence'), and conduct signals (polite, professional).",
        "Vouches count for a rolling 14-day window, then fade. One vouch per pair per window. Self-vouches and blocked pairs are rejected.",
        "Public surfaces show only positive signals with counts. Concerns go through the report flow to moderators; vouch notes are moderator-only.",
        "Vouching awards no XP on purpose - reputation must not be farmable.",
    ], M, y, W - 2 * M)
    y -= 10
    y = h2(CANVAS, "Referrals and Founding Members", M, y)
    y = bullets(CANVAS, [
        "Every account has an invite code and link. A standard join gives both sides +75 XP; the referrer gets a 14-day directory boost, the newcomer a 7-day welcome boost, both get the Connector badge.",
        "Joins through founder-team links create Founding Members: +100 XP, every accent theme unlocked from day one, permanent top placement in the People directory, and the Founding Member badge. This is the privilege that motivates people to join through your links specifically.",
        "The invite leaderboard in the founder console shows exactly who brought whom - use it to recognize your best promoters at events.",
    ], M, y, W - 2 * M)
    y -= 10
    y = h2(CANVAS, "Networking card, support hub, momentum", M, y)
    y = bullets(CANVAS, [
        "The networking card is a printable 85.6 x 54 mm card with the user's QR profile link plus a vCard QR for phones. It always respects privacy toggles.",
        "The support hub aggregates intent chips: open to work, seeking referrals, hiring, between roles. The buddy board lets anyone ask for company at an event; both sides must accept.",
        "Momentum is a gentle streak (one check-in per day, weekly grace day), contribution XP with a 30-per-day cap, and cosmetic unlocks. Safety and privacy tools are always free.",
    ], M, y, W - 2 * M)
    y -= 10
    y = h2(CANVAS, "Moderation and the founder console", M, y)
    y = bullets(CANVAS, [
        "Anyone can report events or accounts. Moderators resolve with a mandatory note; the author is notified, the reporter stays confidential. Mass reports never auto-ban.",
        "Roles: founder (one, immutable), co-founder (max two), moderator, member. The founder console - visible only to the founder team - edits any account, grants roles, suspends accounts, and shows the live dashboard, invite leaderboard, pulse feed and audit log.",
        "Every administrative action is appended to the audit log with actor, action, target and time.",
    ], M, y, W - 2 * M)
    footer(CANVAS, PAGE_NO[0], "Product reference")

def sec_runbook():
    y = page_frame(CANVAS, "Founder runbook", "Operations")
    y = h2(CANVAS, "Team access codes", M, y)
    CANVAS.setFillColor(HexColor("#FFFFFF")); CANVAS.setStrokeColor(BORDER); CANVAS.setLineWidth(1)
    CANVAS.roundRect(M, y - 86, W - 2 * M, 90, 10, stroke=1, fill=1)
    rows = [("Purpose", "Code", "Effect at signup"),
            ("Founder (you)", "CC-FOUNDER-2026", "Claims the single founder seat, full control"),
            ("Co-founder", "CC-CREW-2026", "Claims one of two co-founder seats"),
            ("Everyone else", "your invite link", "Member + Founding perks on team links")]
    ty = y - 22
    for i, (a, b, cc) in enumerate(rows):
        CANVAS.setFont("Sans-B" if i == 0 else "Sans", 9)
        CANVAS.setFillColor(MUTED if i == 0 else INK)
        CANVAS.drawString(M + 14, ty, a)
        CANVAS.setFont("Sans-B" if i else "Sans", 9)
        CANVAS.setFillColor(ACCENT_DARK)
        CANVAS.drawString(M + 150, ty, b)
        CANVAS.setFont("Sans", 9); CANVAS.setFillColor(INK if i else MUTED)
        CANVAS.setFont("Sans", 8.5); CANVAS.setFillColor(INK if i else MUTED)
        CANVAS.drawString(M + 285, ty, cc)
        ty -= 22
    y -= 104
    y = para(CANVAS,
        "Treat these codes as launch-phase conveniences: they work because accounts live per browser in this "
        "version. Give the founder code to nobody; give the co-founder code only to your two named co-founders. "
        "When the server backend lands, these are replaced by real invitations, and the audit log keeps its history.",
        M, y, W - 2 * M, size=9.5, leading=13)
    y -= 8
    y = h2(CANVAS, "The event playbook (you + one teammate)", M, y)
    y = bullets(CANVAS, [
        "Before: pick events with 50-200 expected attendees. Print the flyer PDF and 20 QR networking cards. Both carry your founder invite QR - every scan is attributable.",
        "60-second demo: open the Decision Room on your phone, show three candidates, vote, finalize, confirm. Then show your networking card QR and the invite leaderboard.",
        "The ask: 'Create a free account with this QR, and invite two friends - you both get bonus XP, and people who join through us get Founding Member perks.'",
        "At the venue: never post without organizer permission, never scrape attendee lists, never spam DMs. Ask the organizer to co-host a Decision Room for their next event; offer them moderator tools later.",
        "Same evening: check the founder console pulse feed, welcome every new member by name, and accept pending connection requests. This is what turns a scan into a retained user.",
        "Weekly: review the invite leaderboard, thank your top three promoters publicly, and post two or three fresh, source-linked events for your city.",
    ], M, y, W - 2 * M)
    footer(CANVAS, PAGE_NO[0], "Operations")

def sec_numbers():
    y = page_frame(CANVAS, "Numbers and honest limits", "Operations")
    y = h2(CANVAS, "What to watch weekly", M, y)
    CANVAS.setFillColor(HexColor("#FFFFFF")); CANVAS.setStrokeColor(BORDER); CANVAS.setLineWidth(1)
    CANVAS.roundRect(M, y - 150, W - 2 * M, 154, 10, stroke=1, fill=1)
    rows = [("North-star", "Weekly confirmed group plans (counted once per plan)"),
            ("Growth", "Invite leaderboard: invites sent x accepted; Founding Members count"),
            ("Activation", "Signup -> first circle -> first vote -> first confirmed plan"),
            ("Trust", "Vouches per event; hearts; conduct signals (rolling 14 days)"),
            ("Safety", "Open reports and time-to-resolution; unwanted-contact reports"),
            ("Retention", "Week-2 return rate; repeat planning at 4 weeks")]
    ty = y - 24
    for i, (a, b) in enumerate(rows):
        CANVAS.setFont("Sans-B", 9.5); CANVAS.setFillColor(ACCENT_DARK if i == 0 else INK)
        CANVAS.drawString(M + 14, ty, a)
        CANVAS.setFont("Sans", 9.5); CANVAS.setFillColor(INK)
        CANVAS.drawString(M + 150, ty, b)
        ty -= 22
    y -= 168
    y = h2(CANVAS, "Honest limits of this version", M, y)
    y = bullets(CANVAS, [
        "Accounts and data live per browser. Cross-device sync, server-side auth and email arrive with the Supabase swap - the schema mapping and swap point are documented in docs/DECISIONS.md.",
        "Team access codes and moderation run in the client; enforcement hardens server-side in the next milestone.",
        "'CommunityConnect' is a working name - trademark and domain clearance are still pending (see docs/BRAND.md for the shortlist).",
        "Demo data on first load is fictional and labeled; never present it as real traction.",
    ], M, y, W - 2 * M)
    y -= 12
    y = h2(CANVAS, "Bringing in teammates", M, y)
    y = bullets(CANVAS, [
        "Add them to the GitHub repository with write access; they branch from main and open pull requests - CONTRIBUTING.md defines the bar.",
        "The architecture doc (docs/ARCHITECTURE.md) explains the monorepo in one read: pure domain logic in packages/core, the web app in apps/web, tests pinned to rules.",
        "CI runs typecheck, tests and build on every pull request once the workflow scope is enabled (one command, documented in PROJECT_STATUS.md).",
    ], M, y, W - 2 * M)
    footer(CANVAS, PAGE_NO[0], "Operations")

def build_guide():
    global CANVAS
    CANVAS = pdfcanvas.Canvas(OUT_GUIDE, pagesize=A4)
    CANVAS.setTitle("CommunityConnect - Founder's Operating Manual")
    CANVAS.setAuthor("Siddhant Pardeshi")
    CANVAS.setSubject("Product reference and operations runbook, v0.3.0")
    cover(); sec_what(); sec_features_1(); sec_features_2(); sec_runbook(); sec_numbers()
    CANVAS.save()
    print("guide written:", OUT_GUIDE)

# ─────────────────────────────────────────────────────────────────────────────
# 2) EVENT FLYER (A4, single page)
# ─────────────────────────────────────────────────────────────────────────────
def build_flyer():
    c = pdfcanvas.Canvas(OUT_FLYER, pagesize=A4)
    c.setTitle("CommunityConnect - Event Flyer")
    c.setAuthor("Siddhant Pardeshi")
    c.setSubject("Printable flyer with QR - Find your event. Bring your people.")
    c.setFillColor(PAGE_BG); c.rect(0, 0, W, H, stroke=0, fill=1)

    # header band
    c.setFillColor(DARK_BG); c.rect(0, H - 240, W, 240, stroke=0, fill=1)
    c.setFillColor(DARK_PANEL); c.circle(W - 90, H - 40, 130, stroke=0, fill=1)
    gather_mark(c, 84, H - 90, 1.1)
    c.setFont("Sans-B", 10); c.setFillColor(LIGHT_MUTED)
    c.drawString(M, H - 52, "C O M M U N I T Y C O N N E C T")
    c.setFont("Serif-B", 40); c.setFillColor(LIGHT)
    c.drawString(M, H - 130, "Never event alone.")
    c.setFont("Serif-I", 19); c.setFillColor(HexColor("#B7C8FF"))
    c.drawString(M, H - 162, "Find your event. Bring your people.")
    c.setFont("Sans", 11); c.setFillColor(LIGHT_MUTED)
    c.drawString(M, H - 196, "Turn the three event links in your group chat into one plan everyone actually attends.")
    c.setStrokeColor(CORAL); c.setLineWidth(2); c.line(M, H - 214, M + 52, H - 214)

    body_top = H - 276
    # three steps
    steps = [
        ("1", "Share the options", "Post events or paste any link - the source stays visible."),
        ("2", "Decide together", "Your circle votes can / maybe / cannot. Clashes show up. One plan wins."),
        ("3", "Show up together", "Everyone confirms. Bring a buddy. Vouch for great people."),
    ]
    x = M
    colw = (W - 2 * M - 24) / 3
    for n, t, b in steps:
        c.setFillColor(HexColor("#FFFFFF")); c.setStrokeColor(BORDER); c.setLineWidth(1)
        c.roundRect(x, body_top - 148, colw, 152, 12, stroke=1, fill=1)
        c.setFillColor(SOFT); c.circle(x + 30, body_top - 26, 14, stroke=0, fill=1)
        c.setFont("Serif-B", 15); c.setFillColor(ACCENT_DARK); c.drawCentredString(x + 30, body_top - 31, n)
        c.setFont("Sans-B", 11.5); c.setFillColor(INK); c.drawString(x + 52, body_top - 30, t)
        yy = para(c, b, x + 16, body_top - 60, colw - 32, size=9, leading=13)
        x += colw + 12

    # referral panel
    py = body_top - 300
    c.setFillColor(ACCENT); c.roundRect(M, py, W - 2 * M, 96, 14, stroke=0, fill=1)
    c.setFont("Serif-B", 17); c.setFillColor(HexColor("#FFFFFF"))
    c.drawString(M + 20, py + 62, "Invite a friend - you both get +75 XP and a 14-day boost")
    c.setFont("Sans", 10.5); c.setFillColor(HexColor("#DCE4FF"))
    c.drawString(M + 20, py + 40, "People who join through our team links get Founding Member perks: +100 XP, every profile theme,")
    c.drawString(M + 20, py + 24, "top directory placement - permanent. Free while we grow; students and job seekers always welcome.")
    chip(c, "Decision Rooms", M + 20, py - 4, HexColor("#FFFFFF"), ACCENT_DARK)
    chip(c, "Peer vouches", M + 148, py - 4, HexColor("#FFFFFF"), ACCENT_DARK)
    chip(c, "QR networking cards", M + 268, py - 4, HexColor("#FFFFFF"), ACCENT_DARK)
    chip(c, "Support hub", M + 424, py - 4, HexColor("#FFFFFF"), ACCENT_DARK)

    # QR footer
    fy = py - 190
    qr = ImageReader(os.path.join(ASSETS, "qr-founder-invite.png"))
    c.setFillColor(HexColor("#FFFFFF")); c.setStrokeColor(BORDER); c.setLineWidth(1)
    c.roundRect(W / 2 - 88, fy - 4, 176, 176, 14, stroke=1, fill=1)
    c.drawImage(qr, W / 2 - 80, fy + 4, 160, 160, mask="auto")
    c.setFont("Sans-B", 13); c.setFillColor(INK)
    c.drawCentredString(W / 2, fy - 26, "Scan to join free - Founding Member perks inside")
    c.setFont("Sans", 10); c.setFillColor(MUTED)
    c.drawCentredString(W / 2, fy - 42, "siddhant-pardeshi.github.io/communityconnect")
    c.setFont("Sans", 8); c.setFillColor(MUTED)
    c.drawCentredString(W / 2, 36, "Open source (Apache-2.0) · github.com/siddhant-pardeshi/communityconnect · star the repo if it helps your community")
    c.showPage(); c.save()
    print("flyer written:", OUT_FLYER)

build_guide()
build_flyer()
