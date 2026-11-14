"""
Part 7 of the Compendium: one page per student at the table. Their family ability, their secret gift,
their house trait, and how to rule it when they use it. Plus who they are and where their story goes.
Numbers come from mods.json (their bonuses on 12 November) and the campaign data.
"""

MODS = {  # STR DEX CON INT WIS CHA, on 12 November, everything included
    'Blackwood': (0, 0, 1, 3, 1, 2), 'Fenwick': (0, 2, 2, 2, -1, 2), 'Okafor': (0, 1, 2, 2, 1, 0),
    'Penrose': (-1, 2, 0, 1, 0, 4), 'Quill': (-1, 1, 0, 3, 2, 2), 'Sinclair': (2, 1, 2, 3, 0, -1),
    'Thornbury': (1, 0, 2, 1, 2, 1),
}


def mods(fam):
    names = ('STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA')
    return ' · '.join(f"{n} {'+' if v >= 0 else '−'}{abs(v)}" for n, v in zip(names, MODS[fam]))


HOUSE = {
    'Gryffindor': '<b>Nerve.</b> +2 STR (already in the numbers). Once a day, the first natural 1 they roll is re-rolled by itself. The app does it; you will see it on the TV.',
    'Ravenclaw': '<b>Wit.</b> +2 INT (already in the numbers). Once a day they can tap <b>Ask for a hint</b> on a puzzle, and you give one. A hint is a nudge, not the answer: point at the right object, or confirm one letter.',
    'Slytherin': '<b>Cunning.</b> +2 CHA (already in the numbers). Every chest they open gives half as much gold again. The app adds it.',
    'Hufflepuff': '<b>Steadfast.</b> +2 CON (already in the numbers). Once a day, a hit that would knock them out leaves them on 1 HP instead. Describe it: they should have gone down, and they did not.',
}


def student(fam, *a, first_page=False, **k):
    out = _student(fam, *a, **k)
    return out[1:] if first_page else out


def _student(fam, first, player, house, blood, wealth, hp, gear, ability, ability_rules, gift, gift_rules,
            story, secret, so_far, hooks, voice, line):
    return [
        ('break',),
        ('h2', f'{first} {fam}'),
        ('p', f'<i>Played by {player}. {house}. {blood}, {wealth}.</i>'),
        ('kv', [
            ('Rolls', mods(fam)),
            ('HP', f'{hp} at full health'),
            ('Carries', gear),
            ('House trait', HOUSE[house]),
        ]),
        ('h3', f'Family ability: {ability[0]}'),
        ('kv', [('Always', ability[1]), ('Once a day', ability[2]), ('Drawback', ability[3])]),
        ('p', '<b>When they use it:</b>'),
        ('ifs', ability_rules),
        ('h3', f'Secret gift: {gift[0]}'),
        ('kv', [('Always', gift[1]), ('Once a day', gift[2]), ('Drawback', gift[3])]),
        ('p', '<b>When they use it:</b>'),
        ('ifs', gift_rules),
        ('h3', 'Who they are'),
        ('p', story),
        ('p', f'<b>The family secret:</b> {secret}'),
        ('p', f'<b>So far:</b> {so_far}'),
        ('p', '<b>Where their story goes:</b>'),
        ('list', hooks),
        ('p', f'<b>Playing to them:</b> {voice}'),
        ('say', 'A portrait, as they pass', line),
    ]


