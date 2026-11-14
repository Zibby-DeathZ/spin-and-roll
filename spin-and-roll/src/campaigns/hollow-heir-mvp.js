// MVP of the Day. At the end of each day the GM can crown one student who earned it. It is not given
// every day: the student must meet enough of the requirements. The MVP wears the Badge for the whole of
// the next day and gets one perk that is theirs alone.

export const needs = 3; // requirements to meet, out of the list below

export const requirements = [
  { id: 'tide', icon: '🌊', text: 'Turned the tide: their move saved the group or cracked the day’s big problem' },
  { id: 'back', icon: '🤝', text: 'Went back for someone: helped another student at a cost to themselves' },
  { id: 'points', icon: '⭐', text: 'Top earner: won the most house points that day' },
  { id: 'brain', icon: '🧠', text: 'Brain of the day: solved a puzzle, found the way, or put the clues together' },
  { id: 'brave', icon: '🦁', text: 'Brave choice: took a real risk for the story when it would have been easier not to' },
  { id: 'role', icon: '🎭', text: 'True to their student: played their character so well the table felt it' },
];

// Always on, for the whole next day.
export const badge = {
  title: 'The MVP Badge', icon: '🏅',
  text: '+2 to every d20 roll you make all day (the app adds it), and your name in gold on the TV. Yours until you sleep.',
  points: 20, // house points for their house when crowned
};

// One of these, picked by the GM (or let the MVP choose between two). Used once, during the next day.
export const perks = {
  'golden-hour': { title: 'Golden Hour', icon: '🌟', text: 'Once: turn any roll you make into a natural 20. Say it before or after the roll.' },
  'headmasters-ear': { title: 'The Headmaster’s Ear', icon: '🦉', text: 'Once: ask the DM one yes-or-no question about the mystery. The answer is the truth.' },
  'extra-hour': { title: 'The Extra Hour', icon: '⏳', text: 'One extra action at Lunch and one extra in Free time, all day.' },
  'on-the-house': { title: 'On the House', icon: '🔮', text: 'A free tarot reading from Professor Greaves, even if your house has had one today. If the Future card comes out reversed, read it upright.' },
  'prefects-pass': { title: 'The Prefect’s Pass', icon: '🗝️', text: 'Out after curfew without spinning, all night. Nobody stops you.' },
  bodyguard: { title: 'The Shield', icon: '🛡️', text: 'Once: step in front of a friend and take a hit for them. Neither of you takes any damage.' },
  spotlight: { title: 'The Spotlight', icon: '🎬', text: 'You choose the first scene of the next session: where you are, and what you are doing.' },
  'lucky-galleon': { title: 'The Lucky Galleon', icon: '🪙', text: '+25 Galleons now, and the next thing you buy in any shop is free.', now: { gold: 25 } },
};
