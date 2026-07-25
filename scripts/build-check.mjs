import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { calculateCartTotals } from "../src/pricing.js";

const required = [
  "index.html",
  "api/health.js",
  "api/auth/login.js",
  "api/auth/recover.js",
  "api/auth/register.js",
  "api/admin/login.js",
  "api/admin/events.js",
  "api/admin/photos.js",
  "api/admin/schools.js",
  "api/admin/settings.js",
  "api/admin/storage.js",
  "lib/server/http.js",
  "lib/server/security.js",
  "lib/server/supabase.js",
  "src/app.js",
  "src/config.js",
  "src/mock-data.js",
  "src/pricing.js",
  "src/styles.css",
  "README.md",
];

for (const file of required) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const sample = Array.from({ length: 11 }, (_, index) => ({
  photoId: `test-${index}`,
  productType: "digital",
  printCopies: 1,
}));

if (calculateCartTotals(sample).total !== 385) {
  throw new Error("Pricing build check failed for 11 photos.");
}

execFileSync(process.execPath, ["--check", "src/app.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/health.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/auth/login.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/auth/recover.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/auth/register.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/admin/login.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/admin/events.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/admin/photos.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/admin/schools.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/admin/settings.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "api/admin/storage.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "lib/server/http.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "lib/server/security.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "lib/server/supabase.js"], { stdio: "inherit" });
console.log("Static build check passed.");
