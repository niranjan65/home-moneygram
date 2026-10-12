// src/__tests__/unit/validateStockAvailability.test.js
/**
 * UNIT TESTS — validateStockAvailability (useStockValidation)
 *
 * Covers:
 *  - Happy path: all items in stock
 *  - Partial out-of-stock scenario
 *  - All items out of stock
 *  - Guard: empty itemNames or missing warehouse → { outOfStock: [] }
 *  - API failure → throws error
 *  - Session cookies and CSRF protect the stock request
 */
import { validateStockAvailability } from '../../hooks/useStockValidation';
import { MOCK_LOGIN_USER, MOCK_WAREHOUSE } from '../fixtures/dealerFixtures';

global.fetch = jest.fn();

const ITEMS_ALL  = [
  { item_code: 'AUD-100', requested_qty: 10 },
  { item_code: 'AUD-50', requested_qty: 5 },
  { item_code: 'AUD-20', requested_qty: 20 }
];
const WAREHOUSE  = MOCK_WAREHOUSE.warehouse;
const LOGIN_USER = MOCK_LOGIN_USER;

function mockCSRFResponse() {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({ message: { csrf_token: "test-csrf" } }),
  });
}

function mockFetchResponse(bins) {
  mockCSRFResponse();
  global.fetch.mockResolvedValueOnce({
    ok:   true,
    json: jest.fn().mockResolvedValue({ message: bins }),
  });
}

function mockFetchFailure() {
  mockCSRFResponse();
  global.fetch.mockResolvedValueOnce({ ok: false, json: jest.fn() });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Guard conditions
// ─────────────────────────────────────────────────────────────────────────────
describe('validateStockAvailability — guards', () => {
  test('returns { outOfStock: [] } immediately when itemNames is empty', async () => {
    const result = await validateStockAvailability([], WAREHOUSE, LOGIN_USER);
    expect(result).toEqual({ outOfStock: [] });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns { outOfStock: [] } immediately when warehouse is falsy', async () => {
    const result = await validateStockAvailability(ITEMS_ALL, '', LOGIN_USER);
    expect(result).toEqual({ outOfStock: [] });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns { outOfStock: [] } when itemNames is null', async () => {
    const result = await validateStockAvailability(null, WAREHOUSE, LOGIN_USER);
    expect(result).toEqual({ outOfStock: [] });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Happy path — all items in stock
// ─────────────────────────────────────────────────────────────────────────────
describe('validateStockAvailability — all in stock', () => {
  beforeEach(() => {
    mockFetchResponse([
      { item_code: 'AUD-100', warehouse: WAREHOUSE, actual_qty: 50 },
      { item_code: 'AUD-50',  warehouse: WAREHOUSE, actual_qty: 20 },
      { item_code: 'AUD-20',  warehouse: WAREHOUSE, actual_qty: 100 },
    ]);
  });

  test('outOfStock is empty', async () => {
    const { outOfStock } = await validateStockAvailability(ITEMS_ALL, WAREHOUSE, LOGIN_USER);
    expect(outOfStock).toEqual([]);
  });

  test('qtyMap contains all items', async () => {
    const { qtyMap } = await validateStockAvailability(ITEMS_ALL, WAREHOUSE, LOGIN_USER);
    expect(qtyMap['AUD-100']).toBe(50);
    expect(qtyMap['AUD-50']).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Partial out-of-stock
// ─────────────────────────────────────────────────────────────────────────────
describe('validateStockAvailability — partial out-of-stock', () => {
  beforeEach(() => {
    mockFetchResponse([
      { item_code: 'AUD-100', warehouse: WAREHOUSE, actual_qty: 0 },  // OOS
      { item_code: 'AUD-50',  warehouse: WAREHOUSE, actual_qty: 10 }, // OK
      // AUD-20 absent from response → treated as OOS
    ]);
  });

  test('returns correct out-of-stock codes', async () => {
    const { outOfStock } = await validateStockAvailability(ITEMS_ALL, WAREHOUSE, LOGIN_USER);
    expect(outOfStock).toContain('AUD-100');
    expect(outOfStock).toContain('AUD-20');
    expect(outOfStock).not.toContain('AUD-50');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. All items out of stock (empty bins array)
// ─────────────────────────────────────────────────────────────────────────────
describe('validateStockAvailability — all out of stock', () => {
  beforeEach(() => { mockFetchResponse([]); });

  test('all requested items appear in outOfStock', async () => {
    const { outOfStock } = await validateStockAvailability(ITEMS_ALL, WAREHOUSE, LOGIN_USER);
    expect(outOfStock.sort()).toEqual(ITEMS_ALL.map(it => it.item_code).sort());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. API failure
// ─────────────────────────────────────────────────────────────────────────────
describe('validateStockAvailability — API failure', () => {
  test('throws when response.ok is false', async () => {
    mockFetchFailure();
    await expect(validateStockAvailability(ITEMS_ALL, WAREHOUSE, LOGIN_USER))
      .rejects.toThrow('Stock validation request failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Request payload verification
// ─────────────────────────────────────────────────────────────────────────────
describe('validateStockAvailability — request shape', () => {
  beforeEach(() => { mockFetchResponse([]); });

  test('sends session cookies and CSRF without Authorization', async () => {
    await validateStockAvailability(ITEMS_ALL, WAREHOUSE, LOGIN_USER).catch(() => {});

    const [, init] = global.fetch.mock.calls.find(([url]) => String(url).includes("validate_stock_availability"));
    expect(init.credentials).toBe("include");
    expect(init.headers.has("Authorization")).toBe(false);
    expect(init.headers.get("X-Frappe-CSRF-Token")).toBe("test-csrf");
  });

  test('body contains api_value array with item_code + warehouse', async () => {
    await validateStockAvailability([{item_code: 'AUD-100', requested_qty: 1}], WAREHOUSE, LOGIN_USER).catch(() => {});

    const [, init] = global.fetch.mock.calls.find(([url]) => String(url).includes("validate_stock_availability"));
    const body = JSON.parse(init.body);
    expect(body.api_value).toEqual([{ item_code: 'AUD-100', warehouse: WAREHOUSE }]);
  });
});
