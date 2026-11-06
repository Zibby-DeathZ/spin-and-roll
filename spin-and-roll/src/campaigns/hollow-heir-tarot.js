// Tarot in the Library. Professor Lucan Greaves, Divination, reads the cards in the back alcove of the Library.
// The reading itself happens at the real table with the GM's own deck: the GM enters the three cards
// (Past, Present, Future) and whether each came out reversed. The app writes the reading in Greaves's voice,
// and the Future card decides the outcome:
//   Future upright: a Fortune's Favour (an upper hand, used once).
//   Future reversed: nothing at all. The Galleons are gone.
//   All three upright: Blessed (two favours: the Future's and the Present's).
//   All three reversed: Cursed (the Future card's curse). Harsh on purpose: they chose the risk.
// One reading per house per day. 20 Galleons.

export const reader = {
  name: 'Professor Lucan Greaves',
  short: 'Professor Greaves',
  icon: '🔮',
  price: 20,
};

// Each card: name, the card's traditional meaning read upright (up) and reversed (rev), in Greaves's voice.
const MAJOR = [
  ['fool', 'The Fool', 'A first step off a high edge, laughing. Something new begins for you, and you will not see the bottom until you land.', 'A careless step, taken without looking. Someone has been reckless, and the ground is further down than they think.'],
  ['magician', 'The Magician', 'Every tool you need is already on the table in front of you. Will is the only thing missing, and you have it.', 'Tricks and sleight of hand. Someone near you is not what they seem, and the trick is already working.'],
  ['high-priestess', 'The High Priestess', 'A secret behind a veil, waiting for someone quiet enough to hear it. Listen more than you speak.', 'Secrets kept from you, on purpose. There is a door in this castle you have been carefully steered away from.'],
  ['empress', 'The Empress', 'Warmth, growth, a living thing that thrives. Someone is looking after you, whether you know it or not.', 'Something smothered, starved of care. A thing you should have tended is wilting.'],
  ['emperor', 'The Emperor', 'Order, rules, a firm hand. Authority stands with you, for now.', 'A tyrant’s grip. Someone holds the rules too tightly, and they will use them against you.'],
  ['hierophant', 'The Hierophant', 'A teacher, a tradition, the old ways. Someone older and wiser will guide you, if you ask.', 'Rules broken, or rules that should be. Tradition will not protect you here.'],
  ['lovers', 'The Lovers', 'A bond, and a choice that tests it. Two paths, and the person beside you matters more than either.', 'A bond strained, a choice made badly. A friendship is pulling in two directions.'],
  ['chariot', 'The Chariot', 'Drive, speed, two wild horses held in one hand. You will push through by sheer will.', 'The reins slip. You are being pulled somewhere you did not mean to go.'],
  ['strength', 'Strength', 'Quiet courage. A hand laid gently on a lion’s jaw. You are braver than you have been told.', 'Fear wins this round. Doubt has its teeth in you.'],
  ['hermit', 'The Hermit', 'A lone lamp on a dark path. What you seek is found by walking alone, and looking closely.', 'Lost in the dark, and too proud to ask the way. Isolation has gone on too long.'],
  ['wheel', 'The Wheel of Fortune', 'The great wheel turns, and for once it turns your way. Luck, fate, a sudden change for the better.', 'The wheel turns against you. What went up is coming down, and quickly.'],
  ['justice', 'Justice', 'The scales are level. You will get exactly what you are owed, no more and no less.', 'The scales are crooked. Someone will be blamed for what they did not do, perhaps you.'],
  ['hanged-man', 'The Hanged Man', 'Hanging upside down, and smiling. Stop struggling: the answer is only visible from a new angle.', 'Stuck, and refusing to see it. You are waiting for something that is not coming.'],
  ['death', 'Death', 'Do not flinch. This card is not a dying. It is an ending, a door closing so another may open. Something in you is changing for good.', 'Change, refused. Something that should have ended is being kept alive, and it is starting to rot.'],
  ['temperance', 'Temperance', 'Water poured from cup to cup and not a drop spilled. Patience, balance, the slow right way.', 'Too much, too fast. The balance is broken, and something will overflow.'],
  ['devil', 'The Devil', 'Chains, and a bargain that looks like a gift. Temptation sits very close to you, smiling. The chains are loose enough to lift off, if you choose.', 'The chains come off. You see a trap for what it is, and you step out of it.'],
  ['tower', 'The Tower', 'Lightning, and a tower falling. A sudden collapse. What was built on a lie comes down all at once.', 'The tower shakes, but it stands. Disaster passes close enough to feel its breath.'],
  ['star', 'The Star', 'After the storm, a single star. Hope, healing, a quiet promise kept.', 'The star is clouded. Hope is there, but you have stopped looking for it.'],
  ['moon', 'The Moon', 'A path between two towers, by moonlight. Nothing here is what it seems. Illusion, dreams, and something walking just behind you.', 'The fog lifts. A deception is about to be uncovered.'],
  ['sun', 'The Sun', 'Bright, warm, impossible to argue with. Joy, success, a day that goes right.', 'Clouds over the sun. A good thing, delayed, or dimmed.'],
  ['judgement', 'Judgement', 'A trumpet, and the dead sit up in their graves. A reckoning, a second chance, a calling answered.', 'The trumpet sounds, and you pretend not to hear it. An old mistake comes back to be paid for.'],
  ['world', 'The World', 'The dance is finished and the circle closes. Completion, triumph, a journey ended well.', 'The circle will not close. Something unfinished keeps pulling you back.'],
];

