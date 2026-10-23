"""The Student's Notebook: printable note-taking sheets for players. Run: python3 build_notebook.py"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'dm-guide'))
import build_dm_guide as G  # noqa: E402  (registers the fonts)
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402

VERSION = '1.0'
PW, PH = A4
M = 14 * mm
INK = colors.HexColor('#2a2238')
SEPIA = colors.HexColor('#7a5a2a')
GOLD = colors.HexColor('#a8781f')
LINE = colors.HexColor('#cdbf9d')
FAINT = colors.HexColor('#e9e0c8')
WASH = colors.HexColor('#fbf7ec')
SERIF, SERIF_B, SERIF_I, SANS = G.SERIF, G.SERIF_B, G.SERIF_I, G.SANS


def star(c, x, y, r, fill=GOLD):
    p = c.beginPath()
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * .42
        (p.moveTo if i == 0 else p.lineTo)(x + rr * math.cos(a), y + rr * math.sin(a))
    p.close()
    c.setFillColor(fill)
    c.drawPath(p, stroke=0, fill=1)


def moon(c, x, y, r, fg=GOLD, bg=colors.white):
    c.setFillColor(fg)
    c.circle(x, y, r, stroke=0, fill=1)
    c.setFillColor(bg)
    c.circle(x + r * .45, y + r * .2, r * .85, stroke=0, fill=1)


def frame(c, title, subtitle=None, page=None):
    """Double ruled border with corner flourishes and a title banner."""
    c.setStrokeColor(SEPIA)
    c.setLineWidth(1.4)
    c.rect(M, M, PW - 2 * M, PH - 2 * M)
    c.setLineWidth(.5)
    c.rect(M + 2.2 * mm, M + 2.2 * mm, PW - 2 * M - 4.4 * mm, PH - 2 * M - 4.4 * mm)
    for cx, cy in ((M, M), (PW - M, M), (M, PH - M), (PW - M, PH - M)):
        c.setFillColor(colors.white)
        c.circle(cx, cy, 4.2 * mm, stroke=0, fill=1)
        c.setStrokeColor(SEPIA)
        c.setLineWidth(.8)
        c.circle(cx, cy, 3.2 * mm, stroke=1, fill=0)
        star(c, cx, cy, 2.2 * mm)
    # title banner
    c.setFillColor(INK)
    c.setFont(SERIF_B, 22)
    c.drawCentredString(PW / 2, PH - M - 15 * mm, title)
    tw = c.stringWidth(title, SERIF_B, 22)
    c.setStrokeColor(GOLD)
    c.setLineWidth(.8)
    for s in (-1, 1):
        x0 = PW / 2 + s * (tw / 2 + 5 * mm)
        c.line(x0, PH - M - 12.6 * mm, x0 + s * 22 * mm, PH - M - 12.6 * mm)
        star(c, x0 + s * 24.5 * mm, PH - M - 12.6 * mm, 1.6 * mm)
    if subtitle:
        c.setFillColor(SEPIA)
        c.setFont(SERIF_I, 10.5)
        c.drawCentredString(PW / 2, PH - M - 21 * mm, subtitle)
    c.setFont(SERIF_I, 8)
    c.setFillColor(SEPIA)
    c.drawCentredString(PW / 2, M + 4.5 * mm, f'The Student’s Notebook · The Hollow Heir · by {G.AUTHOR}' + (f' · {page}' if page else ''))
    return PH - M - (27 if subtitle else 22) * mm


def label(c, x, y, text, size=8.5):
    c.setFillColor(SEPIA)
    c.setFont(SANS, size)
    c.drawString(x, y, text.upper())


def field(c, x, y, w, text):
    label(c, x, y + 1.6 * mm, text, 7.5)
    c.setStrokeColor(LINE)
    c.setLineWidth(.6)
    c.line(x, y - 4.5 * mm, x + w, y - 4.5 * mm)


def lines(c, x, y_top, w, y_bottom, gap=7.5 * mm):
    c.setStrokeColor(LINE)
    c.setLineWidth(.45)
    y = y_top - gap
    while y > y_bottom:
        c.line(x, y, x + w, y)
        y -= gap


def box(c, x, y, w, h, title=None, wash=True):
    c.setFillColor(WASH if wash else colors.white)
    c.setStrokeColor(SEPIA)
    c.setLineWidth(.7)
    c.roundRect(x, y, w, h, 2.4 * mm, stroke=1, fill=1)
    if title:
        c.setFont(SERIF_B, 11)
        tw = c.stringWidth(title, SERIF_B, 11)
        c.setFillColor(colors.white)
        c.rect(x + 4 * mm, y + h - 2 * mm, tw + 4 * mm, 4 * mm, stroke=0, fill=1)
        c.setFillColor(INK)
        c.drawString(x + 6 * mm, y + h - 1.2 * mm, title)


L, R = M + 8 * mm, PW - M - 8 * mm
IW = R - L


def cover(c):
    c.setFillColor(colors.white)
    c.setStrokeColor(SEPIA)
    c.setLineWidth(2)
    c.rect(M, M, PW - 2 * M, PH - 2 * M)
    c.setLineWidth(.6)
    c.rect(M + 3 * mm, M + 3 * mm, PW - 2 * M - 6 * mm, PH - 2 * M - 6 * mm)
    c.rect(M + 4.4 * mm, M + 4.4 * mm, PW - 2 * M - 8.8 * mm, PH - 2 * M - 8.8 * mm)
    # constellation arc
    import random
    rnd = random.Random(7)
    for _ in range(46):
        x = rnd.uniform(M + 12 * mm, PW - M - 12 * mm)
        y = rnd.uniform(PH * .62, PH - M - 14 * mm)
        star(c, x, y, rnd.uniform(.6, 1.7) * mm, colors.HexColor('#c9a65a'))
    moon(c, PW / 2, PH - 62 * mm, 12 * mm)
    c.setFillColor(INK)
    c.setFont(SERIF_I, 15)
    c.drawCentredString(PW / 2, PH * .56, 'Hogwarts School of Witchcraft and Wizardry')
    c.setFont(SERIF_B, 40)
    c.drawCentredString(PW / 2, PH * .49, 'The Student’s')
    c.drawCentredString(PW / 2, PH * .49 - 16 * mm, 'Notebook')
    c.setStrokeColor(GOLD)
    c.setLineWidth(.9)
    c.line(PW / 2 - 50 * mm, PH * .49 - 24 * mm, PW / 2 + 50 * mm, PH * .49 - 24 * mm)
    star(c, PW / 2, PH * .49 - 24 * mm, 2.4 * mm)
    c.setFillColor(SEPIA)
    c.setFont(SERIF_I, 12)
    c.drawCentredString(PW / 2, PH * .49 - 32 * mm, 'First year. Clues, curses, secrets and suspects.')
    # owner plate
    px, py, pw, ph = PW / 2 - 62 * mm, 62 * mm, 124 * mm, 46 * mm
    box(c, px, py, pw, ph, wash=True)
    c.setFillColor(SEPIA)
    c.setFont(SERIF_I, 11)
    c.drawCentredString(PW / 2, py + ph - 9 * mm, 'This notebook belongs to')
    c.setStrokeColor(LINE)
    c.line(px + 10 * mm, py + ph - 22 * mm, px + pw - 10 * mm, py + ph - 22 * mm)
    field(c, px + 10 * mm, py + 15 * mm, 48 * mm, 'House')
    field(c, px + pw - 58 * mm, py + 15 * mm, 48 * mm, 'Family')
    c.setFont(SERIF_I, 9.5)
    c.setFillColor(SEPIA)
    c.drawCentredString(PW / 2, 34 * mm, 'If found, return to the owner by owl. Do not read the last page. We mean it.')
    c.showPage()


def character(c):
    top = frame(c, 'My Witch or Wizard', 'Who you are, what you carry, what you can do.', 1)
    # identity row
    y = top - 6 * mm
    field(c, L, y, 86 * mm, 'Name')
    field(c, L + 92 * mm, y, IW - 92 * mm, 'Family')
    y -= 14 * mm
    field(c, L, y, 40 * mm, 'House')
    field(c, L + 46 * mm, y, 40 * mm, 'Pronouns / nickname')
    field(c, L + 92 * mm, y, IW - 92 * mm, 'Pet')
    # wand
    y -= 12 * mm
    bh = 22 * mm
    box(c, L, y - bh, IW, bh, 'My wand')
    for i, t in enumerate(('Wood', 'Core', 'Length', 'Flexibility')):
        field(c, L + 5 * mm + i * (IW - 10 * mm) / 4, y - 10 * mm, (IW - 10 * mm) / 4 - 6 * mm, t)
    # stats
    y -= bh + 9 * mm
    label(c, L, y, 'My stats (write the number, and the bonus in the little circle)')
    sw = IW / 6
    for i, (k, n) in enumerate((('STR', 'Strength'), ('DEX', 'Dexterity'), ('CON', 'Constitution'),
                                 ('INT', 'Intelligence'), ('WIS', 'Wisdom'), ('CHA', 'Charisma'))):
        cx = L + sw * i + sw / 2
        cy = y - 17 * mm
        c.setStrokeColor(SEPIA)
        c.setFillColor(WASH)
        c.setLineWidth(.9)
        p = c.beginPath()
        for j in range(6):
            a = math.pi / 6 + j * math.pi / 3
            (p.moveTo if j == 0 else p.lineTo)(cx + 11 * mm * math.cos(a), cy + 11 * mm * math.sin(a))
        p.close()
        c.drawPath(p, stroke=1, fill=1)
        c.setFillColor(colors.white)
        c.circle(cx, cy - 11 * mm, 3.6 * mm, stroke=1, fill=1)
        c.setFillColor(INK)
        c.setFont(SERIF_B, 10)
        c.drawCentredString(cx, cy + 5.5 * mm, k)
        c.setFillColor(SEPIA)
        c.setFont(SANS, 6.5)
        c.drawCentredString(cx, cy - 17.5 * mm, n.upper())
    # vitals
    y -= 43 * mm
    vw = (IW - 9 * mm) / 4
    for i, t in enumerate(('Health', 'Galleons', 'Level / XP', 'House trait')):
        x = L + i * (vw + 3 * mm)
        box(c, x, y - 18 * mm, vw, 18 * mm, t)
    # spells + items
    y -= 25 * mm
    hw = (IW - 5 * mm) / 2
    bh = 68 * mm
    box(c, L, y - bh, hw, bh, 'Spells I know', wash=False)
    lines(c, L + 4 * mm, y - 3 * mm, hw - 8 * mm, y - bh + 2 * mm)
    box(c, L + hw + 5 * mm, y - bh, hw, bh, 'In my trunk', wash=False)
    lines(c, L + hw + 9 * mm, y - 3 * mm, hw - 8 * mm, y - bh + 2 * mm)
    # secret
    y -= bh + 7 * mm
    bh2 = y - (M + 12 * mm)
    box(c, L, y - bh2, IW, bh2, 'My family’s secret (keep this page closed)', wash=False)
    lines(c, L + 4 * mm, y - 3 * mm, IW - 8 * mm, y - bh2 + 2 * mm)
    c.showPage()


def friends(c):
    top = frame(c, 'Friends, Foes and Teachers', 'Who you have met, and what you think of them.', 2)
    rows, cols = 5, 2
    gap = 5 * mm
    cw = (IW - gap) / cols
    ch = (top - 6 * mm - (M + 12 * mm) - gap * (rows - 1)) / rows
    for r in range(rows):
        for k in range(cols):
            x = L + k * (cw + gap)
            y = top - 6 * mm - (r + 1) * ch - r * gap
            box(c, x, y, cw, ch, wash=False)
            # little portrait frame
            c.setStrokeColor(GOLD)
            c.setLineWidth(.8)
            c.ellipse(x + 4 * mm, y + ch - 30 * mm, x + 24 * mm, y + ch - 4 * mm)
            c.setFont(SERIF_I, 6.5)
            c.setFillColor(SEPIA)
            c.drawCentredString(x + 14 * mm, y + ch - 17.5 * mm, 'draw them')
            field(c, x + 28 * mm, y + ch - 7 * mm, cw - 32 * mm, 'Name')
            field(c, x + 28 * mm, y + ch - 18 * mm, cw - 32 * mm, 'Where I find them')
            label(c, x + 4 * mm, y + ch - 36 * mm, 'Notes', 7)
            lines(c, x + 4 * mm, y + ch - 35 * mm, cw - 8 * mm, y + 1 * mm, 6.5 * mm)
            for i in range(3):
                star(c, x + cw - 6 * mm - i * 4.5 * mm, y + ch - 29 * mm, 1.6 * mm, FAINT)
    c.showPage()


def clues(c, n):
    top = frame(c, 'Clues', 'Every strange thing. Write it down even if it seems small.', n)
    cols = [('#', 9 * mm), ('What I found', 78 * mm), ('Where & when', 38 * mm), ('Points at…', IW - 125 * mm)]
    y = top - 4 * mm
    x = L
    c.setFillColor(WASH)
    c.setStrokeColor(SEPIA)
    c.rect(L, y - 7 * mm, IW, 7 * mm, stroke=1, fill=1)
    for t, w in cols:
        c.setFillColor(INK)
        c.setFont(SERIF_B, 10)
        c.drawString(x + 2 * mm, y - 5 * mm, t)
        x += w
    rh = 15 * mm
    y -= 7 * mm
    i = 0
    while y - rh > M + 10 * mm:
        i += 1
        c.setStrokeColor(LINE)
        c.setLineWidth(.5)
        c.line(L, y - rh, R, y - rh)
        c.setStrokeColor(FAINT)
        c.line(L + 9 * mm, y - rh / 2, R, y - rh / 2)
        c.setFillColor(SEPIA)
        c.setFont(SERIF_I, 9)
        c.drawCentredString(L + 4.5 * mm, y - 9 * mm, str(i))
        y -= rh
    x = L
    c.setStrokeColor(LINE)
    for t, w in cols[:-1]:
        x += w
        c.line(x, top - 4 * mm, x, y)
    c.setStrokeColor(SEPIA)
    c.rect(L, y, IW, top - 4 * mm - y, stroke=1, fill=0)
    c.showPage()


SUSPECTS = ['Professor Ashgrove', 'Professor Grimsby', 'Argus Filch', 'Cassius Thorne', 'The ghost', 'The covered painting']


def suspects(c, n):
    top = frame(c, 'The Suspects', 'Motive, chance, alibi. Cross them out when you are sure.', n)
    gap = 5 * mm
    cw = (IW - gap) / 2
    ch = (top - 6 * mm - (M + 12 * mm + 40 * mm + 6 * mm) - gap * 2) / 3
    for i, name in enumerate(SUSPECTS):
        r, k = divmod(i, 2)
        x = L + k * (cw + gap)
        y = top - 6 * mm - (r + 1) * ch - r * gap
        box(c, x, y, cw, ch, wash=False)
        # wanted poster header
        c.setFillColor(WASH)
        c.rect(x + .4 * mm, y + ch - 10 * mm, cw - .8 * mm, 9.5 * mm, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont(SERIF_B, 12)
        c.drawString(x + 5 * mm, y + ch - 7 * mm, name)
        c.setFont(SANS, 6.5)
        c.setFillColor(SEPIA)
        c.drawRightString(x + cw - 17 * mm, y + ch - 6.6 * mm, 'CLEARED')
        c.setStrokeColor(SEPIA)
        c.rect(x + cw - 15 * mm, y + ch - 8 * mm, 3.5 * mm, 3.5 * mm)
        c.drawRightString(x + cw - 4.5 * mm, y + ch - 6.6 * mm, '')
        yy = y + ch - 17 * mm
        for t in ('Motive', 'Chance', 'Alibi'):
            label(c, x + 5 * mm, yy, t, 7)
            c.setStrokeColor(LINE)
            c.line(x + 22 * mm, yy - 1 * mm, x + cw - 5 * mm, yy - 1 * mm)
            yy -= 7.5 * mm
        label(c, x + 5 * mm, yy, 'Clues', 7)
        lines(c, x + 22 * mm, yy + 6.5 * mm, cw - 27 * mm, y + 2 * mm, 7 * mm)
        # suspicion meter
        label(c, x + 5 * mm, y + 3.5 * mm, 'How sure', 6)
        for j in range(5):
            c.setStrokeColor(GOLD)
            c.circle(x + 23 * mm + j * 5 * mm, y + 4.3 * mm, 1.7 * mm)
    # verdict
    y = M + 12 * mm
    box(c, L, y, IW, 40 * mm, 'My verdict')
    field(c, L + 6 * mm, y + 29 * mm, IW - 12 * mm, 'I think it is…')
    field(c, L + 6 * mm, y + 15 * mm, IW - 12 * mm, 'Because…')
    c.setStrokeColor(LINE)
    c.line(L + 6 * mm, y + 4.5 * mm, R - 6 * mm, y + 4.5 * mm)
    c.showPage()


def runes(c, n):
    top = frame(c, 'Rune Notebook', 'When you work out which rune is which letter, draw it in its box.', n)
    cols, rows = 6, 5
    gap = 3 * mm
    bw = (IW - gap * (cols - 1)) / cols
    bh = 30 * mm
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for i, ch in enumerate(letters):
        r, k = divmod(i, cols)
        if r == 4:  # last row centred (A–X fill four rows; Y, Z sit in the middle)
            k += 2
        x = L + k * (bw + gap)
        y = top - 4 * mm - (r + 1) * bh - r * gap
        c.setFillColor(colors.white)
        c.setStrokeColor(SEPIA)
        c.setLineWidth(.7)
        c.roundRect(x, y, bw, bh, 2 * mm, stroke=1, fill=1)
        c.setFillColor(WASH)
        c.roundRect(x + .4 * mm, y + .4 * mm, bw - .8 * mm, 8 * mm, 1.8 * mm, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont(SERIF_B, 13)
        c.drawCentredString(x + bw / 2, y + 2.4 * mm, ch)
        c.setStrokeColor(FAINT)
        c.setDash(1, 2)
        c.line(x + bw / 2, y + 10 * mm, x + bw / 2, y + bh - 2 * mm)
        c.line(x + 3 * mm, y + 10 * mm + (bh - 12 * mm) / 2, x + bw - 3 * mm, y + 10 * mm + (bh - 12 * mm) / 2)
        c.setDash()
        c.setFont(SANS, 5.5)
        c.setFillColor(SEPIA)
        c.drawString(x + 2 * mm, y + bh - 4 * mm, 'sure?')
        c.circle(x + 11.5 * mm, y + bh - 3.4 * mm, 1.3 * mm)
    y = top - 4 * mm - 5 * bh - 4 * gap - 8 * mm
    bh2 = y - (M + 12 * mm)
    box(c, L, M + 12 * mm, IW, bh2, 'Decoding scratch pad', wash=False)
    lines(c, L + 4 * mm, y - 3 * mm, IW - 8 * mm, M + 14 * mm, 9 * mm)
    c.showPage()


def places(c, n):
    top = frame(c, 'Places and Secrets', 'Rooms, passwords, hidden ways, and what is behind them.', n)
    y = top - 4 * mm
    hw = (IW - 5 * mm) / 2
    bh = 34 * mm
    box(c, L, y - bh, hw, bh, 'Passwords', wash=False)
    lines(c, L + 4 * mm, y - 4 * mm, hw - 8 * mm, y - bh + 2 * mm)
    box(c, L + hw + 5 * mm, y - bh, hw, bh, 'Secret passages', wash=False)
    lines(c, L + hw + 9 * mm, y - 4 * mm, hw - 8 * mm, y - bh + 2 * mm)
    y -= bh + 8 * mm
    # map sketch area with dotted grid
    mh = 92 * mm
    box(c, L, y - mh, IW, mh, 'Sketch the castle', wash=False)
    c.setFillColor(LINE)
    gx = L + 5 * mm
    while gx < R - 3 * mm:
        gy = y - mh + 4 * mm
        while gy < y - 4 * mm:
            c.circle(gx, gy, .35, stroke=0, fill=1)
            gy += 5 * mm
        gx += 5 * mm
    # compass rose
    cx, cy = R - 14 * mm, y - 14 * mm
    c.setStrokeColor(GOLD)
    c.setFillColor(colors.white)
    c.circle(cx, cy, 7 * mm, stroke=1, fill=1)
    star(c, cx, cy, 6 * mm)
    c.setFillColor(INK)
    c.setFont(SERIF_B, 7)
    c.drawCentredString(cx, cy + 8.2 * mm, 'N')
    y -= mh + 8 * mm
    bh3 = y - (M + 12 * mm)
    box(c, L, M + 12 * mm, IW, bh3, 'Places worth going back to', wash=False)
    lines(c, L + 4 * mm, y - 4 * mm, IW - 8 * mm, M + 14 * mm)
    c.showPage()


def quests(c, n):
    top = frame(c, 'Quests and Promises', 'Who asked, what for, and what you get.', n)
    rows = 5
    gap = 4 * mm
    ch = (top - 4 * mm - (M + 12 * mm) - gap * (rows - 1)) / rows
    for r in range(rows):
        y = top - 4 * mm - (r + 1) * ch - r * gap
        box(c, L, y, IW, ch, wash=False)
        # seal
        c.setFillColor(colors.HexColor('#f3e3c4'))
        c.setStrokeColor(GOLD)
        c.circle(L + 9 * mm, y + ch - 9 * mm, 5 * mm, stroke=1, fill=1)
        star(c, L + 9 * mm, y + ch - 9 * mm, 2.6 * mm)
        field(c, L + 18 * mm, y + ch - 6 * mm, 72 * mm, 'Quest')
        field(c, L + 96 * mm, y + ch - 6 * mm, IW - 100 * mm, 'Asked by')
        label(c, L + 4 * mm, y + ch - 20 * mm, 'To do', 7)
        for j in range(3):
            yy = y + ch - 26 * mm - j * 6 * mm
            if yy < y + 2 * mm:
                break
            c.setStrokeColor(SEPIA)
            c.rect(L + 4 * mm, yy, 3.2 * mm, 3.2 * mm)
            c.setStrokeColor(LINE)
            c.line(L + 10 * mm, yy, L + 118 * mm, yy)
        label(c, L + 124 * mm, y + ch - 20 * mm, 'Reward', 7)
        c.setStrokeColor(LINE)
        c.line(L + 124 * mm, y + ch - 26 * mm, R - 4 * mm, y + ch - 26 * mm)
        label(c, L + 124 * mm, y + ch - 32 * mm, 'Done', 7)
        c.setStrokeColor(GOLD)
        c.circle(L + 136 * mm, y + ch - 31 * mm, 2.2 * mm)
    c.showPage()


def journal(c, n, day=None):
    top = frame(c, 'Diary' if day is None else f'Diary, Day {day}', 'What happened, what you saw, what you wonder.', n)
    # doodle margin
    c.setStrokeColor(FAINT)
    c.setLineWidth(.6)
    c.line(L + 28 * mm, top - 2 * mm, L + 28 * mm, M + 10 * mm)
    c.setFont(SERIF_I, 7)
    c.setFillColor(SEPIA)
    c.drawString(L, top - 8 * mm, 'doodles')
    lines(c, L + 31 * mm, top, IW - 31 * mm, M + 10 * mm, 8 * mm)
    star(c, L + 14 * mm, M + 22 * mm, 4 * mm, FAINT)
    c.showPage()


def last_page(c, n):
    top = frame(c, 'Do Not Read This Page', 'Theories, wild guesses, and the thing you have not told anyone.', n)
    moon(c, PW / 2, PH / 2 - 10 * mm, 42 * mm, colors.HexColor('#f5eedc'))
    lines(c, L, top, IW, M + 10 * mm, 8 * mm)
    c.showPage()


def build(path):
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle('The Student’s Notebook')
    c.setAuthor(G.AUTHOR)
    c.setSubject('Printable player notes for The Hollow Heir')
    cover(c)
    character(c)
    friends(c)
    n = 3
    for _ in range(2):
        clues(c, n)
        n += 1
    suspects(c, n); n += 1
    runes(c, n); n += 1
    places(c, n); n += 1
    quests(c, n); n += 1
    for d in range(1, 8):
        journal(c, n, d); n += 1
    last_page(c, n)
    c.save()


if __name__ == '__main__':
    out = os.path.join(HERE, 'Player-Notebook.pdf')
    build(out)
    print('wrote', out)
