import { sessionFetch as fetch } from "../api/sessionClient.js";
import { useUser } from "../context/UserContext";

const API_URL =
  "/api/method/moneygram.moneygram.api.stock_validation.validate_stock_availability";

/**
 * Validates whether a list of denomination items have enough stock.
 *
 * @param {Array<{item_code: string, requested_qty: number}>} items - Array of requested items and quantities
 * @param {string}   warehouse   - Warehouse name from useSettings().selectedWarehouse.warehouse
 * @param {object}   loginUser   - From useUser()
 *
 * @returns {Promise<{ outOfStock: string[] }>}
 *   outOfStock: item_codes whose actual_qty < requested_qty or were not found in Bin
 */
export async function validateStockAvailability(items, warehouse, loginUser) {
  if (!items?.length || !warehouse) return { outOfStock: [] };

  const payload = items.map((item) => ({ item_code: item.item_code, warehouse }));

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ api_value: payload }),
  });

  if (!res.ok) throw new Error("Stock validation request failed");

  const json = await res.json();
  const bins = json?.message ?? []; // [{ item_code, warehouse, actual_qty }]

  // Build a quick lookup: item_code → actual_qty
  const qtyMap = {};
  bins.forEach(({ item_code, actual_qty }) => {
    qtyMap[item_code] = (qtyMap[item_code] ?? 0) + actual_qty;
  });

  // Any item that was requested but has qtyMap[code] < requested_qty is out of stock
  const outOfStock = items.filter(
    (item) => !Object.prototype.hasOwnProperty.call(qtyMap, item.item_code) || qtyMap[item.item_code] < item.requested_qty
  ).map((item) => item.item_code);

  return { outOfStock, qtyMap };
}

const CASH_ACCOUNT_API_URL =
  "/api/method/moneygram.moneygram.api.app_configuration.get_cash_account_for_warehouse";

/**
 * Validates whether the warehouse has a valid mapped Cash Account in App Configuration / Chart of Accounts.
 *
 * @param {string} warehouse - Warehouse name
 * @returns {Promise<{ ok: boolean, account?: string, error?: string }>}
 */
export async function validateWarehouseCashAccount(warehouse) {
  if (!warehouse) {
    return {
      ok: false,
      error: "No warehouse selected. Please select a branch warehouse before continuing.",
    };
  }

  try {
    const res = await fetch(CASH_ACCOUNT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ warehouse_name: warehouse, throw_if_missing: 1 }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      let errorMsg = `Cash Account is not mapped for Warehouse "${warehouse}". Please map it in App Configuration > Warehouse Accounts.`;
      if (json?._server_messages) {
        try {
          const parsedMsgs = JSON.parse(json._server_messages);
          if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
            const first = typeof parsedMsgs[0] === "string" ? JSON.parse(parsedMsgs[0]) : parsedMsgs[0];
            if (first?.message) {
              const plain = first.message.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              if (plain) errorMsg = plain;
            }
          }
        } catch (_) {}
      } else if (json?.message) {
        errorMsg = typeof json.message === "string" ? json.message : JSON.stringify(json.message);
      } else if (json?.exception) {
        const lines = json.exception.split("\n");
        const lastLine = lines.filter(l => l.trim()).pop() || "";
        if (lastLine.includes(":")) {
          errorMsg = lastLine.split(":").slice(1).join(":").trim();
        }
      }

      return {
        ok: false,
        error: errorMsg,
      };
    }

    const account = json?.message;
    if (!account) {
      return {
        ok: false,
        error: `Cash Account is not mapped for Warehouse "${warehouse}". Please map it in App Configuration > Warehouse Accounts.`,
      };
    }

    return { ok: true, account };
  } catch (err) {
    console.error("[Cash Account Validation]", err);
    // On unexpected network error, don't silently hide the check
    return {
      ok: false,
      error: err?.message || "Failed to validate warehouse cash account. Please try again.",
    };
  }
}

