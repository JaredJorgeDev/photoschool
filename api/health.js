import { methodNotAllowed, sendJson } from "../lib/server/http.js";
import { publicBackendConfig } from "../lib/server/supabase.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    return methodNotAllowed(request, response, ["GET"]);
  }

  const config = publicBackendConfig();
  return sendJson(response, {
    ok: true,
    service: "photoschool-backend",
    supabaseConfigured: config.configured,
    timezone: config.timezone,
    galleryValidityMonths: config.galleryValidityMonths,
    downloadValidityDays: config.downloadValidityDays,
  });
}
