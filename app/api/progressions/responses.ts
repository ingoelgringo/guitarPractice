import { NextResponse } from "next/server";

export { expectedRevision, readJson, unauthorized } from "../library/responses";

export function notFound() {
  return NextResponse.json({ error: "There is no such chord progression in the library." }, { status: 404 });
}
