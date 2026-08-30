# VIPER3384 DROP ZONE

An 8-bit NES-style Fortnite hub for **VIPER3384** (`@coolfox3384`). Ride the battle bus, farm a Battle Pass, jump bullets, walk POI to POI, and pull skins from Chief's locker.

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
- **VIPER TV** — CRT bezel around `@coolfox3384` videos. First watch of each tape banks **+50 Battle Pass XP**
- **Battle Pass** — eight skins, XP bar, equip from the track
- **VIPER DROP** — 8-bit Fortnite: battle bus, health + shields, loot, jump, POIs
- **Squads** — Solo / Duo / Trio. Fill with bots or a local invite code (another tab on this PC). Couch P2 uses arrows + K
- **Knocked** — In duo/trio you get downed. A teammate standing on you for 5 seconds revives you
- **Campaign** — Chapter 1, eight drops. Unlock **Jonesy** at Tilted and **Peely** after The Cube
- **Bots** — Rivals shoot each other. Squad bots follow, fight, and revive
- **Fullscreen** — `FULL` in the nav, `FULLSCREEN` on the cabinet
- **Chief's locker** — Armory 117 plus campaign exclusives
- **Hall of Fame** — 3-letter arcade initials
- **Quest log** — Chapter 1 timeline

Controls: **P1** A/D move, W/Space jump, Z/X shoot. **P2** arrows + K. **P3** J/L I M. Phone: **◀ JUMP FIRE ▶**.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Press Start 2P + VT323, SQLite (local/Vercel) + localStorage (GitHub Pages).
