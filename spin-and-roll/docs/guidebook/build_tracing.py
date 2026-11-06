"""The Mirror Maze, tracing version: one page per house to lay under aged paper and trace in pen.
Same size and position as the printed maps (Props Book T9), so traced and printed maps stack the same.
Each house's map is written in its mapmaker's own hand, with their notes and a doodle in the margins.
Run: python3 build_tracing.py"""
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_props as BP  # noqa: E402  (fonts, the maze and its geometry)
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402
from reportlab.pdfbase import pdfmetrics  # noqa: E402
from reportlab.pdfbase.ttfonts import TTFont  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402
from reportlab.platypus import Frame, Paragraph  # noqa: E402

PW, PH = A4
MAZE, MX, MY, MZ = BP.MAZE, BP.MX, BP.MY, BP.MZ
INK = colors.HexColor('#1b1712')
GUIDE = colors.HexColor('#8d8d8d')
NOTE = colors.HexColor('#3a2a1a')

# Each mapmaker writes in their own hand.
HANDS = {'Gryffindor': 'rock-salt', 'Hufflepuff': 'patrick-hand', 'Ravenclaw': 'cedarville-cursive', 'Slytherin': 'homemade-apple'}
for f in set(HANDS.values()):
    pdfmetrics.registerFont(TTFont(f, os.path.join(HERE, 'fonts', f'{f}.ttf')))
SIZE = {'rock-salt': 8.6, 'patrick-hand': 12.5, 'cedarville-cursive': 12.5, 'homemade-apple': 9.6}

# Their notes in the margins: a little of who they were, and a hint or two about what is in the dark.
NOTES = {
    'Gryffindor': ['came in HERE and ran!!', 'do not stop moving. it follows the sound of you.'],
    'Hufflepuff': ['walked it twice. counted every step.', 'the round room in the middle is safe. it will not come in.'],
    'Ravenclaw': ['where my lines stop, I could not see.', 'four of us, four different sets of walls. why?'],
    'Slytherin': ['only what was useful.', 'the stone in the middle listens.'],
}
# Each note goes in its own corner of the margins, so stacked maps don't pile their writing on top of each other.
CORNER = {'Gryffindor': 'tl', 'Hufflepuff': 'tr', 'Ravenclaw': 'bl', 'Slytherin': 'br'}


def wobbly_line(c, x1, y1, x2, y2, rnd, amount=0.45 * mm):
    """A hand-drawn line: the ends exactly where they must be, the middle a little unsteady."""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    ln = math.hypot(dx, dy) or 1
    nx, ny = -dy / ln, dx / ln
    a, b = rnd.uniform(-amount, amount), rnd.uniform(-amount, amount)
    p = c.beginPath()
    p.moveTo(x1, y1)
    p.curveTo(x1 + dx / 3 + nx * a, y1 + dy / 3 + ny * a, x1 + 2 * dx / 3 + nx * b, y1 + 2 * dy / 3 + ny * b, x2, y2)
    c.drawPath(p, stroke=1, fill=0)
    del mx, my


def walls(c, sheet, rnd):
    cs = MZ / MAZE['n']
    c.setStrokeColor(INK)
    c.setLineWidth(2.8)
    c.setLineCap(1)
    for kind, r, col in sheet:
        r, col = int(r), int(col)
        if kind == 'h':
            x, y = BP.mxy(r + 1, col)
            wobbly_line(c, x, y, x + cs, y, rnd)
        else:
            x, y = BP.mxy(r, col + 1)
            wobbly_line(c, x, y, x, y - cs, rnd)


def quarters(c, i):
    """Circle quarters: solid, with a dot where the point must sit (the centre of the square)."""
    for key, slices in MAZE['circles'].items():
        if i in slices:
            r, col = map(int, key.split(','))
            x, y = BP.cell_centre(r, col)
            BP.wedge(c, x, y, 3.2 * mm, i)
            c.setFillColor(colors.white)
            c.circle(x, y, .45 * mm, stroke=0, fill=1)


