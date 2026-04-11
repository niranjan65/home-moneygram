// src/__tests__/fixtures/dealerFixtures.js
/**
 * Shared test fixtures for the Dealer Exchange workflow.
 * Import these in any test file instead of re-defining inline.
 */

// ── User / auth ───────────────────────────────────────────────────────────────
export const MOCK_LOGIN_USER = {
  user: {
    api_key:    'test_api_key_123',
    api_secret: 'test_api_secret_456',
    full_name:  'Test Dealer',
    email:      'dealer@test.com',
  },
};

// ── Warehouse ─────────────────────────────────────────────────────────────────
export const MOCK_WAREHOUSE = {
  warehouse: 'Main Warehouse - MH',
  label:     'Main Warehouse',
};

// ── Currencies with rates ──────────────────────────────────────────────────────
export const MOCK_AUD_CURRENCY = {
  code:        'AUD',
  name:        'Australian Dollar',
  buyingRate:  1.26,
  sellingRate: 1.30,
  country:     'Australia',
  flag:        '🇦🇺',
};

export const MOCK_USD_CURRENCY = {
  code:        'USD',
  name:        'US Dollar',
  buyingRate:  0.55,
  sellingRate: 0.58,
  country:     'United States',
  flag:        '🇺🇸',
};

export const MOCK_AVAILABLE_CURRENCIES = [MOCK_AUD_CURRENCY, MOCK_USD_CURRENCY];

// ── FJD (base currency) denomination data ─────────────────────────────────────
export const MOCK_FJD_DENOM_INFO = {
  currency:   'FJD',
  symbol:     'FJ$',
  flag:       '🇫🇯',
  notes:      [100, 50, 20, 10, 5, 2, 1],
  coins:      [0.50, 0.20, 0.10, 0.05],
  notes_name: ['FJD-100', 'FJD-50', 'FJD-20', 'FJD-10', 'FJD-5', 'FJD-2', 'FJD-1'],
  coins_name: ['FJD-50c', 'FJD-20c', 'FJD-10c', 'FJD-5c'],
};

// ── AUD denomination data ─────────────────────────────────────────────────────
export const MOCK_AUD_DENOM_INFO = {
  currency:   'AUD',
  symbol:     'A$',
  flag:       '🇦🇺',
  notes:      [100, 50, 20, 10, 5],
  coins:      [2, 1, 0.50, 0.20, 0.10, 0.05],
  notes_name: ['AUD-100', 'AUD-50', 'AUD-20', 'AUD-10', 'AUD-5'],
  coins_name: ['AUD-2', 'AUD-1', 'AUD-50c', 'AUD-20c', 'AUD-10c', 'AUD-5c'],
};

// ── Dealer form data (as entered by user) ─────────────────────────────────────
export const MOCK_DEALER_FORM_DATA = {
  firstName:  'John',
  middleName: 'A',
  lastName:   'Doe',
  fullName:   'John A Doe',
  dateOfBirth: '1990-05-15',
  exchangeType: 'BUY',
};

// ── Denomination rows (balanced BUY – FJD out) ────────────────────────────────
export const MOCK_SENDER_DENOM_ROWS_BUY = [
  // Currency Out (FJD leaving MH vault) – these are FJD notes given to customer
  { denomination_value: 20, denomination_type: 'Note', count: 1, subtotal: 20 },
  { denomination_value: 5,  denomination_type: 'Note', count: 1, subtotal: 5  },
];

export const MOCK_RECEIVER_DENOM_ROWS_BUY = [
  // Currency In (AUD arriving at MH) – these are the AUD notes from customer
  { denomination_value: 20, denomination_type: 'Note', count: 1, subtotal: 20 },
  { denomination_value: 5,  denomination_type: 'Note', count: 1, subtotal: 5  },
];

