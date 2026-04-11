// erpConfig.js

export const ERP_ENV = {
  DEMO: "DEMO",
  PROD: "PROD",
};

// 🔥 Change this to switch environment
let CURRENT_ENV = ERP_ENV.PROD;

// 👉 Optional: allow runtime switching
export const setERPEnv = (env) => {
  CURRENT_ENV = env;
};

export const getERPEnv = () => CURRENT_ENV;

// ✅ Base URLs
const CONFIG = {
  [ERP_ENV.DEMO]: {
    baseURL: "http://192.168.101.182:81",
    getAuthHeaders: () => ({
      "Content-Type": "application/json",
      Authorization: `token ab5bd602e5f2950:47a1752c33990d9`,
    }),
  },

  [ERP_ENV.PROD]: {
    baseURL: "https://mhmoneyexpress.anantdv.com",
    getAuthHeaders: (loginUser) => ({
      "Content-Type": "application/json",
      Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
    }),
  },
};

// ✅ Helpers
// export const getBaseURL = () => CONFIG[CURRENT_ENV].baseURL;

// export const getHeaders = (loginUser) =>
//   CONFIG[CURRENT_ENV].getAuthHeaders(loginUser);

// ✅ Helpers (UPDATED)

export const getBaseURL = (envOverride) => {
  const env = envOverride || CURRENT_ENV;
  return CONFIG[env].baseURL;
};

export const getHeaders = (loginUser, envOverride) => {
  const env = envOverride || CURRENT_ENV;
  return CONFIG[env].getAuthHeaders(loginUser);
};