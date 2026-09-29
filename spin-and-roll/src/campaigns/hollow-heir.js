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
      stats: { str: 8, dex: 10, con: 12, int: 14, wis: 13, cha: 15 },
      story: 'One of the oldest wizarding families in Britain. Portraits of Blackwoods line every wall of the family manor, and all of them have opinions.',
      secret: 'Your grandmother’s diary mentions “the painted man” and a debt the Blackwoods never paid. Centuries ago, a Blackwood sealed a dark wizard inside a painting.',
    },
    {
      id: 'sinclair', name: 'Sinclair', blood: 'Half-blood', wealth: 'Comfortable vault', vault: 300,
      stats: { str: 14, dex: 12, con: 15, int: 13, wis: 10, cha: 8 },
      story: 'A family of Aurors. Both parents hunt dark wizards for the Ministry and are rarely home. Your older sister is a Hogwarts prefect.',
      secret: 'Your sister wrote home that the castle “feels wrong this year” and asked you to keep an eye out. You’re the only one she told.',
    },
    {
      id: 'fenwick', name: 'Fenwick', blood: 'Half-blood', wealth: 'Healthy vault', vault: 220,
      stats: { str: 10, dex: 15, con: 12, int: 13, wis: 8, cha: 14 },
      story: 'Your family runs Fenwick’s Fizzing Follies, a joke shop on Diagon Alley. You grew up testing products nobody else would touch.',
      secret: 'In the shop’s back room is a faded map of Hogwarts passages, drawn by a Fenwick who was expelled. Half of it has been torn away.',
    },
    {
      id: 'thornbury', name: 'Thornbury', blood: 'Half-blood', wealth: 'Modest vault', vault: 150,
      stats: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
      story: 'Creature breeders from the Welsh hills. You could calm a hippogriff before you could read, and animals trust you on sight.',
      secret: 'Last year your family’s prize hippogriff, Bramble, vanished near the Forbidden Forest. Nobody believed you when you said you heard her calling.',
    },
    {
      id: 'quill', name: 'Quill', blood: 'Muggle-born', wealth: 'Hogwarts school fund', vault: 60,
      stats: { str: 8, dex: 12, con: 10, int: 15, wis: 14, cha: 13 },
      story: 'Until your letter arrived, you thought the strange things around you were coincidences. Your parents are dentists and are thrilled and terrified.',
      secret: 'On the train, you’ll be the only one who sees the covered painting’s eyes follow you. It happens again every time you pass one of its kind.',
    },
    {
      id: 'marlowe', name: 'Marlowe', blood: 'Pureblood', wealth: 'Nearly empty vault', vault: 25,
      stats: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
      story: 'Once as grand as the Blackwoods, the Marlowes lost everything in a scandal nobody will explain. People still whisper when they hear your name.',
      secret: 'Your vault holds only a few coins and an old iron key with a raven on it. An ancestor served a dark wizard, and the key opens something beneath Hogwarts.',
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

  items,
};