const SUITS = {
  wands: { name: 'Wands', icon: '🔥', element: 'fire', domain: 'will, spells and daring' },
  cups: { name: 'Cups', icon: '🍷', element: 'water', domain: 'the heart, friendship and healing' },
  swords: { name: 'Swords', icon: '🗡️', element: 'air', domain: 'conflict, truth and pain' },
  pentacles: { name: 'Pentacles', icon: '🪙', element: 'earth', domain: 'gold, belongings and the body' },
};
const RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

// [upright, reversed] for each rank, per suit.
const MINOR = {
  wands: [
    ['A spark catches. A new idea, a sudden burst of power in your wand hand.', 'The spark will not catch. Power that fizzles at the worst moment.'],
    ['You stand on the battlements looking out. Plans, and the nerve to make them.', 'Fear of the unknown keeps you on the battlements.'],
    ['Ships on the horizon. What you set in motion is coming back to you.', 'Delays. What you sent out has run aground.'],
    ['A celebration, a homecoming, a moment of firm ground.', 'Something is unsettled at home.'],
    ['Five sticks clashing. Rivalry, squabbling, too many voices at once.', 'The squabble ends, or goes quiet and turns colder.'],
    ['Victory, and a crowd cheering it. You will be seen to win.', 'Pride before a fall. The crowd turns.'],
    ['You stand your ground against many. Defend what is yours.', 'Overwhelmed. You are giving up ground you could have held.'],
    ['Things move very fast now. News arrives on the wind.', 'Haste, and things going wrong because of it.'],
    ['Wounded, but still standing guard. One last push.', 'Exhausted. You cannot keep watch forever.'],
    ['A heavy load, carried alone. Too much responsibility.', 'You set the burden down, or it crushes you.'],
    ['A messenger with news that excites.', 'News that disappoints, or never arrives.'],
    ['A rider at full gallop. Bold action, maybe too bold.', 'Recklessness. Charging in without a plan.'],
    ['Warm, fierce, impossible to ignore. Confidence.', 'Jealousy, a temper turning inward.'],
    ['A leader with fire in them, who makes others brave.', 'A bully with fire in them.'],
  ],
  cups: [
    ['A cup overflowing. New friendship, new feeling, love freely given.', 'The cup is tipped over. Feelings held back, or spilt.'],
    ['Two cups raised. A pact, a partnership, a friend found.', 'A falling-out between two who should be close.'],
    ['Three cups raised together. Friends, a celebration, belonging.', 'Gossip at the party. Someone is talking about you.'],
    ['Three cups offered, and you ignore them, staring at the fourth. Boredom, missed chances.', 'You finally look up and accept what is offered.'],
    ['Three cups spilt, and you grieve them, forgetting the two still standing behind you.', 'Grief easing. You turn around and see what remains.'],
    ['Memories of childhood. Something innocent and kind from the past.', 'Living in the past. Nostalgia that blinds you.'],
    ['Seven cups in the clouds, each holding a different dream. Too many choices, and some are illusions.', 'The illusions clear. You choose.'],
    ['Walking away from the cups, into the dark. Leaving something behind for good.', 'Afraid to walk away, though you know you should.'],
    ['The wish card. What you hope for is coming.', 'A wish granted that you will regret.'],
    ['A rainbow over a happy home. Everything you need, with the people you need.', 'Trouble at home, under a painted smile.'],
    ['A fish leaps out of a cup. A surprise, a strange message, an odd new friend.', 'A message misread. Feelings hurt by accident.'],
    ['A knight offering a cup. Romance, charm, an invitation.', 'Charm with nothing behind it. Beware the sweet-talker.'],
    ['Gentle, intuitive, the one everyone tells their secrets to.', 'Feelings that drown. Too much, too deep.'],
    ['Calm on a rough sea. Kindness that does not break.', 'A calm face hiding a storm.'],
  ],
  swords: [
    ['A blade raised in the clouds. A breakthrough, a cutting truth.', 'A truth twisted, a blade turned against its owner.'],
    ['Blindfolded, two swords crossed. A stalemate, a choice you refuse to make.', 'The blindfold slips. You see what you were avoiding.'],
    ['Three swords through a heart. Grief, a painful truth, a betrayal.', 'The wound is healing, slowly.'],
    ['A knight lying still on a tomb. Rest, recovery, a pause before the fight.', 'Restlessness. You cannot rest, and it is costing you.'],
    ['A cold victory. You win, and lose a friend doing it.', 'Regret. Making amends after a cruel win.'],
    ['A boat crossing to calmer water. Leaving trouble behind.', 'Trouble follows you into the boat.'],
    ['Someone sneaking off with five swords. Theft, deceit, getting away with it.', 'The thief is caught, or confesses.'],
    ['Bound and blindfolded among swords. Trapped, but only by your own fear.', 'The ropes loosen. You free yourself.'],
    ['Awake at night, head in hands. Nightmares, dread, worry.', 'The worst of the dread is passing.'],
    ['Ten swords in a body on the ground. The very worst has happened. It can only get better.', 'Getting back up after the worst.'],
    ['A watchful youth, sword raised. Curiosity, spying, a sharp mind.', 'Gossip and spying, used to hurt.'],
    ['A knight charging into the storm. Fast, brave, careless.', 'All charge and no plan.'],
    ['Sharp-eyed, honest, unafraid of the truth.', 'Honesty turned cruel. A cold tongue.'],
    ['A judge with a raised blade. Fair, clear, logical.', 'A judge who has already decided.'],
  ],
  pentacles: [
    ['A golden coin in an open hand. A new gift, money, a chance that is real.', 'A coin slipping through the fingers. A lost chance.'],
    ['Juggling two coins. Balancing too many things, and managing, for now.', 'A coin dropped. Too much to juggle.'],
    ['A craftsman at work in a cathedral. Skill, teamwork, being noticed.', 'Shoddy work. A team that does not pull together.'],
    ['Clutching coins tight. Holding on, saving, refusing to share.', 'Greed, or letting go too much.'],
    ['Two figures in the snow, outside a lit window. Hardship, cold, left out.', 'Help arrives. Someone opens the door.'],
    ['Coins given to those in need. Generosity, a fair trade.', 'A gift with strings attached.'],
    ['Leaning on a hoe, looking at the crop. Patience: the reward is growing.', 'Impatience. Digging up the seeds to check on them.'],
    ['Hard at work on coin after coin. Practice, diligence, mastery coming.', 'Rushed work. Cutting corners.'],
    ['A garden, a falcon, a quiet fortune earned alone.', 'A fortune that leaves you lonely.'],
    ['Three generations, a family fortune, a legacy.', 'A family quarrel over what is left behind.'],
    ['A student gazing at a coin. Learning, a good start, a lucky find.', 'A lesson not learned.'],
    ['A slow, steady knight. Reliable, patient, a little dull.', 'Stuck in the mud. Too careful.'],
    ['Practical, warm, generous with what she has.', 'Smothering. Giving too much and asking too much back.'],
    ['A rich king in a garden. Wealth, security, success.', 'A king who cares only for gold.'],
  ],
};

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

