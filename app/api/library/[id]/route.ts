import { NextResponse } from "next/server";
import { isOwner } from "../../../../lib/auth";
import { getScore, readDocument, saveScore } from "../../../../lib/library";
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
 * sparats någon annanstans sedan dess.
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/library/[id]">) {
  if (!isOwner(request)) return unauthorized();
  const body = await readJson(request);
  const revision = isRecord(body) ? body.revision : undefined;
  const score = isRecord(body) ? readDocument(body.document) : null;
  if (!score || typeof revision !== "number" || !Number.isInteger(revision)) {
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
