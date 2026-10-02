// Kör databasens SQL-migreringar: `npm run migrate` med DATABASE_URL satt.
// Migreringarna är numrerade filer i db/migrations/ (001_namn.sql …) och körs i nummerordning,
// var och en i en egen transaktion. Tabellen schema_migrations håller reda på vilka som har körts.
// En körd migrering får aldrig ändras. Ändringar görs i en ny fil.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const MIGRATIONS_DIR = fileURLToPath(new URL("../db/migrations/", import.meta.url));

// Godtyckligt men fast nummer för pg_advisory_lock, så att två samtidiga körningar inte krockar.
const LOCK_ID = 7_301_015;

/**
 * Kör de migreringar som inte har körts mot databasen som `client` är ansluten till.
 * @param {pg.ClientBase} client
 * @returns {Promise<string[]>} namnen på migreringarna som kördes nu
 */
export async function migrate(client, dir = MIGRATIONS_DIR) {
  const files = (await readdir(dir)).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
  const applied = [];
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const { rows } = await client.query("SELECT name FROM schema_migrations");
    const done = new Set(rows.map((r) => r.name));
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
      }
      applied.push(file);
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
  }
  return applied;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const applied = await migrate(client);
    console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database is up to date.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
