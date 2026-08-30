import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { HighScore } from "@/lib/types";
import "server-only";

export type { HighScore };

type GlobalDb = typeof globalThis & {
  tiltedScoreDb?: DatabaseSync;
};

const SEED: Array<{ initials: string; score: number }> = [
  { initials: "VIP", score: 12800 },
  { initials: "FOX", score: 9600 },
  { initials: "NES", score: 7400 },
  { initials: "MET", score: 5100 },
  { initials: "TIL", score: 3300 },
];

function resolveDbPath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "tilted-scores.db");
  }
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "scores.db");
}

function getDb() {
  const g = globalThis as GlobalDb;
  if (g.tiltedScoreDb) return g.tiltedScoreDb;

  const db = new DatabaseSync(resolveDbPath());
  db.exec(`
    CREATE TABLE IF NOT EXISTS high_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      initials TEXT NOT NULL CHECK (length(initials) = 3),
      score INTEGER NOT NULL CHECK (score >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores (score DESC, created_at ASC);
  `);

  const count = db.prepare("SELECT COUNT(*) AS n FROM high_scores").get() as {
    n: number;
  };
  if (count.n === 0) {
    const insert = db.prepare(
      "INSERT INTO high_scores (initials, score) VALUES (?, ?)"
    );
    for (const row of SEED) {
      insert.run(row.initials, row.score);
    }
  }

  g.tiltedScoreDb = db;
  return db;
}

export function listTopScores(limit = 10): HighScore[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, initials, score, created_at AS createdAt
       FROM high_scores
       ORDER BY score DESC, created_at ASC
       LIMIT ?`
    )
    .all(Math.min(Math.max(limit, 1), 25)) as Array<{
    id: number;
    initials: string;
    score: number;
    createdAt: string;
  }>;
  return rows;
}

export function insertScore(initials: string, score: number): HighScore {
  const db = getDb();
  const result = db
    .prepare("INSERT INTO high_scores (initials, score) VALUES (?, ?)")
    .run(initials, score);
  const row = db
    .prepare(
      `SELECT id, initials, score, created_at AS createdAt
       FROM high_scores WHERE id = ?`
    )
    .get(Number(result.lastInsertRowid)) as HighScore;
  return row;
}

export function isTopScore(score: number, cutoff = 10) {
  const top = listTopScores(cutoff);
  if (top.length < cutoff) return true;
  return score > (top[top.length - 1]?.score ?? 0);
}
