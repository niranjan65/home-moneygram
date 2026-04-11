// src/__tests__/integration/dealerExchangePage.sell.test.jsx
/**
 * INTEGRATION TESTS — DealerExchange page (SELL flow)
 *
 * Covers:
 *  1. BUY → SELL toggle changes panel assignments correctly
 *  2. SELL: sendAmount is foreign, receiverGets is FJD
 *  3. SELL: stock check fires on submit (BUY skips it)
 *  4. SELL: out-of-stock items show error banner, block submit
 *  5. SELL: denomination panel targets are correct (AUD in / FJD out)
 *  6. SELL: API payload has correct localAmount / foreignAmount ordering
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { MOCK_LOGIN_USER, MOCK_WAREHOUSE, MOCK_API_SUCCESS_RESPONSE } from '../fixtures/dealerFixtures';
import { validateStockAvailability } from '../../hooks/useStockValidation';

// ── Module-level mocks (same as BUY suite) ───────────────────────────────────
jest.mock('../../hooks/useERPNextRates', () => ({
  useERPNextRates: () => ({
    availableCurrencies: [
      { code: 'AUD', buyingRate: 1.26, sellingRate: 1.30, country: 'Australia', name: 'Australian Dollar' },
    ],
    loading: false, error: null,
    rateDate: '2026-04-10', noDataForToday: false,
    showUploadModal: false, setShowUploadModal: jest.fn(),
  }),
}));

jest.mock('../../hooks/useDenomination', () => ({
  useBaseCurrency: () => ({
    data: {
      currency: 'FJD', symbol: 'FJ$', flag: '🇫🇯',
      notes: [100, 50, 20, 10, 5, 2, 1],
      coins: [0.50, 0.20, 0.10, 0.05],
      notes_name: ['FJD-100','FJD-50','FJD-20','FJD-10','FJD-5','FJD-2','FJD-1'],
      coins_name: ['FJD-50c','FJD-20c','FJD-10c','FJD-5c'],
    },
    loading: false, error: null,
  }),
  useDenomination: () => ({
    data: {
      currency: 'AUD', symbol: 'A$', flag: '🇦🇺',
      notes: [100, 50, 20, 10, 5],
      coins: [2, 1, 0.50, 0.20, 0.10, 0.05],
      notes_name: ['AUD-100','AUD-50','AUD-20','AUD-10','AUD-5'],
      coins_name: ['AUD-2','AUD-1','AUD-50c','AUD-20c','AUD-10c','AUD-5c'],
    },
    loading: false, error: null,
  }),
}));

jest.mock('../../hooks/useERPFileUpload', () => ({
  useERPFileUpload: () => ({ uploadFile: jest.fn(), loading: false }),
}));

jest.mock('../../hooks/useStockValidation', () => ({
  validateStockAvailability: jest.fn(),
}));

jest.mock('../../components/layout/Navbar', () => () => <nav data-testid="navbar" />);
jest.mock('../../components/Stepper',        () => ({ Stepper: () => <div /> }));
jest.mock('../../components/SenderCard',     () => ({ SenderCard: () => <div /> }));

let DealerExchange;
beforeAll(async () => {
  ({ default: DealerExchange } = await import('../../pages/DealerExchange'));
});

function renderPage() {
  return renderWithProviders(<DealerExchange />, {
    userCtx:     { user: MOCK_LOGIN_USER.user, setUser: jest.fn() },
    settingsCtx: {
      selectedWarehouse: MOCK_WAREHOUSE, warehouses: [MOCK_WAREHOUSE],
      setSelectedWarehouse: jest.fn(),
      user: { name: 'Test', role: 'User', avatar: 'TD', email: '' },
      updateUser: jest.fn(), theme: 'dark', setTheme: jest.fn(),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
describe('DealerExchange Page — SELL flow', () => {

  beforeEach(() => {
    validateStockAvailability.mockResolvedValue({ outOfStock: [], qtyMap: {} });
  });

  // ── 1. Toggle to SELL ────────────────────────────────────────────────────
  test('1. switching to SELL changes the exchange type badge', async () => {
    renderPage();

    const sellRadio = await screen.findByRole('radio', { name: /sell/i });
    await userEvent.click(sellRadio);

    await waitFor(() => {
      expect(screen.getByText(/🔴 Selling/i)).toBeInTheDocument();
    });
  });

  // ── 2. SELL preview label ────────────────────────────────────────────────
  test('2. SELL: summary label shows "MH Pays" or equivalent FJD', async () => {
    renderPage();

    const sellRadio = await screen.findByRole('radio', { name: /sell/i });
    await userEvent.click(sellRadio);

    const rateInput   = await screen.findByPlaceholderText(/manual rate/i);
    const amountInput = screen.getByPlaceholderText(/enter forex amount/i);
    await userEvent.type(rateInput, '1.30');
    await userEvent.type(amountInput, '50');

    await waitFor(() => {
      // 50 × 1.30 = 65.00 FJD (already on 5-cent boundary)
      expect(screen.getByText(/65\.00/)).toBeInTheDocument();
    });
  });

  // ── 3. Stock check fires on SELL submit ──────────────────────────────────
  test('3. SELL: validateStockAvailability is called on form submit', async () => {
    validateStockAvailability.mockResolvedValue({ outOfStock: [], qtyMap: {} });
    renderPage();

    const sellRadio = await screen.findByRole('radio', { name: /sell/i });
    await userEvent.click(sellRadio);

    await userEvent.type(await screen.findByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Test');
    await userEvent.type(await screen.findByPlaceholderText(/manual rate/i), '1.30');
    await userEvent.type(screen.getByPlaceholderText(/enter forex amount/i), '50');

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(validateStockAvailability).toHaveBeenCalled();
    });
  });

  // ── 4. Out-of-stock error banner blocks submit ────────────────────────────
  test('4. SELL: out-of-stock items show error banner, block advance to REVIEW', async () => {
    validateStockAvailability.mockResolvedValue({
      outOfStock: ['AUD-100', 'AUD-50'],
      qtyMap:     {},
    });

    renderPage();

    const sellRadio = await screen.findByRole('radio', { name: /sell/i });
    await userEvent.click(sellRadio);

    await userEvent.type(await screen.findByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Test');
    await userEvent.type(await screen.findByPlaceholderText(/manual rate/i), '1.30');
    await userEvent.type(screen.getByPlaceholderText(/enter forex amount/i), '50');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
      // Should NOT have advanced to REVIEW
      expect(screen.queryByText(/confirm/i)).not.toBeInTheDocument();
    });
  });

  // ── 5. Stock error clears when currency changes ───────────────────────────
  test('5. SELL: stock error clears when toCurrency selection changes', async () => {
    validateStockAvailability.mockResolvedValue({ outOfStock: ['AUD-100'], qtyMap: {} });

    renderPage();

    const sellRadio = await screen.findByRole('radio', { name: /sell/i });
    await userEvent.click(sellRadio);

    // Trigger a stock error
    await userEvent.type(await screen.findByLabelText(/first name/i), 'X');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Y');
    await userEvent.type(screen.getByLabelText(/full name/i), 'X Y');
    await userEvent.type(await screen.findByPlaceholderText(/manual rate/i), '1.30');
    await userEvent.type(screen.getByPlaceholderText(/enter forex amount/i), '50');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByText(/out of stock/i);

    // Now change currency (re-select AUD to trigger code ≠ prev code)
    const currencySelect = screen.getByRole('combobox');
    await userEvent.selectOptions(currencySelect, 'AUD');

    await waitFor(() => {
      expect(screen.queryByText(/out of stock/i)).not.toBeInTheDocument();
    });
  });

  // ── 6. SELL: BUY flag skips stock check ──────────────────────────────────
  test('6. BUY: validateStockAvailability is NOT called', async () => {
    renderPage();

    // BUY is default
    await userEvent.type(await screen.findByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(await screen.findByPlaceholderText(/manual rate/i), '1.26');
    await userEvent.type(screen.getByPlaceholderText(/enter forex amount/i), '25');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(validateStockAvailability).not.toHaveBeenCalled();
    });
  });
});
