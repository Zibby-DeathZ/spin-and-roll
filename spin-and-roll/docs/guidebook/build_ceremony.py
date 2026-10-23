"""The Ceremony Book: every Ollivanders and Sorting Hat question, and what to say back.
Reads the questions straight from src/campaigns/hollow-heir-quizzes.js (needs Node), so it always matches the app.
Run: python3 build_ceremony.py"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_guidebook as B  # noqa: E402

SRC = os.path.abspath(os.path.join(HERE, '..', '..', 'src', 'campaigns', 'hollow-heir-quizzes.js'))
WOODS = {'holly': 'Holly', 'yew': 'Yew', 'vine': 'Vine', 'ash': 'Ash', 'hawthorn': 'Hawthorn', 'oak': 'Oak'}
CORES = {'phoenix': 'Phoenix feather', 'dragon': 'Dragon heartstring', 'unicorn': 'Unicorn hair'}


def load():
    js = f"import * as q from {json.dumps('file://' + SRC.replace(os.sep, '/'))}; console.log(JSON.stringify(q));"
    out = subprocess.run(['node', '--input-type=module', '-e', js], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def q_blocks(q, key, names):
    rows = [[o['text'], f"<b>{names.get(o[key], o[key])}</b>", f"<i>{o['reply']}</i>"] for o in q['options']]
    return [('h3', f"{q['id'].upper()} · {q['q']}"), ('table', ['If they answer…', 'Points to', 'Say'], rows, [50, 24, 96])]


class Mod:
    def __init__(self, blocks):
        self.BLOCKS = blocks


def build():
    d = load()
    wood = [q for q in d['wandPool'] if q['kind'] == 'wood']
    core = [q for q in d['wandPool'] if q['kind'] == 'core']
    houses = {h: h for h in ('Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin')}

    intro = [
        ('chapter', 'Before you begin', 'How to use this book', 'Every question either ceremony can ask, and the line to say back.'),
        ('p', f'Every student now gets a different set of questions. Ollivanders draws three questions about the wood and two about the core from a pool of '
              f'{len(wood)} and {len(core)}. The Sorting Hat draws five from a pool of {len(d["sortingPool"])}. Nobody hears the same question twice '
              'until the whole pool has been used, and the answers are shuffled each time, so the top answer is never always Gryffindor.'),
        ('p', 'With nine students, nobody in the room hears a repeated Sorting question, and only the last student or two at Ollivanders might.'),
        ('h2', 'Finding the right line'),
        ('list', [
            'The GM screen shows the code of the question on the TV (for example <b>S12</b> or <b>W07</b>). Questions are in code order in this book.',
            'Because the answers are shuffled, find the answer by its words, not its position.',
            'The GM screen also shows the line to say in a purple box the moment a player answers. This book is for when you would rather hold paper, or the Wi-Fi drops.',
            'At the end, read the verdict: the Hat’s shout for the house, or Ollivander’s two lines for the wood and the core.',
        ]),
        ('gm', 'Players tab: press 🪄 Wand questions or 🎩 Sorting Hat on a student’s card. The panel shows the code of the question on screen, a purple box with what to say, and every answer so far with its reply.'),
        ('h2', 'Playing the two voices'),
        ('table', ['', 'Mr Ollivander', 'The Sorting Hat'], [
            ['Sound', 'Soft, slow, a little too close. Never raises his voice.', 'Old, dry, amused. Talks to itself as much as to the student.'],
            ['Habit', 'Repeats a word he likes: “Curious… curious.” Remembers every wand he ever sold.', 'Hums and hmms. Sometimes argues with itself out loud.'],
            ['Trick', 'Lean in and stare at the player for a second too long before you speak.', 'Pause before the line. The longer the pause, the more the room leans in.'],
            ['Never', 'Hurries. Every customer is the only customer.', 'Mocks a student. Teases, yes. Mocks, never.'],
        ], [22, 74, 74]),
        ('tip', 'Before the next question, glance at the other players and say something to them as well: “And you, waiting there, don’t think I haven’t noticed you.” It keeps the whole table in the scene while one person answers.'),
        ('h2', 'When the answers tie'),
        ('p', 'Three wood questions often point at three different woods. When the panel shows a tie, pick the wood whose line got the best reaction from the table, or the one from the last answer, and say its verdict line as if you had known all along. You can also change the wood or core on the student’s card before you press Give this wand.'),
    ]

    wand = [
        ('chapter', 'Part 1', 'Ollivanders', 'Three wood questions, two core questions, and the moment the wand chooses.'),
        ('h2', 'Opening'),
        ('read', 'A narrow shop, dark and dusty, with thousands of thin boxes stacked to the ceiling. A bell tinkles somewhere far away. Then, from between the shelves, a pale old man appears without a sound. “Ah. I wondered when I would be seeing you.”'),
        ('say', 'Mr Ollivander', 'Hold out your wand arm. No, the other one. Yes. Now, a few questions. Answer honestly. The wand will know if you don’t.'),
        ('h2', 'Questions about the wood'),
        *[b for q in wood for b in q_blocks(q, 'wood', WOODS)],
        ('h2', 'Questions about the core'),
        *[b for q in core for b in q_blocks(q, 'core', CORES)],
        ('h2', 'The wand chooses'),
        ('read', 'He disappears into the shelves, mutters, and returns with a single box. He opens it like it might bite. “Try this.” The moment your fingers close around it, warmth runs up your arm and a ribbon of light curls from the tip.'),
        ('p', 'Say the wood line, then the core line, as one speech.'),
        ('table', ['Wood', 'Say'], [[f'<b>{WOODS[k]}</b>', f'<i>{v}</i>'] for k, v in d['wandVerdicts']['wood'].items()], [30, 140]),
        ('table', ['Core', 'Say'], [[f'<b>{CORES[k]}</b>', f'<i>{v}</i>'] for k, v in d['wandVerdicts']['core'].items()], [30, 140]),
        ('say', 'Mr Ollivander', 'Curious. Very curious. The wand chooses the wizard, you see. I think we can expect great things from you. Or terrible ones. Often it is the same thing.'),
    ]

    hat = [
        ('chapter', 'Part 2', 'The Sorting Hat', 'Five questions, one wish, and the shout the whole hall waits for.'),
        ('h2', 'Opening'),
        ('read', 'The hat is old and patched and frayed. As it settles on your head and slips over your eyes, the Great Hall goes dark and quiet, and a small voice speaks right inside your ear.'),
        ('say', 'The Sorting Hat', 'Hmm. Another one. Don’t fidget. I have sat on a thousand heads and I am not about to rush yours. Let us see what is in here…'),
        ('h2', 'The questions'),
        *[b for q in d['sortingPool'] for b in q_blocks(q, 'house', houses)],
        ('h2', 'The wish'),
        ('p', f'After the five questions, the TV asks: <i>{d["sortingWish"]["q"]}</i> If their wish is within one point of their best house, the Hat listens.'),
        ('table', ['If they ask for…', 'Say'], [[f'<b>{k}</b>', f'<i>{v}</i>'] for k, v in d['sortingWish']['replies'].items()], [40, 130]),
        ('h2', 'The verdict'),
        ('p', 'Pause. Let the room wait. Then shout the house so the whole table hears it. Two lines for each house, so the hall never hears the same shout twice in a row.'),
        ('table', ['House', 'Shout'], [[f'<b>{h}</b>', '<br/>'.join(f'<i>{x}</i>' for x in lines)] for h, lines in d['sortingVerdicts'].items()], [30, 140]),
        ('ifs', [
            ('They argue with the Hat', '“Argue all you like. I have never once been wrong. Well. Once. We don’t talk about that.”'),
            ('They try to cheat the questions', '“You are answering what you think I want to hear. Which tells me rather a lot.”'),
            ('The Hat takes a long time', '“Difficult. Very difficult. Plenty of courage, I see. Not a bad mind either…” Use this when the scores are close.'),
            ('Two friends want the same house', 'Let the wish matter, and say so: “Loyalty to a friend. Noted.”'),
        ]),
    ]

    B.book(os.path.join(HERE, 'Ceremony-Book.pdf'), 'The Ceremony Book', 'The Hollow Heir · Ceremony Book',
           'Ollivanders and the Sorting Hat: every question, every reply',
           f'{len(wood) + len(core)} wand questions and {len(d["sortingPool"])} Sorting questions, drawn at random for every student, with the line to say for every answer.',
           [Mod(intro), Mod(wand), Mod(hat)])


if __name__ == '__main__':
    build()
