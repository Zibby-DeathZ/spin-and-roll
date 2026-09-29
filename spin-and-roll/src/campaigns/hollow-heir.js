// The Hollow Heir: campaign data the engine reads.
// Step 6 adds premade characters, wheels, the day clock and minigames.

export const hollowHeir = {
  currency: { name: 'Galleons', icon: '🪙' },
  houses: ['Unsorted', 'Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'],
  defaults: {
    house: 'Unsorted',
    xp: 0,
    hp: 20, maxHp: 20,
    mana: 10, maxMana: 10,
    gold: 0,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    equipment: { wand: 'No wand yet', robes: 'Plain robes' },
    spells: [],
  },
  // Quick-give list on the GM screen. effect is applied when a player taps Use.
  items: {
    'chocolate-frog': { name: 'Chocolate Frog', icon: '🐸', effect: { hp: 5 } },
    'pumpkin-pasty': { name: 'Pumpkin Pasty', icon: '🥧', effect: { hp: 3 } },
    pepperup: { name: 'Pepperup Potion', icon: '🧪', effect: { hp: 10 } },
    wiggenweld: { name: 'Wiggenweld Potion', icon: '💚', effect: { hp: 20 } },
    'focus-draught': { name: 'Focus Draught', icon: '🔮', effect: { mana: 10 } },
    'bertie-botts': { name: "Bertie Bott's Beans", icon: '🫘', note: 'Spin the bean wheel' },
    felix: { name: 'Felix Felicis', icon: '✨', note: 'One free re-spin' },
  },
};
