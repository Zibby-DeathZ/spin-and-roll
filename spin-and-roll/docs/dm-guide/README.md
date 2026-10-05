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
