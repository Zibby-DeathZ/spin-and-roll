// The campaign library. Each campaign will get its own data folder
// (story, map, NPCs, items, wheels) that plugs into the shared engine.
// For now this is the list the DM picks from, plus each campaign's trophy.

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
  },
  {
    id: 'pokemon',
    title: 'Pokémon campaign',
    tagline: 'Being written.',
    status: 'soon',
    trophy: null,
  },
];

export const getCampaign = (id) => campaigns.find((c) => c.id === id);
