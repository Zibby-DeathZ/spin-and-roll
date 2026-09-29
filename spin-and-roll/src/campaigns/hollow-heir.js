// The Hollow Heir: campaign data the engine reads.

const items = {
  'chocolate-frog': { name: 'Chocolate Frog', icon: '🐸', effect: { hp: 5 }, note: 'Comes with a collectible card' },
  'pumpkin-pasty': { name: 'Pumpkin Pasty', icon: '🥧', effect: { hp: 3 } },
  pepperup: { name: 'Pepperup Potion', icon: '🧪', effect: { hp: 10 } },
  wiggenweld: { name: 'Wiggenweld Potion', icon: '💚', effect: { hp: 20 } },
  'focus-draught': { name: 'Focus Draught', icon: '🔮', effect: { mana: 10 } },
  'bertie-botts': { name: "Bertie Bott's Beans", icon: '🫘', note: 'Spin the bean wheel' },
  felix: { name: 'Felix Felicis', icon: '✨', note: 'One free re-spin' },
  remembrall: { name: 'Remembrall', icon: '🔴', note: 'Ask the DM to remind you of one clue' },
  'extendable-ears': { name: 'Extendable Ears', icon: '👂', note: 'Overhear one private NPC conversation' },
  sneakoscope: { name: 'Pocket Sneakoscope', icon: '🌀', note: 'Spins when someone nearby lies' },
};

export const hollowHeir = {
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
      id: 'sinclair', name: 'Sinclair', blood: 'Half-blood', wealth: 'Comfortable vault', vault: 300,
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
      id: 'fenwick', name: 'Fenwick', blood: 'Half-blood', wealth: 'Healthy vault', vault: 220,
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
      id: 'marlowe', name: 'Marlowe', blood: 'Pureblood', wealth: 'Nearly empty vault', vault: 25,
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

  items,
};
