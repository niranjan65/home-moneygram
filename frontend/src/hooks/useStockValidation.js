import { useUser } from "../context/UserContext";

const API_URL =
  "https://mhmoneyexpress.anantdv.com/api/method/moneygram.moneygram.api.stock_validation.validate_stock_availability";

/**
 * Validates whether a list of denomination item_codes are in stock.
 *
 * @param {string[]} itemNames   - Array of ERPNext item_code strings (notes_name / coins_name)
 * @param {string}   warehouse   - Warehouse name from useSettings().selectedWarehouse.warehouse
 * @param {object}   loginUser   - From useUser()
 *
 * @returns {Promise<{ outOfStock: string[] }>}
 *   outOfStock: item_codes whose actual_qty === 0 or were not found in Bin
 */
export async function validateStockAvailability(itemNames, warehouse, loginUser) {
  if (!itemNames?.length || !warehouse) return { outOfStock: [] };

  const payload = itemNames.map((item_code) => ({ item_code, warehouse }));

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

  // Any item_code that was requested but has qty <= 0 (or wasn't in Bin at all) is out of stock
  const outOfStock = itemNames.filter(
    (code) => !Object.prototype.hasOwnProperty.call(qtyMap, code) || qtyMap[code] <= 0
  );

  return { outOfStock, qtyMap };
}
