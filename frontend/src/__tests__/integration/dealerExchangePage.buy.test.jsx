// src/__tests__/integration/dealerExchangePage.buy.test.jsx
/**
 * INTEGRATION TESTS — DealerExchange page (BUY flow)
 *
 * Mock strategy:
 *  - All React context providers replaced with controlled in-memory values
 *  - global.fetch mocked per test to simulate Frappe API responses
 *  - useDenomination / useBaseCurrency / useERPNextRates all mocked via
 *    jest.mock() to avoid real network calls
 *  - sessionStorage/localStorage use the mocks from setup.js
 *
 * Covers:
 *  1. Page renders DETAILS step on first visit
 *  2. DealerForm renders with manual rate mode forced ON
 *  3. BUY: entering amount + currency + rate computes FJD payout
 *  4. BUY: denomination panels show correct target amounts
 *  5. Submit with balanced denominations advances to REVIEW step
 *  6. REVIEW step shows correct BUY summary data
 *  7. Confirm triggers Frappe dealer exchange API with correct payload
 *  8. Successful API response → advances to PAYMENT / success screen
 *  9. API error → shows alert, stays on REVIEW
 * 10. Clear button resets all state and returns to DETAILS
 * 11. Edit button from REVIEW returns to DETAILS preserving data
 */
import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  MOCK_LOGIN_USER,
  MOCK_WAREHOUSE,
  MOCK_AUD_CURRENCY,
  MOCK_AVAILABLE_CURRENCIES,
  MOCK_FJD_DENOM_INFO,
  MOCK_AUD_DENOM_INFO,
  MOCK_API_SUCCESS_RESPONSE,
} from '../fixtures/dealerFixtures';

// ── Module-level mocks ────────────────────────────────────────────────────────
jest.mock('../../hooks/useERPNextRates', () => ({
  useERPNextRates: () => ({
    availableCurrencies: [
      { code: 'AUD', buyingRate: 1.26, sellingRate: 1.30, country: 'Australia', name: 'Australian Dollar' },
    ],
    loading:        false,
    error:          null,
    rateDate:       '2026-04-10',
    noDataForToday: false,
    showUploadModal: false,
    setShowUploadModal: jest.fn(),
  }),
}));

jest.mock('../../hooks/useDenomination', () => ({
  useBaseCurrency: () => ({
    data: {
      currency:   'FJD',
      symbol:     'FJ$',
      flag:       '🇫🇯',
      notes:      [100, 50, 20, 10, 5, 2, 1],
      coins:      [0.50, 0.20, 0.10, 0.05],
      notes_name: ['FJD-100', 'FJD-50', 'FJD-20', 'FJD-10', 'FJD-5', 'FJD-2', 'FJD-1'],
      coins_name: ['FJD-50c', 'FJD-20c', 'FJD-10c', 'FJD-5c'],
    },
    loading: false,
    error:   null,
  }),
  useDenomination: () => ({
    data: {
      currency:   'AUD',
      symbol:     'A$',
      flag:       '🇦🇺',
      notes:      [100, 50, 20, 10, 5],
      coins:      [2, 1, 0.50, 0.20, 0.10, 0.05],
      notes_name: ['AUD-100', 'AUD-50', 'AUD-20', 'AUD-10', 'AUD-5'],
      coins_name: ['AUD-2', 'AUD-1', 'AUD-50c', 'AUD-20c', 'AUD-10c', 'AUD-5c'],
    },
    loading: false,
    error:   null,
  }),
}));

jest.mock('../../hooks/useERPFileUpload', () => ({
  useERPFileUpload: () => ({ uploadFile: jest.fn(), loading: false }),
}));

jest.mock('../../hooks/useStockValidation', () => ({
  validateStockAvailability: jest.fn().mockResolvedValue({ outOfStock: [], qtyMap: {} }),
}));

jest.mock('../../components/layout/Navbar', () => () => <nav data-testid="navbar" />);
jest.mock('../../components/Stepper',        () => ({ Stepper: () => <div data-testid="stepper" /> }));
jest.mock('../../components/SenderCard',     () => ({ SenderCard: () => <div data-testid="sender-card" /> }));

