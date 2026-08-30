import { insertScore, listTopScores } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INITIALS = /^[A-Z]{3}$/;
const MAX_SCORE = 999999;

export async function GET() {
  try {
    const scores = listTopScores(10);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "HALL OF FAME OFFLINE" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      initials?: unknown;
      score?: unknown;
    };
    const initials =
      typeof body.initials === "string"
        ? body.initials.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3)
        : "";
    const score =
      typeof body.score === "number" ? Math.floor(body.score) : NaN;

    if (!INITIALS.test(initials)) {
      return NextResponse.json(
        { error: "ENTER 3 LETTERS" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
      return NextResponse.json({ error: "BAD SCORE" }, { status: 400 });
    }

    insertScore(initials, score);
    const scores = listTopScores(10);
    return NextResponse.json({ ok: true, scores });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "COULD NOT SAVE SCORE" },
      { status: 500 }
    );
  }
}
