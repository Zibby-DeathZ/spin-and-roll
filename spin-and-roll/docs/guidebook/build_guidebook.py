"""
Builds the printed Guidebook (the story, scene by scene, Prologue to Day 4) and the Quest Guide.
It uses the DM Guide's look (docs/dm-guide/build_dm_guide.py) plus two extra kinds of block:
  ('say', 'Name', 'What they say, in their voice')   purple IN CHARACTER box
  ('ifs', [('If they…', 'What happens'), ...])        two-column "if they…" table
  ('kv', [('Label', 'Text'), ...])                    two-column facts card, no header
Content lives in gb_*.py (Guidebook) and qg.py (Quest Guide, also bound into the Guidebook).
Run:  python3 build_guidebook.py
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'dm-guide'))

import build_dm_guide as G  # noqa: E402
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle  # noqa: E402
from reportlab.lib.enums import TA_CENTER  # noqa: E402
from reportlab.platypus import CondPageBreak  # noqa: E402
from reportlab.platypus import Spacer, Table, TableStyle, KeepTogether, PageBreak, NextPageTemplate  # noqa: E402
from reportlab.platypus.tableofcontents import TableOfContents  # noqa: E402

VERSION = '1.0'
VIOLET = colors.HexColor('#5b3f8c')
VIOLET_BG = colors.HexColor('#efe9f8')
SAY = ParagraphStyle('say', fontName=G.SERIF_I, fontSize=11, leading=15.2, textColor=G.INK)
IFLEAD = ParagraphStyle('iflead', fontName=G.SANS_B, fontSize=9.2, leading=11.8, textColor=G.INK)
IFTEXT = ParagraphStyle('iftext', fontName=G.SANS, fontSize=9.2, leading=11.8, textColor=G.INK)


def render(blocks):
    out = []
    plain = []

    def flush():
        if plain:
            out.extend(G.render(list(plain)))
            plain.clear()

    for b in blocks:
        if b[0] == 'say':
            flush()
            out.append(KeepTogether(G.labelled_box(f'IN CHARACTER: {b[1].upper()}', b[2], VIOLET_BG, VIOLET, VIOLET, SAY)))
        elif b[0] == 'kv':
            flush()
            rows = [[G.Paragraph(a, IFLEAD), G.Paragraph(t, IFTEXT)] for a, t in b[1]]
            t = Table(rows, colWidths=[34 * mm, G.W - 34 * mm], hAlign='LEFT')
            t.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#faf6ea')),
                ('LINEBELOW', (0, 0), (-1, -2), .3, colors.HexColor('#e2d7bd')),
                ('LINEBEFORE', (0, 0), (0, -1), 2.5, G.GOLD),
                ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
            out += [t, Spacer(1, 6)]
        elif b[0] == 'ifs':
            flush()
            rows = [[G.Paragraph(a, IFLEAD), G.Paragraph(t, IFTEXT)] for a, t in b[1]]
            t = Table(rows, colWidths=[52 * mm, G.W - 52 * mm], hAlign='LEFT')
            t.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f6f2e7')]),
                ('LINEBELOW', (0, 0), (-1, -1), .3, colors.HexColor('#d8cfb8')),
                ('LINEBEFORE', (0, 0), (0, -1), 2.5, G.EMBER),
                ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
            out += [t, Spacer(1, 8)]
        elif b[0] == 'h3':
            flush()
            out += [CondPageBreak(55 * mm), G.Paragraph(b[1], G.ST['h3'])]
        else:
            plain.append(b)
    flush()
    return out


class BookDoc(G.GuideDoc):
    def __init__(self, path, title, footer):
        super().__init__(path)
        self.title = title
        self.footer = footer

    def page_furniture(self, c, doc):
        c.saveState()
        c.setFont(G.SANS, 8); c.setFillColor(G.MUTED)
        c.drawString(20 * mm, 10 * mm, f'{self.footer} v{VERSION} · by {G.AUTHOR}')
        c.drawRightString(A4[0] - 20 * mm, 10 * mm, str(doc.page))
        if self.part:
            c.drawRightString(A4[0] - 20 * mm, A4[1] - 12 * mm, self.part)
        c.setStrokeColor(G.PARCH_EDGE); c.setLineWidth(.4)
        c.line(20 * mm, 14 * mm, A4[0] - 20 * mm, 14 * mm)
        c.restoreState()


def cover(title, subtitle, blurb):
    t = ParagraphStyle('tp', fontName=G.SERIF_B, fontSize=34, leading=40, textColor=colors.HexColor('#f1e6c8'), alignment=TA_CENTER)
    k = ParagraphStyle('tk', fontName=G.SANS_B, fontSize=11, leading=14, textColor=colors.HexColor('#d9b25a'), alignment=TA_CENTER)
    s2 = ParagraphStyle('tps', fontName=G.SERIF_I, fontSize=15, leading=21, textColor=colors.HexColor('#d9c58f'), alignment=TA_CENTER)
    m = ParagraphStyle('tpm', fontName=G.SANS, fontSize=10, leading=14, textColor=colors.HexColor('#a69fbe'), alignment=TA_CENTER)
    return [Spacer(1, 62 * mm), G.Paragraph('THE HOLLOW HEIR', k), Spacer(1, 6), G.Paragraph(title, t), Spacer(1, 8),
            G.Paragraph(subtitle, s2), Spacer(1, 18), G.Paragraph(blurb, m), Spacer(1, 70 * mm),
            G.Paragraph(f'Written by {G.AUTHOR}', s2), Spacer(1, 4), G.Paragraph(f'Version {VERSION}', m),
            NextPageTemplate('body'), PageBreak()]


def book(path, title, footer, subtitle, blurb, modules):
    toc = TableOfContents(levelStyles=[G.ST['toc1'], G.ST['toc2']], dotsMinLevel=0)
    story = cover(title, subtitle, blurb)
    ct = ParagraphStyle('contents', parent=G.ST['h2'], fontSize=22, leading=26, spaceAfter=10)
    story += [G.Paragraph('Contents', ct), toc]
    for mod in modules:
        story += render(mod.BLOCKS)
    doc = BookDoc(path, title, footer)
    doc.title = f'The Hollow Heir: {title}'
    doc.multiBuild(story)
    print('wrote', path)


if __name__ == '__main__':
    import importlib
    gb = [importlib.import_module(m) for m in ('gb_1', 'gb_2', 'gb_3', 'gb_4', 'gb_5', 'gb_6', 'qg')]
    book(os.path.join(HERE, 'Guidebook.pdf'), 'The Guidebook', 'The Hollow Heir · Guidebook',
         'The story, scene by scene: the Prologue to Day 4',
         'What to say, how to play every character, and what happens when your players poke at absolutely everything.',
         gb)
    book(os.path.join(HERE, 'Quest-Guide.pdf'), 'The Quest Guide', 'The Hollow Heir · Quest Guide',
         'Getting players to bite, and every quest in depth',
         'Hooks, nudges and tricks for steering a table that never does what you expect.',
         [importlib.import_module('qg')])
