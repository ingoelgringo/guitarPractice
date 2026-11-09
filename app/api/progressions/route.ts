import { NextResponse } from "next/server";
import { isOwner } from "../../../lib/auth";
import { createProgression, listProgressions, readName, readProgressionDocument } from "../../../lib/progressionLibrary";
import { isRecord } from "../../../lib/scoreFile";
import { readJson, unauthorized } from "./responses";

/** Listan med Ackordföljder i Biblioteket: id, namn, senast ändrad och revision. Bara för Ägaren. */
export async function GET(request: Request) {
  if (!isOwner(request)) return unauthorized();
  return NextResponse.json({ progressions: await listProgressions() });
}

/** Lägger en Ackordföljd i Biblioteket. Tar `{ name, document }` och svarar med id, namn och revision 1. */
export async function POST(request: Request) {
  if (!isOwner(request)) return unauthorized();
  const body = await readJson(request);
  const name = isRecord(body) ? readName(body.name) : null;
  const progression = isRecord(body) ? readProgressionDocument(body.document) : null;
  if (!name || !progression) {
    return NextResponse.json({ error: "The body must have a name and a valid chord progression." }, { status: 400 });
  }
  return NextResponse.json(await createProgression(name, progression), { status: 201 });
}