BLOCKS = [
    ('chapter', 'Part 7', 'The students', 'One page for each student at your table: what their family ability and secret gift do, how to rule them in the moment, and who they are.'),
    ('h2', 'How their powers work'),
    ('p', 'Every student has three things on top of their rolls. Each of them recharges when the student sleeps (the start of a new day).'),
    ('table', ['What', 'Who knows', 'How they use it', 'What you do'], [
        ['<b>Family ability</b>', 'Everyone. It is on their phone and their family is famous for it.', 'They tap <b>Use</b> on their phone. It is announced on the TV and greys out until tomorrow.', 'Make it happen, big and out loud. The rulings on their page help.'],
        ['<b>Secret gift</b>', 'Only them and you. Nobody at Hogwarts knows.', 'They tell you quietly, or show you the card on their phone.', 'Tick <b>Used today</b> on the Players tab. Describe it to them alone if you can (a note, a whisper, a text).'],
        ['<b>House trait</b>', 'Everyone.', 'Gryffindor and Slytherin traits happen by themselves. Ravenclaws tap <b>Ask for a hint</b>; Hufflepuffs are saved by the app.', 'Give the Ravenclaw hint when asked. Describe the Hufflepuff save dramatically.'],
    ], [26, 38, 52, 54]),
    ('h3', 'Ruling a power you did not plan for'),
    ('list', [
        '<b>Say yes, then add a cost.</b> If the use is clever, let it work. If it is too strong, let it work and add a small price: noise, a witness, a point lost, a favour owed.',
        '<b>The “always” part never needs a roll.</b> The Okafor feels a curse, the Quill sees through a disguise, the Thornbury is never attacked first by a creature. Just tell them.',
        '<b>The once-a-day part beats a roll.</b> When they spend it, it works. Do not make them roll for something they paid for.',
        '<b>Drawbacks are gifts to you.</b> Use one each session per student. They make the best stories, and the players chose them knowing.',
        '<b>Answers from creatures, plants and portraits</b> are short and in character: feelings, images, three or four words. Never a full paragraph of plot.',
        '<b>Protect the mystery.</b> No power reveals who the Hollow Heir is, or what the covered painting holds, before Day 4. Powers find clues; they do not skip the story.',
    ]),
    ('h3', 'Today’s checklist'),
    ('table', ['Student', 'Morning roll', 'Once a day (family)', 'Once a day (secret)'], [
        ['Blackwood', '', 'One true answer from a portrait', 'Ask the spiders what they saw (costs food)'],
        ['Fenwick', '', 'Open the map for 60 seconds', 'Ask a plant for help'],
        ['Okafor', '', 'Break one curse, ward or trap', 'Wear the cloak for one scene'],
        ['Penrose', 'd20: 1 to 4, something escaped the suitcase', 'Wear someone’s face for one scene', 'Let one creature out of the suitcase'],
        ['Quill', '', 'Ask: what here is hidden or enchanted?', 'Send the Mirror Self for one scene'],
        ['Sinclair', 'd20: 1 to 6, late for morning class', 'Re-roll one d20 in a fight', 'Burst into a scene already started'],
        ['Thornbury', '', 'Ask a creature what it has seen', 'Send a rat to listen for one block'],
    ], [24, 46, 50, 50]),
]

BLOCKS += student(
    'Blackwood', 'Ash', 'Ashwin Singh', 'Gryffindor', 'Pureblood', 'an overflowing vault', 24,
    'Vine wand with a phoenix feather core (+1 spell damage). Dragonhide-lined robes (+3 Defence, +4 max HP). A Niffler (+1 DEX, sniffs out treasure). Annotated books. A Pocket Sneakoscope. The second ring’s star chart.',
    ('Portrait Whisperer',
     'Portraits recognise the Blackwood name and talk to them freely, when they would ignore any other student.',
     'Ask any portrait one question. It must answer truthfully.',
     'Portraits gossip. When the Blackwood breaks a rule near one, spin (or roll a d20; 1 to 8) to see if a teacher hears about it.'),
    [
        ('They ask a portrait anything, any time (no power used)', 'It answers politely, but it can lie, flatter or change the subject. Portraits love the Blackwood name. Use them for directions, castle gossip, and who walked past.'),
        ('They use the power: one true question', 'The portrait must answer truthfully, but only what it saw or knows, in its own words. A portrait that saw nothing says so. Good questions get great answers.'),
        ('Best use (Day 3)', 'A portrait in the library corridor, asked what it saw: it answers, terrified, “A painted man. Climbing out.”'),
        ('They ask about the covered painting', 'Every portrait in the castle goes silent at once. One whispers: “We do not speak of the guest.” That is the true answer: they are afraid.'),
        ('They ask who the Hollow Heir is', 'Before Day 4: “The one who wears the faces.” True, and useless until later.'),
        ('They break a rule near a portrait', 'Roll a d20 for the gossip: 1 to 8, a teacher hears by the next block (−5 house points, or a teacher “just happens” to pass). A Blackwood with a pastry for the portrait can buy its silence.'),
    ],
    ('Spider-Speech',
     'They understand the spiders in every corner of the castle, and the spiders understand them. Spiders notice everything.',
     'Ask the spiders in a room what they saw there since yesterday. The answer is a few short, whispery words.',
     'Spiders want paying: one food item from the Bag, or they ignore the Blackwood until tomorrow. And they will not go anywhere near the covered painting.'),
    [
        ('They ask the spiders (once a day)', 'Take a food item off them (pumpkin pasty, chocolate frog, beans). Then answer in four or five whispered words: “Two came. Red cloth. Downstairs.” Keep it short and creepy-funny.'),
        ('They try without food', 'Silence. Then, much later, a single word: “Rude.”'),
        ('Near the covered painting', 'The spiders have fled the room. That empty corner is the answer: something there frightens even them.'),
        ('They share food with the table first (Day 1)', 'It still counts as the payment if the spiders saw them do it. Spiders like generosity.'),
        ('In a fight', 'Spiders cannot fight for them. They can warn: “Behind you.” Give advantage on the next defence roll, once.'),
    ],
    'One of the oldest wizarding families in Britain. Portraits of Blackwoods line every wall of the family manor, and all of them have opinions about Ash. A Gryffindor in a family of mostly Slytherins, which the portraits at home have not stopped talking about.',
    'Grandmother’s diary mentions “the painted man” and a debt the Blackwoods never paid. Centuries ago, a Blackwood sealed a dark wizard inside a painting. That wizard is Vale.',
    'On Day 1 Ash used the spiders, shared pumpkin pasties with the others, and found the star chart for the second ring.',
    [
        'When the name <b>Vale</b> appears (Day 4), the Blackwood recognises it from grandmother’s diary. Let them be the one who says the debt out loud.',
        'An owl from home (any day): a portrait at the manor has been turned to face the wall, and nobody will say why.',
        'The covered painting knows the Blackwood name too. Up close, it says “Blackwood” in a voice like a smile. Only they hear it.',
    ],
    'Old-family confidence, a bit of a show-off. Let portraits treat them like a celebrity, and let that go to their head before it gets them in trouble.',
    '“Master Blackwood! Your great-great-uncle owed me four Sickles. I suppose it would be vulgar to mention it.”',
    first_page=True,
)

