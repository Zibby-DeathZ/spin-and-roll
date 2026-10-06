# DM Guide

`DM-Guide.pdf` is the Dungeon Master's book for The Hollow Heir.

The book is generated from the `content_*.py` files by `build_dm_guide.py`
(Python 3 + reportlab). Whenever the app changes, the matching section of the
content files is updated, the VERSION is bumped, a line is added to the version
log at the end of `content_5.py`, and the PDF is rebuilt:

    pip install reportlab
    python3 build_dm_guide.py

When asking Claude to update the book, upload this folder (or the whole repo) so
the latest content is the starting point.

## Conversation Book

`Conversation-Book.pdf` is the companion book: where every person is in all
35 blocks of the week (plus the prologue), what appears when, which quests are
on offer, and every conversation topic for every NPC. It is built from the
same data the app uses (`src/campaigns/hollow-heir-world.js`), so it always
matches the game:

    node export_world.mjs        # writes world-data.json from the app's data
    python3 build_talk_book.py   # builds Conversation-Book.pdf

Run both whenever the timetable or conversations change.
