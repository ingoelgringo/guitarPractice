import { isOwner } from "../../../../../lib/auth";
import { loadScore } from "../../../../../lib/library";
import { fileName, serialize } from "../../../../../lib/scoreFile";
import { notFound, unauthorized } from "../../responses";

/**
 * Partituret som Partiturfil att ladda ner. Filen är bara Partituret, utan id och revision, så
 * en återöppnad fil blir alltid ett nytt Partitur och skriver aldrig över originalet.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/library/[id]/file">) {
  if (!isOwner(request)) return unauthorized();
  const loaded = await loadScore((await ctx.params).id);
  if (!loaded) return notFound();
  const { score } = loaded;
  return new Response(serialize(score), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": contentDisposition(fileName(score)),
      "cache-control": "no-store",
    },
  });
}

/** Ett filnamn för nedladdning: ett enkelt ASCII-namn och det riktiga namnet enligt RFC 5987. */
function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  // encodeURIComponent lämnar ' ( ) * okodade, men RFC 5987 tillåter dem inte
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
