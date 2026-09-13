# VIPER3384 ARCADE

A walkable Paper Mario-style 2.5D arcade for **VIPER3384**. This is not a scrolling website — you enter the building, walk the floor, and jack into cabinets.

GitHub: [665nthf8sc-debug/VIPER](https://github.com/665nthf8sc-debug/VIPER)  
Pages: [https://665nthf8sc-debug.github.io/VIPER/](https://665nthf8sc-debug.github.io/VIPER/)

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43180](http://127.0.0.1:43180).

## Controls

- **WASD / arrows** — walk the arcade (A/D along the floor, W/S a little depth)
- **E / Space** — interact (insert coin, keypad, terminals)
- **B** — dance emote
- **Esc** — close menus / leave a cabinet
- Mobile: on-screen D-pad + E/B

## Cabinets

1. **VIPER DROP** — 12-player battle royale (neon reskin of the cart)
2. **VIPER FPS** — Wolfenstein-style raycast, 3 levels + bosses
3. **VIPER CROSSING** — Frogger across Tilted traffic
4. **VIPER SNAKE** — llamas + closing storm
5. **VIPER DEFENDER** — Storm King invaders

Three more cabinets sit under caution tape (pinball, racing, fighting).

## Codes

Walk to the cyan keypad on the back wall. Try `BANK`, `GRIND`, `SUNSET`, `STEEL`, or **`3384`** for the sliding-wall admin room.

## Accounts

Register on the boot screen (stored locally, password hashed). GitHub Pages has no server, so progress also exports as a `VIPER3384.` save code. Friend invite links encode your equipped skin as an NPC visitor.

Tickets drop from arcade scores. The prize counter (old battle pass) redeems skins, emotes, and pets.

## Stack

Next.js, TypeScript, Tailwind, canvas minigames, localStorage (+ SQLite scores when not on Pages).
