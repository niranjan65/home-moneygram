# Home App (MH Money Express Frontend & Web Portal) — Project Handover & Developer Guide

## 1. Executive Summary & Purpose

The **Home** application (`apps/home`) is a high-performance Single Page Application (SPA) built using **React 19**, **Vite**, and **Tailwind CSS**, integrated into the **Frappe / ERPNext** backend framework. It serves as the primary teller, cashier, dealer, and customer-facing portal for **MH Money Express (MMEL)**, providing:

1. **Money Transfers (`/money-transfer`)**: Remittance transaction entry with customer lookup, real-time Annual FX & MoneyGram limit checks, optional cash denomination tallying, and professional thermal receipt printing.
2. **Retail Currency Exchange / Forex (`/exchange`)**: Multi-currency Buy and Sell operations with live ERPNext daily master rates, auto-calculated conversions, Reserve Bank of Fiji (RBF) compliance checks, and thermal receipt generation.
3. **Dealer Exchange (`/dealer-exchange`)**: Wholesale foreign currency exchange for commercial dealers with custom rates and settlement tracking.
4. **Reports & Branch Analytics (`/report`)**:
   - **Transaction Records**: Multi-transaction federated view (Retail FX, Dealer FX, Money Transfer) with dedicated transaction type switcher, strict status filter (Paid, Cancelled, All), searchable Customer link filter, and Branch Location selector.
   - **Day End Closing Report**: Teller reconciliation and OET summary by date.
   - **Currency Stock**: Vault inventory balances, valuation rates, and note/coin tallies by currency.
5. **Brand Landing Page (`/` and `/home`)**: Modern zig-zag alternating layout in signature MH Red (`#E00000`) and carbon obsidian theme, featuring a live currency calculator, interactive service showcase, and real-time exchange rate table.

---

## 2. Repository & Remote Configuration

- **Repository Directory**: `/home/erpnext/frappe-mmel/apps/home`
- **Git Remote**: `upstream`
- **Git URL**: `https://github.com/niranjan65/home-moneygram.git`
- **Active Branch**: `main`

---

## 3. Directory Structure & Key Files

```text
apps/home/
├── HANDOVER.md                           <-- Primary developer handover documentation
├── README.md                             <-- Quick-start and app overview
├── pyproject.toml                        <-- Python packaging metadata for Frappe app
├── home/                                 <-- Frappe Python backend wrapper
│   ├── hooks.py                          <-- Frappe hooks and routing
│   ├── modules.txt
│   ├── public/
│   │   └── frontend/                     <-- Production Vite bundle (assets, JS, CSS, images)
│   └── www/
│       └── home.html                     <-- Frappe web template entry (auto-synced from dist)
└── frontend/                             <-- React SPA Source Code
    ├── package.json                      <-- Dependencies & build scripts
    ├── vite.config.js                    <-- Vite configuration (base: /assets/home/frontend/)
    ├── index.html                        <-- HTML template
    └── src/
        ├── App.jsx                       <-- Client-side routing (<BrowserRouter basename="/home">)
        ├── main.jsx                      <-- React root mount point
        ├── context/
        │   ├── SettingsContext.jsx       <-- User profile, branch warehouses, theme, session
        │   ├── ExchangeContext.jsx       <-- Multi-step exchange flow state
        │   └── UserContext.jsx           <-- Frappe authenticated teller user state
        ├── components/
        │   ├── layout/Navbar.jsx         <-- Top navigation bar with active tab high-contrast styling
        │   ├── layout/Footer.jsx         <-- MH Money Express footer with RBF regulatory declaration
        │   ├── MoneyTransferInvoice.jsx  <-- Printable Money Transfer receipt (words & cents, 12h time)
        │   ├── ThermalReceiptPrint.jsx   <-- Thermal POS receipt printer for Forex
        │   ├── DenominationPanel.jsx     <-- Note and coin counting interface
        │   ├── SoldiLanding.jsx          <-- Modern landing page with alternating zig-zag layout
        │   ├── SoldiExchangeForm.jsx     <-- Currency converter card
        │   ├── SoldiAboutSection.jsx     <-- About MH Money Express section
        │   ├── SoldiRatesSection.jsx     <-- Real-time rates table with currency search
        │   ├── why-choose-us.jsx         <-- Value proposition grid
        │   ├── ProtectedRoute.jsx        <-- Session route guard
        │   └── PublicRoute.jsx           <-- Guest route guard
        ├── features/exchange/            <-- Currency Exchange feature slice
        │   ├── components/
        │   │   ├── ReceiverForm.jsx      <-- Main customer retail exchange form
        │   │   ├── DealerForm.jsx        <-- Dealer exchange form
        │   │   └── sections/
        │   │       ├── ExchangeSection.jsx    <-- Rate banner & conversion math
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
            ├── MoneyTransfer.jsx         <-- Money Transfer page with customer limits sidebar
            ├── MoneyExchange.jsx         <-- Retail Forex Buy/Sell page
            ├── DealerExchange.jsx        <-- Dealer wholesale exchange page
            ├── Reports.jsx               <-- Transaction records, Day-end closing & currency stock
            ├── Stocks.jsx                <-- Vault currency inventory
            ├── Login.jsx                 <-- Teller authentication
            └── TransactionHistory.jsx
```

