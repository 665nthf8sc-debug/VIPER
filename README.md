# TILTED TOWERS MEMORIAL

An 8-bit NES-style nostalgia hub for **VIPER3384** (`@coolfox3384`). Dark purple CRT nights, orange meteors, Tilted Towers crumbling in pixel chunks, and a tiny arcade cabinet for high scores.

Meant to feel like a lost 1985 cartridge that somehow predicted Fortnite Chapter 1.

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

On Pages there is no Node server, so the hall of fame uses `localStorage`. Locally (and on Vercel) scores still go through `/api/scores` into SQLite.

## What's on the cart

- **Hero** — pixel title, blinking RPG prompt, live countdown to October 1, meteor sky
- **Tilted TV** — CRT bezel around `@coolfox3384` videos and a subscribe button
- **Meteor Strike** — dodge falling rocks while Tilted crumbles; GAME OVER reads `TILTED DESTROYED`
- **Hall of Fame** — 3-letter arcade initials
- **Quest log** — Chapter 1 timeline in RPG dialog boxes
- **Memory Pak** — before/after Tilted with a pixel wipe
- **Player 1** — 8-bit fox avatar and credits crawl

Touch: on phones, use the **LEFT / RIGHT** pads under the game.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Press Start 2P + VT323, SQLite (local/Vercel) + localStorage (GitHub Pages).
