// Standing on the floor: turns "somewhere in this room" into a point on the floor of its picture.
// Floors are four-cornered areas (data.floors[loc]); u runs left→right, v runs back→front.
const DEFAULT = [[20, 55], [80, 55], [85, 92], [15, 92]];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));

export function floorPoint(data, locId, u, v) {
  const [bl, br, fr, fl] = data?.floors?.[locId] ?? DEFAULT; // back-left, back-right, front-right, front-left
  u = clamp01(u); v = clamp01(v);
  const back = [lerp(bl[0], br[0], u), lerp(bl[1], br[1], u)];
  const front = [lerp(fl[0], fr[0], u), lerp(fl[1], fr[1], u)];
  return { x: Math.round(lerp(back[0], front[0], v) * 10) / 10, y: Math.round(lerp(back[1], front[1], v) * 10) / 10 };
}

// Staff and other people fill the room from the back, middle first.
const PEOPLE = [
  [0.5, 0.1], [0.1, 0.3], [0.9, 0.3], [0.3, 0.45], [0.7, 0.45],
  [0.05, 0.58], [0.95, 0.58], [0.5, 0.32], [0.22, 0.12], [0.78, 0.12],
];
export function personSpot(data, locId, i) {
  const [u, v] = PEOPLE[i % PEOPLE.length];
  const lap = Math.floor(i / PEOPLE.length); // a second lap shifts a little so nobody stacks exactly
  return floorPoint(data, locId, u + lap * 0.06, v + lap * 0.05);
}

// Students stand together at the front: one row, or two once there are many.
export function studentSpots(data, locId, n) {
  if (n <= 0) return [];
  const rows = n > 6 ? 2 : 1;
  const per = Math.ceil(n / rows);
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, n - row * per);
    const u = inRow === 1 ? 0.5 : 0.12 + (col / (inRow - 1)) * 0.76;
    return floorPoint(data, locId, u, rows === 1 ? 0.82 : 0.7 + row * 0.2);
  });
}

// Anything else (a chest, an item, a monster) anywhere on the floor. `u`/`v` default to a random spot.
export const anywhereOnFloor = (data, locId, u = Math.random(), v = 0.2 + Math.random() * 0.6) => floorPoint(data, locId, u, v);