BLOCKS += student(
    'Fenwick', 'Arthur', 'Captain Neo', 'Hufflepuff', 'Half-blood', 'a healthy vault', 20,
    'Oak wand with a unicorn hair core (+1 STR, +4 mana). An Owl (+1 INT, delivers items). Annotated books. A Gold cauldron (an extra dose of every potion). Half of the Marauder’s Map. A Pocket Sneakoscope.',
    ('Marauder’s Legacy',
     'Their great-uncle ran with the Marauders and left them his half of the map. It wakes only for the right words. Tiny runes are scratched along its torn edge.',
     'Open the map from the Bag: say the words into the phone, and the whole table sees everyone’s footsteps and every treasure on their half of the castle for 60 seconds.',
     'Half the map is missing and the ink fades fast. Finding the other half is a side quest only they know about.'),
    [
        ('They open the map (once a day)', 'The TV shows the footsteps for 60 seconds. Make the room go quiet. Let the table shout what they see; do not explain it for them.'),
        ('They read something odd on it', 'Footsteps where nobody should be. Two sets of footsteps with the same name. Treat anything strange as a real clue.'),
        ('Somebody is under the Invisibility Cloak', 'The map still shows them. A lovely moment if the Okafor is sneaking.'),
        ('A teacher sees the map (as on Day 1)', 'It shows blank parchment to anyone else. A teacher who has seen one before narrows their eyes: “Mischief managed, I hope.” They remember the Fenwick from now on.'),
        ('They look for the other half', 'Cassius has it (Day 4, Lunch, the Courtyard). Before then: footsteps on the map stop at the torn edge and carry on off it.'),
    ],
    ('Green Thumb',
     'Plants like them. They know any plant on sight (what it does and whether it bites), roll with advantage in Herbology, and can learn Herbology spells nobody else is taught.',
     'Ask a plant for help: a vine lowers itself for them to climb, a hedge parts, a Mandrake stays quiet, or the grass tells them who walked past.',
     'Plants feel what they feel. When the Fenwick is angry or frightened, the plants around them go wild. And Devil’s Snare always grabs them first.'),
    [
        ('They ask a plant for help (once a day)', 'It works. The plant answers in movements and feelings: the grass flattens toward the lake, a vine shivers when a name is said.'),
        ('Day 2: the Wailing Mandrake', 'Their gift is the best tool here. Asked, the real Mandrakes go quiet and lean away from one pot. That pot is the mimic.'),
        ('Mandrake Repotting (Day 2 class)', 'Advantage on their rolls. If they calm a Mandrake for the whole class, give the class +5 points.'),
        ('They are angry or scared near plants', 'Roots heave, a vine knocks something over, a Venomous Tentacula leans over. Funny first, dangerous only in a real fight.'),
        ('Devil’s Snare (Day 3 onwards)', 'It grabs them first, every time. The table has to save them (Lumos or a fire spell).'),
        ('They make friends with ghosts (Day 1, Borish)', 'Not a plant thing, but in keeping: the Fenwick is the one creatures and spirits trust. Borish follows them, rolling a d20 for legendary finds.'),
    ],
    'The family runs Fenwick’s Fizzing Follies, a joke shop on Diagon Alley. Arthur grew up testing products nobody else would touch, and the Fenwicks have always been on the edge of trouble, and on the side of the people in it.',
    'Their great-uncle copied the Marauder’s Map before he was expelled, and it was torn in half in a duel. Someone at Hogwarts has the other half, and they have been watching the Fenwick.',
    'On Day 1 Arthur tried politely talking to Peeves (who vanished), made friends with the ghost Borish, and a professor noticed his map. He can read the Marauder’s words.',
    [
        'The professor who saw the map remembers it. Pay it off with a quiet word on Day 3: “Your great-uncle sat in that very seat. He was expelled, you know.”',
        'Cassius holds the other half (Day 4). When the halves meet, both maps show the whole castle, and the footsteps of someone who is not on any register.',
        'Borish: let his legendary d20 rolls turn up one real clue before Day 4 (an old map fragment, a key, a page).',
    ],
    'A good-natured prankster who is kinder than he lets on. Reward the polite approach, even when it backfires.',
    '“A Fenwick! Is the joke shop still open? Your grandfather sold me a quill that wrote only insults. I loved it.”',
)