---

## 4. Key Workflows & Architectural Decisions

### 4.1. Money Transfer Remittance Workflow (`MoneyTransfer.jsx`)
- **Customer Verification**:
  - Searches existing `Customer` records in ERPNext by full name and date of birth (`dob`).
  - Automatically loads and displays an **"Existing Customer"** pill when verified.
- **Customer Currency Limits Sidebar**:
  - Positioned outside the main form in a dedicated sticky right-hand column (`lg:col-span-4 lg:sticky lg:top-8`).
  - Displays the **Annual FX & MoneyGram Limit** (`custom_annual_fx_and_moneygram_limit`).
  - Leaves the left-hand form (`lg:col-span-8`) clean and undisturbed in a responsive 2-column layout.
- **Cash Denomination Toggle (`enable_currency_denomination`)**:
  - **Cash Denominations Enabled**: Teller inputs physical notes and coins. The total entered must equal the transfer amount.
  - **Cash Denominations Disabled**: Tellers can submit remittances without entering cash breakdown. The backend handles this gracefully without creating unnecessary Stock Entries.
- **Stock Validation Logic**:
  - **Send (Inward Remittance)**: Stock validation is skipped (`runStockCheck` returns `true`) because customer cash enters the teller drawer, increasing inventory.
  - **Receive (Payout)**: If cash denominations are enabled, stock is validated against ERPNext `Bin` records to prevent overdrafts.
- **Confirmation & Success State**:
  - Displays clean confirmation with formatted currency and amount (`Your transfer of FJD 1,231.00 has been securely processed.`).
  - Customer name and transaction reference are highlighted.
- **Printable Receipt (`MoneyTransferInvoice.jsx`)**:
  - Formatted for POS thermal printers and standard printers.
  - Formats date as `DD/MM/YYYY` and time in clean **12-hour AM/PM format** (`hh:mm:ss AM/PM`), completely stripping internal microseconds.
  - Converts numbers to words (e.g., `One Thousand Two Hundred Thirty One Dollars and Zero Cents Only`).
  - Raw internal customer ID is hidden on customer copy for privacy and professional formatting.

### 4.2. Retail Currency Exchange (Forex) Workflow (`MoneyExchange.jsx`)
- **Rate Source**: Fetched daily from ERPNext `Currency Master Data` via `moneygram.api.get_currency_exchange_rate`.
- **Conversion Math** (in `useExchangeCalculation.js`):
  - **BUY (Customer sells foreign currency, MH pays FJD)**:
    $$\text{receiverAmount (FJD)} = \text{roundTo5Cents}\left(\frac{\text{sendAmount}}{\text{buyingRate}}\right)$$
  - **SELL (Customer buys foreign currency, MH receives FJD)**:
    $$\text{receiverAmount (FJD)} = \text{roundTo5Cents}\left(\frac{\text{sendAmount}}{\text{sellingRate}}\right)$$
- **Regulatory Triggers (Reserve Bank of Fiji)**:
  - If `Available FX Balance` $\le 0$ or $<$ amount: Requires **RBF Approval ID**.
  - If `Annual FX & MG Limit` $\le 0$ or $<$ amount: Requires **Customer TIN Number**.
  - If `Annual Compliance Limit` $\le 0$ or $<$ amount: Requires an uploaded **Tax Clearance Certificate from RBF**.

