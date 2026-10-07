"""
Builds DM-Guide.pdf for The Hollow Heir.

Content lives in content_*.py as simple blocks:
  ('chapter', 'Part 1', 'Title', 'intro line')   new part, starts a page
  ('h2', 'Heading') / ('h3', 'Heading')
  ('p', 'Body text, <b>bold</b>, <i>italic</i>')
  ('read', 'Read-aloud text')                     parchment box
  ('wait', 'Question to ask, then let them talk') red WAIT marker
  ('gm', 'What to press in the app')              teal GM SCREEN box
  ('tip', 'Optional advice')                      gold TIP box
  ('list', ['item', 'item'])
  ('table', ['Head', ...], [[row], ...], [widths in mm] or None)
  ('break',)
Update the content files when the app changes, bump VERSION, and run:  python3 build_dm_guide.py
"""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, KeepTogether, NextPageTemplate, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

sys.path.insert(0, os.path.dirname(__file__))
VERSION = '2.3'
VERSION_NOTE = 'Year 1 with the living castle. Matches the complete app, October 2026.'

# ---------- Fonts (fall back to built-ins if the TTFs aren't on this machine) ----------
SERIF, SERIF_B, SERIF_I, SERIF_BI, SANS, SANS_B = 'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic', 'Helvetica', 'Helvetica-Bold'
try:
    base = '/usr/share/fonts/truetype/crosextra/'
    for name, f in [('Caladea', 'Caladea-Regular'), ('Caladea-B', 'Caladea-Bold'), ('Caladea-I', 'Caladea-Italic'),
                    ('Caladea-BI', 'Caladea-BoldItalic'), ('Carlito', 'Carlito-Regular'), ('Carlito-B', 'Carlito-Bold')]:
        pdfmetrics.registerFont(TTFont(name, base + f + '.ttf'))
    from reportlab.lib.fonts import addMapping
    addMapping('Caladea', 0, 0, 'Caladea'); addMapping('Caladea', 1, 0, 'Caladea-B')
    addMapping('Caladea', 0, 1, 'Caladea-I'); addMapping('Caladea', 1, 1, 'Caladea-BI')
    addMapping('Carlito', 0, 0, 'Carlito'); addMapping('Carlito', 1, 0, 'Carlito-B')
    addMapping('Carlito', 0, 1, 'Carlito'); addMapping('Carlito', 1, 1, 'Carlito-B')
    SERIF, SERIF_B, SERIF_I, SERIF_BI, SANS, SANS_B = 'Caladea', 'Caladea-B', 'Caladea-I', 'Caladea-BI', 'Carlito', 'Carlito-B'
except Exception:
    pass

AUTHOR = 'Zibby'
HERE = os.path.dirname(os.path.abspath(__file__))
# Your own cover art: put cover.jpg or cover.png next to this file (A4 portrait, see the print notes).
COVER_IMG = next((os.path.join(HERE, f) for f in ('cover.jpg', 'cover.png') if os.path.exists(os.path.join(HERE, f))), None)

INK = colors.HexColor('#1d1a2e')
MUTED = colors.HexColor('#5b566e')
GOLD = colors.HexColor('#a8781f')
PARCH = colors.HexColor('#f4ecd6')
PARCH_EDGE = colors.HexColor('#b89a5e')
TEAL = colors.HexColor('#23706a')
TEAL_BG = colors.HexColor('#e3f1ef')
EMBER = colors.HexColor('#a8392a')
EMBER_BG = colors.HexColor('#f8e6e2')
TIP_BG = colors.HexColor('#fbf3dc')
NIGHT = colors.HexColor('#17142a')

ST = {
    'body': ParagraphStyle('body', fontName=SERIF, fontSize=10.6, leading=14.6, textColor=INK, spaceAfter=6),
    'h1': ParagraphStyle('h1', fontName=SERIF_B, fontSize=26, leading=30, textColor=INK, spaceAfter=4),
    'kicker': ParagraphStyle('kicker', fontName=SANS_B, fontSize=10, leading=12, textColor=GOLD, spaceAfter=2),
    'h1intro': ParagraphStyle('h1intro', fontName=SERIF_I, fontSize=12, leading=16, textColor=MUTED, spaceAfter=14),
    'h2': ParagraphStyle('h2', fontName=SERIF_B, fontSize=16, leading=20, textColor=INK, spaceBefore=12, spaceAfter=5),
    'h3': ParagraphStyle('h3', fontName=SANS_B, fontSize=11.5, leading=15, textColor=GOLD, spaceBefore=8, spaceAfter=3),
    'read': ParagraphStyle('read', fontName=SERIF_I, fontSize=11.4, leading=16, textColor=INK),
    'box': ParagraphStyle('box', fontName=SANS, fontSize=10, leading=13.4, textColor=INK),
    'label': ParagraphStyle('label', fontName=SANS_B, fontSize=8.2, leading=10, textColor=colors.white),
    'list': ParagraphStyle('list', fontName=SERIF, fontSize=10.6, leading=14.2, textColor=INK, leftIndent=12, bulletIndent=2, spaceAfter=2),
    'cell': ParagraphStyle('cell', fontName=SANS, fontSize=8.9, leading=11.2, textColor=INK),
    'cellh': ParagraphStyle('cellh', fontName=SANS_B, fontSize=8.9, leading=11.2, textColor=colors.white),
    'toc1': ParagraphStyle('toc1', fontName=SERIF_B, fontSize=12, leading=18, leftIndent=0, textColor=INK),
    'toc2': ParagraphStyle('toc2', fontName=SERIF, fontSize=10, leading=13.5, leftIndent=14, textColor=MUTED),
}
W = A4[0] - 40 * mm

