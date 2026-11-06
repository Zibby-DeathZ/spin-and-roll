"""The Props Book: how to make the props, then printable templates. Run: python3 build_props.py
Templates come from props-data.json (made from the app by export_props.mjs), so runes and gifts always match the game."""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_guidebook as B  # noqa: E402
import build_dm_guide as G  # noqa: E402  (registers the fonts)
import props  # noqa: E402
from pypdf import PdfReader, PdfWriter  # noqa: E402
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.enums import TA_CENTER  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402
from reportlab.pdfbase import pdfmetrics  # noqa: E402
from reportlab.pdfbase.ttfonts import TTFont  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402
from reportlab.platypus import Frame, Paragraph  # noqa: E402

D = json.load(open(os.path.join(HERE, 'props-data.json'), encoding='utf-8'))
RUNE = 'Helvetica'
for path in ('/usr/share/fonts/truetype/freefont/FreeMono.ttf', os.path.join(HERE, 'FreeMono.ttf')):
    if os.path.exists(path):
        pdfmetrics.registerFont(TTFont('Runes', path))
        RUNE = 'Runes'
        break

PW, PH = A4
M = 14 * mm
L, R = M + 2 * mm, PW - M - 2 * mm
IW = R - L
INK = colors.HexColor('#2a2238')
SEPIA = colors.HexColor('#7a5a2a')
GOLD = colors.HexColor('#a8781f')
FAINT = colors.HexColor('#b9ad92')
WASH = colors.HexColor('#fbf7ec')
CUT = colors.HexColor('#9a9a9a')
SERIF, SERIF_B, SERIF_I, SANS, SANS_B = G.SERIF, G.SERIF_B, G.SERIF_I, G.SANS, G.SANS_B
SYMBOL = {'🌙': 'MOON', '🦉': 'OWL', '🐍': 'SERPENT', '⭐': 'STAR', '🗝️': 'KEY', '🦁': 'LION', '🦡': 'BADGER', '☀️': 'SUN', '🦅': 'EAGLE'}
PIC = {'🦉': 'an owl', '🌙': 'a moon', '⭐': 'a star', '🍎': 'an apple', '🌲': 'a pine tree', '🐸': 'a toad', '🔥': 'a flame', '🗝️': 'a key', '🐟': 'a fish'}


def runes(text):
    return ''.join(D['runes'].get(ch, ch) for ch in text)


def page(c, code, title, how):
    c.setFillColor(INK)
    c.setFont(SERIF_B, 17)
    c.drawString(L, PH - M - 6 * mm, f'{code}  {title}')
    c.setFont(SANS, 8.5)
    c.setFillColor(SEPIA)
    c.drawString(L, PH - M - 11.5 * mm, how)
    c.setStrokeColor(GOLD)
    c.setLineWidth(.6)
    c.line(L, PH - M - 14 * mm, R, PH - M - 14 * mm)
    c.setFont(SANS, 7.5)
    c.setFillColor(G.MUTED)
    c.drawString(L, M - 2 * mm, f'The Hollow Heir · Props Book · {code} · print at 100% (actual size), not “fit to page”')
    c.drawRightString(R, M - 2 * mm, f'by {G.AUTHOR}')
    return PH - M - 19 * mm


def cutbox(c, x, y, w, h, fill=WASH, label=None):
    c.setFillColor(fill)
    c.setStrokeColor(CUT)
    c.setLineWidth(.5)
    c.setDash(3, 2)
    c.rect(x, y, w, h, stroke=1, fill=1)
    c.setDash()
    if label:
        c.setFont(SANS, 6.5)
        c.setFillColor(CUT)
        c.drawString(x, y + h + 1.2 * mm, label)


def text(c, x, y, w, h, paras, pad=3 * mm):
    f = Frame(x + pad, y + pad, w - 2 * pad, h - 2 * pad, 0, 0, 0, 0, showBoundary=0)
    left = f.addFromList(list(paras), c)
    if left:
        raise SystemExit(f'text did not fit: {paras[0].text[:40]}')


S = {
    'small': ParagraphStyle('small', fontName=SANS, fontSize=7.4, leading=9.2, textColor=INK),
    'gift': ParagraphStyle('gift', fontName=SERIF, fontSize=9.6, leading=12.4, textColor=INK, spaceAfter=4),
    'gifth': ParagraphStyle('gifth', fontName=SERIF_B, fontSize=15, leading=18, textColor=INK, alignment=TA_CENTER, spaceAfter=6),
    'kick': ParagraphStyle('kick', fontName=SANS_B, fontSize=7.5, leading=9, textColor=GOLD, alignment=TA_CENTER, spaceAfter=2),
    'hand': ParagraphStyle('hand', fontName=SERIF_I, fontSize=10.5, leading=13.6, textColor=INK, spaceAfter=4),
    'handc': ParagraphStyle('handc', fontName=SERIF_I, fontSize=10.5, leading=13.6, textColor=INK, alignment=TA_CENTER, spaceAfter=4),
    'doc': ParagraphStyle('doc', fontName=SERIF, fontSize=9.2, leading=11.8, textColor=INK, spaceAfter=3),
    'doch': ParagraphStyle('doch', fontName=SERIF_B, fontSize=11, leading=13, textColor=INK, alignment=TA_CENTER, spaceAfter=4),
    'clue': ParagraphStyle('clue', fontName=SERIF_I, fontSize=12, leading=15.5, textColor=INK, alignment=TA_CENTER),
}