// ── Complete transfer payload (BUY) ───────────────────────────────────────────
export const MOCK_TRANSFER_PAYLOAD_BUY = {
  ...MOCK_DEALER_FORM_DATA,
  sendAmount:    19.89,
  localCurrency: 'FJD',
  foreignCurrency: 'AUD',
  exchangeRate:  1.26,
  receiverGets:  25.05,  // roundTo5Cents(19.89 * 1.26)
  totalAmount:   25.05,
  rateSource:    'manual',
  rateDate:      null,
  exchangeType:  'BUY',
  // denomination arrays
  sender_notes:      MOCK_FJD_DENOM_INFO.notes,
  sender_notes_name: MOCK_FJD_DENOM_INFO.notes_name,
  sender_coins:      MOCK_FJD_DENOM_INFO.coins,
  sender_coins_name: MOCK_FJD_DENOM_INFO.coins_name,
  notes:             MOCK_AUD_DENOM_INFO.notes,
  notes_name:        MOCK_AUD_DENOM_INFO.notes_name,
  coins:             MOCK_AUD_DENOM_INFO.coins,
  coins_name:        MOCK_AUD_DENOM_INFO.coins_name,
  senderDenominationRows:   MOCK_SENDER_DENOM_ROWS_BUY,
  receiverDenominationRows: MOCK_RECEIVER_DENOM_ROWS_BUY,
};

// ── Complete transfer payload (SELL) ──────────────────────────────────────────
export const MOCK_TRANSFER_PAYLOAD_SELL = {
  ...MOCK_DEALER_FORM_DATA,
  exchangeType:  'SELL',
  sendAmount:    50,       // customer gives AUD 50
  localCurrency: 'FJD',
  foreignCurrency: 'AUD',
  exchangeRate:  1.30,
  receiverGets:  65.00,   // roundTo5Cents(50 * 1.30)
  totalAmount:   65.00,
  rateSource:    'manual',
  rateDate:      null,
  sender_notes:      MOCK_AUD_DENOM_INFO.notes,
  sender_notes_name: MOCK_AUD_DENOM_INFO.notes_name,
  sender_coins:      MOCK_AUD_DENOM_INFO.coins,
  sender_coins_name: MOCK_AUD_DENOM_INFO.coins_name,
  notes:             MOCK_FJD_DENOM_INFO.notes,
  notes_name:        MOCK_FJD_DENOM_INFO.notes_name,
  coins:             MOCK_FJD_DENOM_INFO.coins,
  coins_name:        MOCK_FJD_DENOM_INFO.coins_name,
  senderDenominationRows: [
    { denomination_value: 50, denomination_type: 'Note', count: 1, subtotal: 50 },
  ],
  receiverDenominationRows: [
    { denomination_value: 50, denomination_type: 'Note', count: 1, subtotal: 50 },
    { denomination_value: 10, denomination_type: 'Note', count: 1, subtotal: 10 },
    { denomination_value: 5,  denomination_type: 'Note', count: 1, subtotal: 5  },
  ],
};

// ── Stock API response helpers ────────────────────────────────────────────────
export const makeStockResponse = (inStock = true) => ({
  ok:   true,
  json: jest.fn().mockResolvedValue({
    message: inStock
      ? [
          { item_code: 'AUD-100', warehouse: MOCK_WAREHOUSE.warehouse, actual_qty: 50 },
          { item_code: 'AUD-50',  warehouse: MOCK_WAREHOUSE.warehouse, actual_qty: 20 },
          { item_code: 'AUD-20',  warehouse: MOCK_WAREHOUSE.warehouse, actual_qty: 100 },
        ]
      : [], // empty → all out of stock
  }),
});

// ── Dealer exchange API response ──────────────────────────────────────────────
export const MOCK_API_SUCCESS_RESPONSE = {
  message: {
    data: {
      name:   'DLR-2026-0001',
      status: 'Completed',
    },
  },
};

export const MOCK_API_ERROR_RESPONSE = {
  ok:   false,
  json: jest.fn().mockResolvedValue({ message: 'Internal Server Error' }),
};
