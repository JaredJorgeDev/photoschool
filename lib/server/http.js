export function sendJson(response, body, status = 200) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

export function methodNotAllowed(request, response, allowed) {
  response.setHeader("allow", allowed.join(", "));
  return sendJson(response, { ok: false, error: `Method ${request.method} not allowed`, allowed }, 405);
}

export async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (request.body && typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return null;
    }
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
