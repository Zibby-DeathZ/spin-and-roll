# Data model (Firestore)

```
users/{uid}
  displayName, photoURL, role: 'player' | 'dm', createdAt
  history/{sessionId}    campaignId, campaignTitle, result: 'won'|'lost', endedAt
  trophies/{sessionId}   campaignId, title, icon, awardedAt

sessions/{sessionId}          one game night (or a two-day campaign)
  campaignId, dmUid, code, status: 'lobby'|'active'|'won'|'lost'
  playerUids[], createdAt, startedAt, endedAt
  state                       campaign-wide live state (DM writes)
    shopOpen                  Diagon Alley shops open on phones
    quiz { id, uid }          the ceremony in progress ('sorting' | 'wand') and who's in it
    housePoints { Gryffindor, Hufflepuff, Ravenclaw, Slytherin }
    clock { day (0 = prologue), block, dawn }   dawn counts every new morning; drives once-per-day limits
    taught { "<day>-<block>": true }            lessons already taught this week
    timeTurnerUsed
    spin { wheelId, uid, idx, id, at, applied, hidden }   the wheel currently on the TV
    map { loc, discovered [] }                             where the party is, and places found
    tokens { id: { kind, name, icon, loc, x, y, npc, hp, maxHp, defence, boss, disarmed } }
           chests: { kind: 'chest', chest, dc, stat, trap, contents { gold, items [] }, opened, tried [] }
           items:  { kind: 'item', item }
    pcPos { uid: { loc, x, y } }                           where each character is standing
    quests { questId: { status: 'active'|'done'|'failed', uids [], done [objective index…] } }
    encounter { order [{ kind: 'pc'|'mon', id, name, init }], turn, round, loc, monsters [] }
    forbiddenLearner                                       the one character who knows the Killing Curse
    lesson { id, key, cls, game, diff, uids [], lesson, lessonName }   the class minigame in progress

  lessons/{lessonId}_{uid}    a student's minigame result: attempts (max 2), passed, score, announced

  answers/{quiz}_{uid}        a player's ceremony answers: uid, quiz, picks [option index…], wish

  claims/{familyId}           a player's pick of premade family; doc id = family, so it locks
    uid, firstName, status ('ok' once the GM screen builds the character)

  characters/{uid}            one sheet per player, per campaign (not shared across campaigns)
    name, firstName, family, familyName, house, xp, hp, maxHp, mana, maxMana, gold, vaultOpened
    stats { str, dex, con, int, wis, cha }   base stats; equipment bonuses add on top
    equipment { wand, robes, familiar, cauldron, books: { id, name, icon, bonus, desc } }
    inventory [ { id, name, icon, qty, effect?, note? } ], spells []

  events/{eventId}            the action feed; GM screen + TV animate each new one
    type ('trade' | 'item_used' | 'spell' | 'roll' | 'wheel' | 'damage' | ...)
    actorUid, targetUid, payload {}, createdAt

  trades/{tradeId}
    fromUid, toUid, offer [], request [], status: 'pending'|'accepted'|'declined'
```

## Security in plain terms
- Anyone signed in can read; only the DM changes game data, results and trophies.
- New accounts are always players. DM is set by hand in the console.
- A player can only add themselves to an open game.
- Players can post events, trades and family claims only as themselves, and only in games they joined.
- Buying, using items, claiming a family and trading are requests. The GM screen checks
  them (price, stock, ownership) and applies them, so players can't edit their own sheet.
- Step 4 will open safe player writes (e.g. accepting a trade), handled so nobody
  can edit their own HP.

## Campaign content
Campaigns live in code (`src/campaigns/`), not the database. Each gets a data
folder — story, map, NPCs, items, spells, wheels, trophy — that the shared
engine loads. Adding Pokémon later means writing content, not rebuilding the app.
