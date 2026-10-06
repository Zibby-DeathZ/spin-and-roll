import { extraNpcs, offers, routines, schedule, talk } from './hollow-heir-world.js';

// The Hollow Heir: campaign data the engine reads.

const items = {
  'chocolate-frog': { name: 'Chocolate Frog', icon: '🐸', effect: { hp: 5 }, note: 'Comes with a collectible card' },
  'pumpkin-pasty': { name: 'Pumpkin Pasty', icon: '🥧', effect: { hp: 3 } },
  pepperup: { name: 'Pepperup Potion', icon: '🧪', effect: { hp: 10 } },
  wiggenweld: { name: 'Wiggenweld Potion', icon: '💚', effect: { hp: 20 } },
  'focus-draught': { name: 'Focus Draught', icon: '🔮', effect: { mana: 10 } },
  'bertie-botts': { name: "Bertie Bott's Beans", icon: '🫘', note: 'Spin the bean wheel', wheel: 'beans' },
  felix: { name: 'Felix Felicis', icon: '✨', note: 'One free re-spin' },
  remembrall: { name: 'Remembrall', icon: '🔴', note: 'Ask the DM to remind you of one clue' },
  'extendable-ears': { name: 'Extendable Ears', icon: '👂', note: 'Overhear one private NPC conversation' },
  sneakoscope: { name: 'Pocket Sneakoscope', icon: '🌀', note: 'Spins when someone nearby lies' },
  'mandrake-leaf': { name: 'Mandrake leaf', icon: '🌱', note: 'Key ingredient in the draught that restores drained students' },
  'creature-treats': { name: 'Creature treats', icon: '🦴', note: 'Calms one magical creature instantly' },
  'serpent-key': { name: 'Serpent key', icon: '🗝️', note: 'Opens the door beneath Hogwarts. Only a Parseltongue can turn it' },
  'map-half': { name: 'Half of the Marauder’s Map', icon: '📜', note: 'Torn down the middle. Someone has the rest' },
  'vale-page': { name: 'Torn page about Corvin Vale', icon: '📄', note: 'A painter who wanted to live forever' },
  'restorative-draught': { name: 'Restorative Draught', icon: '⚗️', note: 'Wakes one drained student' },
  'frog-card': { name: 'Rare Chocolate Frog card', icon: '🃏', note: 'A collector would love this' },
  'ring-clue-serpent': { name: 'Scratched note (first ring)', icon: '🗒️', note: '“The first ring remembers what sleeps beneath the castle.”' },
  'ring-clue-moon': { name: 'Star chart (second ring)', icon: '🗺️', note: '“The second ring follows the lamp of the night.”' },
  'ring-clue-owl': { name: 'Feathered card (last ring)', icon: '🪶', note: '“The last ring belongs to the one who carries every letter.”' },
  'diary-page': { name: 'Page of Vale’s diary', icon: '📓', note: 'Written in runes. Collect all three.' },
  'stolen-jars': { name: 'Stolen ingredient jars', icon: '🫙', note: 'Labelled in Grimsby’s spiky handwriting' },
};

