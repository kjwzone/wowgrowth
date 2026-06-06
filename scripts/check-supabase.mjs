import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const loadEnv = () => {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
};

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 필요");
  process.exit(1);
}

const anon = createClient(url, anonKey);
const admin = serviceKey ? createClient(url, serviceKey) : null;

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: anonKey },
});
console.log(`auth health: ${health.status}`);

if (!admin) {
  console.log("SKIP: service role 없음 — 테이블 확인 생략");
  process.exit(health.ok ? 0 : 1);
}

const tables = [
  "profiles",
  "companies",
  "support_programs",
  "program_metadata",
  "matching_results",
  "ai_jobs",
  "diagnosis_reports",
  "business_plan_drafts",
];

let missing = [];
for (const table of tables) {
  const { error } = await admin.from(table).select("*").limit(1);
  const schemaCacheStale = error?.code === "PGRST205" || error?.message?.includes("schema cache");
  const notFound =
    error?.code === "42P01" ||
    error?.message?.includes("does not exist");
  if (schemaCacheStale) {
    console.log(`  ${table}: schema cache stale (테이블은 있을 수 있음)`);
  } else if (notFound) {
    missing.push(table);
    console.log(`  ${table}: MISSING`);
  } else if (error) {
    console.log(`  ${table}: ${error.message}`);
  } else {
    console.log(`  ${table}: OK`);
  }
}

if (missing.length > 0) {
  console.log("\nMISSING TABLES:", missing.join(", "));
  console.log("→ npm run db:migrate (SUPABASE_DB_PASSWORD 필요)");
  console.log(
    "  또는 SQL Editor:",
    `https://supabase.com/dashboard/project/${url.match(/https:\/\/([^.]+)/)?.[1]}/sql/new`,
  );
  process.exit(2);
}

console.log("\nOK: Supabase 연결 및 핵심 테이블 확인 완료");
process.exit(0);
