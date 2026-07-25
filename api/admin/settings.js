import { z } from "zod";
import { methodNotAllowed, readJsonBody, sendJson } from "../../lib/server/http.js";
import { createSupabaseAdminClient, hasSupabaseEnv, isMissingSchemaError, publicBackendConfig } from "../../lib/server/supabase.js";
import { requireAdminRequest } from "../../lib/server/security.js";

const settingsSchema = z.object({
  brand: z.object({
    plannedDomain: z.string().min(1),
  }),
  access: z.object({
    type: z.literal("escuela_y_evento"),
  }),
  timezone: z.enum(["America/Mexico_City", "America/Cancun", "America/Tijuana"]),
  pricing: z.object({
    currency: z.literal("MXN"),
    volumeRules: z.array(z.object({
      min: z.number().int().positive(),
      max: z.number().int().positive().nullable(),
      unitPrice: z.number().nonnegative(),
    })).min(3),
    printAddonPerCopy: z.number().nonnegative(),
  }),
  lifecycle: z.object({
    galleryValidityMonths: z.number().int().positive(),
    downloadAvailabilityDays: z.number().int().positive(),
  }),
  delivery: z.object({
    printDeliveryType: z.literal("recoleccion_personal"),
    printDeliveryLabel: z.string().min(1),
    printDeliveryNote: z.string().min(1),
  }),
  payments: z.object({
    primary: z.literal("mercado_pago"),
    alternative: z.literal("transferencia"),
    methods: z.array(z.object({
      id: z.enum(["mercado_pago", "transferencia"]),
      label: z.string().min(1),
      statusAfterConfirm: z.string().min(1),
    })).length(2),
  }),
});

const fallbackSettings = {
  brand: {
    plannedDomain: "photoschool.com.mx",
  },
  access: {
    type: "escuela_y_evento",
  },
  timezone: "America/Mexico_City",
  pricing: {
    currency: "MXN",
    volumeRules: [
      { min: 1, max: 5, unitPrice: 45 },
      { min: 6, max: 10, unitPrice: 40 },
      { min: 11, max: null, unitPrice: 35 },
    ],
    printAddonPerCopy: 5,
  },
  lifecycle: {
    galleryValidityMonths: 2,
    downloadAvailabilityDays: 7,
  },
  delivery: {
    printDeliveryType: "recoleccion_personal",
    printDeliveryLabel: "Recolección personal",
    printDeliveryNote: "Alberto se pondra en contacto contigo para coordinar la entrega.",
  },
  payments: {
    primary: "mercado_pago",
    alternative: "transferencia",
    methods: [
      { id: "mercado_pago", label: "Mercado Pago", statusAfterConfirm: "Pago aprobado" },
      { id: "transferencia", label: "Transferencia bancaria", statusAfterConfirm: "Pago pendiente" },
    ],
  },
};

export default async function handler(request, response) {
  if (!["GET", "PATCH"].includes(request.method)) {
    return methodNotAllowed(request, response, ["GET", "PATCH"]);
  }

  if (request.method === "GET") {
    if (!hasSupabaseEnv()) {
      return sendJson(response, {
        ok: true,
        source: "fallback",
        backend: publicBackendConfig(),
        settings: fallbackSettings,
      });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "commerce")
      .maybeSingle();

    if (error && isMissingSchemaError(error, "platform_settings")) {
      return sendJson(response, {
        ok: true,
        source: "setup_required",
        setupRequired: true,
        message: "Supabase is connected, but the database schema has not been installed.",
        settings: fallbackSettings,
      });
    }
    if (error) return sendJson(response, { ok: false, error: error.message }, 500);
    return sendJson(response, { ok: true, source: data ? "supabase" : "fallback", settings: data?.value || fallbackSettings });
  }

  if (!requireAdminRequest(request, response, sendJson)) return;

  const body = await readJsonBody(request);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(response, { ok: false, error: "Invalid settings payload", issues: parsed.error.issues }, 400);
  }

  if (!hasSupabaseEnv()) {
    return sendJson(response, {
      ok: true,
      source: "validated_fallback",
      backend: publicBackendConfig(),
      settings: parsed.data,
    });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("platform_settings")
    .upsert({
      key: "commerce",
      value: parsed.data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

  if (error && isMissingSchemaError(error, "platform_settings")) {
    return sendJson(response, {
      ok: true,
      source: "validated_setup_required",
      setupRequired: true,
      message: "Settings payload is valid, but the database schema has not been installed.",
      settings: parsed.data,
    });
  }
  if (error) return sendJson(response, { ok: false, error: error.message }, 500);
  return sendJson(response, { ok: true, settings: parsed.data });
}
