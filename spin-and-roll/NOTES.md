# Spin & Roll: campaign notes

## What's built

### The platform
- One site for everyone. Google sign-in, DM and player roles, dashboards.
- Campaign library. Create a game, share a 4-letter code, record wins and losses.
- Player history (played / won / lost) and a trophy cabinet. Winning drops the trophy on every player's account.
- Three live screens per game: GM, TV, and each player's phone.

### The Hollow Heir
- **Prologue:** letters, Gringotts vaults, Diagon Alley shops, Ollivanders, the Express, the Welcome Feast.
- **Six families** (Blackwood, Sinclair, Fenwick, Thornbury, Quill, Marlowe), locked once picked, each with
  stats, a vault, a secret, a signature ability with a drawback, and portraits as map tokens.
- **Sorting Hat and Ollivander ceremonies** with real questions, live on the TV.
- **Shopping and equipment:** wands, robes (Defence), familiars (buffs), cauldrons, books, extras.
- **7-day clock:** Morning class, Lunch, Afternoon class, Free time, Curfew. New mornings restore everyone.
  Story beats on the GM screen at the right moment. One-use Time-Turner.
- **Classes:** seven minigames on phones, two attempts, harder through the week. Professors and students
  move into the right classroom automatically.
- **House points:** ⏳ Points button in the GM header, with an optional reason that shows on the TV.
- **Map:** 31 connected places, secret places hidden until found, characters as tokens, monsters,
  people, chests (lock rolls), items on the ground, staff in their own rooms.
- **TV:** full-screen map, "Here you can…" choices, paths, slim party bar.
- **Dice and fights:** dice tab, spells with their own dice, initiative, Defence, knockouts, duels, XP.
- **Hidden Killing Curse:** one learner, anonymous green flash, secret expulsion wheel.
- **Wheels:** eight themed wheels that spin on the TV and apply their results.
- **Quests:** 8 normal + 4 secret (The Trials Beneath, The Turning Lock, The Painter's Bargain, The Old Cup).
- **TV puzzles you operate:** Living Chessboard, Torch Wall, Turning Lock, Seven Bottles, Vale's Diary.
  Chess and bottle answers were checked by computer: each has exactly one solution.

### Still to make (your side)
- Map images in `public/maps/` (31 files, prompts in our chat; also `charms-classroom` and `transfiguration-classroom`).
- Portraits in `public/portraits/` (6 files).
- Physical wands and Hogwarts letters.
- A test night: prologue → sorting → one class → one fight → one puzzle.

---

## How the secret quests fit together

- **The Trials Beneath** is the way into the Undercroft, like the trials in the first book:
  Devil's Snare (fight it, or Lumos/Incendio) → Torch Wall → Living Chessboard → Seven Bottles.
  Only one student can drink from bottle 4 and go on, so the others must find another way
  (the Marlowe serpent key and Parseltongue are that other way). That splits the party for the finale.
- **The Turning Lock** hides the Time-Turner in the Room of Requirement. Place the three ring clues as
  items on the ground: Trophy Room, Astronomy Tower, Owlery. *The Old Cup* also gives the moon clue.
- **The Painter's Bargain** is the Killing Curse. Hide the three diary pages as items (Restricted Section,
  Black Lake, Shrieking Shack), then run **Vale's Diary** on the TV. The decoded line tells them the
  painting must be visited *alone*. The painting's question: *"What would you give up to never lose again?"*
  Any honest answer is accepted; then teach the curse from the Players tab. Vale should get something
  back: he can see through that student's eyes once per day.

---

## Ideas to make it more fun (kept simple)

Your group is now comfortable with DnD and good at puzzles, so the best upgrades push them to
**talk to each other and look at the TV**, not add more rules.

1. **Suspect board on the TV.** A wall of portraits (Ashgrove, Grimsby, Filch, the Headmaster, a ghost)
   with clue cards you pin under each one as they find evidence. They argue about who it is, and you just
   reveal cards. Cheap to build, and it's a mystery that runs the whole week.
2. **Hint shop.** A portrait sells a hint for 10 house points. It turns points into a tense team decision
   instead of just a score.
3. **Detention as content.** Getting caught after curfew sends them to detention with Filch in the
   Trophy Room, which is exactly where *The Old Cup* starts. Punishments that open doors are more fun.
4. **A named rival.** One recurring student from another house who duels them, steals house points,
   and maybe turns out to be the one holding the other half of the Marauder's Map.
5. **Secret passages as shortcuts.** When they find one, add it as a new path (e.g. Owlery → Restricted
   Section). Mapping the castle together becomes its own reward.
6. **Environmental boss fight.** In the Undercroft, put things on the map that matter: jars of paint
   (Incendio burns Vale's minions), mirrors, braziers. Players shout ideas at the TV; you decide.
7. **One more TV puzzle per day.** Ideas that fit the same "you move pieces, they talk" style:
   a constellation puzzle on the Astronomy Tower, a moving-staircase maze, a portrait jigsaw,
   a rune-tile floor where one wrong step triggers a trap.
8. **Chocolate Frog cards.** Each frog eaten gives a random card (famous witches and wizards). Three of
   a kind gives a small perk. Gives people a reason to trade.
9. **End-of-night awards on the TV.** Most damage, most points, best fail, luckiest roll. Takes a
   minute and gives everyone a moment.
10. **The House Cup finale.** Great Hall in the winning house's colours on the TV, and a real prize
    (first pick in the Pokémon campaign).

Pick two or three per session rather than all of them. The best ones for this group are probably
**1 (suspect board)**, **5 (secret passages)** and **6 (environmental boss fight)**.