def seal(c, x, y, r=9 * mm):
    c.setStrokeColor(FAINT)
    c.setLineWidth(.6)
    c.setDash(1.5, 1.5)
    c.circle(x, y, r)
    c.setDash()
    c.setFont(SANS, 6)
    c.setFillColor(FAINT)
    c.drawCentredString(x, y - 1 * mm, 'clay seal here')


# ---------- T1: secret gift cards ----------
GIFT_ORDER = ['blackwood', 'sinclair', 'fenwick', 'thornbury', 'quill', 'penrose', 'okafor']


def gift_card(c, x, y, w, h, fam, g):
    cutbox(c, x, y, w, h, fill=colors.white, label='cut out, fold on the middle line, seal shut')
    half = w / 2
    c.setStrokeColor(FAINT)
    c.setDash(4, 3)
    c.line(x + half, y + 3 * mm, x + half, y + h - 3 * mm)
    c.setDash()
    # Outside: who it is for.
    c.setFillColor(WASH)
    c.rect(x + 3 * mm, y + 3 * mm, half - 6 * mm, h - 6 * mm, stroke=0, fill=1)
    c.setFillColor(SEPIA)
    c.setFont(SANS_B, 7.5)
    c.drawCentredString(x + half / 2, y + h - 22 * mm, 'FOR THE EYES OF THE')
    c.setFillColor(INK)
    c.setFont(SERIF_B, 20)
    c.drawCentredString(x + half / 2, y + h - 32 * mm, D['families'][fam]['name'].upper())
    c.setFont(SERIF_I, 10)
    c.drawCentredString(x + half / 2, y + h - 40 * mm, 'and nobody else.')
    seal(c, x + half / 2, y + 30 * mm)
    c.setFont(SERIF_I, 8.5)
    c.setFillColor(SEPIA)
    c.drawCentredString(x + half / 2, y + 12 * mm, 'Open it alone. Tell no one.')
    # Inside: the gift.
    paras = [Paragraph('THE THING NOBODY AT HOGWARTS KNOWS', S['kick']), Paragraph(g['name'], S['gifth']),
             Paragraph(f'<b>Always.</b> {g["always"]}', S['gift']),
             Paragraph(f'<b>Once a day.</b> {g["daily"]}', S['gift']),
             Paragraph(f'<b>The catch.</b> {g["drawback"]}', S['gift'])]
    text(c, x + half, y, half, h, paras, pad=5 * mm)


CREATURES = [
    ('Niffler', 'Sniffs out one shiny or hidden thing in the room. Ask the DM what it found.'),
    ('Bowtruckle', 'Picks one small lock: a drawer, a box, a little chest. Not a door.'),
    ('Occamy', 'Shrinks to fit any gap and fetches one small thing from the other side.'),
    ('ESCAPED!', 'Something got out in the night. Hide this card until the DM asks for it.'),
]


def creature_cards(c, x, y, w, h):
    cw, ch = (w - 6 * mm) / 4, h
    for i, (name, what) in enumerate(CREATURES):
        cx = x + i * (cw + 2 * mm)
        cutbox(c, cx, y, cw, ch, fill=colors.white, label='Penrose: creature cards' if i == 0 else None)
        text(c, cx, y, cw, ch, [Paragraph('FROM THE SUITCASE', S['kick']), Paragraph(name, S['doch']), Paragraph(what, S['small'])])


def t1(c):
    gifts = {g['family']: g for g in D['gifts'].values()}
    w, h = IW, 118 * mm
    for p in range(4):
        top = page(c, 'T1', 'Secret gift cards', 'Cut out, fold in half on the dotted line (the gift inside), and seal with a clay seal. Hand them out at the start of session 2.')
        for k in range(2):
            i = p * 2 + k
            y = top - (k + 1) * h - k * 9 * mm
            if i < len(GIFT_ORDER):
                fam = GIFT_ORDER[i]
                gift_card(c, L, y, w, h, fam, gifts[fam])
            elif i == len(GIFT_ORDER):
                creature_cards(c, L, y + h - 52 * mm, w, 52 * mm)
        c.showPage()


