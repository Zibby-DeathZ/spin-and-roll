"""
Builds Conversation-Book.pdf: where every person is at every hour, what appears when,
who offers which quest, and everything each person can say.

It is built from the same data the app uses, so the two always agree:
    node docs/dm-guide/export_world.mjs        (from the project folder)
    python3 docs/dm-guide/build_talk_book.py
"""
import json, os, sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (Paragraph, Spacer, Table, TableStyle, PageBreak, NextPageTemplate, KeepTogether, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_dm_guide as G  # shared fonts, colours, boxes and page layout

VERSION = '1.1'
D = json.load(open(os.path.join(HERE, 'world-data.json'), encoding='utf-8'))
BLOCKS = D['blocks']
LOC = D['locations']
PEOPLE = D['people']
P = G.Paragraph


def loc_of(npc, day, b):
    r = D['routines'].get(npc)
    if not r:
        return None
    if day == 0:
        pro = r.get('prologue') or []
        return pro[b] if b < len(pro) else None
    block = BLOCKS[b]
    over = (r.get('days') or {}).get(str(day)) or {}
    if block in over:
        return over[block]
    return (r.get('base') or {}).get(block)


def short(loc):
    if not loc:
        return '–'
    n = LOC.get(loc, loc)
    for a, b in [('The ', ''), (' classroom', ''), (' common room', ' c.r.'), ('Platform Nine and Three-Quarters', 'Platform'),
                 ('Gringotts Wizarding Bank', 'Gringotts'), ('The old gamekeeper’s hut', 'Gamekeeper’s hut'),
                 ('Room of Requirement', 'Room of Req.'), ('Restricted Section', 'Restricted Sect.')]:
        n = n.replace(a, b)
    return n


class TalkDoc(G.GuideDoc):
    def __init__(self, path):
        super().__init__(path)
        self.title = 'The Hollow Heir: Conversation Book'

    def page_furniture(self, c, doc):
        c.saveState()
        c.setFont(G.SANS, 8); c.setFillColor(G.MUTED)
        c.drawString(20 * mm, 10 * mm, f'The Hollow Heir · Conversation Book v{VERSION} · by {G.AUTHOR}')
        c.drawRightString(A4[0] - 20 * mm, 10 * mm, str(doc.page))
        if self.part:
            c.drawRightString(A4[0] - 20 * mm, A4[1] - 12 * mm, self.part)
        c.setStrokeColor(G.PARCH_EDGE); c.setLineWidth(.4)
        c.line(20 * mm, 14 * mm, A4[0] - 20 * mm, 14 * mm)
        c.restoreState()


def cover():
    big = ParagraphStyle('cv', fontName=G.SERIF_B, fontSize=38, leading=44, textColor=colors.HexColor('#f1e6c8'), alignment=TA_CENTER)
    sub = ParagraphStyle('cs', fontName=G.SERIF_I, fontSize=16, leading=22, textColor=colors.HexColor('#d9c58f'), alignment=TA_CENTER)
    small = ParagraphStyle('cm', fontName=G.SANS, fontSize=10, leading=14, textColor=colors.HexColor('#a69fbe'), alignment=TA_CENTER)
    kick = ParagraphStyle('ck', fontName=G.SANS_B, fontSize=11, leading=14, textColor=G.GOLD, alignment=TA_CENTER)
    return [Spacer(1, 62 * mm), P('A SPIN &amp; ROLL CAMPAIGN', kick), Spacer(1, 8), P('The Hollow Heir', big), Spacer(1, 6),
            P('Conversation Book', sub), Spacer(1, 8), P(f'Written by {G.AUTHOR}', sub), Spacer(1, 22 * mm),
            P('Who is where, every hour of the week. And what they will say when asked.', sub), Spacer(1, 48 * mm),
            P(f'Version {VERSION}. Built from the same data as the app.', small),
            NextPageTemplate('body'), PageBreak()]


def where_tables():
    out = [('chapter', 'Part 1', 'Where everyone is', 'Every person, every block. The app moves them for you when you press Advance time.')]
    blocks = []
    blocks.append(('p', 'A dash means they are not around (asleep, in their office, not at school). '
                        'Tap any person on the GM map to see what they can say. A little scroll on the TV means they have a quest.'))
    order = ['headmaster', 'flitwick', 'grimsby', 'longbottom', 'ashgrove', 'vance', 'scamander', 'hooch', 'filch', 'peeves', 'ghost',
             'sinclair-prefect', 'rival', 'collector', 'librarian', 'matron', 'house-elf', 'centaur', 'painting', 'landlady']
    order += [k for k in D['routines'] if k not in order]
    cols = BLOCKS

    def table(day, labels, nblocks):
        rows = []
        for npc in order:
            locs = [loc_of(npc, day, b) for b in range(nblocks)]
            if not any(locs):
                continue
            rows.append([PEOPLE.get(npc, npc)] + [short(x) for x in locs])
        widths = [34] + [(170 - 34) / nblocks] * nblocks
        return ('table', ['Who'] + labels, rows, widths)

    blocks.append(('h2', 'The prologue'))
    blocks.append(table(0, ['Letters', 'Diagon Alley', 'The Express', 'The Feast'], 4))
    for d in range(1, D['days'] + 1):
        blocks.append(('h2', f'Day {d}'))
        blocks.append(table(d, ['Morning', 'Lunch', 'Afternoon', 'Free time', 'Curfew'], 5))
    return out + blocks


def spawn_name(x):
    n = D['names']
    t = x['type']
    if t == 'item': return n['items'].get(x['item'], x['item'])
    if t == 'chest': return n['chests'].get(x['chest'], x['chest'])
    if t == 'hazard': return n['hazards'].get(x['hazard'], x['hazard'])
    if t == 'mimic': return n['mimics'].get(x['mimic'], x['mimic']) + ' (disguised)'
    if t == 'npc': return x.get('name') or n['monsters'].get(x['npc'], x['npc'])
    return n['monsters'].get(x.get('kind'), x.get('kind'))


def slot_label(key):
    d, b = key.split('-', 1)
    if d == '0':
        return f'Prologue: {D["prologue"][int(b)]}'
    return f'Day {d}, {b}'


def appearances():
    out = [('chapter', 'Part 2', 'What appears, and when', 'Monsters, clues, chests and hazards arrive by themselves as time advances.'),
           ('p', 'Everything below appears <b>once</b>, the first time its block is reached. <b>Passing</b> monsters leave when the block ends, '
                 'unless they are mid-fight. Everything else stays until it is picked up, opened or beaten.')]
    rows = []
    for key, s in D['schedule'].items():
        for x in s.get('spawn', []):
            rows.append([slot_label(key), spawn_name(x), short(x['loc']), 'Passing' if x.get('transient') else 'Stays'])
        for rid in s.get('remove', []):
            rows.append([slot_label(key), f'Removed: {rid}', '', ''])
    out.append(('table', ['When', 'What', 'Where', ''], rows, [38, 72, 40, 20]))
    out.append(('tip', 'Missed something? On the Day &amp; class tab, <b>↻ Put everyone in place now</b> re-applies the current block. '
                       'Untick <b>Move everyone automatically</b> if you want to run a block by hand.'))
    out.append(('h2', 'Quests on offer'))
    out.append(('p', 'A quest is on offer from its first block to its last. While it is, the person giving it shows a little scroll on the TV, '
                     'and the Day &amp; class tab has a <b>Give</b> button for it. On its last block it is marked <b>Last chance</b>. '
                     'If nobody takes it, it arrives by <b>Owl Post</b> at the start of the next block, and the quest goes straight onto their phones.'))
    rows = [[D['quests'][o['quest']]['title'] + (' (secret)' if D['quests'][o['quest']]['hidden'] else ''),
             PEOPLE.get(o['npc'], '') if o.get('npc') else (o.get('when') or ''), slot_label(o['from']), slot_label(o['to']),
             missed_label(o)] for o in D['offers']]
    out.append(('table', ['Quest', 'Given by', 'From', 'Until', 'If missed'], rows, [34, 40, 28, 28, 40]))
    out.append(('h2', 'The owl letters'))
    out.append(('p', 'What each missed-quest owl says. The players read it on their phones; the TV only shows that an owl arrived.'))
    for o in D['offers']:
        if o.get('owl'):
            out.append(('read', [f'<b>{D["quests"][o["quest"]]["title"]}</b>  <font size="9">(from {o["owl"]["from"]}, {who_label(o["owl"])})</font>',
                                 o['owl']['text']]))
    return out


def next_slot(key):
    d, b = key.split('-', 1)
    if d == '0':
        return f'0-{int(b) + 1}' if int(b) + 1 < len(D['prologue']) else f'1-{BLOCKS[0]}'
    i = BLOCKS.index(b)
    return f'{d}-{BLOCKS[i + 1]}' if i + 1 < len(BLOCKS) else f'{int(d) + 1}-{BLOCKS[0]}'


def who_label(owl):
    to = owl.get('to')
    if to == 'one':
        return 'to one student, chosen at random'
    if to and to.startswith('family:'):
        return f'to the {to[7:].title()} student'
    return 'to everyone'


def missed_label(o):
    if not o.get('owl'):
        return 'No owl: this is the finale.'
    d = next_slot(o['to'])
    if int(d.split('-')[0]) > D['days']:
        return 'Too late.'
    return f'Owl from {o["owl"]["from"]}, {slot_label(d)}'


GROUPS = [
    ('The staff', ['headmaster', 'flitwick', 'grimsby', 'longbottom', 'ashgrove', 'vance', 'scamander', 'hooch', 'librarian', 'matron', 'filch']),
    ('Students', ['sinclair-prefect', 'rival', 'collector', 'victim']),
    ('Castle folk and creatures', ['peeves', 'ghost', 'house-elf', 'centaur']),
    ('The prologue and Hogsmeade', ['goblin', 'ollivander', 'trolley-witch', 'landlady']),
    ('The painting', ['painting']),
]


def routine_summary(npc):
    r = D['routines'].get(npc)
    if not r:
        return 'Placed by the story (see Part 2).'
    base = r.get('base') or {}
    vals = [base.get(b) for b in BLOCKS if base.get(b)]
    if len(vals) == len(BLOCKS) and len(set(vals)) == 1:
        s = f'Usually {short(vals[0])}, all day and night.'
    else:
        parts = [f'{b}: {short(base.get(b))}' for b in BLOCKS if base.get(b)]
        s = 'Usually ' + '; '.join(parts) + '.' if parts else 'Only appears on particular days.'
    if r.get('days'):
        s += ' Changes on Day ' + ', '.join(sorted(r['days'].keys())) + ' (see Part 1).'
    return s


def people():
    out = [('chapter', 'Part 3', 'Conversations', 'Everyone the players can talk to, and what they will say.')]
    out.append(('p', 'Each topic is something the players might ask. Read the answer as written, or in your own words. '
                     'Topics unlock on the day shown. <b>Clue</b> means pin it on the suspect board; <b>Quest</b> means this is the moment to offer it. '
                     'The same text, with one-click buttons, appears on the GM screen when you tap the person on the map.'))
    seen = set()
    for title, ids in GROUPS + [('Others', [k for k in D['talk']])]:
        ids = [i for i in ids if i in D['talk'] and i not in seen]
        if not ids:
            continue
        out.append(('h2', title))
        for npc in ids:
            seen.add(npc)
            t = D['talk'][npc]
            out.append(('h3', PEOPLE.get(npc, npc)))
            out.append(('p', f'<b>Voice:</b> {t["voice"]}<br/><b>Wants:</b> {t["wants"]}<br/><b>Where:</b> {routine_summary(npc)}'))
            for x in t['topics']:
                when = f'Day {x.get("from", 0)}' if x.get('from', 0) else 'Prologue'
                if x.get('to') is not None and x.get('to') != x.get('from'):
                    when += f' to {"Day " + str(x["to"]) if x["to"] else "Prologue"}'
                elif x.get('to') is None and x.get('from', 0):
                    when += ' onward'
                tags = []
                if x.get('clue'):
                    tags.append(f'Clue: {D["clues"].get(x["clue"], x["clue"])}')
                if x.get('quest'):
                    tags.append(f'Quest: {D["quests"][x["quest"]]["title"]}')
                body = [f'<b>“{x["q"]}”</b> <font size="8" color="#8a6a3e">({when})</font>', x['a']]
                if tags:
                    body.append('<font size="9">' + ' · '.join(tags) + '</font>')
                out.append(('read', body))
                if x.get('note'):
                    out.append(('tip', x['note']))
    return out


def build(path):
    toc = TableOfContents(levelStyles=[G.ST['toc1'], G.ST['toc2']], dotsMinLevel=0)
    story = cover()
    story += [P('Contents', ParagraphStyle('contents', parent=G.ST['h2'], fontSize=22, leading=26, spaceAfter=10)), toc]
    intro = [('chapter', 'Before you begin', 'How the living castle works',
              'The castle runs on a timetable. You press one button; everyone goes where they should be.'),
             ('list', [
                 '<b>Advance time</b> (Day &amp; class tab) moves every person to their place for the new block, adds that block’s monsters, '
                 'clues, chests and hazards, and sends passing monsters away.',
                 '<b>The castle this block</b> panel, under the clock, lists who is where. Tap a name to read their conversation.',
                 '<b>Quests on offer</b> appear in the same panel with a Give button, and the person shows a little scroll on the TV.',
                 'On the <b>Table</b> tab, tap any person on the map to see what they can say today, with buttons to pin clues and give quests.',
                 'You can still move anyone by hand. They stay where you put them until their next scheduled move.',
                 '<b>Missed quests arrive by owl.</b> If a quest’s window closes and nobody took it, the person who would have given it '
                 'writes instead. See the end of Part 2.',
                 '<b>The scene counter</b> shows on the TV how much time is left this block: 2 things at lunch, 3 in free time, 2 at curfew, '
                 'none in class. Press <b>Scene done</b> after each thing the players do.',
             ]),
             ('h2', 'How much can they do in one block?'),
             ('p', 'One <b>scene</b> is going somewhere and doing one meaningful thing there: a proper conversation with one person, '
                   'searching a room, opening a chest, shopping, a fight, a puzzle, or sneaking somewhere. Walking through a place on the way is free.'),
             ('table', ['Block', 'Scenes', 'Feel', 'Real time'], [
                 ['Morning / Afternoon class', 'The class', 'Structured. Skipping class gives one free scene, but they miss the lesson.', '10 to 15 min'],
                 ['Lunch', '2', 'Quick: eat, gossip, one errand.', 'About 10 min'],
                 ['Free time', '3', 'The big exploring block. Quests and clues live here.', '20 to 30 min'],
                 ['Curfew', '2', 'Tense. Every move spins Out after curfew. Getting caught ends their curfew.', '10 to 15 min'],
                 ['No-class days (Hogsmeade, lockdown)', '3', 'Like free time.', '20 min'],
             ], [44, 18, 78, 30]),
             ('list', [
                 '<b>Say the budget out loud</b> at the start of the block. Choosing what to skip is the fun.',
                 '<b>Distance matters.</b> Next door is one scene. Somewhere far (the Forbidden Forest, the Astronomy Tower) takes a scene just to get there.',
                 '<b>Fights and puzzles end the block.</b> When they finish, the bell rings.',
                 '<b>Split party:</b> each group gets its own budget. Alternate one scene at a time between groups.',
                 '<b>Generous is fine.</b> The <b>+1</b> button gives one more scene when a moment deserves it.',
             ]),
             ('tip', 'Players lead. The schedule only says where people are; the players decide who to talk to. '
                     'If they miss someone important, a ghost, a portrait or an owl can nudge them.')]
    for blocks in (intro, where_tables(), appearances(), people()):
        story += G.render(blocks)
    TalkDoc(path).multiBuild(story)


if __name__ == '__main__':
    out = os.path.join(HERE, 'Conversation-Book.pdf')
    build(out)
    print('wrote', out)
