import { NextResponse } from "next/server";

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