# ---------- T2: family keepsakes ----------
KEEPSAKES = [
    ('blackwood', 'A torn page from your grandmother’s diary', [
        ('hand', '…and still the painted man waits. Mother said the Blackwoods owe him a debt, or that he owes us one; she would never say which.'),
        ('hand', 'Whatever you do, child, never let anyone unwrap a covered painting. Some of them are not empty.'),
        ('hand', '— E. B.'),
    ]),
    ('sinclair', 'A letter from your sister', [
        ('hand', 'Dear ____________,'),
        ('hand', 'The castle feels wrong this year. The portraits go quiet when I walk past, and there’s a covered painting on the third floor that nobody will admit putting there.'),
        ('hand', 'Don’t tell Mum and Dad. Just keep an eye out for me when you get here. You’re the only one I’ve told.'),
        ('hand', 'Your sister'),
    ]),
    ('fenwick', 'A card from Fenwick’s Fizzing Follies, Diagon Alley', [
        ('doch', 'FENWICK’S FIZZING FOLLIES'),
        ('small', 'Jokes, japes and things your mother warned you about. Diagon Alley, next to the cauldron shop.'),
        ('hand', 'On the back, in your great-uncle’s writing: “The words wake it. I never wrote them down. The boy with the other half has been watching. Be cleverer than he is.”'),
    ]),
    ('thornbury', 'Bramble’s tag, torn in half', [
        ('doch', 'BRAMBLE'),
        ('hand', 'Hippogriff, grey and silver, five years old. Thornbury Farm, Welsh hills.'),
        ('hand', 'If found, please retur…'),
        ('small', 'Tip: press this onto a flat clay tag, tear the clay edge while it is soft, and hang it on black yarn.'),
    ]),
    ('quill', 'A note from home, and a sketch you don’t remember drawing', [
        ('hand', 'Floss every night, write every week, and don’t let anyone turn you into anything. We are so proud of you. Love, Mum and Dad.'),
        ('hand', 'On the back, in your own pencil: two eyes, drawn over and over, all of them looking at you.'),
    ]),
    ('penrose', 'A programme from the Penrose Theatre, Penzance', [
        ('doch', 'THE PENROSE PLAYERS PRESENT: A HUNDRED FACES'),
        ('doc', 'In memory of Morwenna Penrose, who played every part in this company until the summer she sat for her portrait.'),
        ('hand', 'Pencilled in the margin: “She never changed her face again. The painting was never delivered. Where did it go?”'),
    ]),
    ('okafor', 'A carbon copy of your mum’s Gringotts report', [
        ('doch', 'GRINGOTTS · CURSE-BREAKING REPORT'),
        ('doc', '<b>Item:</b> one portrait, wrapped in grey cloth. <b>Destination:</b> Hogwarts School. <b>Inspector:</b> A. Okafor.'),
        ('doc', '<b>Finding:</b> OCCUPIED. <b>Recommendation:</b> do not ship.'),
        ('hand', 'Stamped across the bottom in red: OVERRULED. SENT.'),
    ]),
]


def keepsake(c, x, y, w, h, fam, title, lines):
    cutbox(c, x, y, w, h, label=f'{D["families"][fam]["name"]}: {title}')
    paras = [Paragraph(t, S[st]) for st, t in lines]
    text(c, x, y, w, h, paras, pad=5 * mm)
    if fam == 'quill':
        for i in range(3):
            ex, ey = x + w / 2 + (i - 1) * 22 * mm, y + 14 * mm
            c.setStrokeColor(INK)
            c.setLineWidth(.7)
            p = c.beginPath()
            p.moveTo(ex - 8 * mm, ey)
            p.curveTo(ex - 3 * mm, ey + 5 * mm, ex + 3 * mm, ey + 5 * mm, ex + 8 * mm, ey)
            p.curveTo(ex + 3 * mm, ey - 5 * mm, ex - 3 * mm, ey - 5 * mm, ex - 8 * mm, ey)
            c.drawPath(p, stroke=1, fill=0)
            c.setFillColor(INK)
            c.circle(ex, ey, 2 * mm, stroke=0, fill=1)


def t2(c):
    w, h = (IW - 6 * mm) / 2, 72 * mm
    for p in range(2):
        top = page(c, 'T2', 'Family keepsakes', 'One small reminder of each family’s secret. Tea-stain, tear the edges, and hand them out with the gift cards.')
        for k in range(6):
            i = p * 6 + k
            if i >= len(KEEPSAKES):
                break
            r, col = divmod(k, 2)
            keepsake(c, L + col * (w + 6 * mm), top - (r + 1) * h - r * 8 * mm, w, h, *KEEPSAKES[i])
        c.showPage()


# ---------- T3: Snitch wings ----------
def wing(c, x, y, s, flip=1):
    p = c.beginPath()
    p.moveTo(x, y)
    p.curveTo(x + flip * 10 * s, y + 16 * s, x + flip * 34 * s, y + 20 * s, x + flip * 46 * s, y + 12 * s)
    p.curveTo(x + flip * 40 * s, y + 8 * s, x + flip * 44 * s, y + 4 * s, x + flip * 38 * s, y + 1 * s)
    p.curveTo(x + flip * 32 * s, y - 2 * s, x + flip * 34 * s, y - 6 * s, x + flip * 26 * s, y - 7 * s)
    p.curveTo(x + flip * 16 * s, y - 8 * s, x + flip * 8 * s, y - 5 * s, x, y)
    c.setFillColor(colors.HexColor('#f7f1de'))
    c.setStrokeColor(SEPIA)
    c.setLineWidth(.8)
    c.drawPath(p, stroke=1, fill=1)
    c.setLineWidth(.4)
    for k in range(1, 5):
        c.line(x + flip * 4 * s, y + 1 * s, x + flip * (10 + k * 8) * s, y + (14 - k * 2.5) * s)
    c.setDash(2, 1.5)
    c.line(x, y, x + flip * 4 * s, y + 1 * s)
    c.setDash()


