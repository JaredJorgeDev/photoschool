import { z } from "zod";
import { methodNotAllowed, readJsonBody, sendJson } from "../../lib/server/http.js";
import { createSupabaseAdminClient, hasSupabaseEnv, isMissingSchemaError } from "../../lib/server/supabase.js";
import { publicUser } from "../../lib/server/security.js";

const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8).max(100),
  notificationEmail: z.boolean().optional().default(false),
  notificationWhatsapp: z.boolean().optional().default(false),
  privacyAccepted: z.literal(true),
});

export default async function handler(request, response) {
  if (request.method !== "POST") return methodNotAllowed(request, response, ["POST"]);

  const body = await readJsonBody(request);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(response, { ok: false, error: "Revisa los datos de registro.", issues: parsed.error.issues }, 400);
  }

  if (!hasSupabaseEnv()) {
    return sendJson(response, {
      ok: false,
      setupRequired: true,
      message: "Faltan variables de Supabase para crear cuentas reales.",
    }, 503);
  }

  const input = parsed.data;
  const supabase = createSupabaseAdminClient();

  const schemaProbe = await supabase.from("customers").select("id").limit(1);
  if (schemaProbe.error && isMissingSchemaError(schemaProbe.error, "customers")) {
    return sendJson(response, {
      ok: false,
      setupRequired: true,
      message: "Supabase esta conectado, pero falta ejecutar la migracion inicial.",
    }, 409);
  }
  if (schemaProbe.error) return sendJson(response, { ok: false, error: schemaProbe.error.message }, 500);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    phone: input.phone,
    email_confirm: false,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      notification_email: input.notificationEmail,
      notification_whatsapp: input.notificationWhatsapp,
    },
  });

  if (authError) {
    const duplicate = /already|registered|exists/i.test(authError.message);
    return sendJson(response, {
      ok: false,
      error: duplicate ? "Ese correo ya esta registrado." : authError.message,
    }, duplicate ? 409 : 500);
  }

  const profile = {
    id: authData.user.id,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    notification_email: input.notificationEmail,
    notification_whatsapp: input.notificationWhatsapp,
    updated_at: new Date().toISOString(),
  };

  const { data: customer, error: profileError } = await supabase
    .from("customers")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (profileError) return sendJson(response, { ok: false, error: profileError.message }, 500);

  return sendJson(response, {
    ok: true,
    user: publicUser(authData.user, customer),
  }, 201);
}
