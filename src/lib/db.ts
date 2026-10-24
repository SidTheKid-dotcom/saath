import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

/** Postgres 42703: a column the query names does not exist yet (migration not run). */
export function isUndefinedColumn(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "42703";
}