export const cards = [
  ...MAJOR.map(([id, name, up, rev], i) => ({ id, name, arcana: 'major', number: ROMAN[i], up, rev })),
  ...Object.entries(MINOR).flatMap(([suit, list]) => list.map(([up, rev], i) => ({
    id: `${RANKS[i].toLowerCase()}-of-${suit}`,
    name: `${RANKS[i]} of ${SUITS[suit].name}`,
    arcana: 'minor', suit, rank: RANKS[i], up, rev,
  }))),
];
export const suits = SUITS;

// ---------- Fortune's Favour: the upper hand (used once; the GM ticks it off) ----------
// `now` is something the game does straight away; everything else is played out by the GM when the student uses it.
export const favours = {
  // By suit, for the minor cards.
  wands: { title: 'Favour of Wands', icon: '🔥', text: 'Once: one spell of your choice cannot miss, and costs no mana.' },
  cups: { title: 'Favour of Cups', icon: '🍷', text: 'Once: the next time you would be knocked out, you stand back up instead, at full HP.' },
  swords: { title: 'Favour of Swords', icon: '🗡️', text: 'Once: in your next fight you act first, and your first attack cannot miss.' },
  pentacles: { title: 'Favour of Pentacles', icon: '🪙', text: 'Once: the next chest you open gives double, or one item from any shop is free.' },
  // By card, for the Major Arcana: stronger, and each its own.
  fool: { title: 'The Fool’s Luck', icon: '🃏', text: 'Once: after you fail any roll, pretend it never happened and roll again.' },
  magician: { title: 'The Magician’s Hand', icon: '🪄', text: 'Learn one spell early, even one you are not yet the level for (the DM picks it with you). Your mana is refilled now.', now: { mana: 'full' } },
  'high-priestess': { title: 'The Priestess’s Secret', icon: '🌙', text: 'The DM tells you one true thing about the mystery, in private. Now.', omen: 'Tell them one true, useful thing about the mystery, privately.' },
  empress: { title: 'The Empress’s Care', icon: '🌿', text: 'Healed to full now, and once: heal a friend to full.', now: { hp: 'full' } },
  emperor: { title: 'The Emperor’s Command', icon: '👑', text: '+15 house points now, and once: a teacher or prefect lets you off a punishment.', now: { points: 15 } },
  hierophant: { title: 'The Teacher’s Blessing', icon: '📿', text: '+20 XP now, and once: a teacher answers one question completely honestly.', now: { xp: 20 } },
  lovers: { title: 'The Bond', icon: '🤝', text: 'Once: give any friend a turn, a roll or a spell of your own, wherever they are.' },
  chariot: { title: 'The Chariot’s Charge', icon: '🐎', text: 'Once: take two actions in one turn of a fight, or reach any place in the castle at once.' },
  strength: { title: 'Lion’s Heart', icon: '🦁', text: 'For the rest of today you cannot be frightened, and once: shrug off one hit completely.' },
  hermit: { title: 'The Hermit’s Lamp', icon: '🏮', text: 'Once: ask the DM where the nearest hidden thing is, and get a true answer.', omen: 'When they use it, show them where the nearest hidden item, chest or clue is.' },
  wheel: { title: 'The Wheel Turns', icon: '🎡', text: 'Once: when any wheel is spun for you, spin it twice and keep the one you like.' },
  justice: { title: 'Justice Served', icon: '⚖️', text: '+15 Galleons now (the reading pays for itself), and once: overturn one unfair punishment.', now: { gold: 15 } },
  'hanged-man': { title: 'The Other Angle', icon: '🙃', text: 'Once: when stuck on a puzzle, the DM gives you a real hint.' },
  death: { title: 'Rebirth', icon: '💀', text: 'Once: if you are knocked out or drained, you come back as if nothing happened.' },
  temperance: { title: 'Temperance', icon: '⚗️', text: 'HP and mana refilled now, and once: any potion you drink works twice.', now: { hp: 'full', mana: 'full' } },
  devil: { title: 'The Devil’s Gift', icon: '😈', text: '+40 Galleons now. And a quiet +1 Corruption. Gifts like this are never free.', now: { gold: 40, corruption: 1 } },
  tower: { title: 'Lightning', icon: '⚡', text: 'Once: one spell deals double damage, or breaks any one magical barrier.' },
  star: { title: 'The Star’s Promise', icon: '⭐', text: 'Healed to full now, and once: a wish (within reason) that the DM grants.', now: { hp: 'full' } },
  moon: { title: 'Moonlight', icon: '🌕', text: 'Once: see through any illusion, disguise or painted thing. Unmasks the Painted Double.' },
  sun: { title: 'The Sun’s Joy', icon: '☀️', text: '+20 house points and +20 XP now.', now: { points: 20, xp: 20 } },
  judgement: { title: 'Second Chance', icon: '📯', text: 'Every status cleared now, and once: undo one choice you regret (the DM decides how far back).', now: { clear: true } },
  world: { title: 'The World Entire', icon: '🌍', text: '+30 XP now, and once: complete one quest objective without doing it.', now: { xp: 30 } },
};

