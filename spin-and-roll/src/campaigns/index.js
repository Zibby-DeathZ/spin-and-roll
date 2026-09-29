// The campaign library. Each campaign's data file (story, items, wheels…)
// plugs into the shared engine through `data`.
import { hollowHeir } from './hollow-heir';

export const campaigns = [
  {
    id: 'first-hunt',
    title: 'The First Hunt',
    tagline: 'A gothic one-night hunt to the blood pool.',
    status: 'played',
    trophy: { title: 'Survivor of the Blood Pool', icon: '🩸' },
  },
  {
    id: 'hollow-heir',
    title: 'The Hollow Heir',
    tagline: 'Seven days at Hogwarts to stop a painted wizard.',
    status: 'ready',
    trophy: { title: 'Saviour of Hogwarts', icon: '🏆' },
    data: hollowHeir,
  },
  {
    id: 'pokemon',
    title: 'Pokémon campaign',
    tagline: 'Being written.',
    status: 'soon',
    trophy: null,
  },
];

// Used when a campaign has no data file yet.
export const genericData = {
  currency: { name: 'Gold', icon: '🪙' },
  houses: [],
  defaults: {
    xp: 0, hp: 20, maxHp: 20, mana: 10, maxMana: 10, gold: 0,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    equipment: {}, spells: [],
  },
  items: {},
};

export const getCampaign = (id) => campaigns.find((c) => c.id === id);
export const getCampaignData = (id) => getCampaign(id)?.data ?? genericData;
