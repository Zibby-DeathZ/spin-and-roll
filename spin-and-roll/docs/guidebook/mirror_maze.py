"""The Mirror Maze: one maze split across seven maps.

Each map alone shows its owner's way from their start to the centre exactly, but only some of the other walls,
a few gaps in the outer wall, and an EXIT that is really bricked up (by walls drawn on the other maps).
Stacked and lit from underneath, all the walls add up to the real maze, the false exits close, and
the little circles that are complete (one slice from each map) mark the only way out.

Run:  python3 mirror_maze.py   (writes mirror-maze.json here and in src/campaigns for the GM screen)
"""
import json
import os
import random
from collections import deque

N = 15                        # cells per side
CENTRE = {(r, c) for r in range(6, 9) for c in range(6, 9)}
SHEETS = 4                 # one map per house
SEED = 170
BRANCHY = .65              # 1 = long winding corridors, 0 = short bushy ones
HOUSES = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']
STARTS = [(0, 3), (14, 11), (3, 14), (11, 0)]   # where each house's map starts, on the edge
HERE = os.path.dirname(os.path.abspath(__file__))

# Walls are stored as keys:
#   ('h', r, c): the wall below cell (r, c)  (between r and r+1), r = -1 is the top border, r = N-1 the bottom border
#   ('v', r, c): the wall right of cell (r, c) (between c and c+1), c = -1 is the left border, c = N-1 the right border


def wall_between(a, b):
    (r1, c1), (r2, c2) = a, b
    if r1 == r2:
        return ('v', r1, min(c1, c2))
    return ('h', min(r1, r2), c1)


def border_wall(cell, side):
    r, c = cell
    return {'N': ('h', r - 1, c), 'S': ('h', r, c), 'W': ('v', r, c - 1), 'E': ('v', r, c)}[side]


def neighbours(cell):
    r, c = cell
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        rr, cc = r + dr, c + dc
        if 0 <= rr < N and 0 <= cc < N:
            yield (rr, cc)


def all_walls():
    ws = set()
    for r in range(N):
        for c in range(N):
            for n in neighbours((r, c)):
                ws.add(wall_between((r, c), n))
    for i in range(N):
        ws |= {('h', -1, i), ('h', N - 1, i), ('v', i, -1), ('v', i, N - 1)}
    return ws


def edge_side(cell):
    r, c = cell
    return 'N' if r == 0 else 'S' if r == N - 1 else 'W' if c == 0 else 'E'


def build(seed=SEED):
    rnd = random.Random(seed)
    # A perfect maze with the centre room as one node: carve with a randomised depth-first walk.
    open_ = set()
    for a in CENTRE:
        for b in neighbours(a):
            if b in CENTRE:
                open_.add(wall_between(a, b))
    # Growing tree: half the time carry on from the newest cell (long corridors), half the time branch from
    # anywhere (short, bushy). Gives winding paths that are still short enough to split across seven maps.
    seen = set(CENTRE)
    active = sorted(CENTRE)
    rnd.shuffle(active)
    while active:
        k = len(active) - 1 if rnd.random() < BRANCHY else rnd.randrange(len(active))
        cur = active[k]
        opts = [n for n in neighbours(cur) if n not in seen]
        if not opts:
            active.pop(k)
            continue
        nxt = rnd.choice(opts)
        open_.add(wall_between(cur, nxt))
        seen.add(nxt)
        active.append(nxt)

    def bfs(src, is_open):
        prev = {src: None}
        q = deque([src])
        while q:
            cur = q.popleft()
            for n in neighbours(cur):
                if n not in prev and is_open(wall_between(cur, n)):
                    prev[n] = cur
                    q.append(n)
        return prev

    def path(prev, dst):
        out = []
        while dst is not None:
            out.append(dst)
            dst = prev[dst]
        return out[::-1]

    real_open = lambda w: w in open_  # noqa: E731
    from_c = bfs((7, 7), real_open)
    border_cells = [(r, c) for r in range(N) for c in range(N) if r in (0, N - 1) or c in (0, N - 1)]
    corners = {(0, 0), (0, N - 1), (N - 1, 0), (N - 1, N - 1)}
    near = lambda a, b: abs(a[0] - b[0]) + abs(a[1] - b[1]) < 3  # noqa: E731
    cands = [b for b in border_cells if b not in corners and not any(near(b, s) for s in STARTS)]
    # The real exit: a good long walk from the centre (not the longest), away from every start.
    dist = {b: len(path(from_c, b)) for b in cands}
    want = sorted(dist.values())[int(len(dist) * .8)]
    exit_cell = min(cands, key=lambda b: (abs(dist[b] - want), b))
    # Seven false exits, spread out round the edge.
    false_doors = []
    for b in sorted(cands, key=lambda b: rnd.random()):
        if near(b, exit_cell) or any(abs(b[0] - f[0]) + abs(b[1] - f[1]) < 2 for f in false_doors):
            continue
        false_doors.append(b)
        if len(false_doors) == SHEETS:
            break
    assert len(false_doors) == SHEETS

    walls = all_walls() - open_
    exit_wall = border_wall(exit_cell, edge_side(exit_cell))
    walls.discard(exit_wall)
    true_path = [x for x in path(from_c, exit_cell) if x not in CENTRE]
    routes = [[x for x in path(from_c, s)[::-1] if x not in CENTRE] for s in STARTS]

    # Which map shows which wall.
    sheets = [set() for _ in range(SHEETS)]
    border = {w for w in all_walls() if (w[0] == 'h' and w[1] in (-1, N - 1)) or (w[0] == 'v' and w[2] in (-1, N - 1))}

    def touching(cell):
        out = set()
        for n in neighbours(cell):
            out.add(wall_between(cell, n))
        r, c = cell
        if r == 0: out.add(('h', -1, c))
        if r == N - 1: out.add(('h', N - 1, c))
        if c == 0: out.add(('v', r, -1))
        if c == N - 1: out.add(('v', r, N - 1))
        return out

    for i, route in enumerate(routes):
        for cell in route:
            sheets[i] |= touching(cell) & walls
    for w in sorted(walls - border):
        if not any(w in s for s in sheets):
            for i in rnd.sample(range(SHEETS), 1 if rnd.random() < .8 else 2):
                sheets[i].add(w)
    # The outer wall: every map draws it, except its own false EXIT and a few random gaps (all bricked by other maps).
    door_walls = [border_wall(d, edge_side(d)) for d in false_doors]
    for i in range(SHEETS):
        gaps = {door_walls[i]} | set(rnd.sample(sorted(border - {exit_wall} - set(door_walls)), 3))
        sheets[i] |= (border - {exit_wall}) - gaps

    # Make sure each map's own way to the centre really is the shortest way it shows (no false shortcut).
    for i, s in enumerate(STARTS):
        for _ in range(200):
            prev = bfs(s, lambda w, i=i: w not in sheets[i])
            if (7, 7) not in prev:
                break
            p = path(prev, (7, 7))
            real = path(from_c, s)
            if len(p) >= len(real):
                break
            # It found a shortcut through a wall this map doesn't show: draw that wall too.
            for a, b in zip(p, p[1:]):
                w = wall_between(a, b)
                if w in walls:
                    sheets[i].add(w)
                    break

    # Each map's own EXIT stays open on that map (route walls may have drawn it).
    for i in range(SHEETS):
        sheets[i].discard(door_walls[i])

    # Circles: one slice per map. Complete only along the real way out.
    circles = {}
    for cell in true_path:
        circles[cell] = list(range(SHEETS))
    others = [(r, c) for r in range(N) for c in range(N) if (r, c) not in CENTRE and (r, c) not in circles]
    for cell in rnd.sample(others, int(len(others) * .45)):
        got = rnd.sample(range(SHEETS), rnd.choice((2, 3, 3)))  # never all four
        circles[cell] = sorted(got)

    return {
        'n': N, 'houses': HOUSES, 'centre': sorted(CENTRE), 'starts': STARTS, 'exit': exit_cell, 'exitSide': edge_side(exit_cell),
        'falseDoors': false_doors, 'falseSides': [edge_side(d) for d in false_doors],
        'walls': sorted(walls), 'sheets': [sorted(s) for s in sheets],
        'truePath': true_path, 'routes': routes, 'circles': {f'{r},{c}': v for (r, c), v in circles.items()},
    }


