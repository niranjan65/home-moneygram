# Home App (MH Money Express Frontend & Web Portal) — Project Handover & Developer Guide

## 1. Executive Summary & Purpose

The **Home** application (`apps/home`) is a modern Single Page Application (SPA) built using **React 19**, **Vite**, and **Tailwind CSS**, tightly integrated into the **Frappe / ERPNext** backend framework. It serves as the primary teller, dealer, and cashier-facing point-of-sale terminal for **MH Money Express (MMEL)**, handling:
1. **Money Transfers** (`/money-transfer`): Remittance transactions with automated customer limit verification, denomination tallying, and RBF validation.
2. **Retail Currency Exchange (Forex)** (`/exchange`): Multi-currency Buy/Sell operations with live ERPNext daily master rates, auto-calculated conversions, customer limit checks, RBF/TIN clearance triggers, and receipt printing.
3. **Dealer Exchange** (`/dealer-exchange`): Wholesale currency exchange for commercial dealers with custom rates and settlement tracking.
4. **Denominations & Cash Drawer** (`DenominationPanel`): Real-time note and coin count calculations, stock validation against teller warehouse, and material issue creation.
5. **Reports & Stock Monitoring** (`/report`, `/stocks`): Teller day-end closing reports, vault balances, and transaction history.

---

## 2. Directory Structure & Key Files

```text
apps/home/
├── HANDOVER.md                           <-- This documentation
├── pyproject.toml                        <-- Python packaging for Frappe app
├── home/                                 <-- Frappe python backend module
│   ├── hooks.py                          <-- Frappe hooks and routing
│   ├── modules.txt
│   ├── public/
│   │   └── frontend/                     <-- Built production Vite bundle (assets, html)
│   └── www/
│       └── home.html                     <-- Frappe entry point template (copied from dist)
└── frontend/                             <-- React SPA Source Code
    ├── package.json                      <-- Scripts & dependencies
    ├── vite.config.js                    <-- Vite build configuration (base: /assets/home/frontend/)
    ├── index.html                        <-- HTML entry point
    └── src/
        ├── App.jsx                       <-- Client-side router (BrowserRouter basename="/home")
        ├── main.jsx                      <-- React root entry
        ├── context/
        │   ├── SettingsContext.jsx       <-- User profile, active warehouse, teller configuration
        │   └── ExchangeContext.jsx       <-- Multi-step exchange flow state management
        ├── components/
        │   ├── layout/Navbar.jsx         <-- Top navigation bar with active tab high-contrast styling
        │   ├── MoneyTransferInvoice.jsx  <-- Official printable Money Transfer receipt (words & cents)
        │   ├── SalesInvoice.jsx          <-- Generic Forex thermal invoice template
        │   ├── DenominationPanel.jsx     <-- Note/coin counting interface
        │   ├── SenderCard.jsx            <-- Teller / terminal information banner
        │   ├── ProtectedRoute.jsx        <-- Session route guard
        │   ├── PublicRoute.jsx           <-- Unauthenticated route guard
        │   └── ui/                       <-- Form inputs, badges, modals, and buttons
        ├── features/exchange/            <-- Currency Exchange feature slice
        │   ├── components/
        │   │   ├── ReceiverForm.jsx      <-- Main customer exchange transaction form
        │   │   ├── DealerForm.jsx        <-- Dealer transaction form
        │   │   └── sections/
        │   │       ├── ExchangeSection.jsx    <-- Rate banner (1 FJD = X Forex) & amount converter
        │   │       ├── GovernmentIdSection.jsx<-- Customer lookup, 3-limit rules & RBF compliance
        │   │       └── SourcePurposeSection.jsx
        │   ├── hooks/
        │   │   ├── useCustomer.js        <-- Customer search by ID/DOB & limit auto-fill
        │   │   ├── useERPNextRates.js    <-- Daily buying/selling rate fetcher
        │   │   └── useExchangeCalculation.js <-- Forex arithmetic (sendAmount / effectiveRate)
        │   └── api/
        │       ├── createMoneyTransfer.js
        │       ├── createCurrencyExchange.js
        │       └── customer.js
        └── pages/
            ├── MoneyTransfer.jsx         <-- Money Transfer page with right-hand limit sidebar
            ├── MoneyExchange.jsx         <-- Retail Forex Buy/Sell page
            ├── DealerExchange.jsx        <-- Dealer Exchange page
            ├── Reports.jsx               <-- Transaction records, Day-end closing & currency stock
            ├── Stocks.jsx                <-- Vault currency inventory
            ├── Login.jsx                 <-- Teller authentication
            └── TransactionHistory.jsx
```

---

## 3. Core Workflows & Logic

### 3.1. Currency Exchange Rate Display & Conversion
- **Rate Source**: Fetched from ERPNext `Currency Master Data` via `moneygram.api.get_currency_exchange_rate`.
- **Display Standard**: Rate is displayed as:
  $$\text{Rate: } 1\text{ [FJD.symbol]} = \text{[effectiveRate] [toCurrency.code]}$$
  *(e.g., $1\text{ FJ\$} = 900\text{ KRW}$)*.
