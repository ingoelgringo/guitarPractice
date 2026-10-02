import { NextResponse } from "next/server";
import { isOwner } from "../../../../../lib/auth";
import { duplicateScore } from "../../../../../lib/library";
import { notFound, unauthorized } from "../../responses";

/** Lägger en kopia av Partituret i Biblioteket. Svarar med kopians id och revision 1. */
export async function POST(request: Request, ctx: RouteContext<"/api/library/[id]/duplicate">) {
  if (!isOwner(request)) return unauthorized();
  const copy = await duplicateScore((await ctx.params).id);
  if (!copy) return notFound();
  return NextResponse.json(copy, { status: 201 });
}
