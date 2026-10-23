# Spin & Roll: campaign notes

## What's built

### The platform
- One site for everyone. Google sign-in, DM and player roles, dashboards.
- Campaign library. Create a game, share a 4-letter code, record wins and losses.
- Player history (played / won / lost) and a trophy cabinet. Winning drops the trophy on every player's account.
- Three live screens per game: GM, TV, and each player's phone.

### The Hollow Heir
- **Prologue:** letters, Gringotts vaults, Diagon Alley shops, Ollivanders, the Express, the Welcome Feast.
- **Nine families** (Blackwood, Sinclair, Fenwick, Thornbury, Quill, Marlowe, Hale, Penrose, Okafor), locked once picked, each with
  stats, a vault, a secret, a signature ability with a drawback, and portraits as map tokens.
- **Sorting Hat and Ollivander ceremonies** with real questions, live on the TV.
- **Shopping and equipment:** wands, robes (Defence), familiars (buffs), cauldrons, books, extras.
- **7-day clock:** Morning class, Lunch, Afternoon class, Free time, Curfew. New mornings restore everyone.
  Story beats on the GM screen at the right moment. One-use Time-Turner.
- **Living castle:** every person has a set place for all 35 blocks of the week (plus the prologue).
  Advance time moves them all, and drops that block's clues, chests, hazards and monsters on the map;
  passing monsters leave when the block ends. Quests on offer show a scroll on the TV and a Give button for the GM.
- **Conversations:** tap anyone on the GM map (or in the castle panel) for their voice, wants and today's topics,
  with buttons to pin clues and give quests. Printed as `docs/dm-guide/Conversation-Book.pdf`.
- **The Painted Double:** an Imposter-style party game (🎭 Double tab). The DM's own word list with a hint per word,
  secret cards that only their player can read, phone voting, TV reveal, rewards.
- **Accusation vote** (TV shows tab): phones vote on the culprit. A hunch stamps the pick as Accused; the final accusation
  reveals the truth, pays XP and house points, and takes 10 HP off each boss if the table is right.
- **Art:** pictures in `public/art/` (people, monsters, mimics, items, chests, hazards) replace the emoji on the
  maps, phones and shops. Prompts for every picture: `docs/art/art-prompts.md`.
- **Scene counter:** time left this block (Lunch 2, Free time 3, Curfew 2) as gold pips on the TV and phones;
  the GM taps Scene done. **Missed quests** arrive by Owl Post at the start of the next block.
- **Classes:** seven minigames on phones, two attempts, harder through the week. Professors and students
  move into the right classroom automatically.
- **House points:** ⏳ Points button in the GM header, with an optional reason that shows on the TV.
- **Map:** 35 connected places (all four common rooms, the kitchens), secret places hidden until found, characters as tokens, monsters,
  people, chests (lock rolls), items on the ground, staff in their own rooms.
