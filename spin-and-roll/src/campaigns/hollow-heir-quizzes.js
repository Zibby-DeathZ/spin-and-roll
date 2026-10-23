// The Sorting Hat and Ollivanders. Each student gets a different random draw of questions
// (no repeats until the pool runs out), with the answers shuffled. Every answer has a reply
// for the GM to read in character; the GM screen shows it live and the Ceremony Book prints them all.

const G = 'Gryffindor', H = 'Hufflepuff', R = 'Ravenclaw', S = 'Slytherin';
const o = (text, house, reply) => ({ text, house, reply });
const w = (text, wood, reply) => ({ text, wood, reply });
const c = (text, core, reply) => ({ text, core, reply });

export const sortingPool = [
  { id: 's01', q: 'An older student is picking on a first-year in the corridor. What do you do?', options: [
    o('Step in front of them, whatever it costs me', G, '“Straight in, fists first. Your heart is louder than your sense, and I rather like the noise.”'),
    o('Stay with the first-year afterwards and make sure they’re okay', H, '“The fight ends in a minute. The kindness lasts a lifetime. You know that already, don’t you?”'),
    o('Find a clever way to distract the bully', R, '“Why fight when you can outwit? A tidy little mind. I can hear it ticking.”'),
    o('Remember their face. They’ll regret it later', S, '“Ooh. Patient. You keep a list, don’t you? I can see it, in very neat handwriting.”'),
  ] },
  { id: 's02', q: 'You find a door nobody has opened in a hundred years.', options: [
    o('Open it. Right now', G, '“Without even knocking! Ha! Doors are for opening, and you, child, are for adventures.”'),
    o('Fetch my friends. Nobody goes in alone', H, '“Not alone. Never alone. You would carry a lantern for someone else before you’d carry one for yourself.”'),
    o('Learn the door’s history before I touch it', R, '“A hundred years of dust, and you want to read it first. Splendid. Most people want to sneeze.”'),
    o('Work out how whatever’s inside could be useful to me', S, '“Not what is behind it, but what it is worth. A practical head on small shoulders.”'),
  ] },
  { id: 's03', q: 'Which would hurt most to be called?', options: [
    o('Coward', G, '“That word stings you like a nettle. I can feel you bristling just thinking of it.”'),
    o('Selfish', H, '“Yes. You would rather be called anything at all than that. Interesting.”'),
    o('Ignorant', R, '“To not know a thing. For you, that is the true darkness. Hmm.”'),
    o('Ordinary', S, '“Ordinary! The horror of it. Oh, you mean to be remembered, don’t you?”'),
  ] },
  { id: 's04', q: 'Four boxes sit in front of you. You may open only one.', options: [
    o('The one that is ticking', G, '“The dangerous one. Of course. I have sorted a thousand of you, and you all pick the ticking box.”'),
    o('The plain wooden one, warm to the touch', H, '“The humble one. Warm things are honest things. You trust your hands, not your eyes.”'),
    o('The one covered in runes you can almost read', R, '“Almost. That word is the whole of you. Almost, and then, with a little work, entirely.”'),
    o('The gold one, stamped with an old family crest', S, '“Old money, old names, old power. You know what things are worth, don’t you?”'),
  ] },
  { id: 's05', q: 'Long after you’re gone, what should people remember about you?', options: [
    o('That I was brave when it mattered', G, '“When it mattered. Not always. Just then. That is the bravest answer of all.”'),
    o('That I never let a friend down', H, '“They will. They will remember. People who keep promises are rarer than gold.”'),
    o('That I understood what others couldn’t', R, '“To see what others miss. A lonely gift, sometimes. But a gift.”'),
    o('That I became someone great', S, '“Great. Not good, not kind: great. Ambition sits on you like a crown that is still a little too big.”'),
  ] },
  { id: 's06', q: 'You win a prize you didn’t deserve. What do you do?', options: [
    o('Say so out loud, in front of everyone', G, '“In front of everyone! Honest and loud. You don’t do anything quietly, do you?”'),
    o('Give it to the person who really earned it', H, '“Handed straight over. No speeches, no fuss. Fair is fair.”'),
    o('Find out how the judges got it wrong', R, '“You want the mistake more than the prize. Ha. That is a very particular sort of mind.”'),
    o('Keep it. Luck is a kind of skill', S, '“Luck is a kind of skill. I may have that embroidered on my brim.”'),
  ] },
  { id: 's07', q: 'It is midnight and you cannot sleep. Where do you go?', options: [
    o('Up to the highest tower to see the stars', G, '“Up, up, up, as high as the castle goes. Heights don’t frighten you. Very little does.”'),
    o('Down to the kitchens for something warm to share', H, '“To the kitchens. With extra for everyone. The house-elves will adore you.”'),
    o('The library, to read the book I’m not allowed to', R, '“The forbidden shelf, by candlelight. I can practically smell the dust on you.”'),
    o('Wherever I can hear what people say when they think nobody is listening', S, '“Listening at keyholes. Knowledge is power, and you have worked that out early.”'),
  ] },
  { id: 's08', q: 'Choose a creature to walk beside you for life.', options: [
    o('A lion with a scar across its nose', G, '“A fighter. Scarred and still roaring. You like your friends with stories.”'),
    o('A badger that never leaves your side', H, '“Faithful, stubborn, and fierce when it counts. Rather like someone I’m sitting on.”'),
    o('A raven that answers riddles', R, '“A clever bird for a clever head. You’d spend all night asking it questions.”'),
    o('A serpent that whispers secrets', S, '“Secrets, whispered just to you. You’ve always liked knowing what others don’t.”'),
  ] },
  { id: 's09', q: 'A friend tells you a secret that could get them expelled. What do you do?', options: [
    o('Tell them to face it, and stand next to them when they do', G, '“Face it, and you’ll be right there. Brave for two. That is a heavy thing to carry, and you would.”'),
    o('Keep it. Forever. No matter what', H, '“Locked away and the key swallowed. Loyalty to the bone. I am moved, truly.”'),
    o('Work out a way to fix the problem before anyone finds out', R, '“Not keep it, not tell it: solve it. A third door most people never see.”'),
    o('Keep it, and remember they owe me one', S, '“A favour in the bank. Oh, you will go far. Possibly too far. We shall see.”'),
  ] },
  { id: 's10', q: 'Which smell do you love the most?', options: [
    o('Smoke from a bonfire on a cold night', G, '“Bonfires! Warmth, danger and shouting. You feel at home where things are lively.”'),
    o('Fresh bread, and soil after rain', H, '“Bread and earth. Simple, good, growing things. You notice the small comforts.”'),
    o('Old books and fresh ink', R, '“Ink. Of course. I could have guessed that from the smudge on your finger.”'),
    o('Rain on stone, deep underground', S, '“Cold stone and quiet water. You are comfortable where others shiver. Hmm.”'),
  ] },
  { id: 's11', q: 'You are given a broom for the first time. What do you do?', options: [
    o('Fly as high and fast as it will go', G, '“Straight up and full speed. The instructors will love you. Then shout at you. Then love you again.”'),
    o('Help the student next to you get theirs off the ground', H, '“Your own feet still on the grass, helping someone else. That says more than any flying could.”'),
    o('Work out how it actually flies', R, '“You’d take it apart if they let you. Curiosity before the thrill. Lovely.”'),
    o('Practise in secret until I’m better than everyone', S, '“Secret practice, then a grand entrance. Nobody sees you work, and everybody sees you win.”'),
  ] },
  { id: 's12', q: 'There is one seat left in the last carriage. Who gets it?', options: [
    o('Whoever looks most frightened. I’ll walk', G, '“You’ll walk. In the dark. Through the rain. And whistle while you do it.”'),
    o('We squeeze in together. Nobody gets left behind', H, '“Everyone in, elbows and all. Nobody left out in the cold. Not while you’re around.”'),
    o('Whoever needs it most, after I ask a few questions', R, '“A fair answer, by careful reasoning. You’d make a fine judge one day.”'),
    o('Me. I got here first', S, '“First come, first seated. Honest, at least. Hmm, you don’t apologise for wanting things.”'),
  ] },
  { id: 's13', q: 'Which of these would you most like to be famous for?', options: [
    o('Saving someone’s life', G, '“A hero’s wish. Plenty want to be heroes. Fewer would do the frightening part. I think you might.”'),
    o('Being the best friend anyone ever had', H, '“Not famous to the world, just to the people who matter. That is the best kind.”'),
    o('Discovering something nobody knew', R, '“A new spell, a new star, a new answer. Your name in the footnotes of every book. Delicious.”'),
    o('Being the most powerful witch or wizard of my age', S, '“The most powerful. Not one of. You like the word most, don’t you?”'),
  ] },
  { id: 's14', q: 'A ghost offers to teach you one thing. Which do you choose?', options: [
    o('How to walk through walls', G, '“Walls are just rules made of stone, and you have never liked rules.”'),
    o('How to make the sad laugh again', H, '“Of all the ghostly secrets, you choose that. Bless you. Even I am touched, and I’m a hat.”'),
    o('Everything they learned while they were alive', R, '“Everything! Greedy, in the nicest possible way. A hundred years of lessons, please.”'),
    o('How they died, so it never happens to me', S, '“Clever and careful. You plan to survive. The survivors usually do.”'),
  ] },
  { id: 's15', q: 'Your team is losing. What do you do?', options: [
    o('Try something daring, even if it might go wrong', G, '“All or nothing! You would rather lose gloriously than win quietly. Noted.”'),
    o('Keep everyone’s spirits up, whatever the score', H, '“The score doesn’t matter if the team is still smiling. A rare thing to know at eleven.”'),
    o('Look for the pattern in how the other side plays', R, '“You’d stop and think while everyone else panicked. That is a weapon most people never sharpen.”'),
    o('Find out what the other team is afraid of', S, '“Their fears. Not their tactics, their fears. Hmm, cunning. I see it clearly.”'),
  ] },
  { id: 's16', q: 'What would you hide under your bed?', options: [
    o('Something a teacher told me not to touch', G, '“Contraband. Already. I can’t decide whether to be proud or worried.”'),
    o('Sweets, to share when someone has a bad day', H, '“A secret store of comfort. You would be very popular in a dormitory, I think.”'),
    o('Notebooks full of my own ideas', R, '“Notebooks! Plans, sketches, questions. I would very much like to read them.”'),
    o('Letters other people don’t know I have', S, '“Other people’s letters. Hmm. Interesting, and a little worrying. Go on.”'),
  ] },
  { id: 's17', q: 'You find a lost wand on the floor. What do you do?', options: [
    o('Hand it in and admit I tried a spell with it first', G, '“A spell first, then honesty. Reckless and truthful all at once. Ha!”'),
    o('Search the castle until I find its owner', H, '“All day, if it takes all day. Someone out there is worried, and you can feel it.”'),
    o('Study it to work out who it belongs to', R, '“The wood, the wear, the length. You’d play detective with it. Marvellous.”'),
    o('Return it, but only once they’ve asked nicely', S, '“Returned, eventually, with conditions. You understand that kindness has a price.”'),
  ] },
  { id: 's18', q: 'Which path through the dark forest do you take?', options: [
    o('The one with the howling at the end', G, '“Towards the howling. Not away from it. Towards it. Oh dear. Oh, good.”'),
    o('The well-trodden one, so others can follow', H, '“Leaving a path for those behind. You think of the others even when you’re frightened.”'),
    o('The one marked on the oldest map', R, '“You trust a good map over a good feeling. Wise, mostly.”'),
    o('The one nobody else knows about', S, '“The secret way. Of course. You like a door that only you can open.”'),
  ] },
  { id: 's19', q: 'You’re given one wish, but someone else gets one too. What do you wish for?', options: [
    o('The courage to never back down', G, '“You ask for more courage? You don’t need it, child. But I suppose there’s no harm.”'),
    o('That their wish comes true', H, '“You give your wish away. Oh, I don’t meet many of you. Lovely, lovely.”'),
    o('To understand how wishes work', R, '“A wish to understand the wish. That is the most Ravenclaw thing I have heard all evening.”'),
    o('That my wish is bigger than theirs', S, '“Bigger than theirs! Ha! Ambition, a dash of competition. A familiar flavour.”'),
  ] },
  { id: 's20', q: 'What do you do when someone tells you that you can’t?', options: [
    o('Do it anyway, right in front of them', G, '“Right in front of them. With a grin, I expect. Stubbornness and bravery are cousins.”'),
    o('Ask if they’ll help me try', H, '“You turn a no into a together. That is a much rarer talent than people think.”'),
    o('Ask them why, and prove them wrong with facts', R, '“Footnotes and evidence. You win arguments, don’t you? Probably most of them.”'),
    o('Smile, and do it later when they’re not looking', S, '“A smile, and then quietly getting your way. Patient and sly. I see.”'),
  ] },
  { id: 's21', q: 'You’re trapped in a room that is slowly filling with water. What first?', options: [
    o('Smash the door down', G, '“Bash first. Think later. Effective, actually, if the door is weak enough.”'),
    o('Make sure everyone else is above the water', H, '“Others first, even with your own chin in the water. I have sorted heroes with less heart.”'),
    o('Look for the trick. Rooms like this always have one', R, '“Always a trick. Always a puzzle. You never stop looking for the answer, even when drowning.”'),
    o('Find who locked me in, and how to make them pay', S, '“Revenge before rescue. Hmm. Let’s hope the water is slow.”'),
  ] },
  { id: 's22', q: 'Which gift would you most like on your birthday?', options: [
    o('A real sword', G, '“A sword! And you’d actually use it. Goodness.”'),
    o('A big party with everyone I love', H, '“Everyone together, nobody forgotten. That is your idea of treasure.”'),
    o('A book nobody else in the world has', R, '“The only copy. You would read it twice and never lend it. Well, maybe once.”'),
    o('Something that makes everyone jealous', S, '“The envy of the room. You like to shine, and to be seen shining.”'),
  ] },
  { id: 's23', q: 'A classmate cheats in an exam and gets top marks. What do you do?', options: [
    o('Call them out in front of the whole class', G, '“In front of everyone! Justice, loud and immediate. You don’t whisper, do you?”'),
    o('Talk to them privately. Maybe something is wrong', H, '“You wonder why before you wonder what to do. Kind. Very kind.”'),
    o('Work out exactly how they did it', R, '“The method interests you more than the crime. Hmm, a curious mind indeed.”'),
    o('Keep quiet, and save it for when I need it', S, '“A card kept up your sleeve. Not today, but one day. Clever. Careful.”'),
  ] },
  { id: 's24', q: 'What frightens you most?', options: [
    o('Being frightened, and everyone seeing it', G, '“Fear of fear itself. Only the brave worry about that, you know.”'),
    o('Being left alone', H, '“Alone. Yes. You need your people the way a fire needs air.”'),
    o('Not knowing the answer when it matters', R, '“The blank page in the exam. The empty mind. I hear it, that fear.”'),
    o('Being weak', S, '“Weakness. You will spend your life making sure nobody ever sees you weak.”'),
  ] },
  { id: 's25', q: 'Which part of the Welcome Feast do you most look forward to?', options: [
    o('The moment the doors open and everyone turns to look', G, '“The big entrance. The turning heads. You’re not afraid of being seen.”'),
    o('The food. All of it. Shared with my new friends', H, '“Food and friends! The two best things, and you know it already.”'),
    o('The enchanted ceiling. How does it work?', R, '“The ceiling, yes. Most look up and say ooh. You look up and say how.”'),
    o('Finding out who the important people are', S, '“Weighing up the room. Who matters, who doesn’t. Already plotting. I like you.”'),
  ] },
  { id: 's26', q: 'A spell goes wrong and turns your friend’s hair green. You…', options: [
    o('Turn my own hair green so they’re not alone', G, '“Ha! Solidarity in green. Brave and silly. My favourite combination.”'),
    o('Apologise and help them fix it, however long it takes', H, '“All night if needed. You don’t leave a mess you made. Honest work.”'),
    o('Write down what went wrong so it never happens again', R, '“Notes! On a disaster! You learn from everything, don’t you?”'),
    o('Convince everyone it was on purpose and it’s the new fashion', S, '“Turning a mistake into a trend. That is real cunning, that is.”'),
  ] },
  { id: 's27', q: 'You hear someone crying in an empty classroom.', options: [
    o('Go straight in', G, '“No hesitation. In you go. Danger or sorrow, you meet it head on.”'),
    o('Knock gently, sit beside them and wait', H, '“Sitting quietly beside them. You don’t need to fix it. You just need to be there.”'),
    o('Listen first, to work out who and why', R, '“Gather the facts before you act. Gentle, careful, wise.”'),
    o('Find out who made them cry', S, '“Who did this? You are already planning. Loyal to your own, and dangerous to their enemies.”'),
  ] },
  { id: 's28', q: 'Which would you rather be?', options: [
    o('Feared by your enemies', G, '“Feared by those who deserve it. A protector’s wish.”'),
    o('Loved by your friends', H, '“Loved. Simple, and the hardest thing in the world. You have chosen well.”'),
    o('Respected by your teachers', R, '“The nod of a professor who rarely nods. That would warm you for a week.”'),
    o('Admired by everyone', S, '“Everyone! Not a few, everyone. You think big, little one.”'),
  ] },
  { id: 's29', q: 'You’re told the castle has a hidden room. What do you want to find inside?', options: [
    o('A monster, so I can face it', G, '“A monster! You actually want there to be a monster. Oh my.”'),
    o('A place where everyone can be safe', H, '“A safe place for everyone. You build shelters while others hunt treasure.”'),
    o('A library nobody has read for a thousand years', R, '“A lost library. The idea makes your heart race, I can feel it.”'),
    o('A secret only I know about', S, '“A secret of your very own. You collect them, don’t you? Like coins.”'),
  ] },
  { id: 's30', q: 'If you could master one kind of magic, which would it be?', options: [
    o('Duelling', G, '“Duelling! Wand up, chin up. Somebody fetch the Hospital Wing now.”'),
    o('Healing', H, '“Healing hands and a gentle heart. The castle always needs more of you.”'),
    o('Spells nobody has invented yet', R, '“Your own spells. You’d never be satisfied with the ones in the book.”'),
    o('Magic that changes people’s minds', S, '“Persuasion. The quietest power, and the strongest. Hmm. Careful with that.”'),
  ] },
];

