import { methodNotAllowed, sendJson } from "../../lib/server/http.js";
import { createSupabaseAdminClient, hasSupabaseEnv } from "../../lib/server/supabase.js";
import { requireAdminRequest } from "../../lib/server/security.js";

const requiredBuckets = [
  "photo-originals",
  "photo-protected",
  "photo-thumbnails",
  "photo-downloads",
];

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) return methodNotAllowed(request, response, ["GET", "POST"]);
  if (!hasSupabaseEnv()) return sendJson(response, { ok: false, setupRequired: true, message: "Faltan variables privadas de Supabase." }, 503);
  if (!requireAdminRequest(request, response, sendJson)) return;

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) return sendJson(response, { ok: false, error: listError.message }, 500);
  const existingNames = new Set(existing.map((bucket) => bucket.name));

  if (request.method === "GET") {
    return sendJson(response, {
      ok: true,
      buckets: requiredBuckets.map((name) => ({ name, ready: existingNames.has(name) })),
    });
  }

  const created = [];
  for (const name of requiredBuckets) {
    if (existingNames.has(name)) continue;
    const { error } = await supabase.storage.createBucket(name, {
      public: false,
      fileSizeLimit: 12 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error) return sendJson(response, { ok: false, error: error.message, bucket: name }, 500);
    created.push(name);
  }

  return sendJson(response, {
    ok: true,
    created,
    buckets: requiredBuckets.map((name) => ({ name, ready: true })),
  });
}
