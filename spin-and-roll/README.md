# Spin & Roll

The group's campaign platform: one login for everyone, a DM dashboard to run
games, player dashboards with history and trophies, and three live screens
(GM, TV, phones) per game.

Built with React + Vite, Firebase (login + live database), hosted on GitHub Pages.

## One-time setup (about 15 minutes)

### 1. Firebase project
1. Go to https://console.firebase.google.com and create a project (Analytics not needed).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database**, production mode, pick the closest region.
4. In Firestore's **Rules** tab, paste everything from `firestore.rules` and publish.
5. **Project settings → Your apps → Web (</>)**, register the app, and copy the
   `firebaseConfig` values into `src/firebase.config.js`.

### 2. Run it locally
```
npm install
npm run dev
```
Open the URL it prints and sign in with Google.

### 3. Make yourself the DM
Every account starts as a player, so nobody can make themselves DM from the app.
In Firestore, open `users → <your id>` and change `role` from `player` to `dm`.
Refresh and you'll land on the DM dashboard.

### 4. Put it online
1. Push this folder to a GitHub repo (branch `main`).
2. Repo **Settings → Pages → Source: GitHub Actions**. The included workflow
   builds and deploys on every push.
3. Back in Firebase: **Authentication → Settings → Authorized domains → Add**
   `<your-github-username>.github.io`.

Your site: `https://<username>.github.io/<repo-name>/`

## How a game night works
1. DM: **Create game** on a campaign → a 4-letter join code appears.
2. DM: **Open TV screen** on the laptop output to the TV, **Open GM screen** on your display.
3. Players: sign in on their phones, type the code from the TV → they pop onto the TV live.
4. DM: **Start game**. At the end, **Record win** or **Record loss** — it's written to
   every player's history, and a win drops the campaign trophy into their cabinet.

## Build status
- [x] 1. Accounts, DM/player roles, dashboards
- [x] 2. Campaign library and game creation (engine data files come with step 6)
- [x] 3. Live sync between GM, TV and phones (live map comes with step 6)
- [x] 4. Player phone character sheet and trading
- [~] 5. Event feed with toasts on GM + TV (bigger animations to come)
- [~] 6. Hollow Heir content
  - [x] Six premade families (locked once picked), vaults, Diagon Alley shops, wands, equipment buffs, Defence
  - [x] Family abilities, Sorting Hat and Ollivander ceremonies, house points
  - [ ] 7-day clock and timetable, wheels, Time-Turner, class minigames, live map
- [x] 7. Win/loss history and trophies

See `DATA_MODEL.md` for how the database is laid out.
