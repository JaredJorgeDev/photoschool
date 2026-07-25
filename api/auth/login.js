import { z } from "zod";
import { methodNotAllowed, readJsonBody, sendJson } from "../../lib/server/http.js";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  hasSupabaseEnv,
  hasSupabasePublicEnv,
  isMissingSchemaError,
} from "../../lib/server/supabase.js";
import { publicUser } from "../../lib/server/security.js";

const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(100),
});

export default async function handler(request, response) {
  if (request.method !== "POST") return methodNotAllowed(request, response, ["POST"]);

  const body = await readJsonBody(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(response, { ok: false, error: "Correo o contrasena no validos.", issues: parsed.error.issues }, 400);
  }

  if (!hasSupabasePublicEnv()) {
    return sendJson(response, {
      ok: false,
      setupRequired: true,
      message: "Faltan variables publicas de Supabase para iniciar sesion.",
    }, 503);
  }

  const supabasePublic = createSupabasePublicClient();
  const { data, error } = await supabasePublic.auth.signInWithPassword(parsed.data);
  if (error) return sendJson(response, { ok: false, error: "Correo o contrasena incorrectos." }, 401);

  let profile = null;
  if (hasSupabaseEnv()) {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: customer, error: profileError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError && !isMissingSchemaError(profileError, "customers")) {
      return sendJson(response, { ok: false, error: profileError.message }, 500);
    }
    profile = customer;
  }

  return sendJson(response, {
    ok: true,
    user: publicUser(data.user, profile || {}),
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  });
}
