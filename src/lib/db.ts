import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as {
  __soukdzPg?: Pool;
  __soukdzSchema?: Promise<void>;
};

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.PGHOST ||
      process.env.POSTGRES_HOST
  );
}

function buildPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? undefined;
  const isLocal =
    (connectionString?.includes("localhost") ?? false) ||
    (connectionString?.includes("127.0.0.1") ?? false) ||
    process.env.PGSSL === "0";
  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
}

function getPool(): Pool {
  if (globalForDb.__soukdzPg) return globalForDb.__soukdzPg;
  if (!isDbConfigured()) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL (or PGHOST/PGUSER/PGPASSWORD/PGDATABASE) in your environment."
    );
  }
  globalForDb.__soukdzPg = buildPool();
  return globalForDb.__soukdzPg;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export function ensureSchema(): Promise<void> {
  if (!isDbConfigured()) return Promise.resolve();
  if (globalForDb.__soukdzSchema) return globalForDb.__soukdzSchema;
  globalForDb.__soukdzSchema = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL DEFAULT '',
        account_type TEXT NOT NULL DEFAULT 'user',
        lang TEXT NOT NULL DEFAULT 'fr',
        created_at TIMESTAMPTZ NOT NULL,
        hash TEXT NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ
      );
    `);
  })();
  return globalForDb.__soukdzSchema;
}

export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}