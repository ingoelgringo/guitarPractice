import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "../../../lib/auth";

/**
 * Loggar ut och skickar tillbaka till landningssidan, så att ett vanligt formulär räcker.
 * Adressen är relativ, eftersom appen bakom Nginx inte vet sajtens publika protokoll och värd.
 */
export async function POST() {
  const response = new NextResponse(null, { status: 303, headers: { Location: "/" } });
  response.cookies.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