BLOCKS += student(
    'Okafor', 'Inzaw', 'Tarek', 'Hufflepuff', 'Half-blood', 'a healthy vault', 20,
    'Ash wand with a unicorn hair core (loyal for life, +4 mana). A Kneazle (+1 WIS, +1 CHA, senses untrustworthy people). Used books. The Invisibility Cloak. MVP of Day 1.',
    ('Curse-Breaker',
     'They feel curses, wards and traps before they trigger them: you warn them when one is close. Advantage on opening locked or cursed chests.',
     'Break one curse, ward or magical trap outright: a cursed chest opens safely, a hex fades, a trap fizzles. It cannot solve a puzzle lock or wake a drained student.',
     'Curses bite back. Each time they break one, spin (or roll a d20): sometimes a little of it sticks to them.'),
    [
        ('They come near a curse, ward or trap', 'Tell them before they touch it, no roll: “Your fingertips go cold. Something here does not want to be opened.” This is the “always” part.'),
        ('They break one (once a day)', 'It works, no roll. Then roll a d20 for the bite-back: 1 to 5, a little sticks (1d4 damage, or a status for a turn: Fear, Silence, a Jinx). 6 to 20, nothing.'),
        ('A cursed or locked chest', 'Advantage on the roll to open it, every time, without using the power. Spend the power only on a chest that would hurt them.'),
        ('The Restricted Section gate (Day 2)', 'The keys are with the Headmaster and the librarian, but the lock is warded. He can break the ward. The gate swings open. Once a day: it uses today’s power.'),
        ('A puzzle lock or a drained student', 'It does not work: those are not curses. Tell them clearly so they do not feel cheated: “There is nothing to break. It is a riddle, not a hex.”'),
        ('The covered painting (Day 4)', 'They feel exactly what their mother felt: something inside, awake, pressing back. They can break the outer ward, but the thing inside stays. Do not let one roll end the story.'),
    ],
    ('The Invisibility Cloak',
     'They own a real Invisibility Cloak, silvery and light as water. Under it, nobody can see them.',
     'Wear it for one scene a day. Unseen, they can slip past anyone; in a fight their first attack has advantage (after that, everyone knows where they are).',
     'It hides them, not sound, smell or footprints. The Marauder’s Map still shows them, creatures smell them, ghosts walk straight through, and the Quill’s Sight sees a shimmer. Two can hide under it only if both pass a DEX roll. A teacher who catches them takes it for a week.'),
    [
        ('They wear it (once a day, one scene)', 'No Stealth roll to be unseen. Ask for a roll only for noise (DEX 10 to walk quietly past a sleeping guard; 14 past Filch).'),
        ('Day 1: into the Restricted Section', 'He got past the librarian, but the gate was locked. That is fair: the cloak hides, it does not open.'),
        ('Two under the cloak', 'Both roll DEX 12. One fails: a foot shows, a sneeze, an elbow. Everyone nearby gets a Perception roll.'),
        ('Creatures, Mrs Norris, ghosts', 'Creatures smell them (Mrs Norris stares at empty air and yowls). Ghosts drift through them, shivering. Use it for comedy.'),
        ('A teacher catches them', 'The cloak is confiscated for a week. Write it in the GM notes. A clever plan to get it back is a whole side quest.'),
        ('In a fight', 'First attack with advantage, then they are seen. One scene only.'),
    ],
    'Their mum breaks curses on ancient tombs for Gringotts, and their dad is a Muggle engineer who still cannot quite believe any of it. Inzaw has been picking enchanted locks since he was six. Day 1’s MVP, and the student the others look to when something is locked.',
    'Last month Gringotts sent their mum to inspect a painting before it was shipped to Hogwarts. She refused to unwrap it and wrote one word in her report: <b>Occupied</b>. It was sent anyway.',
    'MVP of Day 1. He wore the cloak into the Restricted Section, got past the librarian but not the gate. His diary guessed that the mirror holds an item that needs all the houses together (right: the Silver Memory), and that a forbidden spell sits behind three puzzles of runes (half right: the tablets).',
    [
        'He returns to the Restricted Section with Curse-Breaker (Day 2) and breaks the ward. Inside, the chained books: a d6 each (Day 2 Book).',
        'An owl from his mum (Day 3): “Did they hang it? Do NOT touch it. Promise me.” He will touch it.',
        'Day 4: hand on the covered painting. Read him the feeling privately, then let him tell the table in his own words.',
    ],
    'Practical and brave; he likes being the expert. Give him locks, wards and chests, and let him explain to the others how curses work.',
    '“Careful, young man. That door bites. Oh, it is you. Then the door had better be careful.”',
)

