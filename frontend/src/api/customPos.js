import { sessionFetch } from "./sessionClient.js";

const ROOT = "/api/method/moneygram.custom_pos.api";

async function call(method, args = {}, httpMethod = "GET") {
  const query = httpMethod === "GET" ? `?${new URLSearchParams(args)}` : "";
  const response = await sessionFetch(`${ROOT}.${method}${query}`, {
    method: httpMethod,
    headers: { Accept: "application/json", ...(httpMethod === "POST" ? { "Content-Type": "application/json" } : {}) },
    ...(httpMethod === "POST" ? { body: JSON.stringify(args) } : {}),
    credentials: "include",
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.exc_type || result?.exception) {
    const serverMessage = result?._server_messages && (() => {
      try {
        const messages = JSON.parse(result._server_messages);
        return JSON.parse(messages[0])?.message;
      } catch { return null; }
    })();
    throw new Error(serverMessage || result?.message?.message || result?.message || "Cash counter request failed. Please try again.");
  }
  return result?.message ?? result;
}

export const customPos = {
  getStatus: (warehouse) => call("get_status", { warehouse }),
  getManagerAccess: (warehouse) => call("get_manager_access", { warehouse }),
  submitOpening: (warehouse, counts, remarks) => call("submit_opening", { warehouse, counts, remarks }, "POST"),
  submitClosing: (session, counts, remarks, transferToVault) => call("submit_closing", { session, counts, remarks, transfer_to_vault: transferToVault }, "POST"),
  startClosing: (warehouse) => call("start_closing", { warehouse }, "POST"),
  cancelClosing: (session) => call("cancel_closing", { session }, "POST"),
  getReviews: (warehouse) => call("get_reviews", warehouse ? { warehouse } : {}),
  getReportEntries: (warehouse, filters = {}) => call("get_report_entries", { warehouse, ...filters }),
  getEntry: (entry) => call("get_entry", { entry }),
  reviewEntry: (entry, decision, remarks, incidentTellers = []) => call("review_entry", { entry, decision, remarks, incident_tellers: incidentTellers }, "POST"),
};
