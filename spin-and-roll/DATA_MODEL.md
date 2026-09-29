# Data model (Firestore)

```
users/{uid}
  displayName, photoURL, role: 'player' | 'dm', createdAt
  history/{sessionId}    campaignId, campaignTitle, result: 'won'|'lost', endedAt
  trophies/{sessionId}   campaignId, title, icon, awardedAt

sessions/{sessionId}          one game night (or a two-day campaign)
  campaignId, dmUid, code, status: 'lobby'|'active'|'won'|'lost'
  playerUids[], createdAt, startedAt, endedAt
  state { ... }               campaign-wide live state, e.g. for Hollow Heir:
                              day, timeBlock, housePoints{}, timeTurnerUsed, mapLocation

  characters/{uid}            one sheet per player, per campaign (not shared across campaigns)
    name, house, level, xp, hp, maxHp, mana, maxMana, gold
    stats { str, dex, con, int, wis, cha }
    equipment {}, inventory [], spells [], knownPotions []

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
- Players can post events and trades only as themselves, and only in games they joined.
- Step 4 will open safe player writes (e.g. accepting a trade), handled so nobody
  can edit their own HP.

## Campaign content
Campaigns live in code (`src/campaigns/`), not the database. Each gets a data
folder — story, map, NPCs, items, spells, wheels, trophy — that the shared
engine loads. Adding Pokémon later means writing content, not rebuilding the app.