def hidden_guides(c, k):
    """The secret picture as a faint dashed guide: trace it LIGHTLY in pencil or grey pen."""
    cx, cy = BP.cell_centre(7, 7)
    c.saveState()
    BP.quadrant_clip(c, cx, cy, k)
    c.setStrokeColor(GUIDE)
    c.setDash(2.2, 1.6)
    c.setLineWidth(1)
    w, h = 74 * mm, 40 * mm
    for sgn in (1, -1):
        p = c.beginPath()
        p.moveTo(cx - w, cy)
        p.curveTo(cx - w * .45, cy + sgn * h, cx + w * .45, cy + sgn * h, cx + w, cy)
        c.drawPath(p, stroke=1, fill=0)
    for t in range(-4, 5):
        x = cx + t * w * .19
        frac = (x - cx) / w
        y = cy + h * .75 * (1 - frac * frac)
        c.line(x, y, x + t * 1.2 * mm, y + 7 * mm)
    c.circle(cx, cy, 25 * mm)
    c.circle(cx, cy, 9 * mm)
    c.restoreState()
    # The words, as hollow outlines split into quarters.
    msg, size = 'HE SEES YOU', 34
    total = c.stringWidth(msg, BP.SERIF_B, size)
    x = PW / 2 - total / 2
    y = MY - 27 * mm
    for ch in msg:
        cw = c.stringWidth(ch, BP.SERIF_B, size)
        if ch != ' ':
            c.saveState()
            BP.quadrant_clip(c, x + cw / 2, y + size * .35, k, big=30 * mm)
            t = c.beginText(x, y)
            t.setFont(BP.SERIF_B, size)
            t.setTextRenderMode(1)  # outline only
            c.setStrokeColor(GUIDE)
            c.setLineWidth(.6)
            t.textOut(ch)
            c.drawText(t)
            c.restoreState()
        x += cw


def doodle(c, house, x, y):
    c.saveState()
    c.setStrokeColor(NOTE)
    c.setLineWidth(.9)
    c.setLineCap(1)
    if house == 'Gryffindor':  # a scribbled lion: a face in a spiky mane
        for k in range(14):
            a = k * 2 * math.pi / 14
            c.line(x + 6 * mm * math.cos(a), y + 6 * mm * math.sin(a), x + 8.5 * mm * math.cos(a + .2), y + 8.5 * mm * math.sin(a + .2))
        c.circle(x, y, 6 * mm)
        c.circle(x - 2 * mm, y + 1.2 * mm, .5 * mm, fill=1)
        c.circle(x + 2 * mm, y + 1.2 * mm, .5 * mm, fill=1)
        c.line(x - 1.2 * mm, y - 2 * mm, x + 1.2 * mm, y - 2 * mm)
    elif house == 'Hufflepuff':  # a careful little badger
        c.ellipse(x - 7 * mm, y - 4.5 * mm, x + 7 * mm, y + 4.5 * mm)
        c.line(x - 1 * mm, y + 4.4 * mm, x - 1 * mm, y - 4.4 * mm)
        c.line(x + 1 * mm, y + 4.4 * mm, x + 1 * mm, y - 4.4 * mm)
        c.circle(x - 3.6 * mm, y + .6 * mm, .5 * mm, fill=1)
        c.circle(x + 3.6 * mm, y + .6 * mm, .5 * mm, fill=1)
        c.circle(x, y - 2.6 * mm, .7 * mm, fill=1)
    elif house == 'Ravenclaw':  # a neat compass rose
        for a in range(4):
            ang = a * math.pi / 2
            p = c.beginPath()
            p.moveTo(x, y)
            p.lineTo(x + 2 * mm * math.cos(ang + math.pi / 4), y + 2 * mm * math.sin(ang + math.pi / 4))
            p.lineTo(x + 8 * mm * math.cos(ang), y + 8 * mm * math.sin(ang))
            p.close()
            c.drawPath(p, stroke=1, fill=0)
        c.circle(x, y, 5 * mm)
        c.setFont(HANDS['Ravenclaw'], 9)
        c.setFillColor(NOTE)
        c.drawCentredString(x, y + 9.5 * mm, 'N')
    else:  # a thin snake
        p = c.beginPath()
        p.moveTo(x - 9 * mm, y)
        for k in range(1, 19):
            t = k / 18
            p.lineTo(x - 9 * mm + 18 * mm * t, y + 2.4 * mm * math.sin(t * 3 * math.pi))
        c.drawPath(p, stroke=1, fill=0)
        c.circle(x + 9.6 * mm, y + .2 * mm, 1.1 * mm, fill=1)
    c.restoreState()