import re
_EMOJI = re.compile('[\U0001F000-\U0001FAFF\u2300-\u23FF\u2600-\u27BF\uFE0F\u200D]+ ?')


def clean(text):
    # Button names in the app use emoji; the book's fonts don't have them.
    return _EMOJI.sub('', text)


_Paragraph = Paragraph


def Paragraph(text, *a, **k):  # noqa: N802
    return _Paragraph(clean(text), *a, **k)


def labelled_box(label, text, bg, edge, label_bg, style):
    lab = Table([[Paragraph(label, ST['label'])]], style=[
        ('BACKGROUND', (0, 0), (-1, -1), label_bg), ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5), ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)])
    paras = [Paragraph(t, style) for t in (text if isinstance(text, list) else [text])]
    inner = [[lab]] + [[p] for p in paras]
    t = Table(inner, colWidths=[W - 4], style=[
        ('BACKGROUND', (0, 0), (-1, -1), bg), ('LINEBEFORE', (0, 0), (0, -1), 3, edge),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 8), ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -2), 2),
        ('ALIGN', (0, 0), (0, 0), 'LEFT')])
    t.hAlign = 'LEFT'
    return [Spacer(1, 3), t, Spacer(1, 7)]


class GuideDoc(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(path, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
                         title='The Hollow Heir: Dungeon Master’s Guide', author=AUTHOR)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id='f')
        self.addPageTemplates([PageTemplate('cover', [frame], onPage=self.cover_bg),
                               PageTemplate('body', [frame], onPageEnd=self.page_furniture)])
        self.part = ''

    def beforeDocument(self):
        self.part = ''

    def cover_bg(self, c, doc):
        c.saveState()
        if COVER_IMG and doc.page == 1:
            c.drawImage(COVER_IMG, 0, 0, width=A4[0], height=A4[1], preserveAspectRatio=False)
            c.restoreState()
            return
        c.setFillColor(NIGHT); c.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        c.setStrokeColor(GOLD); c.setLineWidth(1.2)
        c.rect(12 * mm, 12 * mm, A4[0] - 24 * mm, A4[1] - 24 * mm, fill=0, stroke=1)
        c.setLineWidth(.5); c.rect(14.5 * mm, 14.5 * mm, A4[0] - 29 * mm, A4[1] - 29 * mm, fill=0, stroke=1)
        c.restoreState()

    def page_furniture(self, c, doc):
        c.saveState()
        c.setFont(SANS, 8); c.setFillColor(MUTED)
        c.drawString(20 * mm, 10 * mm, f'The Hollow Heir · DM Guide v{VERSION} · by {AUTHOR}')
        c.drawRightString(A4[0] - 20 * mm, 10 * mm, str(doc.page))
        if self.part:
            c.drawRightString(A4[0] - 20 * mm, A4[1] - 12 * mm, self.part)
        c.setStrokeColor(PARCH_EDGE); c.setLineWidth(.4)
        c.line(20 * mm, 14 * mm, A4[0] - 20 * mm, 14 * mm)
        c.restoreState()

    def afterFlowable(self, f):
        if isinstance(f, _Paragraph):
            name = f.style.name
            if name == 'h1':
                self.part = f.getPlainText()
                self.notify('TOCEntry', (0, f.getPlainText(), self.page))
                key = f'h1-{self.page}'
                self.canv.bookmarkPage(key); self.canv.addOutlineEntry(f.getPlainText(), key, level=0)
            elif name == 'h2':
                self.notify('TOCEntry', (1, f.getPlainText(), self.page))
                key = f'h2-{self.page}-{id(f)}'
                self.canv.bookmarkPage(key); self.canv.addOutlineEntry(f.getPlainText(), key, level=1)


def cover():
    if COVER_IMG:
        # The designed cover fills page 1; a title page follows.
        return [Spacer(1, 1), PageBreak()] + title_page()
    return default_cover()