BLOCKS += student(
    'Penrose', 'Cass', 'TheWhoWot', 'Slytherin', 'Half-blood', 'a healthy vault', 18,
    'Hawthorn wand with a unicorn hair core (quick but hard to master, +4 mana). A Cat (+1 WIS, hisses at hidden danger). New books. The battered suitcase.',
    ('Metamorphmagus',
     'They can change hair, eyes and face at will. Advantage on rolls to avoid being recognised or blamed.',
     'Take on the face of someone they have seen, for one scene. Only their voice and wand can give them away.',
     'Strong feelings show. When they are frightened, angry or lying, their hair changes colour, and you tell the table.'),
    [
        ('Small changes, any time (no power used)', 'Hair, eyes, a different nose: free. Advantage to slip away from a teacher who saw “someone” do it.'),
        ('A whole face (once a day, one scene)', 'It works. Nobody sees through it by looking. The voice gives them away: if they speak to someone who knows the real person well, that person rolls Insight (WIS 13).'),
        ('A prefect’s face, to get somewhere', 'Classic and great. Into the Restricted Section, the prefects’ bathroom, past a portrait guard. Let a good plan beat a roll.'),
        ('Filch’s face, to scare Peeves', 'Peeves flees, then comes back with the real Filch. Pure chaos; give it.'),
        ('They lie, or are scared or angry', 'Say out loud: “Cass’s hair has just gone bright yellow.” (Red for anger, white for fear, yellow for lying.) Every time, it is the best drawback in the game.'),
        ('They copy the Headmaster or Ashgrove', 'It works, but the Sorting Hat, the Quill’s Sight and the covered painting see through any face. The painting likes them for it: “A face-changer. How useful.”'),
    ],
    ('The Battered Suitcase',
     'An old suitcase with the initials N.S. worn into the handle. Inside is a whole world of magical creatures, and they let the Penrose in.',
     'Let one creature out to help for a scene: a Niffler sniffs out something shiny or hidden, a Bowtruckle picks a small lock, or an Occamy squeezes into any gap to fetch something.',
     'Things get out. Each morning roll a d20: on 1 to 4 something escaped in the night and is causing chaos somewhere. Catch it before a teacher does, or the case is confiscated. Professor Scamander would very much like to know where they got it.'),
    [
        ('A Niffler', 'Finds one shiny or hidden thing in the room: a coin, a key, a loose stone with something behind it. Then it tries to keep it (DEX 10 to get it back).'),
        ('A Bowtruckle', 'Picks one small, ordinary lock. Not a warded or cursed one (that is the Okafor’s job), and not a puzzle.'),
        ('An Occamy', 'Squeezes into any gap to fetch one thing it can carry. It grows to fill the space, so getting it back out is funny.'),
        ('The morning roll (1 to 4)', 'Use the d4 table in that day’s Day Book. Tell the Penrose privately. If it is not caught by Curfew, the case is confiscated for a few days.'),
        ('Scamander sees the case (Day 3, Care of Magical Creatures)', '“Where did you get that? I have only ever seen one like it.” Do not answer for them. Let them choose how much to say.'),
    ],
    'A noisy Cornish family who run a wizarding theatre in Penzance. Half the relatives can change their faces, and family photos are a nightmare. Cass is the actor of the table: watchful, funny, and always half in costume.',
    'Their great-great-grandmother sat for a famous portrait painter and came home unable to change her face ever again. The painting was never delivered, and nobody knows where it went. It is one of Vale’s.',
    'On Day 1 Cass opened the Astronomy Tower chest (20 Galleons, a Focus Draught and a Wiggenweld). Their diary noticed the painting being moved to the Dungeons under a red cloth, guessed that the stolen boomslang skin and lacewing flies mean Polyjuice, wondered if Scamander is related, and noted that “Boris’s” ghost finds hidden items.',
    [
        'The Polyjuice guess: let them keep it. On Day 4, when the Painted Double appears, they will feel they called it (and they half did).',
        'Day 4: a new painting by the door of Ashgrove’s classroom. A young woman in old clothes, her face frozen. It is the great-great-grandmother.',
        'N.S. on the suitcase: the Scamander link pays off on Day 3. What it means for the family is yours to decide later.',
    ],
    'Theatrical, loves a disguise and a lie. Make the hair colour a running joke the table waits for.',
    '“Have we met? You look like someone. You look like everyone, actually. How tiring for you.”',
)