NOTE_SIZE = {'rock-salt': 7.2, 'patrick-hand': 10.5, 'cedarville-cursive': 9.8, 'homemade-apple': 7.8}


def notes(c, house):
    font = HANDS[house]
    sz = NOTE_SIZE[font]
    st = ParagraphStyle(house, fontName=font, fontSize=sz, leading=sz * 1.35, textColor=NOTE)
    corner = CORNER[house]
    w = 70 * mm
    if corner[0] == 't':
        y0, h = MY + MZ + 10.5 * mm, 17 * mm
    else:
        y0, h = MY - 30 * mm, 17 * mm
    x0 = 18 * mm if corner[1] == 'l' else PW - 18 * mm - w
    if corner[0] == 'b':  # keep clear of HE SEES YOU in the middle
        w = 56 * mm
        x0 = 14 * mm if corner[1] == 'l' else PW - 14 * mm - w
    f = Frame(x0, y0, w, h, 0, 0, 0, 0)
    left = [Paragraph(t, st) for t in NOTES[house]]
    f.addFromList(left, c)  # takes what fits out of the list
    if left:
        raise SystemExit(f'{house} notes do not fit')
    dx = x0 + w + 9 * mm if corner[1] == 'l' else x0 - 9 * mm
    if corner[0] == 'b':
        dx = x0 + 10 * mm if corner[1] == 'l' else x0 + w - 10 * mm
        doodle(c, house, dx, MY - 40 * mm)
    else:
        doodle(c, house, dx, y0 + h / 2)


def ravenclaw_ticks(c):
    """Isolde measured everything: little tick marks along two edges of the maze."""
    cs = MZ / MAZE['n']
    c.setStrokeColor(NOTE)
    c.setLineWidth(.5)
    for k in range(MAZE['n'] + 1):
        c.line(MX + k * cs, MY + MZ + 1.2 * mm, MX + k * cs, MY + MZ + (3.2 if k % 5 == 0 else 2.2) * mm)
        c.line(MX - 1.2 * mm, MY + k * cs, MX - (3.2 if k % 5 == 0 else 2.2) * mm, MY + k * cs)


def house_page(c, i, house):
    rnd = random.Random(1000 + i)
    font = HANDS[house]
    maker, words = BP.MAPMAKERS[house]
    BP.registration(c)
    hidden_guides(c, i)
    walls(c, MAZE['sheets'][i], rnd)
    quarters(c, i)
    BP.centre_room(c)
    # The title and the signature, in the mapmaker's hand. The signature sits on its own line so the stack lists all four.
    c.setFillColor(INK)
    c.setFont(font, SIZE[font] + 5)
    c.drawCentredString(PW / 2, PH - BP.M - 8 * mm, 'The way through the dark')
    c.setFillColor(colors.HexColor(BP.HOUSE_COLOUR[house]))
    sig = f'“{words}”  {maker}, {house}, 1726'
    size = SIZE[font] - 1
    while c.stringWidth(sig, font, size) > BP.IW - 4 * mm:  # some hands are wider than others
        size -= .2
    c.setFont(font, size)
    c.drawCentredString(PW / 2, PH - BP.M - 14 * mm - i * 5.4 * mm, sig)
    sx, sy = BP.cell_centre(*MAZE['starts'][i])
    BP.star_mark(c, sx, sy, 3.6 * mm)
    c.setFont(font, SIZE[font] - 3)
    c.setFillColor(INK)
    c.drawCentredString(sx, sy - 6 * mm, 'you')
    d, side = MAZE['falseDoors'][i], MAZE['falseSides'][i]
    x, y = BP.cell_centre(*d)
    cs = MZ / MAZE['n']
    off = cs / 2 + 5 * mm
    dx, dy = {'N': (0, off), 'S': (0, -off - 2 * mm), 'W': (-off - 4 * mm, -1 * mm), 'E': (off + 4 * mm, -1 * mm)}[side]
    c.setFont(font, SIZE[font])
    c.drawCentredString(x + dx, y + dy, 'EXIT')
    notes(c, house)
    if house == 'Ravenclaw':
        ravenclaw_ticks(c)
    c.setFont(BP.SANS, 7)
    c.setFillColor(BP.G.MUTED)
    c.drawString(BP.L, BP.M - 2 * mm, f'Mirror Maze tracing master: the {house} map · print at 100% · trace in black pen; dashed grey lines lightly in pencil')
    c.showPage()


