import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "../../../lib/auth";
import { withBasePath } from "../../../lib/basePath";

/**
 * Loggar ut och skickar tillbaka till Gitarrsidan, så att ett vanligt formulär räcker.
 * Adressen är relativ, eftersom appen bakom Nginx inte vet sajtens publika protokoll och värd.
 */
export async function POST() {
  const response = new NextResponse(null, { status: 303, headers: { Location: withBasePath("/") } });
  response.cookies.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  // Före /guitar hade cookien sökvägen /, och en sådan kan leva kvar i 180 dagar. Den rensas för
  // hand, eftersom response.cookies bara håller en cookie per namn.
  response.headers.append("set-cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return response;
}
