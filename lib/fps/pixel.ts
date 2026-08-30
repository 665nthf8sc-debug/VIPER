/** Draw ASCII pixel maps onto a canvas at high resolution. */
export function paintMap(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  px: number,
  ox = 0,
  oy = 0
) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === ".") continue;
      const color = palette[c];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * px, oy + y * px, px, px);
    }
  }
}

export function canvasFromMap(
  rows: string[],
  palette: Record<string, string>,
  px: number
) {
  const w = Math.max(...rows.map((r) => r.length)) * px;
  const h = rows.length * px;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  paintMap(ctx, rows, palette, px);
  return canvas;
}

export function shade(hex: string, amt: number) {
  const n = hex.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(n.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(n.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(n.slice(4, 6), 16) + amt));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
