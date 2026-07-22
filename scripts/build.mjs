import fs from "node:fs";
import path from "node:path";
import "./build-check.mjs";

const outputDir = "public";
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of ["index.html", "src"]) {
  fs.cpSync(entry, path.join(outputDir, entry), { recursive: true });
}

fs.mkdirSync(path.join(outputDir, "assets"), { recursive: true });
for (const asset of fs.readdirSync("assets")) {
  if (asset === ".DS_Store") continue;
  fs.cpSync(path.join("assets", asset), path.join(outputDir, "assets", asset), { recursive: true });
}

console.log("Static output generated in public/.");
