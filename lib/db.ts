import pg from "pg";

/**
 * Anslutningen till databasen (`DATABASE_URL`). Poolen skapas vid första anropet och delas av
 * alla anrop i processen.
 */

let pool: pg.Pool | null = null;

/** Poolen mot databasen. Kastar fel om `DATABASE_URL` saknas. */
export function db(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set.");
    // Liten pool: det finns en enda Ägare, och servern delas med andra appar.
    pool = new pg.Pool({ connectionString, max: 5 });
  }
  return pool;
}

/** Stänger poolen, t.ex. när testerna är klara. */
export async function closeDb(): Promise<void> {
  const current = pool;
  pool = null;
  await current?.end();
}
