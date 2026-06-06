import { readFileSync, existsSync } from "node:fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("GEMINI_API_KEY missing");
  process.exit(1);
}

console.log("key prefix:", key.slice(0, 6) + "...");
const genAI = new GoogleGenerativeAI(key);
const models = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash",
];

for (const model of models) {
  try {
    const m = genAI.getGenerativeModel({
      model,
      generationConfig: { responseMimeType: "application/json" },
    });
    const r = await m.generateContent('Return JSON: {"ok":true}');
    console.log(model, "OK", r.response.text().slice(0, 100));
    process.exit(0);
  } catch (e) {
    console.log(model, "FAIL");
    console.log(" ", e?.message ?? e);
  }
}
process.exit(1);
