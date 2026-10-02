import { NextResponse } from "next/server";
import { isOwner } from "../../../lib/auth";
import { createScore, listScores, readDocument } from "../../../lib/library";
import { readJson, unauthorized } from "./responses";

/** Bibliotekets lista: id, titel, artist, senast ändrad och revision. Bara för Ägaren. */
export async function GET(request: Request) {
  if (!isOwner(request)) return unauthorized();
  return NextResponse.json({ scores: await listScores() });
}

/** Lägger ett Partitur i Biblioteket. Tar Partiturfilen som JSON och svarar med id och revision 1. */
export async function POST(request: Request) {
  if (!isOwner(request)) return unauthorized();
  const score = readDocument(await readJson(request));
  if (!score) return NextResponse.json({ error: "The body is not a valid score file." }, { status: 400 });
  return NextResponse.json(await createScore(score), { status: 201 });
}
