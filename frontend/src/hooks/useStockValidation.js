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
      Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
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
