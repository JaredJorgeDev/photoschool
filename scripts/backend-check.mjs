import assert from "node:assert/strict";
import healthHandler from "../api/health.js";
import settingsHandler from "../api/admin/settings.js";

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

console.log("Backend function checks passed.");
