import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const dir = join(process.cwd(), "sql");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const text = readFileSync(join(dir, file), "utf8");
    const statements = text.split(";").map((s) => s.trim()).filter(Boolean);
    for (const statement of statements) await sql.query(statement);
    console.log(`applied ${file} (${statements.length} statements)`);
  }
}

main().catch((error) => {
  console.error("migrate failed:", error instanceof Error ? error.message : "unknown error");
  process.exit(1);
});
