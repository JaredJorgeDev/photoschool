import Busboy from "busboy";
import { methodNotAllowed, sendJson } from "../../lib/server/http.js";
import { createSupabaseAdminClient, hasSupabaseEnv, isMissingSchemaError } from "../../lib/server/supabase.js";
import { requireAdminRequest } from "../../lib/server/security.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseMultipart(request) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = [];
    const busboy = Busboy({ headers: request.headers, limits: { fileSize: 12 * 1024 * 1024, files: 80 } });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });
    busboy.on("file", (name, file, info) => {
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("limit", () => reject(new Error(`El archivo ${info.filename} excede el limite permitido.`)));
      file.on("end", () => {
        files.push({
          field: name,
          filename: info.filename,
          mimeType: info.mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });
    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ fields, files }));
    request.pipe(busboy);
  });
}

function mapPhoto(row, signedUrl = "") {
  return {
    id: row.id,
    eventId: row.galleries?.event_id || row.event_id || "",
    event_id: row.galleries?.event_id || row.event_id || "",
    galleryId: row.gallery_id,
    gallery_id: row.gallery_id,
    identifier: row.identifier,
    title: row.identifier,
    category: row.category || "",
    published: row.status === "published",
    status: row.status,
    watermarkStatus: row.watermark_status,
    imageUrl: signedUrl,
    variants: {
      thumbnail: signedUrl,
      protectedView: signedUrl,
      originalPrivate: row.original_path,
    },
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function signPhotoUrls(supabase, rows) {
  return Promise.all(rows.map(async (row) => {
    if (!row.protected_view_path) return mapPhoto(row);
    const { data } = await supabase.storage.from("photo-protected").createSignedUrl(row.protected_view_path, 60 * 60);
    return mapPhoto(row, data?.signedUrl || "");
  }));
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) return methodNotAllowed(request, response, ["GET", "POST"]);
  if (!hasSupabaseEnv()) return sendJson(response, { ok: false, setupRequired: true, message: "Faltan variables privadas de Supabase." }, 503);

  const supabase = createSupabaseAdminClient();

  if (!requireAdminRequest(request, response, sendJson)) return;

  if (request.method === "GET") {
    const galleryId = new URL(request.url, "https://photoschool.local").searchParams.get("galleryId");
    let query = supabase
      .from("photos")
      .select("*, galleries(event_id)")
      .order("created_at", { ascending: false });
    if (galleryId) query = query.eq("gallery_id", galleryId);
    const { data, error } = await query;
    if (error && isMissingSchemaError(error, "photos")) return sendJson(response, { ok: false, setupRequired: true, message: "Falta ejecutar la migracion inicial." }, 409);
    if (error) return sendJson(response, { ok: false, error: error.message }, 500);
    return sendJson(response, { ok: true, photos: await signPhotoUrls(supabase, data) });
  }

  let parsed;
  try {
    parsed = await parseMultipart(request);
  } catch (error) {
    return sendJson(response, { ok: false, error: error.message || "No se pudo leer la carga." }, 400);
  }

  const galleryId = parsed.fields.galleryId;
  const category = parsed.fields.category || "General";
  if (!galleryId || !parsed.files.length) return sendJson(response, { ok: false, error: "Selecciona una galeria y al menos una fotografia." }, 400);

  const { data: gallery, error: galleryError } = await supabase
    .from("galleries")
    .select("id, slug, event_id")
    .eq("id", galleryId)
    .single();
  if (galleryError) return sendJson(response, { ok: false, error: galleryError.message }, 400);

  const { count } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("gallery_id", galleryId);

  const inserted = [];
  for (const [index, file] of parsed.files.entries()) {
    if (!/^image\//.test(file.mimeType)) continue;
    const extension = file.filename.split(".").pop()?.toLowerCase() || "jpg";
    const sequence = Number(count || 0) + index + 1;
    const identifier = `${gallery.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}-${String(sequence).padStart(4, "0")}`;
    const path = `${gallery.slug}/${identifier}.${extension}`;

    const upload = await supabase.storage.from("photo-protected").upload(path, file.buffer, {
      contentType: file.mimeType,
      upsert: true,
    });
    if (upload.error) return sendJson(response, { ok: false, error: upload.error.message }, 500);

    const { data: photo, error: photoError } = await supabase
      .from("photos")
      .insert({
        gallery_id: galleryId,
        identifier,
        category,
        status: "published",
        original_path: null,
        protected_view_path: path,
        thumbnail_path: path,
        watermark_status: "pendiente",
        metadata: { original_filename: file.filename, uploaded_from_cms: true },
      })
      .select("*, galleries(event_id)")
      .single();
    if (photoError) return sendJson(response, { ok: false, error: photoError.message }, 500);
    inserted.push(photo);
  }

  const photos = await signPhotoUrls(supabase, inserted);
  return sendJson(response, { ok: true, photos }, 201);
}
