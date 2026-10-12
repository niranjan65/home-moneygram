import axios from "axios";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_PATH = "/api/method/moneygram.moneygram.api.allow_login.get_csrf_token";
const pendingTokens = new Map();

function apiURL(input) {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(input, base);
  const configured = import.meta.env?.VITE_ERPNEXT_BASE_URL;
  const origins = [base, configured && new URL(configured, base).origin];
  return origins.includes(url.origin) && url.pathname.startsWith("/api/") ? url : null;
}

async function csrfToken(url) {
  // Share concurrent lookups, but refresh for each later batch of requests so
  // logout/login and expired sessions cannot leave a stale token cached.
  if (!pendingTokens.has(url.origin)) {
    const lookup = globalThis.fetch(new URL(CSRF_PATH, url.origin).href, {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error("Unable to initialize authentication session");
      const data = await response.json();
      const token = data?.message?.csrf_token;
      if (!token) throw new Error("Missing session CSRF token");
      return token;
    }).finally(() => pendingTokens.delete(url.origin));
    pendingTokens.set(url.origin, lookup);
  }
  return pendingTokens.get(url.origin);
}

function needsCSRF(url, method) {
  return !SAFE_METHODS.has(method) && url.pathname !== "/api/method/login";
}

export async function sessionFetch(input, options = {}) {
  const request = typeof Request !== "undefined" && input instanceof Request ? input : null;
  const url = apiURL(request ? request.url : input);
  if (!url) return globalThis.fetch(input, options);
  const headers = new Headers(options.headers ?? request?.headers);
  headers.delete("Authorization");
  const method = (options.method || request?.method || "GET").toUpperCase();
  if (needsCSRF(url, method)) headers.set("X-Frappe-CSRF-Token", await csrfToken(url));
  return globalThis.fetch(input, { ...options, headers, credentials: "include" });
}

export const sessionAxios = axios.create();
sessionAxios.interceptors.request.use(async (config) => {
  const url = apiURL(sessionAxios.getUri(config));
  if (!url) return config;
  config.withCredentials = true;
  config.headers = axios.AxiosHeaders.from(config.headers);
  config.headers.delete("Authorization");
  if (needsCSRF(url, (config.method || "GET").toUpperCase())) {
    config.headers.set("X-Frappe-CSRF-Token", await csrfToken(url));
  }
  return config;
});