def t3(c):
    top = page(c, 'T3', 'Golden Snitch wings', 'Cut around each wing. Fold the short tab at the root and glue it into the slit you cut in the clay ball.')
    for row, (s, lab) in enumerate([(1.6, 'The Golden Snitch (for The Old Cup)'), (1.15, 'The small Snitch (Flying Lessons)'), (1.15, 'Spares')]):
        y = top - 30 * mm - row * 62 * mm
        c.setFont(SANS, 7.5)
        c.setFillColor(SEPIA)
        c.drawString(L, y + 34 * mm, lab)
        cx = L + IW / 2
        wing(c, cx - 6 * mm, y, s * mm, -1)
        wing(c, cx + 6 * mm, y, s * mm, 1)
    c.showPage()


# ---------- T4: rune tablets ----------
def t4(c):
    top = page(c, 'T4', 'Rune tablets', 'Lay a tablet on soft clay and press along every rune with a toothpick. Draw the picture in the circle the same way.')
    th = 70 * mm
    for i, key in enumerate(['rune-tablet-1', 'rune-tablet-2', 'rune-tablet-3']):
        item = D['items'][key]
        y = top - (i + 1) * th - i * 10 * mm
        cutbox(c, L, y, IW, th, label=f'{item["name"]} · {item["read"]["heading"]}')
        words = item['read']['words']
        cw = IW / len(words)
        for k, wd in enumerate(words):
            cx = L + cw * k + cw / 2
            c.setStrokeColor(FAINT)
            c.setLineWidth(.6)
            c.circle(cx, y + 45 * mm, 15 * mm)
            c.setFont(SANS, 6.5)
            c.setFillColor(FAINT)
            c.drawCentredString(cx, y + 44 * mm, f'draw {PIC.get(wd["pic"], wd["word"].lower())} here')
            c.setFillColor(INK)
            c.setFont(RUNE, 24)
            c.drawCentredString(cx, y + 14 * mm, runes(wd['word']))
    c.showPage()


# ---------- T5: ring clues ----------
def star(c, x, y, r):
    p = c.beginPath()
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * .42
        (p.moveTo if i == 0 else p.lineTo)(x + rr * math.cos(a), y + rr * math.sin(a))
    p.close()
    c.setFillColor(INK)
    c.drawPath(p, stroke=0, fill=1)


def t5(c):
    top = page(c, 'T5', 'The three ring clues', 'Tea-stain and cut out. Scratch the note with a pin. Roll the star chart and slide it into the Snitch. Fold the feathered card.')
    it = D['items']
    # Scratched note
    y = top - 45 * mm
    cutbox(c, L, y, 120 * mm, 40 * mm, label='Scratched note (first ring): Trophy Room')
    text(c, L, y, 120 * mm, 40 * mm, [Paragraph(it['ring-clue-serpent']['note'], S['clue'])], pad=8 * mm)
    # Star chart
    y2 = y - 100 * mm
    cutbox(c, L, y2, 120 * mm, 90 * mm, label='Star chart (second ring): Astronomy Tower, inside the Snitch')
    import random
    rnd = random.Random(7)
    for _ in range(26):
        star(c, L + rnd.uniform(8, 112) * mm, y2 + rnd.uniform(36, 84) * mm, rnd.uniform(.8, 2.2) * mm)
    c.setStrokeColor(FAINT)
    c.setLineWidth(.4)
    c.circle(L + 60 * mm, y2 + 60 * mm, 26 * mm)
    c.setFillColor(INK)
    c.circle(L + 92 * mm, y2 + 74 * mm, 7 * mm, stroke=0, fill=1)
    c.setFillColor(WASH)
    c.circle(L + 95 * mm, y2 + 76 * mm, 6 * mm, stroke=0, fill=1)
    text(c, L, y2, 120 * mm, 34 * mm, [Paragraph(it['ring-clue-moon']['note'], S['clue'])], pad=6 * mm)
    # Feathered card (fold)
    y3 = y2 - 72 * mm
    cutbox(c, L, y3, 150 * mm, 60 * mm, label='Feathered card (last ring): Owlery. Fold in half, glue a paper feather on the front')
    c.setStrokeColor(FAINT)
    c.setDash(4, 3)
    c.line(L + 75 * mm, y3 + 3 * mm, L + 75 * mm, y3 + 57 * mm)
    c.setDash()
    c.setFont(SANS, 6.5)
    c.setFillColor(FAINT)
    c.drawCentredString(L + 37.5 * mm, y3 + 30 * mm, 'front: glue a feather here')
    text(c, L + 75 * mm, y3, 75 * mm, 60 * mm, [Paragraph(it['ring-clue-owl']['note'], S['clue'])], pad=7 * mm)
    c.showPage()


