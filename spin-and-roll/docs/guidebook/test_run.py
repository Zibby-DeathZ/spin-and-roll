def check(rows):
    """A checklist table: tick box, what to do, what you should see."""
    return ('table', ['', 'Do this', 'You should see'], [['[  ]', a, b] for a, b in rows], [9, 76, 85])


BLOCKS = [
    ('chapter', 'Test run', 'The full test run', 'One whole campaign with two phones, start to finish, before game night.'),
    ('p', 'This is the last check before your friends play. Go through it in order with the TV, your GM screen and two phones. '
          'Tick each box. When something is wrong, write it in the notes at the back, with the day and block, which screen and what you pressed, and send me the list. '
          '<b>Nothing new gets added now. Only fixes.</b>'),
    ('h2', 'What you need'),
    ('table', ['Screen', 'Who', 'Signed in as'], [
        ['Laptop', 'GM screen', 'You'],
        ['TV (or a second browser window)', 'The TV screen (Open TV screen on the DM dashboard)', 'You'],
        ['Phone A', 'Player 1', 'A second Google account'],
        ['Phone B', 'Player 2', 'A third Google account'],
        ['Optional: a third player', 'GM screen, 🧪 Test student', 'You (needed for the Double game, which needs 3 players)'],
    ], [42, 72, 56]),
    ('tip', 'Pick families that test the most: <b>Phone A: Fenwick</b> (the map half) and <b>Phone B: Penrose</b> (one of the new families). At the Sorting, wish for <b>Gryffindor</b> on A and <b>Ravenclaw</b> on B, so you can test the Nerve re-roll and Ravenclaw Wit.'),
    ('p', '<b>Important:</b> Make a fresh game for the test, not the one your friends will use, and make a new one for game night. Do <b>not</b> press <b>Record win</b> or <b>Record loss</b> on the test game: that saves the test characters and trophies to the accounts. Just leave it unfinished.'),
    ('h2', 'Before you start'),
    check([
        ('Hard refresh every screen (Ctrl+F5 on the laptop; close and reopen the browser on the phones).', 'Nothing old cached. If anything looks different from this book, refresh again.'),
        ('GM screen, Media tab.', 'Every map, portrait and storybook page ticked. Missing pictures listed (they show an emoji instead).'),
        ('Turn the TV volume up. Tap the TV screen once.', 'Sound unlocks. The music picker in the header plays.'),
        ('Both phones join with the join code. Press Start game on the DM dashboard.', 'Both names appear on the dashboard and the GM Players tab.'),
    ]),

    ('h2', '1. The Prologue'),
    check([
        ('🎬 Opening cutscene: Open the book, Next page through all six pages.', 'Storybook pictures on the TV, words on your panel, phones locked.'),
        ('Each phone picks a family. Close the book and begin.', 'Portraits on the TV. Family cards on the phones.'),
        ('Prologue: Letters arrive. Table tab: Home, Just show on TV.', 'Home picture on the TV. Tokens stand on the floor, not the walls.'),
        ('Advance time to Gringotts. Move everyone to Gringotts. Open each vault.', 'The TV announces each amount. Galleons appear on the phones.'),
        ('🛍️ Open shops. Move to Diagon Alley. Buy something on each phone.', 'School list ticks itself off. Gold goes down.'),
        ('Wand questions for Phone A, then Phone B.', 'Different questions for each, answers in a different order. Purple box on your panel shows what Ollivander says. Give this wand.'),
        ('Close shops. Advance time to the Express. Move to the Platform, then the Express.', 'Doors show where they lead. Trolley and painting can be placed.'),
        ('Advance time to the Welcome Feast. Move to the Great Hall. Sorting Hat for each phone.', 'New questions again, the Hat’s replies in the purple box, the wish, a crest reveal on the TV, and the house specialty on the phone’s Sheet.'),
        ('Send all staff to their rooms. Lights out (or move each student to their common room). Advance time.', 'Each student lands in their own common room. Day 1 begins.'),
    ]),

    ('h2', '2. Day 1: the everyday things'),
    check([
        ('Morning class: start the class minigame. Play it on both phones (pass on one, fail on the other).', 'Pass teaches the spell and gives 10 XP. Fail allows a second try.'),
        ('Look at the Library and the Trophy Room without changing the TV (Party panel, or the peek bar).', 'The TV stays where it is. Rune tablet 1 and the ring clue are on those maps.'),
        ('Phone A picks up an item. Phone B opens a chest.', 'Item in the Bag. The chest gives loot (or is a mimic).'),
        ('Read a clue on a phone. Read the rune tablet.', 'The clue sheet opens. The tablet shows pictures with runes; the Rune notebook lets them pencil letters.'),
        ('Lunch: talk to Prefect Sinclair. Give Keep an Eye Out to one phone.', 'Quest on that phone with its objectives. A scroll over her head on the TV while it is on offer.'),
        ('Free time: Grimsby offers Stolen Ingredients. Ignore it.', 'It arrives by owl at the start of the next block.'),
        ('Points: +5 to one student, −5 to another, with a reason.', 'The TV announces both. The house board changes.'),
        ('Curfew: spin Out after curfew for one phone.', 'The wheel spins on the TV and its result applies to that student.'),
        ('Advance time past Curfew to Day 2.', 'The end-of-day ceremony plays by itself, with the House of the Day and its perk.'),
    ]),

    ('h2', '3. Days 2 to 4: fights, magic and the mystery'),
    check([
        ('Free time on Day 2: start a Dueling Club duel against the rival with the reaction duel on.', 'The spell and a countdown on the TV and the phone. It settles by itself.'),
        ('Start a fight with something from the Bestiary. Roll on both phones.', 'Initiative order, damage, HP bars. End and share XP works.'),
        ('Roll d20s on the Gryffindor phone until a natural 1 comes up.', 'The first natural 1 of the day is re-rolled by itself, and the TV says Gryffindor nerve. The next one is not.'),
        ('Use Ravenclaw Wit on Phone B. Use each family ability once.', 'The TV announces it. Once-a-day things grey out.'),
        ('Day 2 Curfew: the first victim. Open the Suspect board. Pin a clue.', 'The board on the TV, phones locked. Back to the map takes it off.'),
        ('Call an accusation vote. Cancel it halfway. Call it again, vote on both phones, Show the votes, Keep it a hunch.', 'Cancel always frees the TV and phones. The pick is stamped Accused.'),
        ('🧹 Clear the TV while something is showing.', 'Everything returns to the map.'),
        ('Put a puzzle on the TV (try the rune floor and the Turning Lock).', 'The puzzle detects when it is solved. Runes they solve are learned for the whole party.'),
        ('Owl Post: send Phone B a secret letter.', 'An owl arrives on that phone only.'),
        ('Trade an item from Phone A to Phone B.', 'B accepts, the item moves.'),
        ('Day 4: give the Fenwick the other map half. Open the map on Phone A.', 'The whole castle on the TV with footsteps.'),
        ('Play one round of the Double with the test student as the third player.', 'Word, vote, reveal, points.'),
    ]),

    ('h2', '4. Days 5 to 7: the finale'),
    ('p', 'You can move quickly here: Advance time through the blocks and only stop at the beats. Use the 🧪 Test student kits (Top level, Every spell, One of every item) to skip grinding.'),
    check([
        ('Advance through Day 5 and Day 6, stopping at each beat in the DM Guide.', 'Victims, owls and quest offers happen on time. No errors.'),
        ('Day 7: the Trials Beneath. Devil’s Snare, Torch Wall, Chessboard, Bottles.', 'Each trial works and finishes.'),
        ('The Undercroft: fight Ashgrove (possessed) and the Paint Wraiths, then Corvin Vale.', 'Boss reaction duels, the paint jars, the second fight.'),
        ('Complete The Hollow Heir and The Trials Beneath.', 'The quest scroll on the TV and both phones.'),
        ('Final accusation, then 🎖️ Tonight’s awards, then 🏆 House Cup ceremony.', 'Both ceremonies play with music and the right winners.'),
    ]),

    ('h2', '5. Things that might go wrong on the night'),
    check([
        ('Lock and unlock a phone in the middle of a block.', 'It comes straight back to the right screen.'),
        ('Turn the Wi-Fi off on one phone for ten seconds, then on.', 'It catches up with everything it missed.'),
        ('Refresh the TV in the middle of a fight.', 'The fight is still there.'),
        ('Close the GM screen and open it again.', 'Nothing is lost.'),
    ]),

    ('h2', 'After the test'),
    check([
        ('Remove the 🧪 Test student.', 'Gone from the Players tab.'),
        ('Do not record a win or loss on the test game. Make a fresh game for game night.', 'The test characters never reach anyone’s profile.'),
        ('Send me your notes.', 'I fix anything that broke. Nothing new gets added.'),
    ]),

    ('h2', 'Notes'),
    ('table', ['Day / block', 'Screen', 'What I pressed', 'What went wrong'], [['<br/><br/>', '', '', ''] for _ in range(12)], [24, 22, 52, 72]),
]