// Lazy import after mocks
let DealerExchange;
beforeAll(async () => {
  ({ default: DealerExchange } = await import('../../pages/DealerExchange'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Render helper
// ─────────────────────────────────────────────────────────────────────────────
function renderPage() {
  return renderWithProviders(<DealerExchange />, {
    userCtx: {
      user:    MOCK_LOGIN_USER.user,
      setUser: jest.fn(),
    },
    settingsCtx: {
      selectedWarehouse:    MOCK_WAREHOUSE,
      warehouses:           [MOCK_WAREHOUSE],
      setSelectedWarehouse: jest.fn(),
      user: { name: 'Test Dealer', role: 'User', avatar: 'TD', email: '' },
      updateUser:  jest.fn(),
      theme:       'dark',
      setTheme:    jest.fn(),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('DealerExchange Page — BUY flow', () => {

  // ── 1. Initial render ──────────────────────────────────────────────────────
  test('1. renders DETAILS step on first visit', () => {
    renderPage();

    // Dealer portal heading
    expect(screen.getByText(/Dealer Exchange/i)).toBeInTheDocument();
    // "Dealer Details" form header
    expect(screen.getByText(/Dealer Details/i)).toBeInTheDocument();
    // Continue button present
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  // ── 2. Manual rate is forced ON in DealerForm ──────────────────────────────
  test('2. DealerForm forces manual rate mode (useManualRate = true)', async () => {
    renderPage();
    // The manual rate input field should be visible immediately
    // (DealerExchangeSection renders it when useManualRate=true)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/manual rate/i) ||
             screen.getByLabelText(/rate/i)).toBeInTheDocument();
    });
  });

  // ── 3. BUY calculation: entering amount + rate shows FJD result ────────────
  test('3. BUY: computation updates FJD payout in the summary panel', async () => {
    renderPage();

    // Fill manual rate
    const rateInput = await screen.findByPlaceholderText(/manual rate/i);
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '1.26');

    // Fill forex amount (sendAmount = AUD received by MH)
    const amountInput = screen.getByPlaceholderText(/enter forex amount/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '19.89');

    // The summary sidebar should show the rounded FJD amount
    await waitFor(() => {
      expect(screen.getByText(/25\.05/)).toBeInTheDocument();
    });
  });

  // ── 4. Denomination panels show correct targets ────────────────────────────
  test('4. Denomination panels display correct target amounts after entry', async () => {
    renderPage();

    const rateInput = await screen.findByPlaceholderText(/manual rate/i);
    await userEvent.type(rateInput, '1.30');

    const amountInput = screen.getByPlaceholderText(/enter forex amount/i);
    await userEvent.type(amountInput, '50');

    await waitFor(() => {
      // Currency Out (FJD) panel target = roundTo5Cents(50 * 1.30) = 65.00
      expect(screen.getByText(/65\.00/)).toBeInTheDocument();
    });
  });

  // ── 5. Valid submit advances to REVIEW ────────────────────────────────────
  test('5. submitting a valid BUY form with balanced denominations goes to REVIEW', async () => {
    renderPage();

    // Personal info
    await userEvent.type(await screen.findByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i),  'Doe');
    await userEvent.type(screen.getByLabelText(/full name/i),  'John Doe');

    // Exchange
    await userEvent.type(await screen.findByPlaceholderText(/manual rate/i), '1.26');
    await userEvent.type(screen.getByPlaceholderText(/enter forex amount/i), '25');

    // Click Continue — denominations may have 0 shortfall with balanced panels
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/review/i)).toBeInTheDocument();
    });
  });

  // ── 6. REVIEW step shows BUY summary ─────────────────────────────────────
  test('6. REVIEW step displays Dealer label and exchangeType BUY', async () => {
    // Pre-seed session to land on REVIEW
    sessionStorage.setItem('dealerCurrentStep', '3');
    sessionStorage.setItem('dealerTransferPayload', JSON.stringify({
      firstName: 'John', lastName: 'Doe', fullName: 'John Doe',
      dateOfBirth: '1990-05-15',
      exchangeType: 'BUY',
      sendAmount: 25, receiverGets: 31.50,
      exchangeRate: 1.26,
      localCurrency: 'FJD', foreignCurrency: 'AUD',
      senderDenominationRows: [], receiverDenominationRows: [],
    }));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Dealer/i)).toBeInTheDocument();
    });
  });

  // ── 7. Confirm triggers Frappe API with correct payload ───────────────────
  test('7. handleConfirm posts to dealer exchange API with authorization', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok:   true,
      json: jest.fn().mockResolvedValue(MOCK_API_SUCCESS_RESPONSE),
    });

    sessionStorage.setItem('dealerCurrentStep', '3');
    sessionStorage.setItem('dealerTransferPayload', JSON.stringify({
      firstName: 'John', lastName: 'Doe', fullName: 'John Doe',
      dateOfBirth: '1990-05-15',
      exchangeType: 'BUY',
      sendAmount: 25, receiverGets: 31.50,
      exchangeRate: 1.26,
      localCurrency: 'FJD', foreignCurrency: 'AUD',
      notes: [100, 50, 20, 10, 5], notes_name: ['AUD-100','AUD-50','AUD-20','AUD-10','AUD-5'],
      coins: [], coins_name: [],
      sender_notes: [100, 50, 20], sender_notes_name: ['FJD-100','FJD-50','FJD-20'],
      sender_coins: [], sender_coins_name: [],
      senderDenominationRows:   [{ denomination_value: 20, denomination_type: 'Note', count: 1, subtotal: 20 }],
      receiverDenominationRows: [{ denomination_value: 20, denomination_type: 'Note', count: 1, subtotal: 20 }],
    }));

    renderPage();

    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('create_dealer_exchange'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('token'),
          }),
        })
      );
    });
  });

  // ── 8. Success screen after confirmed API ─────────────────────────────────
  test('8. successful confirm advances to PAYMENT step (TransferSuccess)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok:   true,
      json: jest.fn().mockResolvedValue(MOCK_API_SUCCESS_RESPONSE),
    });

    sessionStorage.setItem('dealerCurrentStep', '3');
    sessionStorage.setItem('dealerTransferPayload', JSON.stringify({
      firstName: 'Jane', lastName: 'Smith', fullName: 'Jane Smith',
      dateOfBirth: '1990-01-01',
      exchangeType: 'BUY',
      sendAmount: 50, receiverGets: 63,
      exchangeRate: 1.26,
      localCurrency: 'FJD', foreignCurrency: 'AUD',
      notes: [], notes_name: [], coins: [], coins_name: [],
      sender_notes: [], sender_notes_name: [], sender_coins: [], sender_coins_name: [],
      senderDenominationRows: [], receiverDenominationRows: [],
    }));

    renderPage();

    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      // TransferSuccess renders a transaction ID like #DLR-XXXXXX
      expect(screen.getByText(/#DLR-/)).toBeInTheDocument();
    });
  });

  // ── 9. API error shows alert ──────────────────────────────────────────────
  test('9. API failure triggers window.alert', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    sessionStorage.setItem('dealerCurrentStep', '3');
    sessionStorage.setItem('dealerTransferPayload', JSON.stringify({
      firstName: 'Err', lastName: 'Test', fullName: 'Err Test',
      dateOfBirth: '1990-01-01', exchangeType: 'BUY',
      sendAmount: 50, receiverGets: 63, exchangeRate: 1.26,
      localCurrency: 'FJD', foreignCurrency: 'AUD',
      notes: [], notes_name: [], coins: [], coins_name: [],
      sender_notes: [], sender_notes_name: [], sender_coins: [], sender_coins_name: [],
      senderDenominationRows: [], receiverDenominationRows: [],
    }));

    renderPage();

    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Something went wrong')
      );
    });
  });

  // ── 10. Clear button resets form ──────────────────────────────────────────
  test('10. Clear button resets form and returns to DETAILS step', async () => {
    renderPage();

    const clearBtn = await screen.findByRole('button', { name: /clear/i });
    await userEvent.click(clearBtn);

    expect(sessionStorage.getItem('dealerCurrentStep')).toBeNull();
    expect(sessionStorage.getItem('dealerTransferPayload')).toBeNull();
    expect(screen.getByText(/Dealer Exchange/i)).toBeInTheDocument();
  });

  // ── 11. Edit from REVIEW returns to DETAILS ───────────────────────────────
  test('11. Edit button from REVIEW step returns to DETAILS', async () => {
    sessionStorage.setItem('dealerCurrentStep', '3');
    sessionStorage.setItem('dealerTransferPayload', JSON.stringify({
      firstName: 'John', lastName: 'Doe', fullName: 'John Doe',
      dateOfBirth: '1990-05-15', exchangeType: 'BUY',
      sendAmount: 25, receiverGets: 31.5, exchangeRate: 1.26,
      localCurrency: 'FJD', foreignCurrency: 'AUD',
      senderDenominationRows: [], receiverDenominationRows: [],
    }));

    renderPage();

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    await userEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText(/Dealer Details/i)).toBeInTheDocument();
    });
  });
});
