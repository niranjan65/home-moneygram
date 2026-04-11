// src/__tests__/helpers/renderWithProviders.jsx
/**
 * A test utility that wraps any component with all required
 * context providers used in the Dealer Exchange workflow.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext }     from '../../context/UserContext';
import { SettingsContext } from '../../context/SettingsContext';
import { ExchangeProvider }from '../../context/ExchangeContext';
import {
  MOCK_LOGIN_USER,
  MOCK_WAREHOUSE,
} from '../fixtures/dealerFixtures';

/**
 * Default context values — override per test via `options`.
 */
const defaultUserCtx = {
  user:    MOCK_LOGIN_USER.user,
  setUser: jest.fn(),
};

const defaultSettingsCtx = {
  selectedWarehouse: MOCK_WAREHOUSE,
  warehouses:        [MOCK_WAREHOUSE],
  setSelectedWarehouse: jest.fn(),
  user:        { name: 'Test Dealer', email: 'dealer@test.com', role: 'User', avatar: 'TD' },
  updateUser:  jest.fn(),
  theme:       'dark',
  setTheme:    jest.fn(),
};

const defaultSummary = {
  sendAmount:      0,
  currency:        'FJD',
  exchangeRate:    1.0,
  receiverGets:    0,
  receiverCurrency:'AUD',
  exchangeType:    'BUY',
};

export function renderWithProviders(
  ui,
  {
    userCtx      = defaultUserCtx,
    settingsCtx  = defaultSettingsCtx,
    summary      = defaultSummary,
    initialRoute = '/',
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        {/* Manually provide context values to avoid real API calls */}
        <UserContext.Provider value={userCtx}>
          <SettingsContext.Provider value={settingsCtx}>
            <ExchangeProvider summary={summary}>
              {children}
            </ExchangeProvider>
          </SettingsContext.Provider>
        </UserContext.Provider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

/**
 * Lightweight render — only UserContext + MemoryRouter.
 * Use for hook tests that don't need the full tree.
 */
export function renderWithUser(ui, userCtx = defaultUserCtx) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter>
        <UserContext.Provider value={userCtx}>
          {children}
        </UserContext.Provider>
      </MemoryRouter>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
