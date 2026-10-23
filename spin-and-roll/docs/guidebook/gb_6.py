BLOCKS = [
    ('chapter', 'Part 6', 'The mystery so far', 'What is true, what the players can find, and what to do when they point a finger.'),
    ('h2', 'What is really going on'),
    ('p', 'Keep this to yourself. Three hundred years ago, the painter Corvin Vale sealed himself inside his own unfinished self-portrait to escape death. '
          'To finish it, he needs the light of the young: each student he drains gives the portrait more colour. This summer, Professor Ashgrove found the painting and brought it to Hogwarts. '
          'Since then Vale has been in Ashgrove’s head. By day Ashgrove is himself, mostly. By night Vale uses his hands: hanging new portraits as eyes around the castle, '
          'stepping out of frames to drain a student, slipping back. On the seventh night, the portrait will be finished and Vale will walk free.'),
    ('table', ['Question', 'The truth'], [
        ['Who is draining the students?', 'The covered painting (Vale). Ashgrove is the hands.'],
        ['Why the empty portraits?', 'Portraits are frightened of Vale. When he passes through a corridor, they flee their frames.'],
        ['Why paint on the victims?', 'He touches them to take their light. Oil paint, crimson and gold.'],
        ['Why Ashgrove’s paintings?', 'Each new portrait is a window for Vale. He sees through them.'],
        ['Is Grimsby guilty?', 'No. He is secretly brewing a draught to wake the victims. Peeves stole his ingredients.'],
        ['Is Filch guilty?', 'No. He has keys everywhere, but he was in detention on night two.'],
        ['Is Cassius guilty?', 'No. He was in the Hospital Wing on night three.'],
        ['Is the ghost guilty?', 'No. She is a witness. Vale painted her once.'],
    ], [52, 118]),

    ('h2', 'The suspect board'),
    ('p', 'The TV shows tab has a suspect board with six suspects: Professor Ashgrove, Professor Grimsby, Argus Filch, Cassius Thorne, a Hogwarts ghost and the covered painting. '
          'When the players find a clue, pin it under the suspect it points at. The board is the players’ detective wall: leave it on the TV while they argue.'),
    ('gm', 'TV shows tab: Suspect board. Pin each clue under a suspect as it is found. Mark a suspect Cleared when a clue clears them. Back to the map when they are done talking.'),

    ('h2', 'Every clue up to Day 4'),
    ('table', ['Clue', 'Where and when', 'How they get it', 'Points at'], [
        ['Grimsby’s store cupboard was raided', 'Dungeons, Day 1 Free time', 'Grimsby tells them; or they look at the cupboard', 'Grimsby (a red herring)'],
        ['Filch has keys to every corridor', 'Anywhere Filch is, Day 1+', 'Filch boasts about his keys', 'Filch (a red herring)'],
        ['Every portrait near an attack had gone silent', 'Ravenclaw Tower Day 2 Curfew; Library Day 3 Lunch', 'They look at the empty frames; Flitwick from Day 3', 'The painting'],
        ['Ashgrove’s classroom has more paintings every day', 'Defence classroom, Day 2+', 'They count the frames; Ashgrove shows them off; Longbottom (Day 6)', 'Ashgrove'],
        ['Filch was supervising a detention on night two', 'Filch, Day 3+', 'They ask Filch where he was', 'Clears Filch'],
        ['A ghost saw a figure “step out of a frame”', 'The ghost, Day 3+', 'They ask the ghost what she saw', 'The painting'],
        ['The covered painting’s eyes follow a Quill', 'The Express (Day 0), the Undercroft', 'Only the Quill sees it', 'The painting'],
        ['The covered painting hangs in a different corridor each night', 'Filch or Peeves, Day 4+', 'Filch complains about paintings; Peeves rhymes', 'The painting'],
        ['Cassius was seen with half of an old map', 'The Courtyard, Day 4 Lunch', 'They see him with it', 'Cassius (a red herring)'],
        ['Cassius was in the Hospital Wing himself on night three', 'The matron, Day 4+ (or seen there Day 3 night)', 'They ask the matron', 'Clears Cassius'],
        ['A page about Corvin Vale', 'Restricted Section, Day 4, until Free time', 'They pick it up', 'The painting'],
    ], [48, 40, 52, 30]),
    ('h3', 'Things that are not on the board, but should make them think'),
    ('list', [
        '“Canvas”: what Prefect Sinclair whispers if someone holds her hand (Day 3+).',
        'Oil paint on the victims’ fingers, and a smear of crimson and gold on an empty frame.',
        'Ashgrove touching his cuff and lying about Vale (Day 4, WIS 12).',
        'The ghost knew Vale. The Headmaster’s predecessor invited Vale to paint the staff.',
        'The Okafor’s mother wrote “Occupied” on the painting. The Hale’s great-grandmother saw this before. The Penrose’s ancestor sat for a painter and lost her face.',
        'Longbottom: “All of them were near a painting. The night before, every one of them said they’d been dreaming about paint.”',
        'Wren Ashby’s secret (Card Collector): “Ashgrove signed for the new portraits himself.”',
    ]),

    ('h2', 'The rule of three'),
    ('p', 'Players miss clues. They forget them, misread them, or never open the right barrel. So every conclusion they need has at least three ways to reach it. If they miss one, the next will find them.'),
    ('table', ['They need to realise…', 'Ways to get there'], [
        ['It has something to do with paintings', 'The empty portraits. The paint on the victims. Longbottom’s dreams of paint. The ghost’s figure stepping out of a frame. The Quill’s eye.'],
        ['There is something under the castle', 'The prefect’s cold dead end. The humming. Pip’s door that wants opening. Scamander’s “something under the castle is calling”. The centaur’s “waking beneath the stone”.'],
        ['The name is Corvin Vale', 'The torn page (Day 4). The ghost (Day 4). The Headmaster (Day 4). The Library footnote (Part 5). The Three Broomsticks (Day 6, after this book).'],
        ['Ashgrove is involved', 'The growing number of paintings. His lie about Vale. The sketch in his desk. Wren’s secret. (Day 5: wet paint on his sleeve. Day 6: his eyes.)'],
    ], [58, 112]),
    ('tip', 'If the table is completely stuck at the end of a day, give them a free clue through the world: a portrait whispers to them in the corridor, Pip brings a note with breakfast, or the Pocket Finds table rolls a 20. Never through a teacher telling them the answer.'),

    ('h2', 'When they accuse someone'),
    ('p', 'They will. Usually Grimsby, often Filch, sometimes Cassius, occasionally each other. Every accusation is good: it means they care. Here is how to handle each one up to Day 4.'),
    ('ifs', [
        ('They accuse Grimsby', 'Perfect: he is built for it. Let him be rude, let him be suspicious, let them find the raided cupboard and the shaking hands. Do not clear him before Day 5. The Day 5 beat (Grimsby over the third victim) will feel like proof, and the truth (the draught) will feel like a twist.'),
        ('They accuse Filch', 'He is clearable from Day 3: he was supervising a detention on night two. If they ask him, he tells them, outraged.'),
        ('They accuse Cassius', 'Clearable from Day 4: the matron. Until then he sneers and refuses to deny it, because denying it would be beneath him.'),
        ('They accuse Ashgrove early', 'Do not punish them, and do not confirm it. He is hurt and kind and gives them house points for courage. The other teachers are scandalised. Everyone else in the castle likes him. Make them doubt themselves.'),
        ('They accuse the painting early', 'They are right, and that is fine. Nobody can do anything about it yet: it cannot be harmed, it is hidden below the castle, and nobody believes first-years about a painting. The question becomes how, and who is helping it. That is plenty of mystery.'),
        ('They accuse each other', 'Lovely. The Painted Double night (Day 4) is built for this. Let them argue.'),
        ('They want to tell a teacher', 'The teachers listen. Vance asks the hard question. The Headmaster says “Thank you” and looks frightened. Ashgrove says “Leave it to us.” Nothing changes. Adults are slow.'),
    ]),
    ('gm', 'For a mid-week vote, TV shows tab: Call an accusation vote. When the votes are in, Show the votes, then Keep it a hunch: their pick is stamped Accused and nothing is revealed. Save the final accusation for Day 7.'),
    ('wait', 'At the end of every day, ask: “Who do you think it is, and why?” One sentence each. It costs you thirty seconds, and it tells you exactly which clue they are missing.'),
]
