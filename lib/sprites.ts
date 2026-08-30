export const FOX_A = [
  "......oooo......",
  ".....oWWWWo.....",
  "....oWWWWWWo....",
  "....oWbWWbWo....",
  "....oWWWWWWo....",
  ".....oWWWWo.....",
  "....oooooooo....",
  "...ooOOOOOOoo...",
  "..ooOOOOOOOOoo..",
  "..oOOOOOOOOOOo..",
  "..oOOOOOOOOOOo..",
  "...oOOOo.oOOo...",
  "...oOOo...oOOo..",
  "...oooo...oooo..",
  "....oo.....oo...",
  "....oo.....oo...",
];

export const FOX_B = [
  "......oooo......",
  ".....oWWWWo.....",
  "....oWWWWWWo....",
  "....oWbWWbWo....",
  "....oWWWWWWo....",
  ".....oWWWWo.....",
  "....oooooooo....",
  "...ooOOOOOOoo...",
  "..ooOOOOOOOOoo..",
  "..oOOOOOOOOOOo..",
  "..oOOOOOOOOOOo..",
  "...oOOOo.oOOo...",
  "....oOOo.oOOo...",
  "....oooo.oooo...",
  ".....oo...oo....",
  "....oo.....oo...",
];

export const CHIEF_A = [
  "......oooo......",
  ".....oGGGGo.....",
  "....oGGGGGGo....",
  "....oGVVVVGo....",
  "....oGVVVVGo....",
  ".....oGGGGo.....",
  "....oooooooo....",
  "...ooOOOOOOoo...",
  "..ooOOOOOOOOoo..",
  "..oOOOOOoOOOOo..",
  "..oOOOOOOOOOOo..",
  "...oOOOo.oOOo...",
  "...oOOo...oOOo..",
  "...oooo...oooo..",
  "....oo.....oo...",
  "....oo.....oo...",
];

export const CHIEF_B = [
  "......oooo......",
  ".....oGGGGo.....",
  "....oGGGGGGo....",
  "....oGVVVVGo....",
  "....oGVVVVGo....",
  ".....oGGGGo.....",
  "....oooooooo....",
  "...ooOOOOOOoo...",
  "..ooOOOOOOOOoo..",
  "..oOOOOOoOOOOo..",
  "..oOOOOOOOOOOo..",
  "...oOOOo.oOOo...",
  "....oOOo.oOOo...",
  "....oooo.oooo...",
  ".....oo...oo....",
  "....oo.....oo...",
];

export type SpriteKind = "fox" | "chief";

export function spriteRows(kind: SpriteKind, frame: number) {
  if (kind === "chief") return frame ? CHIEF_B : CHIEF_A;
  return frame ? FOX_B : FOX_A;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  flip = false,
  palette: Record<string, string>
) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const color = palette[row[i]];
      if (!color) continue;
      const px = flip ? x + (row.length - 1 - i) : x + i;
      ctx.fillStyle = color;
      ctx.fillRect(px, y + j, 1, 1);
    }
  }
}

export function drawGun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  flash: boolean
) {
  const gy = y + 9;
  const right = facing > 0;
  const gx = right ? x + 12 : x - 8;
  ctx.fillStyle = "#2a2a38";
  ctx.fillRect(gx, gy, 9, 3);
  ctx.fillRect(right ? gx : gx + 5, gy + 2, 3, 4);
  ctx.fillStyle = "#6a6a78";
  ctx.fillRect(gx + 1, gy + 1, 7, 1);
  if (flash) {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(right ? gx + 9 : gx - 3, gy, 4, 3);
    ctx.fillStyle = "#fff4c2";
    ctx.fillRect(right ? gx + 11 : gx - 4, gy + 1, 3, 1);
  }
}

export function drawBattleBus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(x + 8, y - 22, 30, 14);
  ctx.fillStyle = "#ff6a00";
  ctx.fillRect(x + 12, y - 18, 22, 6);
  ctx.fillStyle = "#f8f0d8";
  ctx.fillRect(x + 14, y - 8, 1, 10);
  ctx.fillRect(x + 30, y - 8, 1, 10);
  ctx.fillStyle = "#3d7cff";
  ctx.fillRect(x, y, 44, 16);
  ctx.fillStyle = "#1a2848";
  ctx.fillRect(x + 2, y + 2, 40, 4);
  ctx.fillStyle = "#9ad4ff";
  ctx.fillRect(x + 6, y + 7, 8, 5);
  ctx.fillRect(x + 18, y + 7, 8, 5);
  ctx.fillRect(x + 30, y + 7, 6, 5);
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(x + 40, y + 11, 6, 3);
  ctx.fillStyle = "#140008";
  ctx.fillRect(x + 4, y + 15, 6, 3);
  ctx.fillRect(x + 34, y + 15, 6, 3);
}
