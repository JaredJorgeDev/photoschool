import { z } from "zod";
import { methodNotAllowed, readJsonBody, sendJson } from "../../lib/server/http.js";
import { createSupabaseAdminClient, hasSupabaseEnv, isMissingSchemaError } from "../../lib/server/supabase.js";
import { hashAccessCode, requireAdminRequest } from "../../lib/server/security.js";

const eventSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/),
  accessCode: z.string().trim().min(4).max(40),
  eventType: z.string().trim().min(2).max(60),
  eventDate: z.string().trim().min(8),
  publishAt: z.string().trim().min(8),
  expiresAt: z.string().trim().min(8),
  status: z.enum(["draft", "scheduled", "active"]).default("draft"),
  categories: z.array(z.string().trim().min(1)).optional().default([]),
  notes: z.string().trim().max(1000).optional().default(""),
});

function mapEvent(row) {
  return {
    id: row.id,
    school_id: row.school_id,
    schoolId: row.school_id,
    schoolName: row.schools?.name || "",
    name: row.name,
    slug: row.slug,
    access_code: row.access_code_hash ? "Configurado" : "",
    event_type: row.event_type,
    event_date: row.event_date,
    date: row.event_date,
    publication_mode: row.publication_mode,
    publish_at: row.publish_at,
    publishDate: row.publish_at?.slice(0, 10) || "",
    expires_at: row.expires_at,
    expiresAt: row.expires_at?.slice(0, 10) || "",
    status: row.status,
    public_visibility: row.public_visibility,
    files_available: row.files_available,
    categories: row.categories || [],
    notes: row.notes || "",
    gallery_id: row.galleries?.[0]?.id || null,
    estimatedStorageGb: Number(row.estimated_storage_gb || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export default async function handler(request, response) {
  if (!["GET", "POST", "DELETE"].includes(request.method)) return methodNotAllowed(request, response, ["GET", "POST", "DELETE"]);
  if (!hasSupabaseEnv()) {
    return sendJson(response, { ok: false, setupRequired: true, message: "Faltan variables privadas de Supabase." }, 503);
  }

  const supabase = createSupabaseAdminClient();

  if (!requireAdminRequest(request, response, sendJson)) return;

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("events")
      .select("*, schools(name), galleries(id)")
      .order("created_at", { ascending: false });
    if (error && isMissingSchemaError(error, "events")) return sendJson(response, { ok: false, setupRequired: true, message: "Falta ejecutar la migracion inicial." }, 409);
    if (error) return sendJson(response, { ok: false, error: error.message }, 500);
    return sendJson(response, { ok: true, events: data.map(mapEvent) });
  }

  if (request.method === "DELETE") {
    const body = await readJsonBody(request);
    const slug = String(body?.slug || "").trim();
    if (!slug) return sendJson(response, { ok: false, error: "Indica el slug del evento." }, 400);

    const { data: eventRow, error: findError } = await supabase
      .from("events")
      .select("id, slug, status")
      .eq("slug", slug)
      .single();
    if (findError) return sendJson(response, { ok: false, error: findError.message }, 404);

    const { count: orderCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventRow.id);
    const { data: galleries } = await supabase
      .from("galleries")
      .select("id")
      .eq("event_id", eventRow.id);
    const galleryIds = galleries?.map((gallery) => gallery.id) || [];
    const { count: photoCount } = galleryIds.length
      ? await supabase.from("photos").select("id", { count: "exact", head: true }).in("gallery_id", galleryIds)
      : { count: 0 };

    if (Number(orderCount || 0) > 0 || Number(photoCount || 0) > 0) {
      const { error: softError } = await supabase
        .from("events")
        .update({ status: "deleted", files_available: false, updated_at: new Date().toISOString() })
        .eq("id", eventRow.id);
      if (softError) return sendJson(response, { ok: false, error: softError.message }, 500);
      return sendJson(response, { ok: true, deleted: "soft", slug });
    }

    if (galleryIds.length) {
      const { error: galleryDeleteError } = await supabase.from("galleries").delete().in("id", galleryIds);
      if (galleryDeleteError) return sendJson(response, { ok: false, error: galleryDeleteError.message }, 500);
    }
    const { error: deleteError } = await supabase.from("events").delete().eq("id", eventRow.id);
    if (deleteError) return sendJson(response, { ok: false, error: deleteError.message }, 500);
    return sendJson(response, { ok: true, deleted: "hard", slug });
  }

  const body = await readJsonBody(request);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return sendJson(response, { ok: false, error: "Datos de evento no validos.", issues: parsed.error.issues }, 400);
  const input = parsed.data;
  const now = new Date().toISOString();
  const publicationMode = input.status === "scheduled" ? "scheduled" : input.status === "active" ? "immediate" : "draft";

  const payload = {
    school_id: input.schoolId,
    name: input.name,
    slug: input.slug,
    access_code_hash: hashAccessCode(input.accessCode),
    event_type: input.eventType,
    event_date: input.eventDate,
    publication_mode: publicationMode,
    publish_at: new Date(input.publishAt).toISOString(),
    expires_at: new Date(input.expiresAt).toISOString(),
    status: input.status,
    public_visibility: false,
    files_available: true,
    updated_at: now,
  };

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .upsert(payload, { onConflict: "slug" })
    .select("*, schools(name)")
    .single();
  if (eventError && isMissingSchemaError(eventError, "events")) return sendJson(response, { ok: false, setupRequired: true, message: "Falta ejecutar la migracion inicial." }, 409);
  if (eventError) return sendJson(response, { ok: false, error: eventError.message }, 500);

  const { data: galleryRow, error: galleryError } = await supabase
    .from("galleries")
    .upsert({
      school_id: eventRow.school_id,
      event_id: eventRow.id,
      type: "private",
      title: eventRow.name,
      slug: eventRow.slug,
      description: input.notes,
      category: input.eventType,
      status: eventRow.status,
      publish_at: eventRow.publish_at,
      expires_at: eventRow.expires_at,
      files_available: true,
      updated_at: now,
    }, { onConflict: "slug" })
    .select("id")
    .single();
  if (galleryError) return sendJson(response, { ok: false, error: galleryError.message }, 500);

  return sendJson(response, { ok: true, event: mapEvent({ ...eventRow, galleries: [{ id: galleryRow.id }] }) }, 201);
}
