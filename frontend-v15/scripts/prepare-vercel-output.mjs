import { cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const outputDir = join(root, ".vercel", "output");
const staticDir = join(outputDir, "static");

const collectApiHandlers = (dir, base = dir) => {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "lib") return [];
      return collectApiHandlers(full, base);
    }
    if (entry.endsWith(".mjs")) {
      return [relative(base, full).replace(/\\/g, "/")];
    }
    return [];
  });
};

const writeFunction = async (handlerPath) => {
  const routePath = handlerPath.replace(/\.mjs$/, "");
  const funcDir = join(outputDir, "functions", "api", `${routePath}.func`);
  mkdirSync(funcDir, { recursive: true });

  await build({
    entryPoints: [join(root, "api", handlerPath)],
    outfile: join(funcDir, "index.mjs"),
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    packages: "bundle",
  });

  writeFileSync(
    join(funcDir, ".vc-config.json"),
    JSON.stringify(
      {
        runtime: "nodejs22.x",
        handler: "index.mjs",
        launcherType: "Nodejs",
        shouldAddHelpers: true,
      },
      null,
      2,
    ),
  );

  return `/api/${routePath}`;
};

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(staticDir, { recursive: true });
cpSync(join(root, "dist"), staticDir, { recursive: true });

const apiRoot = join(root, "api");
const apiRoutes = [];
if (statSync(apiRoot).isDirectory()) {
  for (const handler of collectApiHandlers(apiRoot)) {
    apiRoutes.push(await writeFunction(handler));
  }
}

writeFileSync(
  join(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        ...apiRoutes.map((src) => ({ src, dest: src })),
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log(`Prepared .vercel/output — static + ${apiRoutes.length} API functions`);
