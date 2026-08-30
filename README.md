# TILTED TOWERS MEMORIAL

An 8-bit NES-style nostalgia hub for **VIPER3384** (`@coolfox3384`). Dark purple CRT nights, orange meteors, Tilted Towers crumbling in pixel chunks, and a tiny arcade cabinet that stores high scores in SQLite.

This is meant to feel like a lost 1985 cartridge that somehow predicted Fortnite Chapter 1.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43180](http://127.0.0.1:43180).

Production:

```bash
npm run build
npm start
```

## What's on the cart

- **Hero** — pixel title, blinking RPG prompt, live countdown to October 1, meteor sky
- **Tilted TV** — CRT bezel around the latest `@coolfox3384` videos and a subscribe button
- **Meteor Strike** — dodge falling rocks while Tilted crumbles; GAME OVER reads `TILTED DESTROYED`
- **Hall of Fame** — 3-letter arcade initials saved to a local SQLite database (`data/scores.db`)
- **Quest log** — Chapter 1 timeline in RPG dialog boxes
- **Memory Pak** — before/after Tilted with a pixel wipe
- **Player 1** — 8-bit fox avatar and credits crawl

Touch: on phones, use the **LEFT / RIGHT** pads under the game.

## High scores

`GET` / `POST` `/api/scores` talks to Node's built-in SQLite (`node:sqlite`). First boot seeds a short hall of fame. Local scores live in `data/scores.db` (ignored by git). On Vercel the file is written to `/tmp`, so scores reset between instances unless you point it at a real hosted database.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Press Start 2P + VT323, SQLite.