# ---------- T6: the Turning Lock ----------
def disc(c, cx, cy, r, inner, words, label):
    c.setFillColor(colors.white)
    c.setStrokeColor(CUT)
    c.setDash(3, 2)
    c.circle(cx, cy, r, stroke=1, fill=1)
    c.setDash()
    c.setStrokeColor(SEPIA)
    c.setLineWidth(.8)
    if inner:
        c.circle(cx, cy, inner, stroke=1, fill=0)
    n = len(words)
    for k in range(n):
        a = math.pi / 2 + (k + .5) * 2 * math.pi / n
        r0 = inner or 6 * mm
        c.setLineWidth(.5)
        c.line(cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + (r - 2 * mm) * math.cos(a), cy + (r - 2 * mm) * math.sin(a))
    rm = ((inner or 0) + r) / 2 if inner else r * .68
    for k, w in enumerate(words):
        a = math.pi / 2 - k * 2 * math.pi / n  # clockwise from the top
        c.saveState()
        c.translate(cx + rm * math.cos(a), cy + rm * math.sin(a))
        c.rotate(math.degrees(a) - 90)
        c.setFillColor(INK)
        c.setFont(SERIF_B, 10 if inner else 8)
        c.drawCentredString(0, -1.2 * mm, SYMBOL.get(w, w))
        c.restoreState()
    c.setFillColor(INK)
    c.circle(cx, cy, 1.4 * mm, stroke=0, fill=1)
    c.setFont(SANS, 7)
    c.setFillColor(SEPIA)
    c.drawCentredString(cx, cy - r - 4 * mm, label)


def t6(c):
    rings = D['lock']['rings']
    cx = L + IW / 2
    top = page(c, 'T6', 'The Turning Lock (1 of 3): the base', 'Glue every part onto card, then cut out. Stack: base, ring 1, ring 2, ring 3. Push a pencil through the centre dots. Only the rings turn.')
    cy, rb = top - 100 * mm, 86 * mm
    c.setFillColor(WASH)
    c.setStrokeColor(CUT)
    c.setDash(3, 2)
    c.circle(cx, cy, rb, stroke=1, fill=1)
    c.setDash()
    c.setFillColor(GOLD)
    p = c.beginPath()
    p.moveTo(cx, cy + rb - 7 * mm)
    p.lineTo(cx - 6 * mm, cy + rb - 1.5 * mm)
    p.lineTo(cx + 6 * mm, cy + rb - 1.5 * mm)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.setFillColor(INK)
    c.setFont(SERIF_B, 14)
    c.drawCentredString(cx, cy - 12 * mm, 'THE TURNING LOCK')
    c.circle(cx, cy, 1.4 * mm, stroke=0, fill=1)
    c.setFont(SANS, 7.5)
    c.setFillColor(SEPIA)
    c.drawCentredString(cx, cy - rb - 6 * mm, 'The base stays still. The arrow points down at the three symbols that open the lock.')
    c.showPage()
    top = page(c, 'T6', 'The Turning Lock (2 of 3): ring 1', 'Ring 1 sits on the base. Its symbols go round the outside edge.')
    disc(c, cx, top - 100 * mm, 80 * mm, 60 * mm, rings[0], 'Ring 1 (outer)')
    c.showPage()
    top = page(c, 'T6', 'The Turning Lock (3 of 3): rings 2 and 3', 'Ring 2 sits on ring 1, ring 3 on top. Turn them until the right three symbols line up under the arrow.')
    disc(c, cx, top - 68 * mm, 60 * mm, 40 * mm, rings[1], 'Ring 2 (middle)')
    disc(c, cx, top - 185 * mm, 40 * mm, 0, rings[2], 'Ring 3 (inner)')
    c.showPage()


# ---------- T7: Vale's diary and the map edge ----------
def t7(c):
    top = page(c, 'T7', 'Vale’s diary and the torn map edge', 'Tea-stain these dark and tear the edges. Give each diary page as it is found in the app.')
    pages = D['items']['diary-page']['read']['pages']
    where = ['Restricted Section (Day 3)', 'Black Lake (Day 4)', 'Shrieking Shack (Day 6)']
    h = 50 * mm
    for i, txt in enumerate(pages):
        y = top - (i + 1) * h - i * 9 * mm
        cutbox(c, L, y, IW, h, label=f'Diary page {i + 1}: {where[i]}')
        size = 26 if len(txt) < 24 else 21
        c.setFillColor(INK)
        c.setFont(RUNE, size)
        c.drawCentredString(L + IW / 2, y + h / 2 - 3 * mm, runes(txt))
    edge = D['items']['map-half']['read']['pages'][0]
    y = top - 3 * h - 3 * 9 * mm - 30 * mm
    words = edge.split()
    lines = [' '.join(words[:4]), ' '.join(words[4:])]
    cutbox(c, L, y, IW, 26 * mm, label='The torn map edge: glue along the torn edge of the Fenwick half')
    c.setFillColor(INK)
    c.setFont(RUNE, 15)
    c.drawCentredString(L + IW / 2, y + 15 * mm, runes(lines[0]))
    c.drawCentredString(L + IW / 2, y + 5 * mm, runes(lines[1]))
    c.showPage()


