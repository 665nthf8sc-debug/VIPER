import type { HighScore } from "@/lib/types";

const KEY = "tilted-arcade-rom";

const SEED: HighScore[] = [
  { id: 1, initials: "VIP", score: 12800, createdAt: "1985-10-01" },
  { id: 2, initials: "FOX", score: 9600, createdAt: "1985-10-01" },
  { id: 3, initials: "NES", score: 7400, createdAt: "1985-10-01" },
  { id: 4, initials: "MET", score: 5100, createdAt: "1985-10-01" },
  { id: 5, initials: "TIL", score: 3300, createdAt: "1985-10-01" },
];

function readLocal(): HighScore[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw) as HighScore[];
    return Array.isArray(parsed) ? parsed : SEED;
  } catch {
    return SEED;
  }
}

function writeLocal(scores: HighScore[]) {
  window.localStorage.setItem(KEY, JSON.stringify(scores.slice(0, 10)));
}

function rank(scores: HighScore[]) {
  return [...scores].sort((a, b) => b.score - a.score || a.id - b.id).slice(0, 10);
}

export async function loadHallOfFame(): Promise<HighScore[]> {
  try {
    const res = await fetch("/api/scores", { cache: "no-store" });
    if (!res.ok) throw new Error("offline");
    const data = (await res.json()) as { scores?: HighScore[] };
    if (Array.isArray(data.scores)) return data.scores;
  } catch {
    /* GitHub Pages has no API — use the arcade ROM in localStorage */
  }
  return rank(readLocal());
}

export async function saveHallOfFame(
  initials: string,
  score: number
): Promise<HighScore[]> {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initials, score }),
    });
    if (!res.ok) throw new Error("offline");
    const data = (await res.json()) as { scores?: HighScore[] };
    if (Array.isArray(data.scores)) return data.scores;
  } catch {
    /* fall through to local cabinet */
  }
  const next = rank([
    {
      id: Date.now(),
      initials,
      score,
      createdAt: new Date().toISOString(),
    },
    ...readLocal(),
  ]);
  writeLocal(next);
  return next;
}