export const sortingWish = {
  q: 'The Hat pauses. “Is there a house you would ask me for?”',
  options: ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin', 'Let the Hat decide'],
  replies: {
    Gryffindor: '“Gryffindor? You ask for courage’s house. Well, asking is a brave thing in itself…”',
    Hufflepuff: '“Hufflepuff? Not many ask. The ones who do are usually exactly right for it…”',
    Ravenclaw: '“Ravenclaw, eh? You want to be among the clever ones. Let us see if you have earned the seat…”',
    Slytherin: '“Slytherin. You know what you want, and you ask for it. That alone says something…”',
    'Let the Hat decide': '“You trust me? How refreshing. Most argue. Very well, I shall decide.”',
  },
};

// What the Hat shouts once the house is chosen (pick one).
export const sortingVerdicts = {
  Gryffindor: ['“Brave, loud and impossible to stop. Better be… GRYFFINDOR!”', '“Where the daring go, and the reckless, and the very best friends. GRYFFINDOR!”'],
  Hufflepuff: ['“Loyal, kind, and much tougher than anyone expects. HUFFLEPUFF!”', '“Here is a heart that will never leave anyone behind. HUFFLEPUFF!”'],
  Ravenclaw: ['“A mind like a lantern in a dark library. RAVENCLAW!”', '“So many questions, and the patience to answer them. RAVENCLAW!”'],
  Slytherin: ['“Ambition, cunning, and a long memory. You’ll go far… SLYTHERIN!”', '“Plans inside plans. I know exactly where you belong. SLYTHERIN!”'],
};

