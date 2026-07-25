import { createClient } from "@supabase/supabase-js";
import { hashAccessCode } from "../lib/server/security.js";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const schools = [
  {
    name: "Colegio Antares",
    slug: "colegio-antares",
    access_code_hash: hashAccessCode("ANTARES"),
    status: "active",
    contact_name: null,
  },
  {
    name: "Pedro de Gante",
    slug: "pedro-de-gante",
    access_code_hash: hashAccessCode("PEDROGANTE"),
    status: "active",
    contact_name: null,
  },
];

const { error } = await supabase.from("schools").upsert(schools, { onConflict: "slug" });

if (error) {
  const text = `${error.code || ""} ${error.message || ""}`.toLowerCase();
  if (text.includes("42p01") || text.includes("does not exist") || text.includes("schema cache")) {
    throw new Error("Supabase schema is not installed. Run supabase/migrations/0001_initial_schema.sql first.");
  }
  throw error;
}

console.log("Seeded provisional schools: Colegio Antares, Pedro de Gante.");
