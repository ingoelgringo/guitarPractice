import { NextResponse } from "next/server";
import { isOwner } from "../../../../lib/auth";
import {
  deleteProgression,
  getProgression,
  readName,
  readProgressionDocument,
  renameProgression,
  saveProgression,
} from "../../../../lib/progressionLibrary";
import { isRecord } from "../../../../lib/scoreFile";
import { expectedRevision, notFound, readJson, unauthorized } from "../responses";

/** En Ackordföljd i Biblioteket: id, namn, revision, senast ändrad och dokumentet. */
export async function GET(request: Request, ctx: RouteContext<"/api/progressions/[id]">) {
  if (!isOwner(request)) return unauthorized();
  const stored = await getProgression((await ctx.params).id);
  if (!stored) return notFound();
  return NextResponse.json(stored);
}

/**
 * Sparar en Ackordföljd. Tar `{ document, revision }`, där revisionen är den som klienten senast
 * kände till, och svarar med den nya revisionen, eller 409 med serverns revision vid en Konflikt.
 * Med `{ document, overwrite: true }` sparas den oavsett revision (Skriv över).
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/progressions/[id]">) {
  if (!isOwner(request)) return unauthorized();
  const body = await readJson(request);
  const revision = isRecord(body) ? expectedRevision(body) : null;
  const progression = isRecord(body) ? readProgressionDocument(body.document) : null;
  if (!progression || revision === null) {
    return NextResponse.json({ error: "The body must have a valid chord progression and a revision." }, { status: 400 });
  }

  const result = await saveProgression((await ctx.params).id, progression, revision);
  if (result.ok) return NextResponse.json({ revision: result.revision });
  if (result.reason === "notFound") return notFound();
  return NextResponse.json(
    { error: "The chord progression has been changed somewhere else.", revision: result.revision },
    { status: 409 },
  );
}

/** Byter namn på Ackordföljden. Tar `{ name }`. Revisionen ändras inte. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/progressions/[id]">) {
  if (!isOwner(request)) return unauthorized();
  const body = await readJson(request);
  const name = isRecord(body) ? readName(body.name) : null;
  if (!name) return NextResponse.json({ error: "The body must have a name." }, { status: 400 });
  if (!(await renameProgression((await ctx.params).id, name))) return notFound();
  return new Response(null, { status: 204 });
}

/** Tar bort Ackordföljden ur Biblioteket. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/progressions/[id]">) {
  if (!isOwner(request)) return unauthorized();
  if (!(await deleteProgression((await ctx.params).id))) return notFound();
  return new Response(null, { status: 204 });
}
