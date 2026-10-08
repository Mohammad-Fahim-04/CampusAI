const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function createApiError(message, code, status) {
  const error = new Error(message);
  error.name = "CampusAIAPIError";
  error.code = code;
  if (status !== undefined) error.status = status;
  return error;
}

async function networkError() {
  try {
    const healthResponse = await fetch(`${API_URL}/api/health`);
    if (healthResponse.ok) {
      return createApiError(
        "The backend health check is responding, but POST /api/chat did not return a browser-readable response. The chat request may have timed out or its error response may be missing CORS headers. Check the backend service logs.",
        "CHAT_RESPONSE_UNAVAILABLE",
      );
    }
  } catch {
    // A second failed request cannot distinguish CORS from general connectivity.
  }

  return createApiError(
    `The browser could not read a response from ${API_URL}. Check CORS, network connectivity, and backend availability.`,
    "NETWORK_ERROR",
  );
}

export async function sendMessage(programme, message, history = []) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programme, message, history }),
    });
  } catch {
    throw await networkError();
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) {
        detail = body.detail.map((item) => item.msg).filter(Boolean).join("; ");
      }
    } catch {
      // Non-JSON gateway responses are reported using their HTTP status below.
    }
    const statusText = res.statusText ? ` ${res.statusText}` : "";
    throw createApiError(
      detail
        ? `Backend request failed (HTTP ${res.status}): ${detail}`
        : `Backend request failed (HTTP ${res.status}${statusText}).`,
      `HTTP_${res.status}`,
      res.status,
    );
  }
  try {
    return await res.json(); // { answer, query_type }
  } catch {
    throw createApiError(
      "The backend returned an invalid JSON response for /api/chat.",
      "INVALID_RESPONSE",
      res.status,
    );
  }
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error("Backend unhealthy");
  return res.json(); // { status: "ok" }
}