export const wandPool = [
  // ---- wood questions ----
  { id: 'w01', kind: 'wood', q: 'When trouble comes, what do you reach for first?', options: [
    w('A plan', 'vine', '“A plan. Before the trouble has even finished arriving. Hmm, vine likes a schemer.”'),
    w('My courage, and my fists if needed', 'oak', '“Courage and fists. Oak, perhaps. Oak stands beside those who stand their ground.”'),
    w('The quickest way out', 'hawthorn', '“Quick feet, quick mind. Hawthorn trembles in its box at that answer.”'),
    w('The people beside me', 'ash', '“The people beside you. Ash would never leave you, and I think you would never leave them.”'),
  ] },
  { id: 'w02', kind: 'wood', q: 'What would you hate to lose the most?', options: [
    w('The people I love', 'holly', '“The people you love. Holly is a guardian’s wood. It knows that fear well.”'),
    w('My freedom', 'hawthorn', '“Freedom. Hawthorn hates a cage too. You might understand each other.”'),
    w('My pride', 'yew', '“Pride. Yew is a proud old tree. It lives a thousand years and bows to nobody.”'),
    w('The truth', 'vine', '“The truth. Vine wands see what others hide. Interesting…”'),
  ] },
  { id: 'w03', kind: 'wood', q: 'The people who know you best would call you…', options: [
    w('Stubborn', 'yew', '“Stubborn! Yew, very likely. It is the stubbornest wood in this shop.”'),
    w('Dependable', 'ash', '“Dependable. Ash wands do not wander. They choose once.”'),
    w('Strong', 'oak', '“Strong. Oak likes strong. Strong hands, strong hearts.”'),
    w('Watchful', 'holly', '“Watchful. Holly keeps watch too. It guards its owner like a hound.”'),
  ] },
  { id: 'w04', kind: 'wood', q: 'You’re lost in a strange city at night. What do you do?', options: [
    w('Climb something tall and look around', 'oak', '“Up you go, to see for yourself. Oak would hold you steady.”'),
    w('Slip through the alleys until something looks familiar', 'hawthorn', '“Slipping and darting through the shadows. Hawthorn adores a quick escape.”'),
    w('Ask the friendliest-looking stranger for help', 'ash', '“You trust people. Ash trusts its owner the same way. Completely.”'),
    w('Read the street signs and work it out', 'vine', '“The signs, the patterns, the clues. Vine would hum in your hand.”'),
  ] },
  { id: 'w05', kind: 'wood', q: 'Which season feels most like you?', options: [
    w('Winter: quiet, sharp and patient', 'holly', '“Winter. Holly stays green in the snow. It does not give up in the cold.”'),
    w('Autumn: everything changing', 'yew', '“Autumn. Yew remembers a thousand autumns. Change does not frighten it.”'),
    w('Spring: always growing towards something', 'vine', '“Spring! Climbing, reaching. Vine climbs too, towards a purpose only it can see.”'),
    w('Summer: bright, loud and alive', 'oak', '“Summer. The great oak in full leaf. Hmm, yes, I can see that.”'),
  ] },
  { id: 'w06', kind: 'wood', q: 'A friend is in danger across a rickety bridge. You…', options: [
    w('Run straight across', 'oak', '“Straight across! Oak would carry you. It has carried braver fools than you. Er, braver people.”'),
    w('Dash across lightly, testing every plank', 'hawthorn', '“Light feet, quick reflexes. Hawthorn, I think, or something very like it.”'),
    w('Stay on my side and talk them across, calmly', 'holly', '“Calm, steady, protective. Holly guards. You guard too.”'),
    w('Shout that I’m coming, and never stop shouting', 'ash', '“So they know you’re coming. They are never alone. Ash, I think. Ash is loyal to the end.”'),
  ] },
  { id: 'w07', kind: 'wood', q: 'Pick a sound.', options: [
    w('Wind in the leaves', 'ash', '“Wind in the leaves of a tall ash tree. A sound that has comforted people for centuries.”'),
    w('A crack of thunder', 'oak', '“Thunder! Lightning loves an oak tree. Hmm. That suits you.”'),
    w('A door creaking open in the dark', 'vine', '“A door opening. Something secret beginning. Vine wands live for that sound.”'),
    w('Absolute silence', 'yew', '“Silence. Old yews grow in silent churchyards. You are deeper than you look.”'),
  ] },
  { id: 'w08', kind: 'wood', q: 'What is the best thing a person can be?', options: [
    w('Loyal', 'ash', '“Loyal. Above clever, above brave. Ash wands agree with you completely.”'),
    w('Quick', 'hawthorn', '“Quick, quick, quick. Hawthorn is restless. So are you, I suspect.”'),
    w('Protective', 'holly', '“Protective. Holly will shield you. You will shield others. A good match.”'),
    w('Unstoppable', 'yew', '“Unstoppable. A big word for a small person. Yew likes big words.”'),
  ] },
  { id: 'w09', kind: 'wood', q: 'Which would you rather have?', options: [
    w('A secret nobody else knows', 'vine', '“A secret. Vine wands are drawn to people with something hidden. Hmm…”'),
    w('A home that will always welcome you', 'ash', '“A home, always. Ash is the wood of hearth and roots.”'),
    w('Arms strong enough to carry anyone', 'oak', '“Strong arms to carry others. That is oak, through and through.”'),
    w('Eyes that see danger coming', 'holly', '“Eyes that see danger coming. Holly, the guardian. Mm.”'),
  ] },
  { id: 'w10', kind: 'wood', q: 'How do you feel about rules?', options: [
    w('Rules are for slow people', 'hawthorn', '“Ha! Hawthorn would agree. It is a difficult wood. Quick, and hard to master.”'),
    w('Rules matter, if they keep people safe', 'holly', '“Rules that keep people safe. A guardian’s answer.”'),
    w('I make my own', 'yew', '“Your own rules. Yew bows to nobody, not even me.”'),
    w('Every rule has a loophole', 'vine', '“A loophole! Vine, perhaps. Vine finds every crack in every wall.”'),
  ] },
  { id: 'w11', kind: 'wood', q: 'Your favourite place to sit and think?', options: [
    w('Under a huge old tree', 'oak', '“Under a great tree. Do you know, the oak you sat under may be in this very shop?”'),
    w('On a high window ledge', 'hawthorn', '“A window ledge! Precarious. Hawthorn likes precarious.”'),
    w('Beside a fire with my friends', 'ash', '“Beside a fire, with friends. Warm and loyal, like ash.”'),
    w('In a graveyard at dusk', 'yew', '“A graveyard. Hmm! Yew trees grow in old graveyards. They have seen a great deal.”'),
  ] },
  { id: 'w12', kind: 'wood', q: 'Which of these weather spells would you like to learn?', options: [
    w('Calling a storm', 'oak', '“A storm! Oak stands tall in a storm. It does not bend.”'),
    w('Calling a shield of mist', 'holly', '“A shield of mist, to hide those you love. Holly.”'),
    w('Calling a wind to carry me away', 'hawthorn', '“Away on the wind. Hawthorn doesn’t like to stay anywhere for long.”'),
    w('Calling a darkness only I can see through', 'vine', '“A darkness only you can see through. Hmm, vine. Or something stranger.”'),
  ] },
  { id: 'w13', kind: 'wood', q: 'If you had to stand guard all night, you would…', options: [
    w('Stay awake no matter what', 'holly', '“No matter what. Holly would stand guard with you.”'),
    w('Stay awake to keep my friends company', 'ash', '“To keep them company. Ash would be glad of such an owner.”'),
    w('Sleep, but set a trap first', 'vine', '“A trap! Cunning and practical. Vine approves.”'),
    w('Stay awake and hope something attacks', 'oak', '“Hope something attacks! Oh dear. Oak, without a doubt.”'),
  ] },
  { id: 'w14', kind: 'wood', q: 'Choose a treasure.', options: [
    w('An old crown nobody remembers', 'yew', '“A forgotten crown. Yew remembers what everyone else forgets.”'),
    w('A key that opens any lock', 'hawthorn', '“A key to every lock. Hawthorn, the escapist.”'),
    w('A map of every secret passage', 'vine', '“A map of secrets. I could have guessed that. Vine.”'),
    w('A shield that can never break', 'holly', '“An unbreakable shield. Holly, the protector.”'),
  ] },
  { id: 'w15', kind: 'wood', q: 'Someone you love is being teased. What do you do?', options: [
    w('Stand between them and the teasing', 'holly', '“Stand between. Holly does the same. It stands between its owner and harm.”'),
    w('Laugh it off with them, together', 'ash', '“Together. Ash, I think. Loyal and warm.”'),
    w('Out-talk the bully until they look silly', 'yew', '“Out-talk them! A strong will. Yew loves a strong will.”'),
    w('Do something so brave the teasing stops', 'oak', '“Something so brave everyone forgets the teasing. Oak, oak, oak.”'),
  ] },
  { id: 'w16', kind: 'wood', q: 'What do you want your magic to feel like?', options: [
    w('Lightning: fast, sharp and sudden', 'hawthorn', '“Lightning! Fast, sharp. Hawthorn is hard to master, but quick as anything.”'),
    w('A mountain: heavy and unmovable', 'oak', '“A mountain. Steady, strong, unmovable. That is an oak answer.”'),
    w('Ice: cold, clear and powerful', 'yew', '“Cold and powerful. Yew can be cold. It can also be magnificent.”'),
    w('A whisper: quiet, but impossible to ignore', 'vine', '“A whisper. Vine works quietly. It finds its way in.”'),
  ] },
  { id: 'w17', kind: 'wood', q: 'Your house is on fire. You can save one thing.', options: [
    w('My pet', 'ash', '“Your pet. Without a thought. Ash would love you for that.”'),
    w('My diary', 'vine', '“Your diary. Your secrets. Vine understands.”'),
    w('My family heirloom', 'yew', '“The heirloom. The old things matter to you. Yew is very old.”'),
    w('Nothing. I go back in for whoever is still inside', 'holly', '“Back inside for the others. You are a guardian at heart. Holly.”'),
  ] },
  { id: 'w18', kind: 'wood', q: 'Which kind of game do you like best?', options: [
    w('Racing', 'hawthorn', '“Racing! Of course. Hawthorn does not stay still.”'),
    w('Wrestling', 'oak', '“Wrestling. Hmm, I suspect you win. Oak.”'),
    w('Hide and seek', 'vine', '“Hide and seek. Hiding, mostly, I imagine. Vine.”'),
    w('Anything I can play with my whole family', 'ash', '“With everyone. Ash is a family wood.”'),
  ] },
  { id: 'w19', kind: 'wood', q: 'What do you do with a promise?', options: [
    w('Keep it forever', 'ash', '“Forever. An ash wand chooses its owner forever too.”'),
    w('Keep it, as long as it protects someone', 'holly', '“As long as it protects someone. A guardian’s reasoning.”'),
    w('Keep it, unless I find a cleverer way', 'vine', '“Unless there’s a cleverer way. Ha. Vine.”'),
    w('I don’t make promises I can’t win', 'yew', '“You only make promises you can win. Yew, I think. Strong-willed.”'),
  ] },
  { id: 'w20', kind: 'wood', q: 'A shadow moves in the corner of your bedroom. What do you do?', options: [
    w('Throw something at it', 'oak', '“Throw something! Brave and immediate. Oak.”'),
    w('Pretend to be asleep and watch it', 'vine', '“Pretend to sleep, and watch. Clever. Vine.”'),
    w('Stand in front of whoever is sleeping nearby', 'holly', '“Shield the others. Holly, to be sure.”'),
    w('Leap out of the window', 'hawthorn', '“Out of the window! Hawthorn! A wonderfully quick decision.”'),
  ] },
  { id: 'w21', kind: 'wood', q: 'Which old saying fits you best?', options: [
    w('Slow and steady wins the race', 'ash', '“Slow and steady. Ash grows slowly, and lives a very long time.”'),
    w('Fortune favours the bold', 'oak', '“Fortune favours the bold. You do look bold.”'),
    w('Knowledge is power', 'vine', '“Knowledge is power. Vine collects knowledge like ivy collects walls.”'),
    w('Never let them see you sweat', 'yew', '“Never let them see you sweat. Hmm, that is a yew answer if I ever heard one.”'),
  ] },
  { id: 'w22', kind: 'wood', q: 'You are asked to carry something precious through a dangerous wood. You…', options: [
    w('Guard it with my life', 'holly', '“With your life. Holly. Unmistakably.”'),
    w('Run the whole way without stopping', 'hawthorn', '“Without stopping! Hawthorn, yes. Quick as a hare.”'),
    w('Bring a friend so there are two of us', 'ash', '“Two of you. Ash would be proud.”'),
    w('Ask what it is first. And why me', 'yew', '“Why me? A fair question. Yew always asks.”'),
  ] },
  { id: 'w23', kind: 'wood', q: 'Which colour do you dream in?', options: [
    w('Deep green', 'holly', '“Deep green. The green of holly leaves in winter. Yes.”'),
    w('Dark red', 'yew', '“Dark red. Like yew berries. Beautiful, and a little dangerous.”'),
    w('Silver grey', 'ash', '“Silver grey, like ash bark. Calm and true.”'),
    w('Gold', 'oak', '“Gold, like an oak in autumn sun. Bright, strong.”'),
  ] },
  { id: 'w24', kind: 'wood', q: 'Your greatest strength is…', options: [
    w('That I notice everything', 'vine', '“You notice everything. Vine notices too. Nothing is hidden from it for long.”'),
    w('That I never give up', 'yew', '“You never give up. Neither does yew.”'),
    w('That I move before anyone else', 'hawthorn', '“You move first. Hawthorn, quick and twitchy, yes.”'),
    w('That I never leave anyone behind', 'ash', '“Never anyone behind. Ash is the wood for you, I think.”'),
  ] },
  // ---- core questions ----
  { id: 'c01', kind: 'core', q: 'Three things glow on Mr Ollivander’s counter. Which draws your hand?', options: [
    c('A flame that rises from its own ashes', 'phoenix', '“The flame that rises again. Phoenix. Rare, rare indeed.”'),
    c('A heart that beats fierce and hot', 'dragon', '“The beating heart. Dragon heartstring, powerful and proud.”'),
    c('A silver thread that never breaks', 'unicorn', '“The silver thread. Unicorn hair, the most faithful of cores.”'),
  ] },
  { id: 'c02', kind: 'core', q: 'What kind of magic do you want to do?', options: [
    c('Rare magic nobody else can do', 'phoenix', '“Rare magic. The phoenix feather gives only to a few.”'),
    c('Powerful magic that wins fights', 'dragon', '“Power that wins. Dragon heartstring. Mind it doesn’t win you.”'),
    c('Steady magic I can always rely on', 'unicorn', '“Steady magic. Unicorn hair hardly ever misfires.”'),
  ] },
  { id: 'c03', kind: 'core', q: 'Which would you rather be?', options: [
    c('Unforgettable', 'phoenix', '“Unforgettable. The phoenix is never forgotten.”'),
    c('Unbeatable', 'dragon', '“Unbeatable. A dragon’s answer.”'),
    c('Unbreakable', 'unicorn', '“Unbreakable. The unicorn endures.”'),
  ] },
  { id: 'c04', kind: 'core', q: 'When you get angry, you…', options: [
    c('Burn hot, then rise above it', 'phoenix', '“Burn and rise. Like a phoenix. Hmm.”'),
    c('Roar', 'dragon', '“Roar! Ha! Dragon, for certain.”'),
    c('Go very, very quiet', 'unicorn', '“Very quiet. Unicorns are gentle until they are not.”'),
  ] },
  { id: 'c05', kind: 'core', q: 'Choose a light.', options: [
    c('A candle that never goes out', 'phoenix', '“A flame that will not die. Phoenix.”'),
    c('A roaring bonfire', 'dragon', '“A bonfire. Heat and fury. Dragon.”'),
    c('Moonlight on still water', 'unicorn', '“Moonlight on water. That is unicorn, and nothing else.”'),
  ] },
  { id: 'c06', kind: 'core', q: 'You are badly hurt in a duel. What happens next?', options: [
    c('I get back up, stronger than before', 'phoenix', '“Stronger than before. The phoenix rises from its own ashes.”'),
    c('I hit back twice as hard', 'dragon', '“Twice as hard! Dragon heartstring will match your temper.”'),
    c('I walk away. Winning isn’t everything', 'unicorn', '“Walk away. The unicorn never fights for pride.”'),
  ] },
  { id: 'c07', kind: 'core', q: 'Which creature would you most like to meet?', options: [
    c('A bird made of fire', 'phoenix', '“The phoenix. Few ever meet one. Fewer are chosen.”'),
    c('A dragon, up close', 'dragon', '“Up close! You’d lose your eyebrows. Dragon heartstring, I think.”'),
    c('A unicorn in a moonlit forest', 'unicorn', '“A unicorn. Gentle and pure. The hair might suit you.”'),
  ] },
  { id: 'c08', kind: 'core', q: 'What do you want from a wand?', options: [
    c('Surprises', 'phoenix', '“Surprises! Phoenix wands are full of them.”'),
    c('Power', 'dragon', '“Power. Dragon, then. It will give you plenty.”'),
    c('Loyalty', 'unicorn', '“Loyalty. Unicorn hair is the most loyal of all.”'),
  ] },
  { id: 'c09', kind: 'core', q: 'Pick a word.', options: [
    c('Rebirth', 'phoenix', '“Rebirth. A phoenix word.”'),
    c('Fire', 'dragon', '“Fire. Dragon heartstring burns warm in its wood.”'),
    c('Pure', 'unicorn', '“Pure. Unicorn, unmistakably.”'),
  ] },
  { id: 'c10', kind: 'core', q: 'Your magic is most likely to…', options: [
    c('Do something nobody expected', 'phoenix', '“The unexpected. Phoenix feathers are unpredictable.”'),
    c('Blow something up', 'dragon', '“Blow something up! Oh dear. Dragon, then. Stand back, everyone.”'),
    c('Work exactly as I meant', 'unicorn', '“Exactly as meant. A unicorn hair wand will not let you down.”'),
  ] },
  { id: 'c11', kind: 'core', q: 'Which is the hardest thing to do?', options: [
    c('Start again after losing everything', 'phoenix', '“Start again. The phoenix does it every time.”'),
    c('Hold back when you could win', 'dragon', '“Holding back. Dragons don’t, as a rule.”'),
    c('Stay kind when people are cruel', 'unicorn', '“Kind when people are cruel. The unicorn way.”'),
  ] },
  { id: 'c12', kind: 'core', q: 'If your magic had a voice, it would…', options: [
    c('Sing', 'phoenix', '“Sing! Phoenix song is said to give courage to the pure of heart.”'),
    c('Roar', 'dragon', '“Roar. A dragon’s voice in your wand.”'),
    c('Hum softly', 'unicorn', '“Hum softly. Unicorn hair, I think.”'),
  ] },
  { id: 'c13', kind: 'core', q: 'Which would you rather never lose?', options: [
    c('Hope', 'phoenix', '“Hope. The phoenix is hope with feathers.”'),
    c('My nerve', 'dragon', '“Your nerve. Dragons never lose theirs.”'),
    c('My friends', 'unicorn', '“Your friends. Unicorns stay close to those they trust.”'),
  ] },
  { id: 'c14', kind: 'core', q: 'Pick a place to practise spells.', options: [
    c('A cliff edge at sunrise', 'phoenix', '“At sunrise, on the edge of things. Phoenix.”'),
    c('An empty arena', 'dragon', '“An arena. You want an audience, or an opponent. Dragon.”'),
    c('A quiet glade in the forest', 'unicorn', '“A quiet glade. Unicorns live in such places.”'),
  ] },
  { id: 'c15', kind: 'core', q: 'Your wand will be with you all your life. What should it be?', options: [
    c('A mystery', 'phoenix', '“A mystery. Phoenix feather wands are the hardest to understand.”'),
    c('A weapon', 'dragon', '“A weapon. Dragon heartstring makes fierce ones.”'),
    c('A friend', 'unicorn', '“A friend. Unicorn hair, then. The truest friend in this shop.”'),
  ] },
];

// What Ollivander says as he hands the wand over.
export const wandVerdicts = {
  wood: {
    holly: '“Holly. A guardian’s wood. It will stand between you and harm when you most need it.”',
    yew: '“Yew. Proud and long-lived, and it bows to nobody but you.”',
    vine: '“Vine. It seeks those with a hidden purpose. I wonder what yours is…”',
    ash: '“Ash. Loyal to one owner for life. It will never work as well for anyone else.”',
    hawthorn: '“Hawthorn. Quick, and hard to master. You’ll get on splendidly, once you stop fighting.”',
    oak: '“Oak. A faithful partner in battle. Strong roots, strong heart.”',
  },
  core: {
    phoenix: '“…with a phoenix feather. The rarest of cores. It may be picky about what it will do for you.”',
    dragon: '“…with a dragon heartstring. Powerful, and with a temper. Rather like its owner, I suspect.”',
    unicorn: '“…with unicorn hair. Faithful, steady, and it almost never misfires.”',
  },
};