def title_page():
    t = ParagraphStyle('tp', fontName=SERIF_B, fontSize=30, leading=36, textColor=colors.HexColor('#f1e6c8'), alignment=TA_CENTER)
    s2 = ParagraphStyle('tps', fontName=SERIF_I, fontSize=14, leading=20, textColor=colors.HexColor('#d9c58f'), alignment=TA_CENTER)
    m = ParagraphStyle('tpm', fontName=SANS, fontSize=10, leading=14, textColor=colors.HexColor('#a69fbe'), alignment=TA_CENTER)
    return [Spacer(1, 80 * mm), Paragraph('The Hollow Heir', t), Spacer(1, 6), Paragraph('Dungeon Master’s Guide', s2), Spacer(1, 10),
            Paragraph(f'Written by {AUTHOR}', s2), Spacer(1, 70 * mm), Paragraph(f'Version {VERSION}. {VERSION_NOTE}', m),
            NextPageTemplate('body'), PageBreak()]


def default_cover():
    big = ParagraphStyle('cv', fontName=SERIF_B, fontSize=40, leading=46, textColor=colors.HexColor('#f1e6c8'), alignment=TA_CENTER)
    sub = ParagraphStyle('cs', fontName=SERIF_I, fontSize=16, leading=22, textColor=colors.HexColor('#d9c58f'), alignment=TA_CENTER)
    small = ParagraphStyle('cm', fontName=SANS, fontSize=10, leading=14, textColor=colors.HexColor('#a69fbe'), alignment=TA_CENTER)
    kick = ParagraphStyle('ck', fontName=SANS_B, fontSize=11, leading=14, textColor=GOLD, alignment=TA_CENTER)
    return [Spacer(1, 62 * mm), Paragraph('A SPIN &amp; ROLL CAMPAIGN', kick), Spacer(1, 8),
            Paragraph('The Hollow Heir', big), Spacer(1, 6),
            Paragraph('Dungeon Master’s Guide', sub), Spacer(1, 8),
            Paragraph(f'Written by {AUTHOR}', sub), Spacer(1, 18 * mm),
            Paragraph('Seven days at Hogwarts to stop a painted wizard.', sub), Spacer(1, 50 * mm),
            Paragraph(f'Version {VERSION}. {VERSION_NOTE}', small),
            Paragraph('Keep this book beside the GM screen. Update it whenever the app changes.', small),
            NextPageTemplate('body'), PageBreak()]


def render(blocks):
    out = []
    for b in blocks:
        kind = b[0]
        if kind == 'chapter':
            _, kicker, title, intro = b
            out += [PageBreak(), Paragraph(kicker.upper(), ST['kicker']), Paragraph(title, ST['h1']),
                    Table([['']], colWidths=[W], rowHeights=[2], style=[('BACKGROUND', (0, 0), (-1, -1), GOLD)]),
                    Spacer(1, 8), Paragraph(intro, ST['h1intro'])]
        elif kind == 'h2':
            out += [CondPageBreak(60 * mm), Paragraph(b[1], ST['h2'])]
        elif kind == 'h3':
            out += [CondPageBreak(35 * mm), Paragraph(b[1], ST['h3'])]
        elif kind == 'p':
            out.append(Paragraph(b[1], ST['body']))
        elif kind == 'read':
            out.append(KeepTogether(labelled_box('READ ALOUD', b[1], PARCH, PARCH_EDGE, PARCH_EDGE, ST['read'])))
        elif kind == 'wait':
            out.append(KeepTogether(labelled_box('WAIT FOR THE PLAYERS', b[1], EMBER_BG, EMBER, EMBER, ST['box'])))
        elif kind == 'gm':
            out.append(KeepTogether(labelled_box('ON THE GM SCREEN', b[1], TEAL_BG, TEAL, TEAL, ST['box'])))
        elif kind == 'tip':
            out.append(KeepTogether(labelled_box('TIP', b[1], TIP_BG, GOLD, GOLD, ST['box'])))
        elif kind == 'list':
            for item in b[1]:
                out.append(Paragraph(item, ST['list'], bulletText='•'))
            out.append(Spacer(1, 4))
        elif kind == 'table':
            head, rows = b[1], b[2]
            widths = [w * mm for w in b[3]] if len(b) > 3 and b[3] else None
            data = [[Paragraph(h, ST['cellh']) for h in head]] + [[Paragraph(str(c), ST['cell']) for c in r] for r in rows]
            t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), NIGHT), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f6f2e7')]),
                ('LINEBELOW', (0, 0), (-1, -1), .3, colors.HexColor('#d8cfb8')),
                ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 3.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5)]))
            out += [t, Spacer(1, 8)]
        elif kind == 'break':
            out.append(PageBreak())
        else:
            raise ValueError(kind)
    return out


def build(path):
    import content_1, content_2, content_3, content_4, content_5
    toc = TableOfContents(levelStyles=[ST['toc1'], ST['toc2']], dotsMinLevel=0)
    story = cover()
    contents_title = ParagraphStyle('contents', parent=ST['h2'], fontSize=22, leading=26, spaceAfter=10)
    story += [Paragraph('Contents', contents_title), toc]
    for mod in (content_1, content_2, content_3, content_4, content_5):
        story += render(mod.BLOCKS)
    doc = GuideDoc(path)
    doc.multiBuild(story)


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'DM-Guide.pdf')
    build(out)
    print('wrote', out)
