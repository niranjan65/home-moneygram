// erpConfig.js
// Central API configuration for the Doppio/Frappe React app.
// This app is served by Frappe, so authenticated requests should use the
// logged-in Frappe session cookie created by username/password login.
// Do NOT hardcode API tokens in frontend code.

export const ERP_ENV = {
  DEMO: "DEMO",
  PROD: "PROD",
};

let CURRENT_ENV = ERP_ENV.PROD;

export const setERPEnv = (env) => {
  CURRENT_ENV = env;
};

export const getERPEnv = () => CURRENT_ENV;

const normalizeBaseURL = (url) => {
  if (!url) return "/";
  return url.endsWith("/") ? url : `${url}/`;
};

const getRuntimeBaseURL = () => {
  const envBaseURL = import.meta.env?.VITE_ERPNEXT_BASE_URL?.trim();

  if (envBaseURL) {
    return normalizeBaseURL(envBaseURL);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeBaseURL(window.location.origin);
  }

  return "/";
};

export const getBaseURL = () => getRuntimeBaseURL();

export const buildApiUrl = (path) => {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${getBaseURL()}${cleanPath}`;
};

const getCSRFToken = () => {
  if (typeof window === "undefined") return "";

  const token = window.csrf_token || window.frappe?.csrf_token || "";

  // During local template development this can remain as raw Jinja text.
  if (!token || token.includes("{{")) return "";

  return token;
};

export const getHeaders = () => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers["X-Frappe-CSRF-Token"] = csrfToken;
  }

  return headers;
};

export const getFetchOptions = (options = {}) => ({
  credentials: "include",
  ...options,
  headers: {
    ...getHeaders(),
    ...(options.headers || {}),
  },
});
