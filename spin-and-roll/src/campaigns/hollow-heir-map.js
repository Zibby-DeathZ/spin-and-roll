// The Marauder's Map: the castle drawn in ink, live. Positions are the centre of each room on a 1000 × 720 sheet.
// The sheet is torn down the middle at x = 500: the Fenwick half is the left, Cassius Thorne has the right.
export const marauders = {
  password: 'I solemnly swear that I am up to no good',
  close: 'Mischief managed',
  ms: 60000, // the ink fades after 60 seconds
  halves: { left: 'map-half', right: 'map-other-half' },
  split: 500,
  size: [1000, 720],
  // [x, y] or [x, y, width, height]
  layout: {
    'black-lake': [95, 80, 150, 76], greenhouses: [250, 80], courtyard: [405, 90],
    'hospital-wing': [95, 215], 'great-hall': [250, 215, 150, 86], 'entrance-hall': [405, 225],
    'slytherin-common': [95, 350], dungeons: [250, 350], kitchens: [405, 360],
    undercroft: [95, 480], 'hufflepuff-common': [250, 480],
    'shrieking-shack': [95, 630], hogsmeade: [250, 630], 'three-broomsticks': [405, 630],
    'hagrids-hut': [595, 80], 'quidditch-pitch': [750, 80], 'forbidden-forest': [905, 90, 150, 80],
    'grand-staircase': [595, 230, 120, 110], 'charms-classroom': [750, 215], 'transfiguration-classroom': [905, 215],
    library: [595, 390], 'defence-classroom': [750, 345], 'trophy-room': [905, 345],
    'restricted-section': [595, 510], 'gryffindor-common': [750, 470], 'ravenclaw-common': [905, 470],
    'room-of-requirement': [595, 630], owlery: [750, 600], 'astronomy-tower': [905, 600],
  },
  // Hidden places the joined map gives away (the Room of Requirement never shows on it).
  revealsWhenWhole: ['undercroft', 'shrieking-shack', 'restricted-section'],
  // People the map shows without footprints.
  floaters: ['ghost', 'peeves', 'painting'],
  // The map never lies, but some names won't settle.
  smudged: { painting: 'C— V—' },
  // Wrong words: the parchment answers back.
  insults: [
    'Mr Moony politely suggests you go back to bed.',
    'Mr Padfoot would like to know who let you in here.',
    'Mr Prongs agrees with Mr Padfoot, and adds that the answer is written on the map itself.',
    'Mr Wormtail has nothing to add. He is already hiding.',
    'This parchment is blank. It has always been blank. Good day.',
  ],
};