BLOCKS += student(
    'Quill', 'Danny', 'Daniel Nand', 'Ravenclaw', 'Muggle-born', 'the Hogwarts school fund', 18,
    'Yew wand with a dragon heartstring core (chooses the strong-willed, +2 spell damage). A Rat (+1 DEX, squeezes through gaps). Used books.',
    ('The Sight',
     'They see through disguises, glamours and magical illusions that fool everyone else.',
     'Ask the DM: “What here is hidden or enchanted?” and get an honest answer.',
     'Visions come uninvited. Sometimes you show them something they would rather not have seen.'),
    [
        ('A disguise, glamour or illusion (no power used)', 'They just see through it. The Penrose in someone else’s face, a mimic pretending to be a chest, the Painted Double: tell the Quill privately what they really see.'),
        ('They ask: what here is hidden or enchanted? (once a day)', 'Answer honestly and specifically for this room: “The third book on that shelf. The window latch. And the painting, all of it.”'),
        ('Best use (Ashgrove’s classroom)', '“Every painting. All of them.” Let it land. Say nothing more.'),
        ('An uninvited vision', 'Once a session, at a quiet moment, pass them a note: a painted eye opening, a staircase that goes down forever, a girl with grey skin. Clues, but frightening ones.'),
        ('The Invisibility Cloak', 'They see a shimmer where the Okafor is. Fun when the table is trying to sneak.'),
    ],
    ('Mirror Self',
     'They can make a magical illusion of themselves. It looks, moves and smiles like them, but it cannot speak or touch anything.',
     'For one scene, send the illusion somewhere they are not: as a decoy, an alibi, or to walk into danger first. In a fight, the first attack that would hit them hits the illusion instead, and it pops.',
     'While it is up they cannot cast spells. If it is hit or touched it bursts, and they feel it: 1d4 damage. And something else in this castle copies people. It has noticed them.'),
    [
        ('As a decoy or an alibi', 'It works until someone touches it or speaks to it and waits for an answer. A teacher who sees it “in class” while the Quill is elsewhere is fooled, for the scene.'),
        ('Walking into danger first', 'Traps fire on it, mimics bite it, monsters chase it. It bursts: 1d4 damage to the Quill, and they learn what was there.'),
        ('In a fight', 'The first attack that would hit them hits the illusion. No spells while it is up: they choose when to let it go.'),
        ('The Painted Double notices (Day 3 onwards)', 'Once, the Double copies the Quill. Two Quills in a corridor. Only the real one cannot see through itself. Tell them privately and watch them try to prove who they are.'),
    ],
    'Until their letter came, Danny thought the strange things around him were coincidences. His parents are dentists, thrilled and terrified in equal measure. Everything at Hogwarts is new to him, which makes him the one who asks the questions everyone else forgot to.',
    'On the train he was the only one who saw the covered painting’s eyes follow him. It happens again every time he passes one of its kind.',
    'On Day 1 the Thornbury took 5 Galleons off him.',
    [
        'Day 1 Curfew: the dream of the painted eye. If you did not use it, use it tonight.',
        'The covered painting’s eyes follow only the Quill. Each time, tell them privately. Let them be the one to warn the others, in their words.',
        'Mirror Self and the Painted Double are both copies. On Day 4 the Quill may be the only one who can tell the real Ashgrove from the painted one.',
    ],
    'Wide-eyed, clever, a bit out of their depth. Let them notice what nobody else does, and let the table hear it from them, not from you.',
    '“A Muggle-born? How marvellous. Do your parents still use those little metal drills? Tell me everything.”',
)

