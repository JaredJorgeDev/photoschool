import crypto from "node:crypto";

export function normalizeAccessCode(code) {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

// Disuasorio para no guardar codigos operativos en texto plano.
// En produccion se debe usar una estrategia con secreto de servidor y rotacion.
export function hashAccessCode(code) {
  return crypto.createHash("sha256").update(normalizeAccessCode(code)).digest("hex");
}

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

export function verifySha256(value, expectedHash) {
  if (!expectedHash) return false;
  const actual = sha256(value);
  const expected = String(expectedHash);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function createAdminSessionToken(username, issuedAt = new Date().toISOString()) {
  const secret = process.env.PHOTOSCHOOL_ADMIN_PASSWORD_HASH;
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify({ username, issuedAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  const secret = process.env.PHOTOSCHOOL_ADMIN_PASSWORD_HASH;
  if (!secret || !token || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const issuedAt = new Date(data.issuedAt).getTime();
    if (!Number.isFinite(issuedAt)) return false;
    const maxAgeMs = 12 * 60 * 60 * 1000;
    return Date.now() - issuedAt < maxAgeMs;
  } catch {
    return false;
  }
}

export function requireAdminRequest(request, response, sendJson) {
  const header = request.headers?.authorization || request.headers?.Authorization || "";
  const token = String(header).replace(/^Bearer\s+/i, "").trim();
  if (verifyAdminSessionToken(token)) return true;
  sendJson(response, { ok: false, error: "Acceso administrativo requerido." }, 401);
  return false;
}

export function publicUser(user, profile = {}) {
  return {
    id: user?.id || profile?.id,
    email: user?.email || profile?.email,
    firstName: profile?.first_name || user?.user_metadata?.first_name || "",
    lastName: profile?.last_name || user?.user_metadata?.last_name || "",
    phone: profile?.phone || user?.phone || "",
    notificationEmail: Boolean(profile?.notification_email),
    notificationWhatsapp: Boolean(profile?.notification_whatsapp),
  };
}
