// The Mirror in the Dark: walking the maze with arrow buttons. The phone keeps its own position (it is the
// only one moving it) and tells the GM screen where it is, so the walls are enforced without the GM.
// Walls are keyed as in docs/guidebook/mirror_maze.py: ['h', r, c] is the wall below cell (r, c),
// ['v', r, c] the wall right of it; r or c = -1 is the top or left border.

export const DIRS = {
  up: { dr: -1, dc: 0, wall: (r, c) => `h,${r - 1},${c}`, word: 'north' },
  down: { dr: 1, dc: 0, wall: (r, c) => `h,${r},${c}`, word: 'south' },
  left: { dr: 0, dc: -1, wall: (r, c) => `v,${r},${c - 1}`, word: 'west' },
  right: { dr: 0, dc: 1, wall: (r, c) => `v,${r},${c}`, word: 'east' },
};

const cache = new WeakMap();
function wallSet(maze) {
  if (!cache.has(maze)) cache.set(maze, new Set(maze.walls.map((w) => w.join(','))));
  return cache.get(maze);
}
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
export const inCentre = (maze, [r, c]) => maze.centre.some((x) => x[0] === r && x[1] === c);
export const startOf = (maze, mapIdx) => [...maze.starts[mapIdx]];

// One step. Returns what happened: { to } for a step, { wall: true, door: 'false' } for a bump
// (door says it was a bricked-up EXIT), or { out: true } for leaving through the real exit.
export function step(maze, pos, dir) {
  const d = DIRS[dir];
  const [r, c] = pos;
  const key = d.wall(r, c);
  const n = maze.n;
  const to = [r + d.dr, c + d.dc];
  const offGrid = to[0] < 0 || to[0] >= n || to[1] < 0 || to[1] >= n;
  if (wallSet(maze).has(key)) {
    const door = offGrid && maze.falseDoors.some((f) => same(f, pos)) ? 'false' : null;
    return { wall: true, door };
  }
  if (offGrid) return same(pos, maze.exit) ? { out: true } : { wall: true, door: null };
  return { to };
}

// What a move means for the game: entering the centre, getting thrown back (any bump after the centre),
// or getting out. `state` is { pos, centre }. Bumping a wall inside the centre room itself is harmless.
export function move(maze, mapIdx, state, dir) {
  const res = step(maze, state.pos, dir);
  if (res.out) return { ...state, out: true, event: 'out' };
  if (res.wall) {
    // Past the centre, the dark is unforgiving: one bump and the mirror throws you back to your start.
    if (state.centre && !inCentre(maze, state.pos)) return { pos: startOf(maze, mapIdx), centre: false, event: 'thrown', door: res.door };
    return { ...state, event: 'bump', door: res.door };
  }
  const centre = state.centre || inCentre(maze, res.to);
  return { pos: res.to, centre, event: !state.centre && centre ? 'centre' : 'step' };
}

// ---------- The watcher ----------
// A cold presence that drifts through the maze. It can't enter the centre room (the pedestal keeps it out).
// When a student is within reach it hunts them along the real corridors; otherwise it wanders.

export const key = ([r, c]) => `${r},${c}`;
const ORDER = ['up', 'right', 'down', 'left'];

export function openNeighbours(maze, cell) {
  return ORDER.map((d) => step(maze, cell, d)).filter((s) => s.to).map((s) => s.to);
}

// Shortest walk from a to every cell (not through the centre room unless `throughCentre`).
export function distances(maze, from, throughCentre = false) {
  const dist = new Map([[key(from), 0]]);
  const prev = new Map();
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const n of openNeighbours(maze, cur)) {
      if (dist.has(key(n)) || (!throughCentre && inCentre(maze, n))) continue;
      dist.set(key(n), dist.get(key(cur)) + 1);
      prev.set(key(n), cur);
      q.push(n);
    }
  }
  return { dist, prev };
}

// Where the watcher waits at the start: the square farthest from every start and from the centre.
export function watcherHome(maze) {
  const far = maze.starts.map((s) => distances(maze, s, true).dist);
  let best = null, bestD = -1;
  for (let r = 0; r < maze.n; r++) {
    for (let c = 0; c < maze.n; c++) {
      if (inCentre(maze, [r, c])) continue;
      const d = Math.min(...far.map((m) => m.get(key([r, c])) ?? 0), Math.abs(r - 7) + Math.abs(c - 7));
      if (d > bestD) { bestD = d; best = [r, c]; }
    }
  }
  return best;
}

// One move of the watcher. `targets` are the students it could hunt ([r, c] each), `last` where it just was.
export function watcherStep(maze, at, targets, last = null, reach = 8, rnd = Math.random) {
  const { dist, prev } = distances(maze, at);
  let goal = null, gd = Infinity;
  for (const t of targets) {
    const d = dist.get(key(t));
    if (d != null && d <= reach && d < gd) { gd = d; goal = t; }
  }
  if (goal && gd > 0) {
    let cur = goal;
    while (prev.has(key(cur)) && key(prev.get(key(cur))) !== key(at)) cur = prev.get(key(cur));
    return cur;
  }
  const opts = openNeighbours(maze, at).filter((n) => !inCentre(maze, n));
  if (!opts.length) return at;
  const fresh = opts.filter((n) => !last || key(n) !== key(last));
  const pool = fresh.length ? fresh : opts;
  return pool[Math.floor(rnd() * pool.length)];
}

export const near = (a, b, d = 2) => !!a && !!b && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= d;

// Every house in the maze has someone standing in the centre room: the pedestal lights.
export function housesUnited(maze, st, mapOf) {
  const needed = new Set(Object.values(mapOf).filter((i) => i != null));
  if (!needed.size) return false;
  for (const i of needed) {
    const here = Object.entries(mapOf).some(([u, m]) => m === i && st.pos?.[u] && inCentre(maze, st.pos[u]) && !st.out?.[u]);
    if (!here) return false;
  }
  return true;
}

// Which map a student walks: the GM's choice if they made one, otherwise their house's map.
export function mapFor(maze, st, uid, house) {
  const o = st?.maps?.[uid];
  if (o != null) return o;
  const i = (maze.houses ?? []).indexOf(house);
  return i >= 0 ? i : null;
}
