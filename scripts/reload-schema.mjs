import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

const loadEnv = () => {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
  }
};
loadEnv();

const ref = "yhpvaehpzajgaaytwkye";
const enc = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD ?? "");
const url = `postgresql://postgres.${ref}:${enc}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres`;
const sql = postgres(url, { ssl: "require", max: 1 });
await sql.unsafe("NOTIFY pgrst, 'reload schema'");
console.log("PostgREST schema reload requested");
await sql.end();
