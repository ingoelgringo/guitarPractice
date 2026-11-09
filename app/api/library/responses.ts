import { NextResponse } from "next/server";
import type { ExpectedRevision } from "../../../lib/library";

/** Svaret på ett anrop till Biblioteket utan Ägarens session. */
export function unauthorized() {
  return NextResponse.json({ error: "Log in to use the library." }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "There is no such score in the library." }, { status: 404 });
}

/** Anropets JSON, eller undefined när det inte är JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Revisionen i en sparning, "overwrite" för Skriv över, eller null när ingen giltig revision finns. */
export function expectedRevision(body: Record<string, unknown>): ExpectedRevision | null {
  if (body.overwrite === true) return "overwrite";
  return typeof body.revision === "number" && Number.isInteger(body.revision) ? body.revision : null;
}
