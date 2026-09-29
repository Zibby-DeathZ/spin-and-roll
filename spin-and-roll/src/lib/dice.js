export const DICE = [4, 6, 8, 10, 12, 20];
export const rollDie = (d) => 1 + Math.floor(Math.random() * d);

export function rollDice({ count = 1, die, bonus = 0 }) {
  const rolls = Array.from({ length: count }, () => rollDie(die));
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + bonus };
}

// mode: 'normal' | 'adv' (roll two, keep higher) | 'dis' (keep lower)
export function rollD20(mode = 'normal') {
  const a = rollDie(20);
  if (mode === 'normal') return { rolls: [a], nat: a };
  const b = rollDie(20);
  return { rolls: [a, b], nat: mode === 'adv' ? Math.max(a, b) : Math.min(a, b) };
}

export const diceLabel = ({ count = 1, die, bonus = 0 }) => `${count}d${die}${bonus ? ` + ${bonus}` : ''}`;
