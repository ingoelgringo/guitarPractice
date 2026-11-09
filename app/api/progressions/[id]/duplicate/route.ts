import { NextResponse } from "next/server";
import { isOwner } from "../../../../../lib/auth";
import { duplicateProgression } from "../../../../../lib/progressionLibrary";
import { notFound, unauthorized } from "../../responses";

/** Lägger en kopia av Ackordföljden i Biblioteket. Svarar med kopians id, namn och revision 1. */
export async function POST(request: Request, ctx: RouteContext<"/api/progressions/[id]/duplicate">) {
  if (!isOwner(request)) return unauthorized();
  const copy = await duplicateProgression((await ctx.params).id);
  if (!copy) return notFound();
  return NextResponse.json(copy, { status: 201 });
}
