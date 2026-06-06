/**
 * Applies supabase/migrations/*.sql using direct Postgres connection.
 * Requires in .env.local:
 *   SUPABASE_DB_PASSWORD=<Database password from Supabase Dashboard>
 * Optional override:
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@...
 */
import postgres from "postgres";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

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

const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
  /https:\/\/([^.]+)\.supabase\.co/,
)?.[1];

const password = process.env.SUPABASE_DB_PASSWORD;

const REGIONS = [
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "us-east-1",
  "us-west-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "sa-east-1",
];

const buildUrls = () => {
  if (process.env.DATABASE_URL) return [process.env.DATABASE_URL];
  if (!ref || !password) return [];
  const enc = encodeURIComponent(password);
  const urls = [];
  // Prefer Session pooler (IPv4-friendly); region from Supabase Connect UI
  for (const region of REGIONS) {
    for (const prefix of ["aws-1", "aws-0"]) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      urls.push(
        `postgresql://postgres.${ref}:${enc}@${host}:5432/postgres`,
        `postgresql://postgres.${ref}:${enc}@${host}:6543/postgres`,
      );
    }
  }
  return urls;
};

const candidateUrls = buildUrls();

if (candidateUrls.length === 0) {
  console.error(
    [
      "FAIL: DB 연결 정보가 없습니다.",
      ".env.local에 SUPABASE_DB_PASSWORD를 추가하세요.",
      "(Supabase Dashboard → Project Settings → Database → Database password)",
      "또는 DATABASE_URL 전체 연결 문자열을 넣을 수 있습니다.",
    ].join("\n"),
  );
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let lastError = null;

for (const databaseUrl of candidateUrls) {
  const host = databaseUrl.replace(/:([^:@/]+)@/, ":****@").split("@")[1]?.split("/")[0];
  const sql = postgres(databaseUrl, { ssl: "require", max: 1, connect_timeout: 8 });

  try {
    await sql`select 1 as ok`;
  } catch (e) {
    await sql.end({ timeout: 1 }).catch(() => {});
    continue;
  }

  console.log(`Connected via ${host}`);
  try {
    await sql.unsafe(`
      create table if not exists public.schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const initialFile = "20250602140000_initial_schema.sql";
    const [{ exists: profilesExists }] = await sql`
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'profiles'
      ) as exists
    `;
    if (profilesExists) {
      await sql`
        insert into public.schema_migrations (filename)
        values (${initialFile})
        on conflict (filename) do nothing
      `;
    }

    for (const file of files) {
      const applied = await sql`
        select 1 from public.schema_migrations where filename = ${file}
      `;
      if (applied.length > 0) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      const body = readFileSync(join(migrationsDir, file), "utf8");
      console.log(`Applying ${file}...`);
      await sql.unsafe(body);
      await sql`
        insert into public.schema_migrations (filename) values (${file})
      `;
      console.log(`  done: ${file}`);
    }
    try {
      await sql.unsafe("NOTIFY pgrst, 'reload schema'");
    } catch {
      /* optional */
    }
    await sql.end();
    console.log("\nOK: 마이그레이션 적용 완료 (API 스키마 캐시 리로드 요청)");
    process.exit(0);
  } catch (e) {
    lastError = e;
    await sql.end({ timeout: 1 }).catch(() => {});
    console.log(`  migration failed on ${host}: ${e.message}`);
  }
}

console.error(
  [
    "FAIL: DB에 연결하지 못했습니다.",
    "Supabase Dashboard → Connect → Session pooler(5432) URI를 복사해",
    ".env.local에 DATABASE_URL=... 로 넣고 다시 실행하세요.",
    lastError ? `마지막 오류: ${lastError.message}` : "",
  ]
    .filter(Boolean)
    .join("\n"),
);
process.exit(1);