- **Conversion Math** (in `useExchangeCalculation.js`):
  - **BUY (Customer sells Forex, MH receives Forex, MH pays FJD)**:
    $$\text{receiverAmount (FJD)} = \text{roundTo5Cents}\left(\frac{\text{sendAmount}}{\text{buyingRate}}\right)$$
  - **SELL (Customer buys Forex, MH pays Forex, MH receives FJD)**:
    $$\text{receiverAmount (FJD)} = \text{roundTo5Cents}\left(\frac{\text{sendAmount}}{\text{sellingRate}}\right)$$
  - **Zero Regression Rule**: Never alter `sendAmount / effectiveRate` or `roundTo5Cents` without accounting approval.

### 3.2. Money Transfer Workflow, Validation & Invoicing
- Located in `src/pages/MoneyTransfer.jsx`.
- **Customer Verification**: Searching by `full_name` and `dob` queries `Customer` via Frappe API.
- **Customer Currency Limits Sidebar**:
  - Positioned outside the form in a dedicated right-hand column (`lg:col-span-4 lg:sticky lg:top-8`).
  - Displays **Annual FX & MG Limit** (`custom_annual_fx_and_moneygram_limit`).
  - Shows an **"Existing Customer"** status pill once verified.
  - Leaves the left-hand form (`lg:col-span-8`) completely clean and undisturbed in its standard 2-column layout.
- **Transaction Types & Stock Validation Logic**:
  - **Send (Customer pays cash in)**:
    - Stock validation is **skipped** (`runStockCheck` returns `true`) because customer cash is entering the teller's drawer/vault, increasing stock.
  - **Receive (Customer collects payout cash out)**:
    - If denomination counting is enabled and rows are selected, **stock validation is mandatory** (`runStockCheck` validates vault balances via ERPNext API). If teller stock is insufficient for the requested banknotes/coins, submission is blocked.
  - **Denomination Toggle**:
    - When `enable_currency_denomination` is turned off, denomination rows are omitted and stock check is bypassed.
- **Dedicated Receipt Printing (`MoneyTransferInvoice.jsx`)**:
  - Embedded in hidden print template `<MoneyTransferInvoiceDocument>`.
  - Formats Money Transfer receipts with official MH Money Express branding, number-to-words currency breakdown (dollars and cents), sender/receiver details, teller ID, and transaction reference.

### 3.3. Customer Compliance Triggers (RBF Rules)
Enforced in `GovernmentIdSection.jsx` and backend:
1. **Available FX Balance** ($\le 0$ or $<$ transfer amount): Requires **RBF ID / Approval Number**.
2. **Annual FX & MG Limit** ($\le 0$ or $<$ transfer amount): Requires **Customer TIN Number**.
3. **Annual Compliance Limit** ($\le 0$ or $<$ transfer amount): Requires **Tax Clearance Document from RBF** (PDF/Image file upload).

### 3.4. Teller Authentication & Session Management
- Stored in `localStorage.getItem("erpnext_session")`.
- Structure: `{ sessionActive: true, user: { name, email, api_key, api_secret }, warehouse: "..." }`.
- `SettingsContext.jsx`: Resolves user details via `userData.message.username || userData.message` to populate teller first name, phone, email, and active teller warehouse.
- Protected routes redirect unauthenticated users to `/login`.

### 3.5. Landing Page Architecture & Zig-Zag ("Back-and-Forth") Layout
- Primary component: `src/components/SoldiLanding.jsx` (routed at `/` and `/home`).
- **MH Money Express Design System**:
  - Replaces arbitrary maroons and neon-greens with signature MH Red (`#E00000`, `#C50000`), frosted glass cards (`bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl`), and dark carbon obsidian accents (`from-gray-950 to-[#1e0404]`).
- **Alternating "Back-and-Forth" Rhythm**:
  1. **Hero**: Headline, value proposition, CTAs, and 4-metric stat cards on the **LEFT**; interactive `PhoneMockup` POS hardware with live rate tickers on the **RIGHT** (replaces broken `absolute left-72`).
  2. **Calculator (`SoldiExchangeForm.jsx`)**: Centered glassmorphic currency exchange converter with quick swap.
  3. **Core Features**: 3-column dark glass cards with MH Red accents.
  4. **About MH Money Express (`SoldiAboutSection.jsx`)**: Visual photo and 25+ years experience badge on the **LEFT**; interactive service selector and compliance benefits on the **RIGHT** (reversed from Hero).
  5. **Working Process (`WorkingProcess.jsx`)**: 3-step sequence (01. Select Currency $\rightarrow$ 02. Verify ID & RBF $\rightarrow$ 03. Fast Cash Payout).
  6. **Why Choose Us (`why-choose-us.jsx`)**: Key advantages on the **LEFT**; brand graphic on the **RIGHT**.
  7. **Live Rates Table (`SoldiRatesSection.jsx`)**: Real-time ERPNext master exchange rates table with currency search, flag icons, and high-visibility Buy/Sell pills.
  8. **Footer (`Footer.jsx`)**: Official MH Money Express footer with RBF regulatory declaration, quick links, and Suva head office contacts.

