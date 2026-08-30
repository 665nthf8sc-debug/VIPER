# VIPER3384 DROP ZONE

An 8-bit NES-style Fortnite hub for **VIPER3384** (`@coolfox3384`), plus a 3D Battle Royale minigame that looks like Fortnite.

GitHub: [665nthf8sc-debug/VIPER](https://github.com/665nthf8sc-debug/VIPER)  
Pages: [https://665nthf8sc-debug.github.io/VIPER/](https://665nthf8sc-debug.github.io/VIPER/)

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43180](http://127.0.0.1:43180).

```bash
npm run build
npm start
```

## Publish to GitHub Pages

This repo deploys with GitHub Actions on push to `main`. After the first push:

1. Repo **Settings → Pages → Build and deployment → Source** → **GitHub Actions**
2. Wait for the **Deploy GitHub Pages** workflow
3. Open `https://665nthf8sc-debug.github.io/VIPER/`

On Pages there is no Node server, so the hall of fame uses `localStorage`. Locally (and on Vercel) scores still go through `/api/scores` into SQLite. Battle Pass XP and skins always live in `localStorage`.

## What's on the cart

- **Hero** — VIPER drop zone, battle bus sky, countdown to the next season on October 1
- **VIPER TV** — Watch a tape for **+8 XP** (once). Like a tape for **+12 XP**. Subscribe, then claim the **Channel 3384** exclusive skin.
- **Battle Pass** — Slow grind. A match caps around **35 XP**. Tiers go through Bad Kit, Kit, Sonic, Phantom, Chief, and Mythic. You cannot finish the pass in one game.
- **Lobby** — Pre-game pad: swap skins, emotes (Floss, Griddy), and pets, then wait for friends with an invite code.
- **Achievements** — Wins unlock Floss and the **VIPER** skin. 10 elims unlock Griddy. Island finds unlock cat/dog sidekicks.
- **Locker** — Skins, emotes, pets, finds from in-game loot, and achievements.
- **Tilted + Meteor** — VIPER's map: Tilted Towers with a giant meteor, 1 HP, exotics, secrets, spawn island on death. Mystery short slot for the upcoming secrets video.
- **Library** — two cabinets: 8-bit **VIPER DROP** and 3D **VIPER Royale**
- **VIPER DROP** — 8-bit Fortnite: battle bus, health + shields, loot, jump, POIs
- **VIPER Royale / Island Drop** — third-person Battle Royale with smooth (not blocky) Fortnite-style models: Peely, Master Chief armor, a detailed Battle Bus, sunny sky, storm, pickaxe/AR/pump, builds, 10 bots, original drop soundtrack, Victory Royale. Free 360° mouse look. Uses your equipped locker skin. This 3D match does **not** use the 8-bit VIPER cabinet look.
- **Squads** — Solo / Duo / Trio. Fill with bots or a local invite code (another tab on this PC). Couch P2 uses arrows + K
- **Knocked** — In duo/trio you get downed. A teammate standing on you for 5 seconds revives you
- **Campaign** — Chapter 1, eight drops. Unlock **Jonesy** at Tilted and **Peely** after The Cube
- **Bots** — Rivals shoot each other. Squad bots follow, fight, and revive
- **Fullscreen** — `FULL` in the nav, `FULLSCREEN` on the cabinet
- **Chief's locker** — Armory 117 plus campaign exclusives
- **Hall of Fame** — 3-letter arcade initials
- **Quest log** — Chapter 1 timeline

Royale: drag the lobby to look around, then **Drop in**. **WASD** move (relative to camera), mouse look 360°, **Space** jump / leave the bus, **1/2/3** weapons, click harvest/shoot, **Q** wall, **E/C** ramp, **Shift** sprint.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Three.js, Press Start 2P + VT323, SQLite (local/Vercel) + localStorage (GitHub Pages).