# ---------- T8: the Seven Bottles ----------
def t8(c):
    b = D['bottles']
    top = page(c, 'T8', 'The Seven Bottles', 'Wrap each label round its clay bottle and glue. Stand them in a row, 1 to 7, left to right, behind the riddle card.')
    lw, lh = 62 * mm, 20 * mm
    for i, bt in enumerate(b['bottles']):
        r, col = divmod(i, 2)
        x = L + col * (lw + 12 * mm)
        y = top - (r + 1) * lh - r * 7 * mm
        cutbox(c, x, y, lw, lh, label=f'Bottle {i + 1}: make it {bt["shape"]}')
        c.setFillColor(INK)
        c.setFont(SERIF_B, 14)
        c.drawCentredString(x + lw / 2, y + 7 * mm, f'{i + 1} · {bt["colour"].upper()}')
    ry = top - 4 * (lh + 7 * mm) - 92 * mm
    cutbox(c, L, ry, IW, 88 * mm, label='The riddle card')
    paras = [Paragraph('THE SEVEN BOTTLES', S['kick']), Paragraph(b['intro'], S['handc'])]
    paras += [Paragraph(f'{k + 1}. {t}', S['hand']) for k, t in enumerate(b['clues'])]
    text(c, L, ry, IW, 88 * mm, paras, pad=7 * mm)
    c.showPage()


# ---------- T9 / T10: the Mirror Maze ----------
MAZE = json.load(open(os.path.join(HERE, 'mirror-maze.json'), encoding='utf-8'))
HOUSES = MAZE['houses']
HOUSE_COLOUR = {'Gryffindor': '#8e1f1f', 'Hufflepuff': '#a07a12', 'Ravenclaw': '#1f3f8e', 'Slytherin': '#1f6b3a'}
# Each house's map was drawn long ago by one student who escaped the mirror. Their own words.
MAPMAKERS = {
    'Gryffindor': ('Aldous Penhallow', 'I came through the glass and ran. This is all I remember. The others drew the rest.'),
    'Hufflepuff': ('Merryn Holt', 'I walked it twice, slowly. My part is right. Trust the others for theirs.'),
    'Ravenclaw': ('Isolde Varga', 'I measured what I could in the dark. Where my lines stop, I could not see.'),
    'Slytherin': ('Silas Crane', 'I marked only what was useful to me. Find the others where the four roads meet. We did.'),
}
MZ = 165 * mm                     # maze width and height
MX = (PW - MZ) / 2                # same place on every page, so the stack lines up
MY = 62 * mm


def mxy(r, c):
    """Top-left corner of cell (r, c) in page coordinates."""
    cs = MZ / MAZE['n']
    return MX + c * cs, MY + MZ - r * cs


def draw_wall(c, w, width=2.2):
    kind, r, col = w[0], int(w[1]), int(w[2])
    cs = MZ / MAZE['n']
    c.setLineWidth(width)
    c.setLineCap(1)
    if kind == 'h':   # below cell (r, col)
        x, y = mxy(r + 1, col)
        c.line(x, y, x + cs, y)
    else:             # right of cell (r, col)
        x, y = mxy(r, col + 1)
        c.line(x, y, x, y - cs)


def cell_centre(r, col):
    cs = MZ / MAZE['n']
    x, y = mxy(r, col)
    return x + cs / 2, y - cs / 2


def registration(c):
    """Crosshairs in the same four places on every map: line them up before you light the stack."""
    c.setStrokeColor(INK)
    c.setLineWidth(.6)
    for x, y in ((MX - 8 * mm, MY - 8 * mm), (MX + MZ + 8 * mm, MY - 8 * mm), (MX - 8 * mm, MY + MZ + 8 * mm), (MX + MZ + 8 * mm, MY + MZ + 8 * mm)):
        c.circle(x, y, 2.6 * mm)
        c.line(x - 4 * mm, y, x + 4 * mm, y)
        c.line(x, y - 4 * mm, x, y + 4 * mm)


def wedge(c, x, y, rad, k):
    """Quarter k of a circle: whole only when all four maps are stacked."""
    p = c.beginPath()
    p.moveTo(x, y)
    p.arcTo(x - rad, y - rad, x + rad, y + rad, startAng=90 - (k + 1) * 90, extent=90)
    p.close()
    c.setFillColor(INK)
    c.drawPath(p, stroke=0, fill=1)


def quadrant_clip(c, cx, cy, k, big=400 * mm):
    """Clip to one quarter of the page around (cx, cy): 0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left."""
    x = cx - big if k in (0, 3) else cx
    y = cy if k in (0, 1) else cy - big
    p = c.beginPath()
    p.rect(x, y, big, big)
    c.clipPath(p, stroke=0, fill=0)