### 4.3. Transaction Records Report (`Reports.jsx`)
- **Unified Multi-Transaction Query (`get_all_transactions`)**:
  Federates three transaction sources into a single table:
  1. **Retail Currency Exchange**: Sales Invoices linked to `Currency Exchange For Customer`.
  2. **Dealer Exchange**: Wholesale transactions from `Currency Exchange For Dealer`.
  3. **Money Transfer**: Remittances from `Money Transfer` DocType.
- **Status Filter**:
  - `Paid`: Strictly filters submitted/paid transactions (`docstatus = 1`).
  - `Cancelled`: Strictly filters cancelled transactions (`docstatus = 2`).
  - `All`: Returns both active and cancelled transactions (`docstatus IN (1, 2)`).
- **Searchable Customer Link Filter**:
  - Uses `CustomerLinkFilter` dropdown backed by `get_customers_list`.
  - Searches by customer full name or ERPNext customer ID (`Debrup Singha` or `Debrup Singha_2001-02-10`).
- **Branch Location Filter (Replaced "Warehouse")**:
  - All user-facing labels renamed from `Warehouse` to **`Branch Location`** across table headers, dropdowns, search placeholders, CSV export headers, stock views, and receipts.
  - Dropdown defaults to **`All Branch Locations`**, allowing tellers and managers to inspect transactions across all branches or filter by their specific branch.
- **Defensive Client-Side Filtering**:
  - `filtered = rows.filter(...)` applies local filter checks on `selectedStatus`, `selectedType`, `selectedWarehouse`, and `selectedCustomer` as a safety layer so that changing dropdowns instantly updates the view without lag or stale rows.
- **Removed Outstanding Amount**:
  - The Outstanding Amount column and all outstanding calculations were completely removed from the report and CSV exports as transactions are paid upon settlement.
- **Type Badge Reliability**:
  - Type column includes robust fallback rendering (`Currency Exchange`, `Dealer Exchange`, or `Money Transfer`), ensuring badges are never blank.

---

## 5. Build & Deployment Procedure

### 5.1. Standard Frontend Build
Whenever making edits in `apps/home/frontend/`:
```bash
# 1. Navigate to the frontend directory
cd /home/erpnext/frappe-mmel/apps/home/frontend

# 2. Compile production bundle
npm run build
# Note: npm run build automatically runs:
# vite build --base=/assets/home/frontend/ && cp ../home/public/frontend/index.html ../home/www/home.html

# 3. Clear Frappe site cache
bench --site mmel.local clear-cache
```

### 5.2. Verification in Browser
- Open: `http://<server-ip>:83/home` or `http://mmel.local:83/home`
- Always perform a hard refresh (`Ctrl + Shift + R` or `Cmd + Shift + R`) to ensure the browser loads the new hashed Vite bundle.

---

## 6. Multi-Bench Synchronization

The production server hosts two benches:
- **`frappe-mmel`**: Active production bench on Port 83 (`mmel.local`). All daily work is done here.
- **`frappe-bench`**: Secondary bench on Port 80/81 (`adv.abhirup.moneygram`).

If syncing changes from `frappe-mmel` to `frappe-bench`:
```bash
# 1. Sync modified frontend source files
rsync -av /home/erpnext/frappe-mmel/apps/home/frontend/src/ /home/erpnext/frappe-bench/apps/home/frontend/src/

# 2. Build in frappe-bench
cd /home/erpnext/frappe-bench/apps/home/frontend && npm run build
bench --site adv.abhirup.moneygram clear-cache
```

---

## 7. Developer Rules & Gotchas

1. **Do Not Edit `home/www/home.html` Directly**:
   `home.html` is an auto-generated entry point created by Vite and copied by `yarn copy-html-entry`. Always edit `frontend/index.html` or source React components.
2. **Vite Base Path**:
   `vite.config.js` uses `--base=/assets/home/frontend/`. Do not remove or change this path; Frappe desk and web routing rely on it for static asset delivery.
3. **React Router Basename**:
   The router root is `<BrowserRouter basename="/home">`. All internal `<Link>` and `navigate()` paths must be relative to `/home`.
4. **Denomination Sum Validation**:
   When `enable_currency_denomination` is enabled in Money Transfer, the sum of `denomination * qty` MUST match the transaction amount before submission is allowed.