// ---------- Curses: all three cards reversed. Harsh, because they chose the risk ----------
export const curses = {
  wands: { title: 'Curse of Wands', icon: '🔥', text: 'Your magic turns on you: −10 mana now, and your next spell misfires on yourself.', now: { mana: -10 } },
  cups: { title: 'Curse of Cups', icon: '🍷', text: 'Heartache: −6 HP now, and a friend at the table loses 5 HP too (the DM picks).', now: { hp: -6 }, omen: 'Take 5 HP from one of their friends.' },
  swords: { title: 'Curse of Swords', icon: '🗡️', text: 'Your next fight, every enemy goes for you first.', omen: 'In their next fight, every enemy targets them first.' },
  pentacles: { title: 'Curse of Pentacles', icon: '🪙', text: 'Peeves steals your most valuable item. It is somewhere in the castle now.', now: { loseItem: 'best' }, omen: 'Peeves has their best item. Hide it somewhere in the castle.' },
  fool: { title: 'The Fool’s Fall', icon: '🃏', text: 'You trip down the moving stairs: −8 HP, and you drop an item on the way down.', now: { hp: -8, loseItem: 'random' } },
  magician: { title: 'The Trickster', icon: '🪄', text: 'All your mana is gone, and you cannot cast until you have slept.', now: { mana: 'empty' } },
  'high-priestess': { title: 'The Veil', icon: '🌙', text: 'Vale learns your name. Tonight, the painting whispers to you.', omen: 'The covered painting whispers to them tonight. Vale knows them now.' },
  empress: { title: 'Withering', icon: '🥀', text: 'Something you care for withers: −10 HP, and your healing potions are spoilt.', now: { hp: -10 }, omen: 'Their healing potions are spoilt: remove them, or let them fail when drunk.' },
  emperor: { title: 'The Tyrant', icon: '👑', text: '−25 house points. Your house will not thank you.', now: { points: -25 } },
  hierophant: { title: 'Expelled from Grace', icon: '📿', text: 'The next time you are caught breaking a rule, it is detention, no spin.', omen: 'Next time they are caught breaking a rule: detention, no spin.' },
  lovers: { title: 'The Rift', icon: '💔', text: 'A quarrel: you cannot give or trade anything with anyone until tomorrow.', omen: 'No trades or gifts with anyone until tomorrow.' },
  chariot: { title: 'Runaway', icon: '🐎', text: 'You lose your way: your next walk anywhere spins Hogwarts surprises, twice.', omen: 'Their next move: spin Hogwarts surprises, twice.' },
  strength: { title: 'Broken Nerve', icon: '🦁', text: 'You are Frightened until you sleep.', omen: 'They are Frightened until morning: put Fear on them in the Players tab.' },
  hermit: { title: 'Alone in the Dark', icon: '🏮', text: 'Your light fails. You cannot cast Lumos until tomorrow.', omen: 'No Lumos until tomorrow.' },
  wheel: { title: 'The Wheel Breaks', icon: '🎡', text: 'Whenever a wheel is spun for you today, the DM picks the worst result.', omen: 'Every wheel spun for them today lands on the worst result.' },
  justice: { title: 'Unjust', icon: '⚖️', text: 'Blamed for something you did not do: −20 Galleons and −10 house points.', now: { gold: -20, points: -10 } },
  'hanged-man': { title: 'Hung Out to Dry', icon: '🙃', text: 'You miss your next Free time: stuck somewhere, waiting.', omen: 'They miss their next Free time block.' },
  death: { title: 'The Grey Touch', icon: '💀', text: 'Vale’s cold brushes you: +2 Corruption and −10 HP.', now: { corruption: 2, hp: -10 } },
  temperance: { title: 'Overflow', icon: '⚗️', text: 'Your potions curdle: you lose every potion you carry.', now: { losePotions: true } },
  devil: { title: 'The Bargain', icon: '😈', text: '+2 Corruption. The chains tighten.', now: { corruption: 2 } },
  tower: { title: 'Collapse', icon: '🗼', text: 'Everything at once: −15 HP, −20 Galleons, and you drop an item.', now: { hp: -15, gold: -20, loseItem: 'random' } },
  star: { title: 'A Clouded Star', icon: '⭐', text: '−20 XP, and no healing works on you until you sleep.', now: { xp: -20 }, omen: 'No healing works on them until morning.' },
  moon: { title: 'Lunacy', icon: '🌕', text: 'The DM tells you one false thing about the mystery, and you will believe it.', omen: 'Tell them one convincing false thing about the mystery, privately.' },
  sun: { title: 'Eclipse', icon: '☀️', text: '−20 house points and −20 XP.', now: { points: -20, xp: -20 } },
  judgement: { title: 'Judged', icon: '📯', text: '−30 house points. Something you did comes back to be paid for.', now: { points: -30 } },
  world: { title: 'Unravelling', icon: '🌍', text: 'One of your quests goes back a step: the DM un-ticks an objective.', omen: 'Un-tick one quest objective of theirs.' },
};

// A line in each family's past, when the Past card is a Major Arcana card: their secret, half-seen in the cards.
export const familyEchoes = {
  blackwood: 'I see a painting your family was warned never to uncover.',
  sinclair: 'I see an older sister, walking a corridor alone at night.',
  fenwick: 'I see half of something torn in two, and a word your family forgot.',
  thornbury: 'I see wings, and an empty stable, and someone calling a name.',
  quill: 'I see an eye. Painted. It has been looking at you since the train.',
  penrose: 'I see a face that will not change, in a frame that was never delivered.',
  okafor: 'I see a report stamped in red, and a mother who was overruled.',
};
