import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputDir = join(root, ".vercel", "output");
const staticDir = join(outputDir, "static");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(staticDir, { recursive: true });
cpSync(join(root, "dist"), staticDir, { recursive: true });

writeFileSync(
  join(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log("Prepared .vercel/output from dist/");