def hidden_picture(c, k):
    """The secret only the stack shows: a great eye round the centre, and HE SEES YOU beneath the maze.
    Each map carries one quarter of every line, so alone it is just a few odd curves."""
    cx, cy = cell_centre(7, 7)
    grey = colors.HexColor('#8d8d8d')
    c.saveState()
    quadrant_clip(c, cx, cy, k)
    c.setStrokeColor(grey)
    c.setLineWidth(3.2)
    w, h = 74 * mm, 40 * mm
    for sgn in (1, -1):  # upper and lower lids
        p = c.beginPath()
        p.moveTo(cx - w, cy)
        p.curveTo(cx - w * .45, cy + sgn * h, cx + w * .45, cy + sgn * h, cx + w, cy)
        c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(2.4)
    for t in range(-4, 5):  # lashes on the upper lid
        x = cx + t * w * .19
        frac = (x - cx) / w
        y = cy + h * .75 * (1 - frac * frac)
        c.line(x, y, x + t * 1.2 * mm, y + 7 * mm)
    c.setLineWidth(3.2)
    c.circle(cx, cy, 25 * mm)
    c.setLineWidth(5)
    c.circle(cx, cy, 9 * mm)
    c.restoreState()
    # The words, each letter split into quarters the same way.
    msg, size = 'HE SEES YOU', 34
    total = c.stringWidth(msg, SERIF_B, size)
    x = PW / 2 - total / 2
    y = MY - 27 * mm
    for ch in msg:
        cw = c.stringWidth(ch, SERIF_B, size)
        if ch != ' ':
            c.saveState()
            quadrant_clip(c, x + cw / 2, y + size * .35, k, big=30 * mm)
            c.setFillColor(grey)
            c.setFont(SERIF_B, size)
            c.drawString(x, y, ch)
            c.restoreState()
        x += cw


def door_label(c, cell, side, text, colour=INK):
    x, y = cell_centre(*cell)
    cs = MZ / MAZE['n']
    off = cs / 2 + 4.5 * mm
    dx, dy = {'N': (0, off), 'S': (0, -off - 2 * mm), 'W': (-off - 3 * mm, -1 * mm), 'E': (off + 3 * mm, -1 * mm)}[side]
    c.setFillColor(colour)
    c.setFont(SANS_B, 7.5)
    c.drawCentredString(x + dx, y + dy, text)


def star_mark(c, x, y, r):
    p = c.beginPath()
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * .42
        (p.moveTo if i == 0 else p.lineTo)(x + rr * math.cos(a), y + rr * math.sin(a))
    p.close()
    c.setFillColor(INK)
    c.drawPath(p, stroke=0, fill=1)


def centre_room(c):
    rows = [rc[0] for rc in MAZE['centre']]
    cols = [rc[1] for rc in MAZE['centre']]
    x0, y0 = mxy(min(rows), min(cols))
    x1, y1 = mxy(max(rows) + 1, max(cols) + 1)
    c.setStrokeColor(INK)
    c.setLineWidth(.6)
    c.setDash(2, 2)
    c.rect(x0 + 1.5 * mm, y1 + 1.5 * mm, x1 - x0 - 3 * mm, y0 - y1 - 3 * mm)
    c.setDash()
    c.setFont(SERIF_I, 8)
    c.setFillColor(INK)
    c.drawCentredString((x0 + x1) / 2, (y0 + y1) / 2 - 1 * mm, 'the centre')


def t9(c):
    for i, house in enumerate(HOUSES):
        maker, words = MAPMAKERS[house]
        c.setFillColor(INK)
        c.setFont(SERIF_B, 15)
        c.drawCentredString(PW / 2, PH - M - 7 * mm, 'The way through the dark')
        # Each signature sits on its own line, so stacked maps show all four neatly, one under another.
        y = PH - M - 13 * mm - i * 4.6 * mm
        c.setFillColor(colors.HexColor(HOUSE_COLOUR[house]))
        c.setFont(SERIF_I, 8.6)
        c.drawCentredString(PW / 2, y, f'“{words}”  {maker}, {house}, 1726')
        registration(c)
        hidden_picture(c, i)
        c.setStrokeColor(INK)
        for w in MAZE['sheets'][i]:
            draw_wall(c, w)
        centre_room(c)
        for key, slices in MAZE['circles'].items():
            if i in slices:
                r, col = map(int, key.split(','))
                wedge(c, *cell_centre(r, col), 3.2 * mm, i)
        sx, sy = cell_centre(*MAZE['starts'][i])
        star_mark(c, sx, sy, 3.6 * mm)
        c.setFont(SANS_B, 6.5)
        c.setFillColor(INK)
        c.drawCentredString(sx, sy - 5.6 * mm, 'YOU')
        door_label(c, MAZE['falseDoors'][i], MAZE['falseSides'][i], 'EXIT')
        c.setFont(SANS, 7)
        c.setFillColor(G.MUTED)
        c.drawString(L, M - 2 * mm, f'The Hollow Heir · Props Book · T9 Mirror Maze, the {house} map · print at 100%')
        c.showPage()