- **TV:** full-screen map, "Here you can…" choices, paths, slim party bar.
- **Dice and fights:** dice tab, spells with their own dice, initiative, Defence, knockouts, duels, XP.
- **Hidden Killing Curse:** one learner, anonymous green flash, secret expulsion wheel.
- **Wheels:** eight themed wheels that spin on the TV and apply their results.
- **Quests:** 8 normal + 4 secret (The Trials Beneath, The Turning Lock, The Painter's Bargain, The Old Cup).
- **TV puzzles you operate (9):** Living Chessboard, Torch Wall, Turning Lock, Seven Bottles, Vale's Diary,
  Serpent in the Stars, Moving Staircases, Scrambled Portrait, Rune Floor. Every answer was checked by computer.
- **Suspect board** on the TV: pin clues under suspects, clear or accuse them.
- **Detention:** a button, or Filch on the curfew wheel. Sends the student to the Trophy Room with Filch
  and quietly starts *The Old Cup* for them.
- **Hazards** for environmental fights: paint jars, cracked mirror, braziers, ritual circle, Vale's canvas, a pillar.
- **End-of-night awards** worked out from the night's events, and the **House Cup ceremony**,
  which also puts the cup in each winner's trophy cabinet.

- **Opening cutscene:** studio ident (GM crest, your name), cinematic title, a red storybook the GM pages
  through, families chosen inside the book, then the book closes into the game.
- **Sound:** built-in effects on the TV; music tracks from `public/sounds/music/`; optional recorded narration.
- **Main event lock:** phones lock during the opening, puzzles and TV shows, or whenever the GM presses 🎬.

- **Owl Post:** private letters from the GM to one player (database-enforced privacy).
- **Levels by year** (Year 1: 1–5, Year 2: 5–10 … Year 7: up to 35), +4 HP / +2 mana per level.
- **Saved characters:** recording a win or loss saves every character to its player's profile;
  the next year's family picker offers “Continue as…”.

- **Media tab (GM):** previews of every cutscene and moment, every sound, music and narration, and a
  checklist of every media file. Custom `video/intro.mp4` and `video/jumpscare.mp4` replace the built-ins.

### Still to make (your side)
- Map images in `public/maps/` (35 files; prompts in our chat).
- `public/puzzles/portrait.jpg` for the Scrambled Portrait (optional).
- Storybook pictures `public/story/page-1.jpg` … `page-6.jpg`.
- Music in `public/sounds/music/` (see the README there) and optional narration recordings.
- Optional videos: `public/video/intro.mp4`, `public/video/jumpscare.mp4`.
- A printed cover: `docs/dm-guide/cover.jpg` (2480 × 3508 px).
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

**Built so far from this list:** 1, 3, 6, 7, 9 and 10. Still open: 2 (hint shop), 4 (named rival as a
running character; Cassius Thorne exists as a suspect and token), 5 (secret passages), 8 (frog cards).

### Running the finale with hazards
Place in the Undercroft: the ritual circle, Vale's empty canvas, a shelf of paint jars, a cracked mirror and
two cold braziers. The TV lists each one under "Here", so the players can plan around them. Ashgrove
(phase 1) then Vale (phase 2). Breaking the circle and burning the canvas are what make phase 2 winnable.

### Dark magic, Corruption and status effects (DM Guide v2.7)
- `src/campaigns/spellbooks/dark-spells.json` is the series spellbook, written as plain JSON. Replace or extend it
  freely; `src/lib/spellbook.js` converts it to app spells. Icons, mana and to-hit stats for each spell live in the
  `APP` table there; new spells get sensible defaults.
- Spells unlock by `unlockYear` and `minLevel` (GM Spells tab shows the lock, with an override). `villainOnly`
  spells never reach players; the GM casts them from a monster's panel (`villainCast` in `src/lib/status.js`).
  `bossOnly` (Avada Kedavra) is cutscene-only. The Year 1 secret Killing Curse is a separate spell and still works
  as before, now adding 5 Corruption.
- Corruption: `characters/{uid}.corruption`, 0–10, carried into the next year. Thresholds come from the JSON.
- Status effects: `status` maps on tokens and characters, `{ bleed: { turns: 3 } }`, `turns: null` = until lifted.
  They tick at the start of that combatant's turn in `nextTurn`. Fear gives disadvantage, Silence locks spells,
  Blood Shield blocks one hit. Petrificus, Immobulus, Rictusempra (stun) and Silencio (silence) now apply them.

### Reaction duel (DM Guide v2.8)
- Bosses with `duelSpells` (one per colour: red = Shield, blue = Dodge, gold = Counter) get a Reaction duel panel on
  their token. `src/lib/duel.js` holds the rules and the tunable `DEFAULTS` (window, DEX bonus, feint, Protego);
  a campaign can override them with a `duel` object. `duelFast` bosses get 25% less time.
- Reactions are written to the Painted Double's vote collection (round `duel-<id>`, vote `red|1834`), so no new
  Firebase rules. Each phone times itself; the GM screen's `useDuelEngine` settles it and clears the TV after 7 s.

### The Marauder's Map (DM Guide v2.9)
- `src/campaigns/hollow-heir-map.js` holds the password, the room layout on a 1000 × 720 sheet (torn at x = 500),
  the insults and which hidden places the joined map gives away. `src/components/Marauders.jsx` draws it as SVG
  and animates the footsteps; `src/lib/marauders.js` has the rules, phrase matching and who/what it shows.
- Opening goes through an `item_used` event with `payload.map = 'open' | 'close'` (allowed by the existing rules),
  handled in `applyItemUse`. Once per dawn (`state.marauders.usedDawn`); the GM screen closes it after 60 s.
- Voice uses the browser's SpeechRecognition (Chrome, Edge, Safari). Phones without it can type the words.

### Test student (DM Guide v3.0)
- Players tab → Test student. `src/lib/testing.js` adds a character on the GM's own uid (`test: true`), so the GM can
  open `#/session/<id>/play` and act as a player. Excluded from saved heroes, history and trophies.

## Houses, House of the Day, ceremonies (v3.6)
- `src/lib/houses.js`: HOUSE_TRAITS (stat bonus + trait, added in `bonuses()`), HOUSE_PERKS, `nerveRoll` (Gryffindor re-roll on the phone, sends `nerve: true`), day standings.
- `src/lib/houseday.js`: `endOfDay` (called from `moveClock` on a new dawn: House of the Day, perk gifts, `state.show` kind 'day'), `changePerk`, `setHouseOfDay`, `spendTrait`, `steadfast`.
- Once-a-day house traits use `houseDawn` on the character (players can't write characters, so the GM engine spends it when an event carries `nerve`, or for Ravenclaw's `ability_used` with `payload.house`).
- Golden Hourglass multiplies positive points in `awardPoints`. Slytherin chest gold is in `applyOpenChest`.
- `AwardsCeremony.jsx` (TV ceremony; `inline` for previews), `QuestComplete.jsx` (TV overlay from the `quest_done` event; phone scroll for heroes in `payload.uids`).

## Runes (v3.7)
- One alphabet everywhere: `RUNES`/`ORDER` in `src/lib/puzzles.js` (`runeFor`, `RUNE_ALPHABET`). Look-alike runes ᚬ ᚭ ᚾ are on Q, X, J.
- `src/lib/runes.js`: party letters in `state.runes.known` (`learnRunes`, `forgetRune`), `lettersOfClue`, `usePencil` (a player's guesses in localStorage).
- Cipher puzzles add letters as the GM reveals them (quietly) and all on solve; `runes_learned` events toast the TV.
- `RuneNotebook.jsx` (Bag), ClueReader `tablet` style and the notebook overlay; GM codex panel at the bottom of the Puzzles tab.
- Rune floor: `wordInEnglish: true` shows the word in letters; GM tiles show their letter.

## Door pins and crowds (v3.8)
- `src/campaigns/hollow-heir-doors.js`: `doors[here][there] = [x%, y%]`, placed by eye on each 16:9 map picture. `doorsAt()` in world.js adds names (short ones via `doorName`), hides undiscovered secret places, and spreads any unplaced exit along the bottom.
- MapView: `doors` + `onDoor` props (GM table: takes everyone here through). Pins and strip sizes use `cqw` (the map is a size container).
- More than 3 NPC tokens at a place → they render in `.crowd-strip` along the top (not selected, not in the fight).