export const hollowHeir = {
  // The living castle: positions, appearances, quest offers and conversations.
  routines, schedule, offers, talk,
  // Part of the Hogwarts series. Characters are saved to player profiles and carry into the next year.
  series: 'hogwarts', seriesName: 'Hogwarts', year: 1, levelFloor: 1, levelCap: 5,

  currency: { name: 'Galleons', icon: '🪙' },
  houses: ['Unsorted', 'Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'],

  defaults: {
    house: 'Unsorted',
    xp: 0,
    hp: 18, maxHp: 18, // + CON bonus × 2 at creation
    mana: 8, maxMana: 8, // + INT bonus × 2 at creation
    gold: 0,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    equipment: {},
    spells: [],
  },

  // Players pick a family and add their own first name. Each family can be taken once.
  families: [
    {
      id: 'blackwood', name: 'Blackwood', blood: 'Pureblood', wealth: 'Overflowing vault', vault: 500,
      ability: {
        name: 'Portrait Whisperer', icon: '🖼️',
        passive: 'Portraits recognise the Blackwood name and speak to you freely.',
        active: 'Once per day, ask any portrait one question and it must answer truthfully.',
        drawback: 'Portraits gossip. When you break a rule near one, the DM spins to see if a teacher hears about it.',
      },
      stats: { str: 8, dex: 10, con: 12, int: 14, wis: 13, cha: 15 },
      story: 'One of the oldest wizarding families in Britain. Portraits of Blackwoods line every wall of the family manor, and all of them have opinions.',
      secret: 'Your grandmother’s diary mentions “the painted man” and a debt the Blackwoods never paid. Centuries ago, a Blackwood sealed a dark wizard inside a painting.',
    },
    {
      id: 'sinclair', name: 'Sinclair', startSpells: ['stupefy'], blood: 'Half-blood', wealth: 'Comfortable vault', vault: 300,
      ability: {
        name: 'Constant Vigilance', icon: '🛡️',
        passive: 'Auror training at home: you can’t be caught by surprise, and you start the game knowing Stupefy.',
        active: 'Once per day, re-roll any d20 in a fight and keep the better roll.',
        drawback: 'You don’t back down. When someone insults your family, you need a WIS roll to walk away.',
      },
      stats: { str: 14, dex: 12, con: 15, int: 13, wis: 10, cha: 8 },
      story: 'A family of Aurors. Both parents hunt dark wizards for the Ministry and are rarely home. Your older sister is a Hogwarts prefect.',
      secret: 'Your sister wrote home that the castle “feels wrong this year” and asked you to keep an eye out. You’re the only one she told.',
    },
    {
      id: 'fenwick', name: 'Fenwick', startItems: ['map-half'], blood: 'Half-blood', wealth: 'Healthy vault', vault: 220,
      ability: {
        name: 'Marauder’s Legacy', icon: '🗺️',
        passive: 'Your great-uncle ran with the Marauders. You know the words: “I solemnly swear that I am up to no good.”',
        active: 'Once per day, open your half of the Marauder’s Map to see who is in any one area of the castle (the DM reveals it).',
        drawback: 'Half the map is missing. Finding the other half is a side quest only you know about.',
      },
      stats: { str: 10, dex: 15, con: 12, int: 13, wis: 8, cha: 14 },
      story: 'Your family runs Fenwick’s Fizzing Follies, a joke shop on Diagon Alley. You grew up testing products nobody else would touch.',
      secret: 'Your great-uncle copied the Marauder’s Map before he was expelled, but it was torn in half during a duel. Someone at Hogwarts has the other half, and they’ve been watching you.',
    },
    {
      id: 'thornbury', name: 'Thornbury', blood: 'Half-blood', wealth: 'Modest vault', vault: 150,
      ability: {
        name: 'Beast Bond', icon: '🐾',
        passive: 'Magical creatures never attack you first, and you roll with advantage to calm or befriend them.',
        active: 'Once per day, ask a creature what it has seen. It answers in feelings and images the DM describes.',
        drawback: 'You can’t stand to see a creature hurt, and you’ll risk yourself to stop it.',
      },
      stats: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      story: 'Creature breeders from the Welsh hills. You could calm a hippogriff before you could read, and animals trust you on sight.',
      secret: 'Last year your family’s prize hippogriff, Bramble, vanished near the Forbidden Forest. Nobody believed you when you said you heard her calling.',
    },
    {
      id: 'quill', name: 'Quill', blood: 'Muggle-born', wealth: 'Hogwarts school fund', vault: 60,
      ability: {
        name: 'The Sight', icon: '👁️',
        passive: 'You see through disguises, glamours and magical illusions that fool everyone else.',
        active: 'Once per day, ask the DM: “What here is hidden or enchanted?” and get an honest answer.',
        drawback: 'Your visions come uninvited. Sometimes the DM shows you something you’d rather not have seen.',
      },
      stats: { str: 8, dex: 12, con: 10, int: 15, wis: 14, cha: 13 },
      story: 'Until your letter arrived, you thought the strange things around you were coincidences. Your parents are dentists and are thrilled and terrified.',
      secret: 'On the train, you’ll be the only one who sees the covered painting’s eyes follow you. It happens again every time you pass one of its kind.',
    },
    {
      id: 'marlowe', name: 'Marlowe', startItems: ['serpent-key'], blood: 'Pureblood', wealth: 'Nearly empty vault', vault: 25,
      ability: {
        name: 'Parseltongue', icon: '🐍',
        passive: 'You can speak to and understand snakes. Doors sealed with a serpent open when you command them.',
        active: 'Once per day, ask a snake to scout, guard, or deliver a message for you.',
        drawback: 'Anyone who hears you speak it will fear or distrust you. The DM spins to see how they react.',
      },
      stats: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
      story: 'Once as grand as the Blackwoods, the Marlowes lost everything in a scandal nobody will explain. People still whisper when they hear your name.',
      secret: 'Your vault holds only a few coins and an old iron key with a serpent on it. An ancestor served a dark wizard, and only a Parseltongue can open the door that key belongs to.',
    },
  ],

  // Ollivander: the DM picks wood + core after the wand questions.
  wandPrice: 7,
  wandWoods: [
    { id: 'holly', name: 'Holly', bonus: { stats: { wis: 1 } }, desc: 'Protective, for those facing a dangerous quest' },
    { id: 'yew', name: 'Yew', bonus: { stats: { cha: 1 } }, desc: 'Chooses the strong-willed' },
    { id: 'vine', name: 'Vine', bonus: { stats: { int: 1 } }, desc: 'Seeks those with a hidden purpose' },
    { id: 'ash', name: 'Ash', bonus: { stats: { con: 1 } }, desc: 'Loyal to one owner for life' },
    { id: 'hawthorn', name: 'Hawthorn', bonus: { stats: { dex: 1 } }, desc: 'Quick, but hard to master' },
    { id: 'oak', name: 'Oak', bonus: { stats: { str: 1 } }, desc: 'A faithful partner in battle' },
  ],
  wandCores: [
    { id: 'phoenix', name: 'phoenix feather', bonus: { spellPower: 1, maxMana: 2 }, desc: '+1 spell damage' },
    { id: 'dragon', name: 'dragon heartstring', bonus: { spellPower: 2 }, desc: '+2 spell damage' },
    { id: 'unicorn', name: 'unicorn hair', bonus: { maxMana: 4 }, desc: '+4 max mana, rarely misfires' },
  ],

  required: [
    ['wand', 'Wand'], ['robes', 'Robes'], ['familiar', 'Familiar'], ['cauldron', 'Cauldron'], ['books', 'Book set'],
  ],

  // Diagon Alley. Entries with a slot are equipped; entries with `item` go in the bag.
  shops: [
    {
      name: 'Madam Malkin’s Robes',
      stock: [
        { id: 'robes-plain', slot: 'robes', name: 'Second-hand robes', icon: '🧥', price: 3, bonus: {}, desc: 'Patched but wearable' },
        { id: 'robes-standard', slot: 'robes', name: 'Standard school robes', icon: '🧥', price: 8, bonus: { defence: 1 }, desc: '+1 Defence' },
        { id: 'robes-tailored', slot: 'robes', name: 'Tailored robes', icon: '🧥', price: 30, bonus: { defence: 2 }, desc: '+2 Defence' },
        { id: 'robes-dragonhide', slot: 'robes', name: 'Dragonhide-lined robes', icon: '🐉', price: 90, bonus: { defence: 3, maxHp: 4 }, desc: '+3 Defence, +4 max HP' },
      ],
    },
    {
      name: 'Magical Menagerie',
      stock: [
        { id: 'toad', slot: 'familiar', name: 'Toad', icon: '🐸', price: 4, bonus: { maxHp: 2 }, desc: '+2 max HP. Hops off at the worst moments' },
        { id: 'rat', slot: 'familiar', name: 'Rat', icon: '🐀', price: 6, bonus: { stats: { dex: 1 } }, desc: '+1 DEX. Squeezes through gaps to scout' },
        { id: 'cat', slot: 'familiar', name: 'Cat', icon: '🐈', price: 15, bonus: { stats: { wis: 1 } }, desc: '+1 WIS. Hisses at hidden danger' },
        { id: 'owl', slot: 'familiar', name: 'Owl', icon: '🦉', price: 25, bonus: { stats: { int: 1 } }, desc: '+1 INT. Delivers items to anyone, anywhere' },
        { id: 'bowtruckle', slot: 'familiar', name: 'Bowtruckle', icon: '🌿', price: 40, bonus: { stats: { dex: 1 }, defence: 1 }, desc: '+1 DEX, +1 Defence. Picks simple locks' },
        { id: 'kneazle', slot: 'familiar', name: 'Kneazle', icon: '🐆', price: 60, bonus: { stats: { wis: 1, cha: 1 } }, desc: '+1 WIS, +1 CHA. Senses untrustworthy people' },
        { id: 'niffler', slot: 'familiar', name: 'Niffler', icon: '🦫', price: 120, bonus: { stats: { dex: 1 } }, desc: '+1 DEX. Sniffs out hidden treasure and Galleons' },
      ],
    },
    {
      name: 'Potage’s Cauldron Shop',
      stock: [
        { id: 'cauldron-pewter', slot: 'cauldron', name: 'Pewter cauldron', icon: '🫕', price: 3, bonus: {}, desc: 'Standard size 2. Required for Potions' },
        { id: 'cauldron-brass', slot: 'cauldron', name: 'Brass cauldron', icon: '🫕', price: 12, bonus: {}, desc: 'Brews faster: one extra wheel spin in Potions' },
        { id: 'cauldron-gold', slot: 'cauldron', name: 'Gold cauldron', icon: '🏺', price: 50, bonus: {}, desc: 'Potions you brew make one extra dose' },
      ],
    },
    {
      name: 'Flourish and Blotts',
      stock: [
        { id: 'books-used', slot: 'books', name: 'Used book set', icon: '📚', price: 3, bonus: {}, desc: 'Scribbled notes. Required to learn spells' },
        { id: 'books-new', slot: 'books', name: 'New book set', icon: '📚', price: 9, bonus: { stats: { int: 1 } }, desc: '+1 INT' },
        { id: 'books-annotated', slot: 'books', name: 'Annotated book set', icon: '📖', price: 35, bonus: { stats: { int: 1 }, spellPower: 1 }, desc: '+1 INT, +1 spell damage. Margin notes by a famous witch' },
      ],
    },
    {
      name: 'Weasleys’ Wizard Wheezes',
      stock: [
        { id: 'extendable-ears', item: 'extendable-ears', price: 15 },
        { id: 'remembrall', item: 'remembrall', price: 10 },
        { id: 'sneakoscope', item: 'sneakoscope', price: 30 },
      ],
    },
    {
      name: 'Sugarplum’s Sweet Shop',
      stock: [
        { id: 'chocolate-frog', item: 'chocolate-frog', price: 1 },
        { id: 'bertie-botts', item: 'bertie-botts', price: 1 },
        { id: 'pumpkin-pasty', item: 'pumpkin-pasty', price: 1 },
      ],
    },
    {
      name: 'Slug and Jiggers Apothecary',
      stock: [
        { id: 'pepperup', item: 'pepperup', price: 5 },
        { id: 'focus-draught', item: 'focus-draught', price: 6 },
        { id: 'wiggenweld', item: 'wiggenweld', price: 12 },
      ],
    },
  ],

  // Ceremonies. Each option adds a point to a house, a wand wood or a wand core.
  quizzes: {
    sorting: {
      title: 'The Sorting Hat',
      icon: '🎩',
      thinking: 'Hmm… difficult. Very difficult…',
      questions: [
        {
          q: 'An older student is picking on a first-year in the corridor. What do you do?',
          options: [
            { text: 'Step in front of them, whatever it costs me', house: 'Gryffindor' },
            { text: 'Stay with the first-year afterwards and make sure they’re okay', house: 'Hufflepuff' },
            { text: 'Find a clever way to distract the bully', house: 'Ravenclaw' },
            { text: 'Remember their face. They’ll regret it later', house: 'Slytherin' },
          ],
        },
        {
          q: 'You find a door nobody has opened in a hundred years.',
          options: [
            { text: 'Open it. Right now', house: 'Gryffindor' },
            { text: 'Fetch my friends. Nobody goes in alone', house: 'Hufflepuff' },
            { text: 'Learn the door’s history before I touch it', house: 'Ravenclaw' },
            { text: 'Work out how whatever’s inside could be useful to me', house: 'Slytherin' },
          ],
        },
        {
          q: 'Which would hurt most to be called?',
          options: [
            { text: 'Coward', house: 'Gryffindor' },
            { text: 'Selfish', house: 'Hufflepuff' },
            { text: 'Ignorant', house: 'Ravenclaw' },
            { text: 'Ordinary', house: 'Slytherin' },
          ],
        },
        {
          q: 'Four boxes sit in front of you. You may open only one.',
          options: [
            { text: 'The one that is ticking', house: 'Gryffindor' },
            { text: 'The plain wooden one, warm to the touch', house: 'Hufflepuff' },
            { text: 'The one covered in runes you can almost read', house: 'Ravenclaw' },
            { text: 'The gold one, stamped with an old family crest', house: 'Slytherin' },
          ],
        },
        {
          q: 'Long after you’re gone, what should people remember about you?',
          options: [
            { text: 'That I was brave when it mattered', house: 'Gryffindor' },
            { text: 'That I never let a friend down', house: 'Hufflepuff' },
            { text: 'That I understood what others couldn’t', house: 'Ravenclaw' },
            { text: 'That I became someone great', house: 'Slytherin' },
          ],
        },
      ],
      // Asked last. If the wish is close to the top score, the Hat listens.
      wish: {
        q: 'The Hat pauses. “Is there a house you would ask me for?”',
        options: ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin', 'Let the Hat decide'],
      },
    },
    wand: {
      title: 'Ollivanders',
      icon: '🪄',
      thinking: '“Curious… very curious…”',
      questions: [
        {
          q: 'When trouble comes, what do you reach for first?',
          options: [
            { text: 'A plan', wood: 'vine' },
            { text: 'My courage, and my fists if needed', wood: 'oak' },
            { text: 'The quickest way out', wood: 'hawthorn' },
            { text: 'The people beside me', wood: 'ash' },
          ],
        },
        {
          q: 'What would you hate to lose the most?',
          options: [
            { text: 'The people I love', wood: 'holly' },
            { text: 'My freedom', wood: 'hawthorn' },
            { text: 'My pride', wood: 'yew' },
            { text: 'The truth', wood: 'vine' },
          ],
        },
        {
          q: 'The people who know you best would call you…',
          options: [
            { text: 'Stubborn', wood: 'yew' },
            { text: 'Dependable', wood: 'ash' },
            { text: 'Strong', wood: 'oak' },
            { text: 'Watchful', wood: 'holly' },
          ],
        },
        {
          q: 'Three things glow on Mr Ollivander’s counter. Which draws your hand?',
          options: [
            { text: 'A flame that rises from its own ashes', core: 'phoenix' },
            { text: 'A heart that beats fierce and hot', core: 'dragon' },
            { text: 'A silver thread that never breaks', core: 'unicorn' },
          ],
        },
        {
          q: 'What kind of magic do you want to do?',
          options: [
            { text: 'Rare magic nobody else can do', core: 'phoenix' },
            { text: 'Powerful magic that wins fights', core: 'dragon' },
            { text: 'Steady magic I can always rely on', core: 'unicorn' },
          ],
        },
      ],
    },
  },

  // ---------- The 7-day clock ----------
  clock: {
    days: 7,
    prologue: ['Letters arrive', 'Gringotts and Diagon Alley', 'The Hogwarts Express', 'The Welcome Feast'],
    blocks: ['Morning class', 'Lunch', 'Afternoon class', 'Free time', 'Curfew'],
    xpPerClass: 10,
  },

  // Spells a character can learn. damage gets the character's spell damage bonus added.
  spells: {
    // hit: stat added to a d20 roll that must reach the target's Defence.
    // dice: the spell's own die. damage spells add the caster's spell damage bonus.
    lumos: { group: 'class', name: 'Lumos', icon: '💡', mana: 1, desc: 'Light in the dark. Reveals invisible ink.' },
    avifors: { group: 'class', name: 'Avifors', icon: '🐦', mana: 2, dice: { count: 1, die: 4 }, effectLabel: 'rounds of distraction', desc: 'Turns a small object into a flock of birds.' },
    alohomora: { group: 'class', name: 'Alohomora', icon: '🔓', mana: 2, check: 'int', desc: 'Unlocks a lock if your roll beats its difficulty.' },
    protego: { group: 'class', name: 'Protego', icon: '🛡️', mana: 3, dice: { count: 1, die: 6 }, effectLabel: 'damage blocked', desc: 'Shield charm. Blocks damage from the next attack on you or an ally.' },
    expelliarmus: { group: 'class', name: 'Expelliarmus', icon: '🪄', mana: 3, hit: 'dex', attack: true, desc: 'Disarms the target. On a hit, their next attack misses.' },
    stupefy: { group: 'class', name: 'Stupefy', icon: '💥', mana: 4, hit: 'int', attack: true, dice: { count: 1, die: 8 }, damage: true, desc: 'Stunning spell.' },
    incendio: { group: 'class', name: 'Incendio', icon: '🔥', mana: 5, hit: 'int', attack: true, dice: { count: 1, die: 10 }, damage: true, desc: 'Conjures fire. Painted creatures burn.' },
    // Other charms and jinxes (teach from the GM Spells tab)
    'wingardium-leviosa': { group: 'extra', name: 'Wingardium Leviosa', icon: '🪶', mana: 2, check: 'int', desc: 'Levitates an object. Heavier things need a higher roll.' },
    accio: { group: 'extra', name: 'Accio', icon: '🧲', mana: 3, check: 'int', desc: 'Summons an object you can name and see, or know is close.' },
    reparo: { group: 'extra', name: 'Reparo', icon: '🔧', mana: 1, desc: 'Mends something broken.' },
    aguamenti: { group: 'extra', name: 'Aguamenti', icon: '💧', mana: 2, desc: 'A jet of water. Puts out fires.' },
    'finite-incantatem': { group: 'extra', name: 'Finite Incantatem', icon: '✋', mana: 2, check: 'wis', desc: 'Ends a spell or curse if the roll beats it.' },
    episkey: { group: 'extra', name: 'Episkey', icon: '🩹', mana: 3, dice: { count: 1, die: 6 }, effectLabel: 'HP healed (GM applies)', desc: 'Heals small wounds on yourself or a friend.' },
    flipendo: { group: 'extra', name: 'Flipendo', icon: '💨', mana: 2, hit: 'int', attack: true, dice: { count: 1, die: 6 }, damage: true, desc: 'Knockback jinx.' },
    rictusempra: { group: 'extra', name: 'Rictusempra', icon: '😂', mana: 2, hit: 'cha', attack: true, desc: 'Tickling charm. On a hit, the target loses its next turn laughing.' },
    diffindo: { group: 'extra', name: 'Diffindo', icon: '✂️', mana: 3, hit: 'dex', attack: true, dice: { count: 1, die: 6 }, damage: true, desc: 'Severing charm. Cuts ropes, vines and bags.' },
    riddikulus: { group: 'extra', name: 'Riddikulus', icon: '🤡', mana: 3, hit: 'cha', attack: true, dice: { count: 1, die: 10 }, damage: true, onlyKind: 'boggart', desc: 'Turns fear into a joke. Only hurts Boggarts.' },
    silencio: { group: 'extra', name: 'Silencio', icon: '🤐', mana: 3, hit: 'cha', attack: true, desc: 'On a hit, the target can’t cast spells on its next turn.' },
    glacius: { group: 'extra', name: 'Glacius', icon: '❄️', mana: 4, hit: 'int', attack: true, dice: { count: 1, die: 8 }, damage: true, desc: 'Freezing charm.' },
    confundo: { group: 'extra', name: 'Confundo', icon: '😵', mana: 4, hit: 'cha', attack: true, desc: 'On a hit, the target attacks the wrong person next turn (GM decides).' },
    immobulus: { group: 'extra', name: 'Immobulus', icon: '⏸️', mana: 4, hit: 'wis', attack: true, desc: 'On a hit, freezes a creature in place for a round.' },
    'petrificus-totalus': { group: 'extra', name: 'Petrificus Totalus', icon: '🧊', mana: 5, hit: 'int', attack: true, desc: 'Full body-bind. On a hit, the target skips its next turn.' },
    // Advanced magic
    bombarda: { group: 'advanced', name: 'Bombarda', icon: '💣', mana: 7, hit: 'int', attack: true, dice: { count: 2, die: 8 }, damage: true, desc: 'Explosive. Loud. Very loud.' },
    'expecto-patronum': {
      group: 'advanced', name: 'Expecto Patronum', icon: '🦌', mana: 8, hit: 'wis', attack: true, dice: { count: 1, die: 12 }, damage: true, patronus: true,
      desc: 'Your Patronus. Drives back dark creatures and Vale’s servants. Advanced magic, usually learned in Year 3.',
    },
    'avada-kedavra': {
      name: 'Avada Kedavra', icon: '💚', mana: 10, hit: 'cha', attack: true, kill: true, forbidden: true,
      desc: 'The Killing Curse. Kills any creature outright; bosses take 20. If anyone sees, you are expelled.',
    },
  },

  // Monsters and people you can place on the map. Monsters can be fought.
  bestiary: {
    'cornish-pixie': { name: 'Cornish Pixie', icon: '🧚', hp: 4, defence: 12, atk: 3, dmg: { count: 1, die: 4 }, init: 3, xp: 5 },
    'devils-snare': { name: 'Devil’s Snare', icon: '🌿', hp: 14, defence: 10, atk: 4, dmg: { count: 1, die: 6 }, init: 0, xp: 15, note: 'Hates light and fire' },
    boggart: { name: 'Boggart', icon: '👤', hp: 10, defence: 12, atk: 3, dmg: { count: 1, die: 6 }, init: 2, xp: 20, note: 'Laughter hurts it' },
    'rival-duelist': { name: 'Dueling Club rival', icon: '🧑‍🎓', hp: 14, defence: 12, atk: 3, dmg: { count: 1, die: 6 }, init: 2, xp: 15 },
    'paint-wraith': { name: 'Paint Wraith', icon: '🎨', hp: 12, defence: 13, atk: 4, dmg: { count: 1, die: 6 }, init: 3, xp: 25, note: 'Vale’s servant. Fire burns it' },
    acromantula: { name: 'Acromantula', icon: '🕷️', hp: 22, defence: 13, atk: 5, dmg: { count: 1, die: 8 }, init: 2, xp: 40 },
    troll: { name: 'Mountain Troll', icon: '👹', hp: 30, defence: 11, atk: 6, dmg: { count: 1, die: 10 }, init: -1, xp: 50 },
    'ashgrove-possessed': { name: 'Ashgrove (possessed)', icon: '🧙', hp: 45, defence: 14, atk: 5, dmg: { count: 1, die: 8, bonus: 2 }, init: 3, xp: 100, boss: true },
    'corvin-vale': { name: 'Corvin Vale', icon: '🖼️', hp: 60, defence: 15, atk: 6, dmg: { count: 1, die: 10, bonus: 2 }, init: 4, xp: 200, boss: true },
    // People (no stats)
    ashgrove: { name: 'Professor Ashgrove', icon: '🧙', npc: true },
    grimsby: { name: 'Professor Grimsby', icon: '⚗️', npc: true },
    longbottom: { name: 'Professor Longbottom', icon: '🌱', npc: true },
    scamander: { name: 'Professor Scamander', icon: '🐾', npc: true },
    flitwick: { name: 'Professor Flitwick', icon: '✨', npc: true },
    vance: { name: 'Professor Vance', icon: '🔄', npc: true },
    hooch: { name: 'Madam Hooch', icon: '🧹', npc: true },
    filch: { name: 'Filch', icon: '🔦', npc: true },
    peeves: { name: 'Peeves', icon: '🤡', npc: true },
    ghost: { name: 'A ghost', icon: '👻', npc: true },
    'house-elf': { name: 'House-elf', icon: '🧦', npc: true },
    centaur: { name: 'Centaur', icon: '🏹', npc: true },
    'sinclair-prefect': { name: 'Prefect Sinclair', icon: '🎖️', npc: true },
    painting: { name: 'The covered painting', icon: '🖼️', npc: true },
    rival: { name: 'Cassius Thorne', icon: '😏', npc: true },
    ...extraNpcs,
  },

  // Where each member of staff belongs. "Staff to their rooms" on the GM screen puts them there.
  staff: {
    flitwick: 'charms-classroom', grimsby: 'dungeons', longbottom: 'greenhouses', ashgrove: 'defence-classroom',
    vance: 'transfiguration-classroom', scamander: 'hagrids-hut', hooch: 'quidditch-pitch',
    filch: 'entrance-hall', peeves: 'grand-staircase',
  },

  // Places on the map. Drop an image at public/maps/<id>.jpg and it shows automatically.
  locations: [
    { id: 'home', area: 'Prologue', name: 'Home', icon: '🏠', desc: 'An owl taps at the window.', actions: ['Open the letter'] },
    { id: 'gringotts', area: 'Prologue', name: 'Gringotts Wizarding Bank', icon: '🏦', desc: 'Goblins, marble halls, and the rattle of mine carts below.', exits: ['diagon-alley'], actions: ['Visit your family vault'] },
    { id: 'diagon-alley', area: 'Prologue', name: 'Diagon Alley', icon: '🛍️', desc: 'Crooked shops, owls, and a hundred smells at once.', exits: ['ollivanders', 'platform'], actions: ['Shop for school things', 'Spin: Hogwarts surprises'] },
    { id: 'ollivanders', area: 'Prologue', name: 'Ollivanders', icon: '🪄', desc: 'Dusty boxes stacked to the ceiling. Something hums.', actions: ['Let the wand choose you'] },
    { id: 'platform', area: 'Prologue', name: 'Platform Nine and Three-Quarters', icon: '🚂', desc: 'Steam, trunks, and a scarlet engine.', exits: ['express'], actions: ['Find the hidden barrier', 'Look for friends'] },
    { id: 'express', area: 'Prologue', name: 'The Hogwarts Express', icon: '🚃', desc: 'Compartments, the trolley witch, and a covered painting in the luggage car.', exits: ['great-hall'], actions: ['Buy from the trolley', 'Explore the carriages', 'Peek at the covered painting'] },
    { id: 'great-hall', area: 'Castle', name: 'The Great Hall', icon: '🕯️', desc: 'Floating candles under an enchanted sky.', exits: ['entrance-hall'], actions: ['Eat a feast', 'Watch the staff table'] },
    { id: 'entrance-hall', area: 'Castle', name: 'Entrance Hall', icon: '🚪', desc: 'The house point hourglasses glitter by the doors.', exits: ['grand-staircase', 'dungeons', 'courtyard', 'kitchens'], actions: ['Check the house points', 'Ask a ghost for directions'] },
    { id: 'grand-staircase', area: 'Castle', name: 'Grand Staircase', icon: '🪜', desc: 'Stairs that change their minds. Portraits everywhere.', exits: ['charms-classroom', 'transfiguration-classroom', 'gryffindor-common', 'ravenclaw-common', 'library', 'defence-classroom', 'trophy-room', 'hospital-wing', 'owlery', 'astronomy-tower', 'room-of-requirement'], actions: ['Talk to a portrait', 'Ride a moving staircase'] },
    { id: 'gryffindor-common', area: 'Common rooms', name: 'Gryffindor common room', icon: '🦁', desc: 'A round tower room in scarlet and gold, behind the portrait of the Fat Lady.', actions: ['Give the password to the Fat Lady', 'Rest by the fire', 'Hear the latest gossip'] },
    { id: 'ravenclaw-common', area: 'Common rooms', name: 'Ravenclaw common room', icon: '🦅', desc: 'An airy blue tower with a starry domed ceiling. The door has no password, only a riddle.', actions: ['Answer the eagle knocker’s riddle', 'Read by the windows', 'Hear the latest gossip'] },
    { id: 'hufflepuff-common', area: 'Common rooms', name: 'Hufflepuff common room', icon: '🦡', desc: 'A cosy round basement room full of plants, copper pots and honey-coloured wood, near the kitchens.', actions: ['Tap the barrels in the right rhythm', 'Rest by the fire', 'Hear the latest gossip'] },
    { id: 'slytherin-common', area: 'Common rooms', name: 'Slytherin common room', icon: '🐍', desc: 'A long low dungeon under the lake, lit green by the water outside the windows.', actions: ['Give the password to the bare stone wall', 'Watch the lake through the windows', 'Hear the latest gossip'] },
    { id: 'kitchens', area: 'Castle', name: 'The Kitchens', icon: '🍲', exits: ['hufflepuff-common'], desc: 'Behind a painting of a fruit bowl: tickle the pear. House-elves everywhere.', actions: ['Tickle the pear to get in', 'Ask the house-elves for food', 'Ask the house-elves what they’ve heard'] },
    { id: 'library', area: 'Castle', name: 'The Library', icon: '📚', desc: 'Silent shelves and a librarian who hears everything.', exits: ['restricted-section'], actions: ['Search the shelves (INT)', 'Ask the librarian'] },
    { id: 'restricted-section', area: 'Castle', name: 'Restricted Section', icon: '⛓️', desc: 'Chained books that whisper when you pass.', secret: true, actions: ['Read a chained book (WIS)', 'Look for the page about Vale'] },
    { id: 'dungeons', area: 'Castle', name: 'The Dungeons', icon: '⚗️', desc: 'Cold stone, green light, and the Potions classroom.', exits: ['undercroft', 'slytherin-common'], actions: ['Check the store cupboard', 'Brew something'] },
    { id: 'charms-classroom', area: 'Castle', name: 'Charms classroom', icon: '✨', desc: 'Tiered desks and a tall stack of books for the professor to stand on.', actions: ['Practise a charm', 'Ask Flitwick a question'] },
    { id: 'transfiguration-classroom', area: 'Castle', name: 'Transfiguration classroom', icon: '🔄', desc: 'Neat rows of desks, cages of beetles, and a stern blackboard.', actions: ['Study the transfiguration charts'] },
    { id: 'defence-classroom', area: 'Castle', name: 'Defence classroom', icon: '🛡️', desc: 'Ashgrove’s room. Too many paintings for comfort.', actions: ['Study the paintings', 'Search Ashgrove’s desk'] },
    { id: 'trophy-room', area: 'Castle', name: 'Trophy Room', icon: '🏆', desc: 'Old awards, including a certain Quidditch Cup.', actions: ['Inspect the old trophies'] },
    { id: 'owlery', area: 'Castle', name: 'The Owlery', icon: '🦉', desc: 'Freezing, windy, and full of owls.', actions: ['Send an owl home'] },
    { id: 'astronomy-tower', area: 'Castle', name: 'Astronomy Tower', icon: '🔭', desc: 'The highest point in the castle.', actions: ['Look out over the grounds'] },
    { id: 'hospital-wing', area: 'Castle', name: 'Hospital Wing', icon: '🏥', desc: 'Where the drained students lie, still and grey.', actions: ['Visit the drained students', 'Ask the matron what she’s seen'] },
    { id: 'room-of-requirement', area: 'Castle', name: 'Room of Requirement', icon: '✨', desc: 'It becomes whatever you need.', secret: true, actions: ['Ask the room for what you need'] },
    { id: 'undercroft', area: 'Castle', name: 'The Undercroft', icon: '🕳️', desc: 'Beneath the castle. A door with a serpent carved in it.', secret: true, actions: ['Face what waits in the dark'] },
    { id: 'courtyard', area: 'Grounds', name: 'The Courtyard', icon: '⛲', desc: 'Stone arches and gossiping students.', exits: ['greenhouses', 'quidditch-pitch', 'black-lake', 'hagrids-hut', 'hogsmeade'], actions: ['Chat with other students', 'Spin: Hogwarts surprises'] },
    { id: 'greenhouses', area: 'Grounds', name: 'Greenhouses', icon: '🌱', desc: 'Warm, damp, and something is screaming in a pot.', actions: ['Help with the plants', 'Gather ingredients'] },
    { id: 'quidditch-pitch', area: 'Grounds', name: 'Quidditch Pitch', icon: '🧹', desc: 'Towering hoops and wind.', actions: ['Borrow a school broom'] },
    { id: 'black-lake', area: 'Grounds', name: 'The Black Lake', icon: '🌊', desc: 'Dark water. Something large moves beneath.', actions: ['Skim stones and watch the water'] },
    { id: 'hagrids-hut', area: 'Grounds', name: 'The old gamekeeper’s hut', icon: '🛖', desc: 'A giant-sized door, and pumpkins.', exits: ['forbidden-forest'], actions: ['Knock on the giant door'] },
    { id: 'forbidden-forest', area: 'Grounds', name: 'Forbidden Forest', icon: '🌲', desc: 'Out of bounds. For good reason.', actions: ['Follow the silver glow', 'Spin: Forbidden Forest'] },
    { id: 'hogsmeade', area: 'Hogsmeade', name: 'Hogsmeade Village', icon: '🏘️', desc: 'Snowy rooftops and sweet shops.', exits: ['three-broomsticks', 'shrieking-shack'], actions: ['Browse the shops'] },
    { id: 'three-broomsticks', area: 'Hogsmeade', name: 'The Three Broomsticks', icon: '🍺', desc: 'Butterbeer and loose tongues.', actions: ['Buy a Butterbeer', 'Listen for rumours'] },
    { id: 'shrieking-shack', area: 'Hogsmeade', name: 'The Shrieking Shack', icon: '🏚️', desc: 'The most haunted building in Britain. Supposedly.', secret: true, actions: ['Search the broken rooms'] },
  ],

  classes: {
    charms: { name: 'Charms', icon: '✨', professor: 'Professor Flitwick', game: 'charms', room: 'charms-classroom', prof: 'flitwick' },
    potions: { name: 'Potions', icon: '⚗️', professor: 'Professor Grimsby', game: 'potions', room: 'dungeons', prof: 'grimsby' },
    herbology: { name: 'Herbology', icon: '🌱', professor: 'Professor Longbottom', game: 'herbology', room: 'greenhouses', prof: 'longbottom' },
    defence: { name: 'Defence Against the Dark Arts', icon: '🛡️', professor: 'Professor Ashgrove', game: 'defence', room: 'defence-classroom', prof: 'ashgrove' },
    transfiguration: { name: 'Transfiguration', icon: '🔄', professor: 'Professor Vance', game: 'transfiguration', room: 'transfiguration-classroom', prof: 'vance' },
    creatures: { name: 'Care of Magical Creatures', icon: '🐾', professor: 'Professor Scamander', game: 'creatures', room: 'hagrids-hut', prof: 'scamander' },
    flying: { name: 'Flying Lessons', icon: '🧹', professor: 'Madam Hooch', game: 'flying', room: 'quidditch-pitch', prof: 'hooch' },
  },

  // What each class teaches the students who show up (and pass the minigame).
  timetable: {
    1: {
      'Morning class': { class: 'charms', lesson: { type: 'spell', spell: 'lumos' } },
      'Afternoon class': { class: 'potions', lesson: { type: 'item', item: 'pepperup', qty: 2, name: 'Pepperup Potion' } },
    },
    2: {
      'Morning class': { class: 'herbology', lesson: { type: 'item', item: 'mandrake-leaf', qty: 1, name: 'Mandrake care' } },
      'Afternoon class': { class: 'defence', lesson: { type: 'spell', spell: 'expelliarmus' } },
    },
    3: {
      'Morning class': { class: 'transfiguration', lesson: { type: 'spell', spell: 'avifors' } },
      'Afternoon class': { class: 'creatures', lesson: { type: 'item', item: 'creature-treats', qty: 2, name: 'Handling magical creatures' } },
    },
    4: {
      'Morning class': { class: 'potions', lesson: { type: 'item', item: 'wiggenweld', qty: 2, name: 'Wiggenweld Potion' } },
      'Afternoon class': { class: 'flying', lesson: { type: 'perk', perk: 'Can fly a broom', name: 'Broom flying' } },
    },
    5: {
      'Morning class': { class: 'charms', lesson: { type: 'spell', spell: 'alohomora' } },
      'Afternoon class': { class: 'defence', lesson: { type: 'spell', spell: 'protego' } },
    },
    6: {
      'Morning class': { note: 'Hogsmeade visit: no classes. Open the shops if you like.' },
      'Afternoon class': { note: 'Hogsmeade visit: no classes.' },
    },
    7: {
      'Morning class': { class: 'transfiguration', lesson: { type: 'spell', spell: 'incendio' } },
      'Afternoon class': { note: 'Classes cancelled. The castle is on lockdown.' },
    },
  },

  // Story beats, visible only on the GM screen, at the moment they happen.
  beats: {
    '1-Curfew': 'A covered painting is hung in the Undercroft corridor. A Quill feels its eyes.',
    '2-Curfew': 'The Sinclair prefect is found drained outside the Ravenclaw tower. Cliffhanger for day one of play.',
    '3-Lunch': 'A second student is drained near the library. Portraits in that corridor are strangely silent.',
    '4-Free time': 'The only book page about Corvin Vale vanishes from the Restricted Section.',
    '5-Curfew': 'Professor Grimsby is caught standing over a third victim. (He was trying to help. Red herring.)',
    '6-Free time': 'Ashgrove’s eyes flicker with paint. The truth can come out tonight if the party is close.',
    '7-Curfew': 'The ritual. If Vale isn’t stopped before this block ends, he walks free and the game is lost.',
  },

  // ---------- Wheels ----------
  // label: short text on the slice. text: what the TV announces. effect: applied to whoever spun.
  // Slices are equally likely, so repeat a slice to make it more common.
  wheels: {
    beans: {
      name: "Bertie Bott's Beans", icon: '🫘',
      segments: [
        { label: 'Chocolate', text: 'Chocolate! Delicious. +2 HP', effect: { hp: 2 } },
        { label: 'Earwax', text: 'Earwax. Everyone watches you gag' },
        { label: 'Toffee', text: 'Toffee! +2 HP', effect: { hp: 2 } },
        { label: 'Vomit', text: 'Vomit flavour. −2 HP', effect: { hp: -2 } },
        { label: 'Pepper', text: 'Pepper! You breathe smoke. +2 mana', effect: { mana: 2 } },
        { label: 'Bogey', text: 'Bogey. You swallow it anyway' },
        { label: 'Grass', text: 'Freshly cut grass. Oddly nice' },
        { label: 'Cherry', text: 'Cherry! +2 HP', effect: { hp: 2 } },
      ],
    },
    brewing: {
      name: 'Potion brewing', icon: '⚗️',
      segments: [
        { label: 'Perfect!', text: 'A perfect brew! +10 XP', effect: { xp: 10 } },
        { label: 'Good', text: 'A good, solid brew' },
        { label: 'Good', text: 'A good, solid brew' },
        { label: 'Bubbles', text: 'It bubbles over and burns your hand. −2 HP', effect: { hp: -2 } },
        { label: 'BOOM', text: 'Small explosion! −3 HP and no eyebrows', effect: { hp: -3 } },
        { label: 'Wrong colour', text: 'Wrong colour. Grimsby sighs. −5 points', effect: { points: -5 } },
        { label: 'Good', text: 'A good, solid brew' },
        { label: 'Inspired', text: 'Inspired brewing! +5 points', effect: { points: 5 } },
      ],
    },
    curfew: {
      name: 'Out after curfew', icon: '🌙',
      segments: [
        { label: 'Safe', text: 'Nobody saw a thing' },
        { label: 'Mrs Norris', text: 'Mrs Norris spots you. −5 points', effect: { points: -5 } },
        { label: 'Safe', text: 'Nobody saw a thing' },
        { label: 'Filch!', text: 'Filch catches you! −10 points and detention', effect: { points: -10, detention: true } },
        { label: 'Peeves', text: 'Peeves shrieks your name down the corridor. −5 points', effect: { points: -5 } },
        { label: 'Prefect', text: 'A prefect sees you… and lets it slide' },
        { label: 'Safe', text: 'Nobody saw a thing' },
        { label: 'Secret!', text: 'You stumble on a secret passage. +10 XP', effect: { xp: 10 } },
      ],
    },
    misfire: {
      name: 'Wand misfire', icon: '🪄',
      segments: [
        { label: 'Sparks', text: 'A shower of harmless sparks' },
        { label: 'Vase', text: 'A vase across the shop explodes' },
        { label: 'Blue hair', text: 'Your hair turns bright blue' },
        { label: 'Knocked', text: 'It knocks you flat. −1 HP', effect: { hp: -1 } },
        { label: 'Eyebrows', text: 'Mr Ollivander’s eyebrows are singed' },
        { label: 'Nothing', text: 'Nothing happens. Very awkward' },
      ],
    },
    gossip: {
      name: 'Portrait gossip', icon: '🖼️',
      segments: [
        { label: 'Quiet', text: 'The portrait keeps your secret' },
        { label: 'Quiet', text: 'The portrait keeps your secret' },
        { label: 'Teacher', text: 'It tells a teacher. −5 points', effect: { points: -5 } },
        { label: 'Corridor', text: 'It tells the whole corridor. Everyone knows' },
        { label: 'Favour', text: 'It keeps quiet… for a favour, later' },
        { label: 'Quiet', text: 'The portrait keeps your secret' },
      ],
    },
    parseltongue: {
      name: 'They heard you hiss', icon: '🐍',
      segments: [
        { label: 'Terrified', text: 'They’re terrified and run' },
        { label: 'Suspicious', text: 'They’ll be watching you now' },
        { label: 'Impressed', text: 'They’re secretly impressed' },
        { label: 'Tells all', text: 'By dinner, the whole school knows' },
        { label: 'Missed it', text: 'They didn’t notice a thing' },
        { label: 'Teacher', text: 'They report you to a teacher. −5 points', effect: { points: -5 } },
      ],
    },
    forest: {
      name: 'Forbidden Forest', icon: '🌲',
      segments: [
        { label: 'Bowtruckles', text: 'A family of Bowtruckles watches from a tree' },
        { label: 'Acromantula', text: 'ACROMANTULA! Roll for initiative' },
        { label: 'Centaur', text: 'A centaur blocks the path. It has questions' },
        { label: 'Unicorn', text: 'A unicorn, silver in the dark. +10 XP', effect: { xp: 10 } },
        { label: 'Thestral', text: 'Something invisible breathes nearby' },
        { label: 'Fog', text: 'Only fog, and the feeling of being watched' },
        { label: 'Hippogriff', text: 'A hippogriff… with a torn Thornbury tag' },
        { label: 'Howling', text: 'A howl. Everyone roll WIS' },
      ],
    },
    unforgivable: {
      name: 'Did anyone see?', icon: '💚', secret: true,
      segments: [
        { label: 'Unseen', text: 'Nobody saw. This time.' },
        { label: 'Teacher!', text: 'A teacher saw the green light.', effect: { expel: true } },
        { label: 'Unseen', text: 'Nobody saw. This time.' },
        { label: 'Portrait', text: 'A portrait saw everything. It may talk…' },
        { label: 'Unseen', text: 'Nobody saw. This time.' },
        { label: 'Ghost', text: 'A ghost drifts away without a word.' },
        { label: 'Unseen', text: 'Nobody saw. This time.' },
        { label: 'Headmaster', text: 'The Headmaster was watching.', effect: { expel: true } },
      ],
    },
    castle: {
      name: 'Hogwarts surprises', icon: '🏰',
      segments: [
        { label: 'Staircase', text: 'The staircase swings away. You’re late for everything' },
        { label: 'Peeves', text: 'Peeves ambush! −1 HP', effect: { hp: -1 } },
        { label: 'Passage', text: 'You find a hidden passage. +10 XP', effect: { xp: 10 } },
        { label: 'House-elf', text: 'A house-elf slips you a Chocolate Frog', effect: { item: 'chocolate-frog' } },
        { label: 'Ghost', text: 'A ghost whispers a rumour about the painting' },
        { label: 'Galleons', text: 'You find Galleons in an old suit of armour. +5', effect: { gold: 5 } },
        { label: 'Calm', text: 'A quiet moment. Nothing happens' },
        { label: 'Portrait', text: 'A portrait winks at you knowingly' },
      ],
    },
  },

  // ---------- Chests ----------
  // Contents are rolled when the GM places the chest. dc = the d20 + stat roll needed to open it.
  chests: {
    'small-chest': { name: 'Small chest', icon: '📦', dc: 8, stat: 'dex', gold: [3, 10], loot: ['chocolate-frog', 'pumpkin-pasty', 'bertie-botts', 'pepperup'], picks: 1 },
    'locked-chest': { name: 'Locked chest', icon: '🧰', dc: 13, stat: 'dex', gold: [10, 25], loot: ['pepperup', 'focus-draught', 'wiggenweld', 'remembrall', 'extendable-ears'], picks: 2 },
    'ancient-chest': { name: 'Ancient chest', icon: '🗃️', dc: 16, stat: 'int', gold: [25, 60], loot: ['wiggenweld', 'felix', 'sneakoscope', 'focus-draught', 'frog-card'], picks: 2 },
    'cursed-chest': { name: 'Cursed chest', icon: '⚰️', dc: 14, stat: 'dex', gold: [20, 40], loot: ['felix', 'wiggenweld', 'sneakoscope'], picks: 1, trap: 4 },
  },

  // ---------- Quests ----------
  // reward: xp and gold go to each player on the quest; points go to each player's house.
  quests: [
    {
      id: 'hollow-heir', main: true, title: 'The Hollow Heir', giver: 'The castle itself', icon: '🖼️',
      desc: 'Students are being found drained of their magic. Something in Hogwarts is feeding.',
      objectives: ['Find out what is draining the students', 'Learn the name of the painted man', 'Find the way into the Undercroft', 'Stop the ritual before the seventh night ends'],
      reward: { xp: 150, points: 50 },
    },
    {
      id: 'wake-sleepers', title: 'Wake the Sleepers', giver: 'Professor Longbottom', icon: '🌱',
      desc: 'A Restorative Draught could wake the drained students, if someone can gather what it needs.',
      objectives: ['Gather 3 Mandrake leaves', 'Brew the Restorative Draught', 'Bring it to the Hospital Wing'],
      reward: { xp: 60, points: 20, items: ['wiggenweld'] },
    },
    {
      id: 'bramble', title: 'Where is Bramble?', giver: 'Professor Scamander', icon: '🦅',
      desc: 'A hippogriff with a torn Thornbury tag has been seen near the Forbidden Forest.',
      objectives: ['Find Bramble’s tracks in the Forbidden Forest', 'Calm Bramble without hurting her', 'Bring her safely out of the forest'],
      reward: { xp: 50, gold: 15, items: ['creature-treats'] },
    },
    {
      id: 'other-half', title: 'The Other Half', giver: 'A note in the Fenwick map', icon: '📜',
      desc: 'Someone at Hogwarts has the other half of the Marauder’s Map, and they know you have yours.',
      objectives: ['Find out who has the other half', 'Win it back, by trade, trick or duel', 'Join the halves'],
      reward: { xp: 50, items: ['frog-card'] },
    },
    {
      id: 'stolen-ingredients', title: 'Stolen Ingredients', giver: 'Professor Grimsby', icon: '🫙',
      desc: 'Someone has been raiding the Potions store cupboard. Grimsby is furious, and suspicious of everyone.',
      objectives: ['Search the Dungeons for clues', 'Catch the thief', 'Return the jars to Grimsby'],
      reward: { xp: 30, gold: 10, items: ['pepperup', 'pepperup'] },
    },
    {
      id: 'dueling-champion', title: 'Dueling Club Champion', giver: 'Professor Flitwick', icon: '⚔️',
      desc: 'The Dueling Club is looking for a first-year champion.',
      objectives: ['Beat a Dueling Club rival', 'Beat two more rivals', 'Win the final against an older student'],
      reward: { xp: 40, points: 15 },
    },
    {
      id: 'card-collector', title: 'Card Collector', giver: 'A Ravenclaw collector', icon: '🃏',
      desc: 'An older student will trade a secret for a rare Chocolate Frog card.',
      objectives: ['Find a rare Chocolate Frog card', 'Trade it to the collector'],
      reward: { xp: 25, items: ['felix'] },
    },
    {
      id: 'keep-an-eye-out', title: 'Keep an Eye Out', giver: 'Prefect Sinclair', icon: '🎖️',
      desc: 'The Sinclair prefect thinks something is wrong with the castle this year.',
      objectives: ['Meet the prefect after dinner', 'Follow her patrol route', 'Find what she was afraid of'],
      reward: { xp: 30, points: 10 },
    },
    // ---------- Hidden quests: only you see these until you hand them out ----------
    {
      id: 'vales-trials', hidden: true, title: 'The Trials Beneath', giver: 'A door with a serpent on it', icon: '🚪',
      desc: 'Vale guarded the way to his chamber with trials, one for each kind of student he despised.',
      objectives: ['Get past the Devil’s Snare', 'Light every torch on the Torch Wall', 'Win the Living Chessboard', 'Drink from the right bottle'],
      reward: { xp: 120, points: 40 },
    },
    {
      id: 'turning-lock', hidden: true, title: 'The Turning Lock', giver: 'The Room of Requirement', icon: '⌛',
      desc: 'In a forgotten corner of the Room of Requirement sits a chest with three stone rings for a lock. Something inside is ticking.',
      objectives: ['Find the Room of Requirement', 'Find the three ring clues (Trophy Room, Astronomy Tower, Owlery)', 'Turn the rings to open the lock'],
      reward: { xp: 60 }, manual: 'The Time-Turner (one use). Use it from the Day & class tab.',
    },
    {
      id: 'painters-bargain', hidden: true, title: 'The Painter’s Bargain', giver: 'A whisper from the covered painting', icon: '💚',
      desc: 'The painting knows a curse that cannot be blocked. It will teach one student, if they can prove they deserve it. Nothing it gives is free.',
      objectives: [
        'Find all three pages of Vale’s diary (Restricted Section, Black Lake, Shrieking Shack)',
        'Decode the diary’s runes',
        'Go to the painting alone, during curfew',
        'Answer the painting’s question truthfully',
        'Choose: accept the bargain, or walk away',
      ],
      reward: { xp: 50 }, manual: 'The Killing Curse. Teach it secretly from the Players tab (Edit stats and limits).',
    },
    {
      id: 'old-cup', hidden: true, title: 'The Old Cup', giver: 'A trophy in the Trophy Room', icon: '🏆',
      desc: 'One old Quidditch Cup has a line engraved beneath the names that nobody seems to have noticed.',
      objectives: ['Read the engraving on the old cup', 'Follow it to the Astronomy Tower', 'Find what was hidden there'],
      reward: { xp: 30, items: ['ring-clue-moon', 'felix'] },
    },
  ],

  // ---------- Opening cutscene (TV) ----------
  // Story images: public/story/page-1.jpg … page-6.jpg. Recorded narration (optional):
  // public/sounds/narration/page-1.mp3 … page-6.mp3. Intro music (optional): public/sounds/music/intro.mp3.
  intro: {
    studio: { mark: 'GM', name: 'Zibby', presents: 'presents' },
    title: { over: 'Harry Potter', main: 'and the Hollow Heir' },
    cover: 'The Hollow Heir',
    pages: [
      { icon: '🎨', text: 'Three hundred years ago, a painter named Corvin Vale made portraits so lifelike that people swore his subjects breathed.' },
      { icon: '⏳', text: 'He feared one thing above all others: growing old. So he began his greatest work, a portrait of himself that would never age, never fade, and never end.' },
      { icon: '🌑', text: 'To finish it, he needed the light of the young. Students began to be found at dawn, grey and silent, as if someone had painted them in ash.' },
      { icon: '🔒', text: 'A family called Blackwood stopped him. They sealed Vale inside his own unfinished canvas, and hid it where no one would ever think to look.' },
      { icon: '🚂', text: 'For three centuries, the painting slept. Until this summer, when someone found it, wrapped it in grey cloth, and put it on a train to Hogwarts.' },
      { icon: '✉️', text: 'Six families are about to receive a letter. Six children are about to begin their first year. None of them know that the painting is waiting for them.' },
    ],
    choose: 'Choose your family',
  },

  // ---------- Music (files in public/sounds/music/<id>.mp3) ----------
  music: [
    { id: 'castle', name: 'Castle halls' },
    { id: 'great-hall', name: 'Great Hall feast' },
    { id: 'diagon', name: 'Diagon Alley' },
    { id: 'mystery', name: 'Mystery and clues' },
    { id: 'forest', name: 'Forbidden Forest' },
    { id: 'battle', name: 'Battle' },
    { id: 'undercroft', name: 'The Undercroft' },
    { id: 'victory', name: 'Victory' },
  ],

  // ---------- Mimics: disguised until someone gets too close ----------
  mimics: {
    'hungry-trunk': {
      name: 'The Hungry Trunk', icon: '🧳', disguise: 'chest', looksLike: 'locked-chest',
      hp: 30, defence: 13, atk: 5, dmg: { count: 1, die: 8 }, init: 2, xp: 60, hoard: [30, 60],
      behaviour: 'swallow',
      desc: 'Bites swallow a random item from the target’s bag. Each item: it grows and gains 5 max HP. Potions heal it. 3+ items: +1d6 bite. Spits everything out when beaten.',
    },
    'painted-double': {
      name: 'The Painted Double', icon: '🎭', disguise: 'person',
      hp: 26, defence: 14, atk: 4, dmg: { count: 1, die: 6 }, init: 3, xp: 60, hoard: [15, 30],
      behaviour: 'mirror', weakTo: 'incendio',
      desc: 'Copies a person. On its turn it casts the last spell that hit it back at that caster, for the same damage. Incendio does double damage.',
    },
  },
  // Items a mimic can never swallow (the story needs them).
  unswallowable: ['serpent-key', 'map-half', 'diary-page', 'ring-clue-serpent', 'ring-clue-moon', 'ring-clue-owl', 'vale-page'],

  // ---------- Detention: where it happens and what it quietly starts ----------
  detention: { loc: 'trophy-room', npc: 'filch', quest: 'old-cup' },

  // ---------- Suspect board ----------
  suspects: [
    { id: 'ashgrove', name: 'Professor Ashgrove', icon: '🧙', note: 'Defence teacher. Everyone’s favourite.' },
    { id: 'grimsby', name: 'Professor Grimsby', icon: '⚗️', note: 'Potions master. Nobody’s favourite.' },
    { id: 'filch', name: 'Argus Filch', icon: '🔦', note: 'Has a key to everything.' },
    { id: 'rival', name: 'Cassius Thorne', icon: '😏', note: 'A smug older student.' },
    { id: 'ghost', name: 'A Hogwarts ghost', icon: '👻', note: 'Goes through walls.' },
    { id: 'painting', name: 'The covered painting', icon: '🖼️', note: 'Arrived on the train.' },
  ],
  // Pin a clue under a suspect when the players find it. "clears" clues point away from someone.
  clues: [
    { id: 'cupboard-raided', text: 'Grimsby’s store cupboard was raided the night of the first attack', points: 'grimsby' },
    { id: 'grimsby-standing', text: 'Grimsby was found standing over the third victim', points: 'grimsby' },
    { id: 'grimsby-draught', text: 'Grimsby was secretly brewing a draught to wake the victims', points: 'grimsby', clears: true },
    { id: 'more-paintings', text: 'Ashgrove’s classroom has more paintings every day', points: 'ashgrove' },
    { id: 'wet-paint', text: 'Flecks of wet paint on Ashgrove’s sleeve', points: 'ashgrove' },
    { id: 'ashgrove-eyes', text: 'Ashgrove’s eyes looked like brushstrokes for a moment', points: 'ashgrove' },
    { id: 'filch-keys', text: 'Filch has keys to every corridor where students were drained', points: 'filch' },
    { id: 'filch-detention', text: 'Filch was supervising a detention on the night of the second attack', points: 'filch', clears: true },
    { id: 'rival-map', text: 'Cassius was seen with half of an old map', points: 'rival' },
    { id: 'rival-alibi', text: 'Cassius was in the Hospital Wing himself on night three', points: 'rival', clears: true },
    { id: 'portraits-silent', text: 'Every portrait near an attack had gone silent', points: 'painting' },
    { id: 'painting-moves', text: 'The covered painting hangs in a different corridor each night', points: 'painting' },
    { id: 'painting-eyes', text: 'The covered painting’s eyes follow a Quill', points: 'painting' },
    { id: 'vale-page', text: 'A page about Corvin Vale, a painter who wanted to live forever', points: 'painting' },
    { id: 'ghost-saw', text: 'A ghost saw a figure “step out of a frame”', points: 'ghost' },
  ],

  // ---------- Hazards: things on the map the players can use in a fight ----------
  hazards: {
    'paint-jars': { name: 'Shelf of paint jars', icon: '🎨', action: 'Set the paint jars alight', effect: { killKind: 'paint-wraith', bossDamage: 5 }, desc: 'Destroys every Paint Wraith here and burns bosses for 5.' },
    'cracked-mirror': { name: 'Cracked mirror', icon: '🪞', action: 'Bounce a spell off the cracked mirror', effect: { bossDamage: 8 }, desc: 'Reflected magic hits bosses for 8.' },
    braziers: { name: 'Cold braziers', icon: '🔥', action: 'Light the braziers', effect: { heal: 5 }, desc: 'Warmth heals every student here by 5.' },
    'ritual-circle': { name: 'Ritual circle', icon: '⭕', action: 'Break the ritual circle', effect: { bossDefence: -3 }, desc: 'Bosses here lose 3 Defence.' },
    canvas: { name: 'Vale’s empty canvas', icon: '🖼️', action: 'Slash or burn the empty canvas', effect: { bossDamage: 15 }, desc: 'His anchor to this world: 15 damage to bosses.' },
    pillar: { name: 'Cracked pillar', icon: '🏛️', action: 'Topple the cracked pillar', effect: { damageAll: 6 }, desc: '6 damage to every enemy here.' },
  },

  // ---------- TV puzzles: shown on the TV, operated by the GM, solved by talking ----------
  puzzles: [
    {
      id: 'living-chess', type: 'chess', icon: '♟️', title: 'The Living Chessboard',
      intro: 'You stand on a giant chessboard as the white pieces. White to move: checkmate the black king in two moves. Each of you is a piece. Choose carefully, because the board strikes back.',
      fen: '7k/R2B4/3p4/6N1/8/n3p2K/6P1/8',
      solution: '1. Bishop d7 → e6 (quiet move: it clears the rook’s path along the 7th rank AND guards g8). Whatever Black does, 2. Rook a7 → h7 is checkmate. Any other first move: Black escapes; reset the board.',
    },
    {
      id: 'torch-wall', type: 'torches', icon: '🔥', title: 'The Torch Wall',
      intro: 'Touch a torch and it flips, along with the torches directly above, below, left and right of it. Light every torch to open the way.',
      size: 5,
      start: [1,1,0,0,0, 0,0,0,1,0, 0,0,0,0,0, 0,0,0,0,0, 0,1,1,1,0],
      solution: [[0,0],[0,1],[0,4],[2,2],[3,0],[3,4]],
    },
    {
      id: 'turning-lock', type: 'rings', icon: '🌀', title: 'The Turning Lock',
      intro: 'Three stone rings, each carved with symbols. Turn them until the right three symbols sit beneath the arrow.',
      rings: [
        ['🌙', '🦉', '🐍', '⭐', '🗝️', '🦁'],
        ['⭐', '🦡', '☀️', '🌙', '🐍', '🦅'],
        ['🗝️', '🐍', '🦡', '🌙', '🦉', '☀️'],
      ],
      answer: ['🐍', '🌙', '🦉'],
      solution: 'Serpent, Moon, Owl. Clues: “what sleeps beneath the castle” (the serpent in the Undercroft), “the lamp of the night” (the moon), “the one who carries every letter” (an owl).',
    },
    {
      id: 'seven-bottles', type: 'bottles', icon: '⚗️', title: 'The Seven Bottles',
      intro: 'Seven bottles stand in a row. One lets you walk on through the fire. One leads safely back. Two bring a deep sleep. Three are poison. Only one of you may drink to go forward.',
      bottles: [
        { shape: 'tall', colour: 'green', kind: 'poison' },
        { shape: 'small', colour: 'red', kind: 'sleep' },
        { shape: 'round', colour: 'blue', kind: 'poison' },
        { shape: 'small', colour: 'gold', kind: 'forward' },
        { shape: 'tall', colour: 'purple', kind: 'poison' },
        { shape: 'round', colour: 'green', kind: 'sleep' },
        { shape: 'tiny', colour: 'clear', kind: 'back' },
      ],
      clues: [
        'No poison stands beside the way back.',
        'No two poisons stand side by side.',
        'Every tall bottle is poison.',
        'The way back stands beside a sleeping draught.',
        'The way forward is neither red nor clear.',
        'The way forward stands somewhere to the left of the way back.',
      ],
      solution: 'Bottle 4, the small gold one. Poison: 1, 3, 5. Sleep: 2, 6. Back: 7. (Checked: these six clues allow only this answer, and every clue is needed.)',
    },
    {
      id: 'vale-diary', type: 'cipher', icon: '📓', title: 'Vale’s Diary',
      intro: 'Vale wrote his diary in runes. Each rune is always the same letter. Work out what it says.',
      message: 'ONLY THE ONE WHO STANDS ALONE MAY LEARN THE CURSE THAT CANNOT BE BLOCKED',
      given: ['E', 'T'],
      solution: 'ONLY THE ONE WHO STANDS ALONE MAY LEARN THE CURSE THAT CANNOT BE BLOCKED. (This is why the painting must be visited alone.)',
    },
    {
      id: 'constellation', type: 'constellation', icon: '✨', title: 'The Serpent in the Stars',
      intro: 'On the Astronomy Tower, the stars are numbered in silver. “Draw the serpent: begin at its eye, the brightest star, and always move to the next brightest.” Tell the DM which stars to join.',
      stars: [
        { n: 5, x: 14, y: 30, r: 26 }, { n: 2, x: 26, y: 20, r: 22 }, { n: 7, x: 39, y: 30, r: 19 }, { n: 1, x: 48, y: 46, r: 16 },
        { n: 8, x: 58, y: 60, r: 13 }, { n: 3, x: 70, y: 66, r: 10 }, { n: 6, x: 80, y: 54, r: 8 }, { n: 4, x: 88, y: 38, r: 6 },
      ],
      answer: [[5, 2], [2, 7], [7, 1], [1, 8], [8, 3], [3, 6], [6, 4]],
      solution: 'Join 5–2–7–1–8–3–6–4 (brightest to faintest). Any order of joining works; it checks the lines.',
    },
    {
      id: 'moving-stairs', type: 'stairs', icon: '🪜', title: 'The Moving Staircases',
      intro: 'The staircases have swung out of place. Turn the pieces until a single path runs from the arrow on the left to the door on the right.',
      size: 4,
      tiles: [[5, 2], [3, 3], [3, 3], [7, 1], [5, 3], [5, 3], [3, 3], [3, 0], [5, 3], [3, 2], [3, 0], [5, 1], [7, 0], [7, 3], [3, 1], [3, 3]],
      solution: 'Clockwise turns (row-column): 1-1 ×3, 1-2 ×3, 2-2 ×1, 3-2 ×2, 3-3 ×3, 2-3 ×2, 2-4 ×2, 3-4 ×3, 4-4 ×1. It checks the path, so any working route counts.',
    },
    {
      id: 'portrait-jigsaw', type: 'slider', icon: '🖼️', title: 'The Scrambled Portrait',
      intro: 'A portrait has been cut into squares and shuffled. Slide the pieces into the gap until the picture is whole. The portrait will tell you a secret.',
      start: [0, 4, 1, 7, 2, 3, 6, 5, 8],
      solution: 'Slide pieces into the gap until they read 1–8 with the gap last. The shortest solution is 16 slides.',
    },
    {
      id: 'rune-floor', type: 'runefloor', icon: '🪨', title: 'The Rune Floor',
      intro: 'Above the far door, five runes are carved. Cross the floor from the bottom row to the top, stepping only up, left or right, on those runes in that order, again and again. One wrong step and the floor bites.',
      word: 'ALONE',
      grid: ['OLNBL', 'EAAAR', 'NOLRO', 'STAEN', 'NRTLO', 'NBOAI'],
      solution: 'Start on the bottom row, 4th tile. Path (row counted from the bottom, column): 1-4, 2-4, 2-5, 3-5, 3-4, 3-3, 4-3, 4-2, 4-1, 5-1, 5-2, 6-2. Checked: it is the only safe path.',
    },

  ],

  items,
};
