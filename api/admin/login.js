import crypto from "node:crypto";
import { z } from "zod";
import { methodNotAllowed, readJsonBody, sendJson } from "../../lib/server/http.js";
import { createAdminSessionToken, verifySha256 } from "../../lib/server/security.js";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(100),
});

export default async function handler(request, response) {
  if (request.method !== "POST") return methodNotAllowed(request, response, ["POST"]);

  const body = await readJsonBody(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(response, { ok: false, error: "Credenciales no validas.", issues: parsed.error.issues }, 400);
  }

  const expectedUsername = process.env.PHOTOSCHOOL_ADMIN_USERNAME || "alberto";
  const expectedHash = process.env.PHOTOSCHOOL_ADMIN_PASSWORD_HASH;
  const validUser = parsed.data.username === expectedUsername;
  const validPassword = verifySha256(parsed.data.password, expectedHash);

  if (!validUser || !validPassword) {
    return sendJson(response, { ok: false, error: "Credenciales no validas." }, 401);
  }

  const issuedAt = new Date().toISOString();
  const token = createAdminSessionToken(expectedUsername, issuedAt);
  if (!token) return sendJson(response, { ok: false, error: "Falta configurar la seguridad administrativa." }, 503);

  return sendJson(response, {
    ok: true,
    admin: {
      username: expectedUsername,
      role: "owner",
      name: "Alberto de la Fuente",
    },
    session: {
      // Token transitorio para la maqueta. En produccion debe ser cookie httpOnly firmada o proveedor auth.
      token,
      requestId: crypto.randomUUID(),
      issuedAt,
    },
  });
}