### 3.4. Transaction Records Report & Multi-Transaction Federation
- Located in `src/pages/Reports.jsx` (`TransactionsTab`).
- **Federated Unified Query**:
  - Unifies three distinct transaction sources into a single consistent record stream via `get_all_transactions`:
    1. **Retail Currency Exchange**: Sales Invoices linked to `Currency Exchange For Customer`.
    2. **Dealer Exchange**: Wholesale transactions from `Currency Exchange For Dealer` (with fallback to direct dealer doc data).
    3. **Money Transfer**: Remittances from `Money Transfer` DocType (`amount` mapped to `grand_total`, status `Paid` when `docstatus=1`, `Cancelled` when `docstatus=2`).
- **Removal of Outstanding Amount**:
  - The Outstanding Amount column, footer calculations, and CSV export fields have been completely removed as requested, presenting only the realized transaction Amount and Paid totals.
- **Dedicated Transaction Type Switcher**:
  - Dedicated pill buttons for instant switching: **All Transactions**, **Currency Exchange**, **Dealer Exchange**, and **Money Transfer** with dynamic record counts.
- **ERPNext Customer Link Field Filter**:
  - Searchable dropdown (`CustomerLinkFilter`) populated via `get_customers_list`. Supports search-as-you-type by customer name or ERPNext ID, with a clear `✕` button to instantly revert to All Customers.
- **Multi-Type Receipt & Cancellation Actions**:
  - **Cancellation**: Dispatches appropriate cancellation calls per type (e.g. `cancel_currency_exchange` for Retail FX, docstatus update for Dealer, and `frappe.client.cancel` for Money Transfer).
  - **Receipt Printing**: Calls `printThermalReceipt` for Forex and `printMoneyTransferReceipt` for Money Transfer.

---

## 4. Build & Deployment Procedure

### 4.1. Fast Build (Active Bench: `frappe-mmel`)
When making changes to any file in `apps/home/frontend/src/`:
```bash
# 1. Navigate to the frontend directory
cd /home/erpnext/frappe-mmel/apps/home/frontend

# 2. Build the production bundle
npm run build
# Note: npm run build automatically runs:
# vite build --base=/assets/home/frontend/ && cp ../home/public/frontend/index.html ../home/www/home.html

# 3. Clear the Frappe site cache
bench --site mmel.local clear-cache
```

### 4.2. Verify in Browser
- URL: `http://<server-ip>:83/home` or `http://mmel.local:83/home`
- Always perform a hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac) to bypass stale service worker/browser caches.

---

## 5. Multi-Bench Synchronization

In this server environment, there are two benches:
- **`frappe-mmel`** (Primary active production bench, Port 83, site `mmel.local`).
- **`frappe-bench`** (Secondary bench, Port 80/81/8009).

If keeping both benches identical:
```bash
# Copy frontend changes to frappe-bench
cp /home/erpnext/frappe-mmel/apps/home/frontend/src/pages/MoneyTransfer.jsx /home/erpnext/frappe-bench/apps/home/frontend/src/pages/MoneyTransfer.jsx
cp /home/erpnext/frappe-mmel/apps/home/frontend/src/components/layout/Navbar.jsx /home/erpnext/frappe-bench/apps/home/frontend/src/components/layout/Navbar.jsx
cp /home/erpnext/frappe-mmel/apps/home/frontend/src/features/exchange/components/sections/ExchangeSection.jsx /home/erpnext/frappe-bench/apps/home/frontend/src/features/exchange/components/sections/ExchangeSection.jsx

# Build in frappe-bench
cd /home/erpnext/frappe-bench/apps/home/frontend && npm run build
bench --site adv.abhirup.moneygram clear-cache
```

---

## 6. Git Workflow

- **Remote**: `upstream`
- **URL**: `https://github.com/niranjan65/home-moneygram.git`
- **Branch**: `main`

### Routine Commit & Push
```bash
cd /home/erpnext/frappe-mmel/apps/home
git status
git add -A
git commit -m "Your descriptive commit message"
git push upstream main
```

---

## 7. Developer Rules & Gotchas

1. **Never edit `home/www/home.html` directly**: It is an auto-generated entry point overwritten by `yarn copy-html-entry` during `npm run build`. Always edit `frontend/index.html` or source React components.
2. **Vite Base Path**: Must remain `--base=/assets/home/frontend/`. Changing this breaks asset resolution in Frappe desk/web pages.
3. **React Router Basename**: The router uses `<BrowserRouter basename="/home">`. All sub-routes must be defined relative to this basename.
4. **Mandatory Denomination Validation**: When cash denominations are enabled in Money Transfer, the total entered denomination value must match the transaction amount before submission.
