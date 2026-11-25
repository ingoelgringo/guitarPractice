import { tunerManifest } from "@/lib/tunerManifest";

// Manifestet ändras bara med en ny release, så det byggs en gång.
export const dynamic = "force-static";

/** Stämmarens manifest. Se lib/tunerManifest.ts. */
export function GET() {
  return new Response(JSON.stringify(tunerManifest()), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
