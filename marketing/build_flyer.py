# Builds the public A4 event flyer (marketing/CommunityConnect-Flyer.pdf).
# Founder-facing documents are built from the private distribution, not here.
import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
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

W, H = A4
M = 56

def register_fonts():
    fonts = {
        "Serif": ["georgia.ttf"],
        "Serif-B": ["georgiab.ttf"],
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

def chip(c, text, x, y, bg, fg, font="Sans-B", size=8):
    w = c.stringWidth(text, font, size) + 16
    c.setFillColor(bg); c.roundRect(x, y - 5, w, 17, 8.5, stroke=0, fill=1)
    c.setFillColor(fg); c.setFont(font, size); c.drawString(x + 8, y, text)
    return x + w + 8

def build_flyer():
    c = pdfcanvas.Canvas(OUT_FLYER, pagesize=A4)
    c.setTitle("CommunityConnect - Event Flyer")
    c.setAuthor("Siddhant Pardeshi")
    c.setSubject("Printable flyer with QR - Find your event. Bring your people.")
    c.setFillColor(PAGE_BG); c.rect(0, 0, W, H, stroke=0, fill=1)

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
        para(c, b, x + 16, body_top - 60, colw - 32, size=9, leading=13)
        x += colw + 12

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

build_flyer()