BLOCKS += student(
    'Sinclair', 'Rose', 'Rose Magnus', 'Ravenclaw', 'Half-blood', 'a comfortable vault', 22,
    'Vine wand with a unicorn hair core (seeks a hidden purpose, +4 mana). A Kneazle (+1 WIS, +1 CHA, senses untrustworthy people). Annotated books. Knows Stupefy from home. A key in the family vault.',
    ('Constant Vigilance',
     'Auror training at home: they cannot be caught by surprise, and they started the game knowing Stupefy.',
     'Re-roll any d20 in a fight and keep the better roll.',
     'They do not back down. When someone insults their family, they need a WIS roll (12) to walk away.'),
    [
        ('An ambush or surprise attack', 'Never surprised. They act first in the first round, even if everyone else is caught off guard. Tell them: “You saw it a second before it moved.”'),
        ('They re-roll in a fight (once a day)', 'Any d20 in a fight: an attack, a defence, a saving roll. Keep the better one. Not outside a fight.'),
        ('Stupefy', 'Their opening spell. 1d8, rolled with INT. They had it from the start, so they can teach the others how it feels.'),
        ('Someone insults their family', 'WIS roll, 12. Fail: they have to answer it (a sharp word, a shove, a duel challenge). Use Cassius or a Slytherin prefect to push it.'),
        ('Day 2 Curfew: their sister is drained', 'Everything about that scene belongs to them. Let them choose first: who to tell, whether to stay, what to promise.'),
    ],
    ('Fashionably Late',
     'They are late for everything. But the castle bends around it: they always turn up exactly when things get interesting.',
     'Burst into a scene or a fight that has already started, wherever the others are. In a fight they join at the start of the next round, and their first spell gets +2 to hit.',
     'At every morning class roll a d20 for them. On 1 to 6 they are late: −5 house points, and the teacher remembers their name for the wrong reasons.'),
    [
        ('They burst in (once a day)', 'Anywhere, no matter where they were. Describe the doors banging open. In a fight: next round, +2 to hit with the first spell.'),
        ('When to suggest it', 'When the others are in trouble and the Sinclair was elsewhere. It solves splitting the party.'),
        ('The morning roll (1 to 6)', 'Late: −5 house points, and the teacher says their name in a disappointed voice. On 7 or more they are on time, and everyone notices.'),
        ('Late on purpose, to skip something', 'Let it work, but the teacher remembers. The next time they are late, it costs 10 points.'),
    ],
    'A family of Aurors. Both parents hunt dark wizards for the Ministry and are rarely home. Their older sister is a Ravenclaw prefect, and Rose has always been the one following her into rooms. Tough, direct, and the first to step in front of a friend.',
    'Their sister wrote home that the castle “feels wrong this year” and asked Rose to keep an eye out. She is the only one the sister told.',
    'On Day 1 Rose rolled a natural 20 on the Library chest (15 Galleons, a Focus Draught and a Remembrall), and the party took on her sister’s quest and walked the patrol route. Her diary noticed her sister having bad dreams about paintings, a key in the family vault (and a goblin who looked at her in a certain way), and guessed that houses with high points get a perk or a clue (right).',
    [
        'Day 2 Curfew: Prefect Sinclair is found drained. She is the first victim. Give Rose quiet moments with her before then, at Lunch and on the Grand Staircase.',
        'Day 3: someone whispers “Canvas” to Rose. Only her.',
        'The vault key: an owl from home can say “It was your great-aunt’s. Keep it close.” What it opens is yours to decide.',
        'When the sister wakes (if she wakes), she remembers only one thing, and she tells Rose.',
    ],
    'Protective and fierce, never backs down. Give her someone to protect, and test her with insults.',
    '“A Sinclair? Your mother arrested my nephew. He deserved it. Carry on.”',
)

