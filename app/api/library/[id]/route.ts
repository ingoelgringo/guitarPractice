import { NextResponse } from "next/server";
import { isOwner } from "../../../../lib/auth";
import { getScore, readDocument, saveScore, type ExpectedRevision } from "../../../../lib/library";
import { isRecord } from "../../../../lib/scoreFile";
import { notFound, readJson, unauthorized } from "../responses";

/** Ett Partitur i Biblioteket: id, revision, senast ändrad och dokumentet (Partiturfilen). */
export async function GET(request: Request, ctx: RouteContext<"/api/library/[id]">) {
  if (!isOwner(request)) return unauthorized();
  const score = await getScore((await ctx.params).id);
  if (!score) return notFound();
  return NextResponse.json(score);
}

/**
 * Sparar ett Partitur. Tar `{ document, revision }`, där revisionen är den som klienten senast
 * kände till. Svarar med den nya revisionen, eller 409 med serverns revision om Partituret har
 * sparats någon annanstans sedan dess. Med `{ document, overwrite: true }` sparas det oavsett
 * revision (Skriv över).
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/library/[id]">) {
  if (!isOwner(request)) return unauthorized();
  const body = await readJson(request);
  const revision = isRecord(body) ? expectedRevision(body) : null;
  const score = isRecord(body) ? readDocument(body.document) : null;
  if (!score || revision === null) {
    return NextResponse.json({ error: "The body must have a valid score file and a revision." }, { status: 400 });
  }

  const result = await saveScore((await ctx.params).id, score, revision);
  if (result.ok) return NextResponse.json({ revision: result.revision });
  if (result.reason === "notFound") return notFound();
  return NextResponse.json(
    { error: "The score has been changed somewhere else.", revision: result.revision },
    { status: 409 },
  );
}

/** Revisionen i anropet, "overwrite" för Skriv över, eller null när ingen giltig revision finns. */
function expectedRevision(body: Record<string, unknown>): ExpectedRevision | null {
  if (body.overwrite === true) return "overwrite";
  return typeof body.revision === "number" && Number.isInteger(body.revision) ? body.revision : null;
}
