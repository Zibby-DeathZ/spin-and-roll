"""
Builds the Day Books: one printed book per in-game day, everything for that session in one place.
Uses the Guidebook's look (docs/guidebook/build_guidebook.py). Content: dayN.py in this folder.
Run:  python3 build_day_books.py        (builds every day that has a dayN.py)
"""
import importlib, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'guidebook'))
sys.path.insert(0, os.path.join(HERE, '..', 'dm-guide'))

import build_guidebook as B  # noqa: E402

VERSION = '1.1'
DAYS = {
    2: ('Day 2', 'The first victim', 'Mandrakes, a charming teacher, two puzzles, and a scream in the night. Everything for one session, start to finish.'),
}

if __name__ == '__main__':
    B.VERSION = VERSION
    for n, (title, sub, blurb) in DAYS.items():
        if not os.path.exists(os.path.join(HERE, f'day{n}.py')):
            continue
        B.book(os.path.join(HERE, f'Day-{n}-Book.pdf'), f'{title} Book', f'The Hollow Heir · {title} Book',
               f'{title}: {sub}', blurb, [importlib.import_module(f'day{n}')])