BLOCKS += student(
    'Thornbury', 'John', 'Nathaniel', 'Ravenclaw', 'Half-blood', 'a modest vault', 22,
    'Vine wand with a phoenix feather core (+1 spell damage). A Rat (+1 DEX). Annotated books. A Gold cauldron (an extra dose of every potion). The first rune tablet.',
    ('Beast Bond',
     'Magical creatures never attack them first, and they roll with advantage to calm or befriend one.',
     'Ask a creature what it has seen. It answers in feelings and images you describe.',
     'They cannot stand to see a creature hurt, and will risk themselves to stop it.'),
    [
        ('A creature in a fight', 'It never attacks the Thornbury first. Once the Thornbury attacks it, that protection ends for that creature.'),
        ('Calming or befriending', 'Advantage, always. A good roll and the creature is on their side for the scene.'),
        ('They ask a creature what it saw (once a day)', 'Answer in feelings and images, not words: “Cold. A smell of paint. Two-legs carrying something heavy. Fear.”'),
        ('Someone hurts a creature', 'They must step in (no roll to choose not to). If the table is about to kill a creature, let the Thornbury try to calm it first.'),
        ('Monsters that are not creatures', 'Mimics, the Painted Double, animated armour: Beast Bond does not work on them. Tell them: “It is not alive the way animals are.”'),
        ('Bramble (Day 3 onwards)', 'Their lost hippogriff. In the Forbidden Forest only the Thornbury can get close. Asked what she has seen: “The dark under the castle. Something that is not a person.”'),
    ],
    ('Rat-Speech',
     'They can talk to rats. Rats know every crack, pipe and pantry in the castle.',
     'Send a rat to listen in a room or follow someone for one block. At the start of the next block, you tell them what it heard.',
     'Rats are cowards and gossips: on a d20 of 1 to 5 it also tells someone else what they asked. And the caretaker’s cat can smell rat on them, so after curfew they roll Stealth with disadvantage.'),
    [
        ('They send a rat (once a day)', 'Next block, a short report in rat voice: “Big man. Angry. Said ‘tonight’. Dropped cheese. Good cheese.”'),
        ('The gossip roll (1 to 5)', 'The rat also tells someone: Filch, Peeves, or the person it was spying on. Next block, that person knows the Thornbury was asking.'),
        ('After curfew', 'Stealth with disadvantage. Mrs Norris finds them first, always.'),
        ('Their own rat familiar', 'It is the first rat they talk to. Give it a name and a personality (nervous, greedy, loyal).'),
        ('Rats near the covered painting', 'They refuse. Like the spiders, they will not go near it. That refusal is a clue.'),
    ],
    'Creature breeders from the Welsh hills. John could calm a hippogriff before he could read, and animals trust him on sight. Not the most book-smart, but nobody in the party reads a room (or a creature) faster.',
    'Last year the family’s prize hippogriff, Bramble, vanished near the Forbidden Forest. Nobody believed John when he said he heard her calling.',
    'On Day 1 John found the first rune tablet, took 5 Galleons from his friend the Quill, and had his tarot read (a curse that cost 20 Galleons, and the Favour of Pentacles).',
    [
        'From Day 1 they can hear something large and frightened deep in the forest. From Day 3 (Scamander’s lesson) Bramble is findable.',
        'Bringing Bramble home is one of the best endings for the Thornbury. She knows the way under the castle.',
        'The rune tablets: he found the first. Let him carry it and be the one to hold it up when the next one lights.',
    ],
    'Quiet, steady, more at home with animals than people. Give him the scenes where the creatures are the point.',
    '“Oh, do come here, boy. You smell of rats and hay and honesty. How refreshing.”',
)