def instructions(c):
    st = ParagraphStyle('i', fontName=BP.SERIF, fontSize=10.5, leading=15, textColor=INK, spaceAfter=7)
    h = ParagraphStyle('h', fontName=BP.SERIF_B, fontSize=20, leading=24, textColor=INK, spaceAfter=10)
    lst = [
        Paragraph('Tracing the Mirror Maze', h),
        Paragraph('Four masters, one for each house. Print them at <b>100% (actual size)</b> on plain paper. They are the same size and in the same place on the page as the printed maps, so a traced map and a printed one stack together.', st),
        Paragraph('<b>1. Age the paper first.</b> A light, even wash of cold tea or coffee, darker at the edges than the middle. Dry it flat under heavy books. Keep the middle pale: four stained sheets stack up.', st),
        Paragraph('<b>2. Line it up.</b> Tape a master to a bright window (or the TV showing a white screen), lay the aged sheet on top and tape it down. Trace the <b>four crosshairs</b> first, so every map has the same frame.', st),
        Paragraph('<b>3. Black pen</b> for everything solid: the walls, the star, the EXIT, the title, the signature, the notes and the doodle. Use the same pen for all four maps. The lines on the master wobble a little on purpose: a hurried student drew them in the dark.', st),
        Paragraph('<b>4. The quarter circles:</b> fill each one in solid. The white dot shows where its point must sit, right in the middle of the square. These are what make the way out appear, so take care here.', st),
        Paragraph('<b>5. The dashed grey lines</b> are the secret picture (the eye, and the hollow letters under the maze). Trace them <b>lightly</b> in pencil or a grey pen, and fill the letters in faintly. They should be easy to miss on one map, and obvious when all four are stacked.', st),
        Paragraph('<b>6. Write the notes in your own version of their hand.</b> Each mapmaker writes differently: Aldous scrawls (Gryffindor), Merryn prints neatly (Hufflepuff), Isolde writes in a quick, joined-up hand and measures everything (Ravenclaw), Silas writes in a narrow, careful script and says as little as possible (Slytherin). The notes sit in different corners, so they don’t pile up when stacked.', st),
        Paragraph('<b>7. Check the stack.</b> All four together, crosshairs lined up, against a white screen: the whole circles should make a clear path from the centre to the edge, the eye should look back at you, and the words should read HE SEES YOU.', st),
        Paragraph('About 30 to 45 minutes a map. Put the masters away afterwards: the players must never see them.', st),
    ]
    f = Frame(BP.L, BP.M + 8 * mm, BP.IW, PH - 2 * BP.M - 12 * mm, 0, 0, 0, 0)
    f.addFromList(lst, c)
    c.showPage()


if __name__ == '__main__':
    out = os.path.join(HERE, 'Mirror-Maze-Tracing.pdf')
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle('The Hollow Heir: Mirror Maze tracing masters')
    c.setAuthor(BP.G.AUTHOR)
    instructions(c)
    for i, house in enumerate(BP.HOUSES):
        house_page(c, i, house)
    c.save()
    print('wrote', out)
