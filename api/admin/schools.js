import { z } from "zod";
import { methodNotAllowed, readJsonBody, sendJson } from "../../lib/server/http.js";
import { createSupabaseAdminClient, hasSupabaseEnv, isMissingSchemaError } from "../../lib/server/supabase.js";
import { hashAccessCode, requireAdminRequest } from "../../lib/server/security.js";

const schoolSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  accessCode: z.string().trim().min(4).max(40),
  status: z.enum(["active", "inactive"]).default("active"),
  logoPath: z.string().trim().max(300).optional().nullable(),
  coverImagePath: z.string().trim().max(300).optional().nullable(),
  contactName: z.string().trim().max(140).optional().nullable(),
});

function mapSchool(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    logoPath: row.logo_path,
    coverImagePath: row.cover_image_path,
    contactName: row.contact_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) return methodNotAllowed(request, response, ["GET", "POST"]);

  if (!hasSupabaseEnv()) {
    return sendJson(response, {
      ok: false,
      setupRequired: true,
      message: "Faltan variables privadas de Supabase para administrar escuelas.",
    }, 503);
  }

  const supabase = createSupabaseAdminClient();

  if (!requireAdminRequest(request, response, sendJson)) return;

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("schools")
      .select("id,name,slug,status,logo_path,cover_image_path,contact_name,created_at,updated_at")
      .order("name", { ascending: true });

    if (error && isMissingSchemaError(error, "schools")) {
      return sendJson(response, {
        ok: false,
        setupRequired: true,
        message: "Supabase esta conectado, pero falta ejecutar la migracion inicial.",
      }, 409);
    }
    if (error) return sendJson(response, { ok: false, error: error.message }, 500);
    return sendJson(response, { ok: true, schools: data.map(mapSchool) });
  }

  const body = await readJsonBody(request);
  const parsed = schoolSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(response, { ok: false, error: "Datos de escuela no validos.", issues: parsed.error.issues }, 400);
  }

  const input = parsed.data;
  const payload = {
    name: input.name,
    slug: input.slug,
    access_code_hash: hashAccessCode(input.accessCode),
    status: input.status,
    logo_path: input.logoPath || null,
    cover_image_path: input.coverImagePath || null,
    contact_name: input.contactName || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("schools")
    .upsert(payload, { onConflict: "slug" })
    .select("id,name,slug,status,logo_path,cover_image_path,contact_name,created_at,updated_at")
    .single();

  if (error && isMissingSchemaError(error, "schools")) {
    return sendJson(response, {
      ok: false,
      setupRequired: true,
      message: "Supabase esta conectado, pero falta ejecutar la migracion inicial.",
    }, 409);
  }
  if (error) return sendJson(response, { ok: false, error: error.message }, 500);

  return sendJson(response, { ok: true, school: mapSchool(data) }, 201);
}
