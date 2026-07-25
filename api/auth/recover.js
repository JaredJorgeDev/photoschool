import { z } from "zod";
import { methodNotAllowed, readJsonBody, sendJson } from "../../lib/server/http.js";
import { createSupabasePublicClient, hasSupabasePublicEnv } from "../../lib/server/supabase.js";

const recoverSchema = z.object({
  email: z.string().trim().email().max(160),
});

export default async function handler(request, response) {
  if (request.method !== "POST") return methodNotAllowed(request, response, ["POST"]);

  const body = await readJsonBody(request);
  const parsed = recoverSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(response, { ok: false, error: "Ingresa un correo valido.", issues: parsed.error.issues }, 400);
  }

  if (!hasSupabasePublicEnv()) {
    return sendJson(response, {
      ok: false,
      setupRequired: true,
      message: "Faltan variables publicas de Supabase para recuperar contrasenas.",
    }, 503);
  }

  const supabase = createSupabasePublicClient();
  const redirectTo = `${process.env.PHOTOSCHOOL_PUBLIC_URL || "https://photoschool-demo.vercel.app"}/#/login`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  if (error) return sendJson(response, { ok: false, error: error.message }, 500);

  return sendJson(response, {
    ok: true,
    message: "Si el correo existe, recibira instrucciones para recuperar el acceso.",
  });
}