def t10(c):
    c.setFillColor(INK)
    c.setFont(SERIF_B, 15)
    c.drawCentredString(PW / 2, PH - M - 8 * mm, 'T10  The Mirror Maze: GM key (do not hand out)')
    c.setFont(SANS, 8)
    c.setFillColor(SEPIA)
    c.drawCentredString(PW / 2, PH - M - 14 * mm, 'Every real wall. Gold: the only way out. G H R S: where each house starts. X: the bricked-up EXITs.')
    c.setStrokeColor(colors.HexColor('#cfc3e6'))
    c.setLineWidth(1.6)
    for route in MAZE['routes']:
        pts = [cell_centre(*rc) for rc in route] + [cell_centre(7, 7)]
        for a, b in zip(pts, pts[1:]):
            c.line(*a, *b)
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    pts = [cell_centre(7, 7)] + [cell_centre(*rc) for rc in MAZE['truePath']]
    for a, b in zip(pts, pts[1:]):
        c.line(*a, *b)
    c.setStrokeColor(INK)
    for w in MAZE['walls']:
        draw_wall(c, w, 2)
    centre_room(c)
    for i, s0 in enumerate(MAZE['starts']):
        x, y = cell_centre(*s0)
        c.setStrokeColor(colors.HexColor(HOUSE_COLOUR[HOUSES[i]]))
        c.setFillColor(colors.white)
        c.circle(x, y, 3.4 * mm, stroke=1, fill=1)
        c.setFillColor(colors.HexColor(HOUSE_COLOUR[HOUSES[i]]))
        c.setFont(SERIF_B, 8)
        c.drawCentredString(x, y - 1.3 * mm, HOUSES[i][0])
    for d, sd in zip(MAZE['falseDoors'], MAZE['falseSides']):
        door_label(c, d, sd, 'X', colors.HexColor('#a8392a'))
    door_label(c, MAZE['exit'], MAZE['exitSide'], 'OUT', GOLD)
    c.setFont(SANS, 8)
    c.setFillColor(INK)
    lines = [
        'The phones enforce the walls, move the watcher and show the riddle. This sheet is for you to follow along.',
        'Each house map is exact from its YOU to the centre. Beyond it, each shows only some walls, and its own EXIT is bricked up.',
        'Stacked against the lit TV: the walls add up, every EXIT closes, the whole circles (a quarter from each map) mark the way out,',
        'and a great eye appears round the centre, with HE SEES YOU beneath the maze.',
    ]
    for k, t in enumerate(lines):
        c.drawString(MX, MY - 16 * mm - k * 4.2 * mm, t)
    c.setFont(SANS, 7)
    c.setFillColor(G.MUTED)
    c.drawString(L, M - 2 * mm, 'The Hollow Heir · Props Book · T10 · GM only')
    c.showPage()


# ---------- T11: relic cards ----------
def relic_card(c, x, y, w, h, r):
    mythic = r['rarity'] == 'Mythic'
    cutbox(c, x, y, w, h, fill=colors.white)
    c.setStrokeColor(GOLD if mythic else colors.HexColor('#5b3f8c'))
    c.setLineWidth(1.4 if mythic else .9)
    c.roundRect(x + 2.5 * mm, y + 2.5 * mm, w - 5 * mm, h - 5 * mm, 2.5 * mm)
    if mythic:
        c.setLineWidth(.4)
        c.roundRect(x + 4 * mm, y + 4 * mm, w - 8 * mm, h - 8 * mm, 2 * mm)
    paras = [Paragraph(f'{r["rarity"].upper()} RELIC', S['kick']), Paragraph(r['name'], S['gifth']),
             Paragraph(f'<i>{r["lore"]}</i>', S['gift'])]
    if r.get('always'):
        paras.append(Paragraph(f'<b>Always.</b> {r["always"]}', S['gift']))
    paras.append(Paragraph(f'<b>When used.</b> {r["daily"]}', S['gift']))
    paras.append(Paragraph(f'<b>The cost.</b> {r["drawback"]}', S['gift']))
    text(c, x + 2 * mm, y + 2 * mm, w - 4 * mm, h - 4 * mm, paras, pad=5 * mm)


def t11(c):
    rel = list(D['relics'].values())
    w, h = (IW - 6 * mm) / 2, 118 * mm
    for p in range(0, len(rel), 4):
        top = page(c, 'T11', f'Relic cards ({p // 4 + 1} of {(len(rel) + 3) // 4})', 'Hand over the card with the relic, in the story. Print on card if you can.')
        for k, r in enumerate(rel[p:p + 4]):
            row, col = divmod(k, 2)
            relic_card(c, L + col * (w + 6 * mm), top - (row + 1) * h - row * 7 * mm, w, h, r)
        c.showPage()


def templates(path):
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle('The Hollow Heir: Props Book templates')
    for f in (t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11):
        f(c)
    c.save()


if __name__ == '__main__':
    out = os.path.join(HERE, 'Props-Book.pdf')
    guide, tmpl = out + '.guide.tmp', out + '.tmpl.tmp'
    B.book(guide, 'The Props Book', 'The Hollow Heir · Props Book', 'Things to make with paper, clay and yarn',
           'Every prop matches a moment the game already has. Templates to print and cut out are at the back.', [props])
    templates(tmpl)
    w = PdfWriter()
    for f in (guide, tmpl):
        for p in PdfReader(f).pages:
            w.add_page(p)
    w.add_metadata({'/Title': 'The Hollow Heir: The Props Book', '/Author': G.AUTHOR})
    with open(out, 'wb') as fh:
        w.write(fh)
    os.remove(guide)
    os.remove(tmpl)
    print('wrote', out)
