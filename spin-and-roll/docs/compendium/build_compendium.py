"""
The Compendium: every item, spell, status and shop thing, in plain words, for when a student asks
"what does this do?". Built from compendium-data.json (exported from the campaign data).
Run:  python3 build_compendium.py
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'guidebook'))
sys.path.insert(0, os.path.join(HERE, '..', 'dm-guide'))
import build_guidebook as B  # noqa: E402

B.VERSION = '1.2'
D = json.load(open(os.path.join(HERE, 'compendium-data.json'), encoding='utf-8'))
STAT = {'str': 'STR', 'dex': 'DEX', 'con': 'CON', 'int': 'INT', 'wis': 'WIS', 'cha': 'CHA'}
STATUS = {k: v['name'] for k, v in D['statuses'].items()}


def dice(d):
    return f"{d.get('count', 1)}d{d['die']}" if d else ''


def spell_how(s):
    out = [f"{s['mana']} mana"]
    if s.get('minLevel'):
        out.append(f"level {s['minLevel']}+")
    if s.get('attack'):
        out.append(f"roll d20 + {STAT[s['hit']]} to hit" if s.get('hit') else 'attack')
        if s.get('damage') and s.get('dice'):
            out.append(f"{dice(s['dice'])} damage")
        if s.get('kill'):
            out.append('kills outright on a hit')
    elif s.get('check'):
        out.append(f"roll d20 + {STAT[s['check']]}: it works if you beat the difficulty")
    elif s.get('dice'):
        out.append(f"roll {dice(s['dice'])}: {s.get('effectLabel', '')}".strip(': '))
    else:
        out.append('no roll: it just works')
    for a in s.get('applies', []):
        t = a.get('turns')
        out.append(f"{STATUS.get(a['status'], a['status'])}{f' for {t} turn' + ('s' if t != 1 else '') if t else ''}{' (natural 20 only)' if a.get('nat20Only') else ''}")
    if s.get('removes'):
        out.append('cures ' + ', '.join(STATUS.get(x, x) for x in s['removes']))
    if s.get('onlyKind'):
        out.append(f"only works on {s['onlyKind'].replace('-', ' ')}")
    if s.get('targetAlly'):
        out.append('cast on a friend')
    if s.get('area') == 'all-enemies':
        out.append('hits every enemy in the room')
    if s.get('hpCost'):
        out.append(f"costs {s['hpCost']} HP")
    if s.get('hpCostChosen'):
        out.append(f"you choose how much HP to give; heals {s.get('heal', '')}")
    if s.get('lifesteal'):
        out.append(f"heals you {int(s['lifesteal'] * 100)}% of the damage")
    if s.get('corruption'):
        out.append(f"{'+' if s['corruption'] > 0 else ''}{s['corruption']} Corruption")
    return '; '.join(out) + '.'


def spell_row(sid, s):
    extra = []
    if s.get('nat20'):
        extra.append(f"<b>Natural 20:</b> {s['nat20']}.")
    if s.get('nat1'):
        extra.append(f"<b>Natural 1:</b> {s['nat1']}.")
    where = D['taught'].get(sid)
    if where:
        extra.append(f"<i>Taught: {', '.join(where)}.</i>")
    if s.get('source'):
        extra.append(f"<i>Learned from: {s['source']}.</i>")
    return [f"<b>{s['name']}</b>", f"{s.get('desc', '')}<br/>{spell_how(s)} {' '.join(extra)}"]


def item_does(i):
    e = i.get('effect') or {}
    parts = []
    if e.get('hp'):
        parts.append(f"Heals {e['hp']} HP when used.")
    if e.get('mana'):
        parts.append(f"Restores {e['mana']} mana when used.")
    if i.get('note'):
        n = i['note']
        parts.append(n if n[-1] in '.!?”"' else n + '.')
    if i.get('wheel'):
        parts.append('Using it spins a wheel on the TV.')
    return ' '.join(parts)


SHOP_OF = {it['item']: f"{sh['name']} ({it['price']})" for sh in D['shops'] for it in sh['stock'] if it.get('item')}


def item_where(iid):
    w = []
    if iid in SHOP_OF:
        w.append('Shop: ' + SHOP_OF[iid])
    if D['taught'].get(iid):
        w.append('Class: ' + ', '.join(D['taught'][iid]))
    if D['chestsHave'].get(iid):
        w.append('Chests: ' + ', '.join(sorted(set(D['chestsHave'][iid]))))
    return '. '.join(w) or 'Found in the story'


items = D['items']
consumables = [(k, i) for k, i in items.items() if i.get('kind') == 'consumable']
keys = [(k, i) for k, i in items.items() if i.get('kind') != 'consumable']
groups = [('class', 'Spells taught in class'), ('extra', 'More charms and jinxes'), ('herbology', 'Herbology spells (Green Thumb)'),
          ('advanced', 'Advanced spells')]
spells = D['spells']

BLOCKS = [
    ('chapter', 'Part 1', 'Things in the Bag', 'Potions, sweets and useful things. What they do and where they come from.'),
    ('p', 'Students use these from their <b>Bag</b> on their phone. Anything that heals or restores is applied by the game straight away; anything else (a re-spin, a reminder, overhearing someone) is yours to play out.'),
    ('table', ['Item', 'What it does', 'Where it comes from'],
     [[f"<b>{i['name']}</b>", item_does(i), item_where(k)] for k, i in consumables], [36, 80, 54]),
    ('h2', 'Keys, clues and story things'),
    ('p', 'Answer these only for a student who has the thing in their Bag. They cannot be used up, and Peeves and the Hungry Trunk cannot take the important ones.'),
    ('table', ['Item', 'What it is'], [[f"<b>{i['name']}</b>", item_does(i) or '—'] for k, i in keys], [50, 120]),

    ('chapter', 'Part 2', 'Spells', 'Every spell a first-year can learn, how to roll it, and what it does.'),
    ('p', '<b>How casting works:</b> the student taps the spell on their Dice tab. It costs mana. An <b>attack</b> spell rolls d20 plus a stat against the target’s Defence, then rolls damage on a hit. A <b>check</b> spell rolls d20 plus a stat against a difficulty you set (easy 10, medium 13, hard 16). A spell with <b>no roll</b> just works. Mana comes back after sleeping, or with a Focus Draught.'),
]
for g, title in groups:
    rows = [spell_row(k, s) for k, s in spells.items() if s.get('group') == g]
    if rows:
        BLOCKS += [('h2', title), ('table', ['Spell', 'What it does and how to roll it'], rows, [36, 134])]
dark = [spell_row(k, s) for k, s in spells.items() if s.get('group') == 'dark' or s.get('forbidden')]
BLOCKS += [
    ('h2', 'Dark and forbidden magic'),
    ('p', 'No first-year knows these. They come from forbidden books and dark mentors, most need a much higher level, and many cost Corruption. If a student asks, the honest answer is: “You have heard whispers. That is all.”'),
    ('table', ['Spell', 'What it does and how to roll it'], dark, [36, 134]),

    ('chapter', 'Part 3', 'Conditions', 'What happens when a spell or a creature leaves its mark.'),
    ('table', ['Condition', 'What it does'], [[f"<b>{v['name']}</b>", '; '.join(filter(None, [
        f"{v['damagePerTurn']} damage every turn" if v.get('damagePerTurn') else '',
        f"{v['damageDice']} damage every turn" if v.get('damageDice') else '',
        'skips their turn' if v.get('skipTurn') else '',
        'cannot cast spells' if v.get('cannotCast') else '',
        'rolls with disadvantage' if v.get('disadvantage') else '',
        'drops what they are holding' if v.get('dropsItem') else '',
        'someone else controls them' if v.get('controlled') else '',
        f"blocks the next {v['blocksHits']} hit" if v.get('blocksHits') else '',
        f"lasts {v['defaultDuration']} turns" if v.get('defaultDuration') else '',
        'lasts until someone ends it' if v.get('held') else '',
    ])) + '.'] for v in D['statuses'].values()], [40, 130]),

    ('chapter', 'Part 4', 'Checks', 'Every kind of roll you might ask for, which stat it uses, and what makes a student better at it.'),
    ('h2', 'How a check works'),
    ('p', 'When a student tries something that could fail, ask for a check. They roll a <b>d20 plus one stat bonus</b> on the <b>Dice</b> tab (pick d20, then the stat), and the result appears on the TV. Meet or beat the difficulty and it works.'),
    ('table', ['Difficulty', 'Number', 'For example'], [
        ['Very easy', '5', 'Remembering a professor’s name, climbing a low wall'],
        ['Easy', '10', 'Sneaking past a dozing portrait, calming a nervous owl'],
        ['Medium', '13', 'Picking a lock, lying to a prefect, finding a book fast'],
        ['Hard', '16', 'Sneaking past Filch, reading an ancient rune'],
        ['Very hard', '19', 'Lying to the Headmaster, outrunning a Thornback Boar'],
    ], [30, 20, 120]),
    ('list', [
        '<b>Advantage:</b> roll two d20s, keep the higher. Give it when something helps: a good plan, the right spell, a friend helping, the right family gift.',
        '<b>Disadvantage:</b> roll two, keep the lower. Give it when something hinders: darkness, panic, Fear, a broken wand.',
        '<b>Natural 20:</b> something wonderful. <b>Natural 1:</b> something disastrous (and funny).',
        '<b>The stat bonus</b> on the phone already includes everything: the family’s stats, the house bonus, the wand, the familiar and the books. The <b>MVP Badge</b> adds +2 more on top.',
    ]),
    ('h2', 'The checks'),
    ('p', 'This game only has six stats. Every “skill” from other tabletop games is just one of them. Say the name of the check (it sounds more exciting), and the student rolls the stat beside it.'),
    ('table', ['Check', 'Stat', 'When to ask for it', 'What makes them better'], [
        ['<b>Perception</b>', 'WIS', 'Noticing something hidden: a trap, a secret door, footsteps behind them, a chest that is breathing.', 'Cat or Kneazle (+1 WIS), Holly wand (+1 WIS). The Okafor is warned of traps and curses before anyone rolls.'],
        ['<b>Insight</b>', 'WIS', 'Is this person lying? Are they scared? What do they want?', 'Kneazle (senses untrustworthy people), a Pocket Sneakoscope (spins when someone lies).'],
        ['<b>Animal handling</b>', 'WIS', 'Calming, befriending or riding a creature.', 'Creature treats calm one instantly. The Thornbury talks to rats; the Penrose has a suitcase full of creatures.'],
        ['<b>Herbology</b>', 'WIS', 'Handling, naming or calming a plant.', 'The Fenwick (Green Thumb) rolls with advantage.'],
        ['<b>Investigation</b>', 'INT', 'Searching a room or a desk properly, piecing clues together.', 'Ravenclaw (+2 INT), Owl (+1 INT), New or Annotated books (+1 INT).'],
        ['<b>Knowledge</b>', 'INT', 'Remembering a fact: a creature’s weakness, a spell, a bit of castle history.', 'Same as Investigation. A Remembrall reminds them of one clue.'],
        ['<b>Sense magic</b>', 'INT', 'Feeling an enchantment, a curse or a hidden spell on something.', 'The Okafor (Curse-Breaker) feels curses without rolling. The Quill (The Sight) can ask what here is hidden or enchanted, once a day.'],
        ['<b>Potion-making</b>', 'INT', 'Brewing, or naming a potion by its smell.', 'A Brass cauldron (an extra spin), a Gold cauldron (an extra dose).'],
        ['<b>Stealth</b>', 'DEX', 'Sneaking past someone, hiding, moving after curfew.', 'Rat, Bowtruckle or Niffler (+1 DEX). The Invisibility Cloak needs no roll at all.'],
        ['<b>Sleight of hand</b>', 'DEX', 'Lifting a key, swapping an item, picking a lock, palming a card.', 'Bowtruckle (picks simple locks). The cloak gives advantage.'],
        ['<b>Acrobatics</b>', 'DEX', 'Dodging, balancing, jumping between moving staircases.', 'DEX familiars (+1 DEX).'],
        ['<b>Athletics</b>', 'STR', 'Climbing, forcing a door, holding on, swimming, wrestling something off a friend.', 'Gryffindor (+2 STR).'],
        ['<b>Endurance</b>', 'CON', 'Resisting poison, cold, a Mandrake’s scream, a curse; staying awake; drinking something awful.', 'Hufflepuff (+2 CON).'],
        ['<b>Persuasion</b>', 'CHA', 'Talking a teacher round, getting a favour, making a deal.', 'Slytherin (+2 CHA), Kneazle (+1 CHA), Yew wand (+1 CHA).'],
        ['<b>Deception</b>', 'CHA', 'Lying, bluffing Filch, forging a story.', 'Same as Persuasion. Careful: the Penrose’s hair changes colour when they lie.'],
        ['<b>Intimidation</b>', 'CHA', 'Scaring Peeves, a younger student, or a creature off.', 'Same as Persuasion.'],
        ['<b>Opening a chest</b>', 'DEX or INT', 'Small, Locked and Cursed chests use DEX; Ancient chests use INT (Part 6).', 'The Okafor rolls with advantage. Slytherins find half as much gold again.'],
    ], [28, 14, 66, 62]),

    ('h2', 'The Dreadful Roll'),
    ('p', 'The best trick in tabletop gaming. Just before a student does something ordinary (opens a chest, drinks a potion, sits down, picks something up), you stop them and say, very calmly: <b>“Before you do that… roll me a Perception check.”</b> They roll. You look at the number. You write it down. You say “Okay.” And nothing else.'),
    ('list', [
        '<b>Do it on safe things too.</b> At least two times out of three, nothing is wrong at all. That is the whole trick: they can never tell which time is real.',
        '<b>Never explain.</b> Write the number down, nod slowly, maybe say “Hm.” Do not answer “why?”',
        '<b>Be fair when it is real.</b> When there really is a mimic or a trap, a good roll gets a real warning (see the table). A bad roll gets nothing, and then the lid opens.',
        '<b>Once or twice a session</b> is plenty. More than that and it stops being scary.',
    ]),
    ('table', ['You ask for', 'Just before', 'If something IS wrong (13 or more)', 'If nothing is wrong'], [
        ['Perception (WIS)', 'Opening a chest', '“The keyhole… blinks.” (A mimic.) Or: “There is a needle in the lock, glistening.” (A trap.)', '“It is a chest.” Pause. “Probably.”'],
        ['Perception (WIS)', 'Picking up a Mandrake leaf (Day 2)', '“The leaf is… breathing.” (The Wailing Mandrake.)', '“It is a leaf. A very good leaf.”'],
        ['Endurance (CON)', 'Drinking a potion or eating a sweet', '“It tastes of pennies and something worse.” They know before it hits.', '“Delicious.” Then, very quietly: “…for now.”'],
        ['Insight (WIS)', 'Accepting a teacher’s kind offer', '“His smile stays a moment too long.”', '“He seems nice.” Write something down.'],
        ['Stealth (DEX)', 'Walking down an empty corridor', '“You hear a second set of footsteps stop when yours do.”', '“Nobody sees you.” Look at the portraits on the wall. Say nothing.'],
        ['Everyone: initiative', 'Nothing at all', 'A fight really starts.', 'Write all the numbers down. Wait. Then Peeves drops a water balloon. Use this once a campaign.'],
    ], [26, 30, 64, 50]),
    ('tip', 'A great variation: “Who has the highest Perception here?” Let them work it out (it is the Thornbury or the Quill). Then: “Just you. Come here.” Whisper something harmless to them. Send them back. Say nothing to the others.'),

    ('h2', 'Who is best at what (this party)'),
    ('p', 'Their bonuses on 12 November, with house, wand, familiar and books included. Buying new gear changes these; the Players tab always shows the real numbers.'),
    ('table', ['Student', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'], [['<b>Blackwood</b> (Ash)', '+0', '+0', '+1', '+3', '+1', '+2'], ['<b>Fenwick</b> (Arthur)', '+0', '+2', '+2', '+2', '-1', '+2'], ['<b>Okafor</b> (Inzaw)', '+0', '+1', '+2', '+2', '+1', '+0'], ['<b>Penrose</b> (Cass)', '-1', '+2', '+0', '+1', '+0', '+4'], ['<b>Quill</b> (Danny)', '-1', '+1', '+0', '+3', '+2', '+2'], ['<b>Sinclair</b> (Rose)', '+2', '+1', '+2', '+3', '+0', '-1'], ['<b>Thornbury</b> (John)', '+1', '+0', '+2', '+1', '+2', '+1']], [40, 21, 21, 22, 22, 22, 22]),
    ('table', ['For', 'Stat', 'Best in the party'], [['Perception, Insight, creatures, plants', 'WIS', 'Quill, Thornbury (+2)'], ['Investigation, Knowledge, Sense magic', 'INT', 'Blackwood, Quill, Sinclair (+3)'], ['Stealth, Sleight of hand, Acrobatics', 'DEX', 'Fenwick, Penrose (+2)'], ['Athletics', 'STR', 'Sinclair (+2)'], ['Endurance', 'CON', 'Fenwick, Okafor, Sinclair, Thornbury (+2)'], ['Persuasion, Deception, Intimidation', 'CHA', 'Penrose (+4)']], [70, 16, 84]),

    ('chapter', 'Part 5', 'Shops and gear', 'What things cost and what they give. Gear is worn from the Bag and its bonus counts all the time.'),
]
for sh in D['shops']:
    BLOCKS += [('h2', sh['name']), ('table', ['Item', 'Price', 'What it gives'],
               [[f"<b>{it.get('name') or items[it['item']]['name']}</b>", f"{it['price']} {D['currency']['name']}",
                 it.get('desc') or item_does(items[it['item']])] for it in sh['stock']], [56, 26, 88])]
BLOCKS += [
    ('chapter', 'Part 6', 'Chests', 'What is inside, and how hard they are to open.'),
    ('table', ['Chest', 'To open', 'Galleons', 'Items inside'], [
        [f"<b>{c['name']}</b>", f"{STAT[c['stat']]} {c['dc']}", f"{c['gold'][0]} to {c['gold'][1]}",
         f"{c.get('picks', 1)} of: " + ', '.join(items[i]['name'] for i in c['loot']) + (f". <b>Trapped:</b> {c['trap']} damage if the roll fails." if c.get('trap') else '')]
        for c in D['chests'].values()], [32, 22, 24, 92]),
    ('gm', '<b>A natural 20</b> on a chest: give the most Galleons and the best items on its list. <b>A natural 1</b>: the lid snaps shut on their fingers (1 HP) and it stays locked until tomorrow.'),
]
beans = D['wheels'].get('beans')
if beans:
    BLOCKS += [('h2', 'Bertie Bott’s Every Flavour Beans'), ('p', 'Eating them spins this wheel on the TV:'),
               ('table', ['Flavour', 'What happens'], [[a, b] for a, b in beans['segments']], [40, 130])]

if __name__ == '__main__':
    import types
    import students
    mod = types.SimpleNamespace(BLOCKS=BLOCKS + students.BLOCKS)
    B.book(os.path.join(HERE, 'Compendium.pdf'), 'The Compendium', 'The Hollow Heir · Compendium',
           'Every item, spell and condition, and every student at the table',
           'For when a student holds something up and asks: “What does this do?”', [mod])
