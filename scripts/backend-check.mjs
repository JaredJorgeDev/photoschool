import assert from "node:assert/strict";
import healthHandler from "../api/health.js";
import settingsHandler from "../api/admin/settings.js";
import adminLoginHandler from "../api/admin/login.js";
import schoolsHandler from "../api/admin/schools.js";
import userRegisterHandler from "../api/auth/register.js";
import userLoginHandler from "../api/auth/login.js";
import recoverHandler from "../api/auth/recover.js";
import { createAdminSessionToken, sha256 } from "../lib/server/security.js";

const savedEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PHOTOSCHOOL_ADMIN_USERNAME: process.env.PHOTOSCHOOL_ADMIN_USERNAME,
  PHOTOSCHOOL_ADMIN_PASSWORD_HASH: process.env.PHOTOSCHOOL_ADMIN_PASSWORD_HASH,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.PHOTOSCHOOL_ADMIN_USERNAME = "alberto";
process.env.PHOTOSCHOOL_ADMIN_PASSWORD_HASH = sha256("photostime2026");

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(value) {
      this.body = value;
    },
  };
}

function jsonBody(response) {
  return JSON.parse(response.body);
}

{
  const response = createResponse();
  healthHandler({ method: "GET" }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "photoschool-backend");
}

{
  const response = createResponse();
  await settingsHandler({ method: "GET" }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.settings.pricing.volumeRules[0].unitPrice, 45);
  assert.equal(body.settings.payments.methods.length, 2);
}

{
  const response = createResponse();
  await settingsHandler({
    method: "PATCH",
    headers: { authorization: `Bearer ${createAdminSessionToken("alberto")}` },
    body: {
      brand: { plannedDomain: "photoschool.com.mx" },
      access: { type: "escuela_y_evento" },
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
    },
  }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.settings.timezone, "America/Mexico_City");
}

{
  const response = createResponse();
  await adminLoginHandler({
    method: "POST",
    body: { username: "alberto", password: "photostime2026" },
  }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.admin.username, "alberto");
}

{
  const response = createResponse();
  await schoolsHandler({ method: "GET" }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 503);
  assert.equal(body.setupRequired, true);
}

{
  const response = createResponse();
  await userRegisterHandler({
    method: "POST",
    body: {
      firstName: "Usuario",
      lastName: "Prueba",
      email: "usuario@example.com",
      phone: "7751604463",
      password: "password2026",
      notificationEmail: true,
      notificationWhatsapp: false,
      privacyAccepted: true,
    },
  }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 503);
  assert.equal(body.setupRequired, true);
}

{
  const response = createResponse();
  await userLoginHandler({
    method: "POST",
    body: { email: "usuario@example.com", password: "password2026" },
  }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 503);
  assert.equal(body.setupRequired, true);
}

{
  const response = createResponse();
  await recoverHandler({
    method: "POST",
    body: { email: "usuario@example.com" },
  }, response);
  const body = jsonBody(response);
  assert.equal(response.statusCode, 503);
  assert.equal(body.setupRequired, true);
}

restoreEnv();

console.log("Backend function checks passed.");
