const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function sendMessage(programme, message) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programme, message }),
    });
  } catch {
    throw new Error("Can't reach the backend. Check that it is running on " + API_URL + ".");
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* keep default message */
    }
    throw new Error(detail);
  }
  return res.json(); // { answer, query_type }
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error("Backend unhealthy");
  return res.json(); // { status: "ok" }
}