def check(m):
    """Proves the puzzle works. Raises if anything is off."""
    walls = {tuple(w) for w in m['walls']}
    sheets = [{tuple(w) for w in s} for s in m['sheets']]
    union = set().union(*sheets)
    exit_cell = tuple(m['exit'])
    exit_wall = border_wall(exit_cell, m['exitSide'])
    # 1. Stacked, the maps show exactly the real maze (plus the full outer wall except the real exit).
    assert union == walls, (len(union - walls), len(walls - union))
    border = {w for w in all_walls() if (w[0] == 'h' and w[1] in (-1, N - 1)) or (w[0] == 'v' and w[2] in (-1, N - 1))}
    assert border - {exit_wall} <= union and exit_wall not in union

    def reach(src, closed):
        seen = {src}
        q = deque([src])
        while q:
            cur = q.popleft()
            for n in neighbours(cur):
                if n not in seen and wall_between(cur, n) not in closed:
                    seen.add(n)
                    q.append(n)
        return seen

    def dist(src, dst, closed):
        prev = {src: None}
        q = deque([src])
        while q:
            cur = q.popleft()
            if cur == dst:
                break
            for n in neighbours(cur):
                if n not in prev and wall_between(cur, n) not in closed:
                    prev[n] = cur
                    q.append(n)
        k, x = 0, dst
        while prev.get(x) is not None:
            x = prev[x]
            k += 1
        return k
    # 2. The real maze is one piece, and the only way out is the real exit.
    assert len(reach((7, 7), walls)) == N * N
    # 3. Each map: its own start reaches the centre by the real route, with no shortcut through a missing wall.
    for i, s in enumerate(m['starts']):
        s = tuple(s)
        assert dist(s, (7, 7), sheets[i]) == dist(s, (7, 7), walls), f'map {i + 1} has a shortcut'
        # Its EXIT looks open on its own map...
        d = tuple(m['falseDoors'][i])
        assert border_wall(d, m['falseSides'][i]) not in sheets[i]
        # ...but is bricked up when stacked.
        assert border_wall(d, m['falseSides'][i]) in union
    # 4. Circles: complete (all seven slices) only on the real way out.
    full = {tuple(map(int, k.split(','))) for k, v in m['circles'].items() if len(v) == SHEETS}
    assert full == {tuple(c) for c in m['truePath']}, 'circles'
    # 5. The real way out leaves the centre and reaches the exit through open walls.
    tp = [tuple(c) for c in m['truePath']]
    assert tp[-1] == exit_cell
    for a, b in zip(tp, tp[1:]):
        assert wall_between(a, b) not in walls
    return True


if __name__ == '__main__':
    m = build()
    check(m)
    data = json.dumps(m)
    open(os.path.join(HERE, 'mirror-maze.json'), 'w').write(data)
    open(os.path.join(HERE, '..', '..', 'src', 'campaigns', 'mirror-maze.json'), 'w').write(data)
    print('mirror maze ok:', 'exit', m['exit'], 'path', len(m['truePath']), 'walls', len(m['walls']),
          'per map', [len(s) for s in m['sheets']])
