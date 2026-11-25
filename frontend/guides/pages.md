# MH Money Express Frontend — Comprehensive Pages Guide

This document describes the structure, behavior, UI components, and business logic of all pages in the `apps/home/frontend` application.

The application serves as the primary Point of Sale (POS), Forex Dealing, and Remittance Portal for **MH Money Express (MMEL)** tellers, vault custodians, and branch managers, integrated with the ERPNext backend.

---

## Architecture & Navigation Overview

- **Application Router:** React Router DOM configured with `basename="/home"`. All URL paths below are relative to `/home`.
- **Route Protections:**
  - **`PublicRoute`**: Accessible only when unauthenticated (e.g., `/login`).
  - **`ProtectedRoute`**: Requires an active ERPNext session.
  - **`PosRouteGuard`**: Ensures the user's active branch cash counter is currently **Open** before allowing money handling operations. If the counter is closed or requires opening, the user is redirected to `/pos` or `/pos/open`.

---

## Core Customer Handling & Page Relationship Rules

1. **Exchange vs Exchange-New Equivalence:**
   - `/exchange` and `/exchange-new` are functionally the same page under the hood. They execute the exact same business logic, rate queries, validations, and ERPNext transaction submissions. The only difference is that `/exchange-new` features an **updated, modernized UI layout** with enhanced card designs and tabbed navigation.
2. **Money Transfer vs Money-Transfer-New Equivalence:**
   - Similarly, `/money-transfer` and `/money-transfer-new` are functionally identical. Both handle outbound MoneyGram remittances and inbound payouts. The only difference is that `/money-transfer-new` provides an **updated, modernized UI** with unified navigation tabs (`TransactionTabBar`).
3. **Full Name Search & On-the-Fly Customer Creation:**
   - Both Exchange pages (`/exchange`, `/exchange-new`) and both Money Transfer pages (`/money-transfer`, `/money-transfer-new`) feature a **Full Name** input field.
   - **Searching Existing Customers:** Typing in the Full Name field performs a live search against existing customers in ERPNext, allowing the teller to select a matched customer to auto-fill their profile, ID documents, and contact details.
   - **Creating New Customers:** If a new customer name is entered (or no match is selected), tellers can input their ID and contact information. When the transfer or exchange transaction is submitted and proceeds, the system **automatically creates a new Customer record** in ERPNext from that data.
4. **Customer Group Filtering (`Dealer` vs Non-Dealer):**
   - **In Dealer Exchange (`/dealer-exchange`):** Has a similar Full Name search/creation field, but customers are strictly filtered by **`customer_group == "Dealer"`**. Only registered wholesale institutional dealers appear in the search results, and new entries created here are assigned to the Dealer group.
   - **In Retail Pages (`/exchange`, `/exchange-new`, `/money-transfer`, `/money-transfer-new`):** The customer lookup explicitly filters for **`customer_group != "Dealer"`**. This ensures retail customers and institutional wholesale dealers remain strictly segregated.
5. **Editing Existing Customer Data & Storage Architecture (Master Data vs. Transactional DocTypes):**
   - **Live Editing of Existing Customer Details:** When an existing customer is retrieved in Money Transfer, Currency Exchange, or Dealer Exchange, tellers can edit their information directly in the form inputs.
   - **Master Data Updates (`Customer` DocType):** Core customer identification and regulatory compliance fields update directly on the master `Customer` record in ERPNext:
     - **Risk Level** (`custom_risk_level` / `risk_level`): e.g., Low, Medium, High (updated via `updateCustomerRiskLevel` / `updateCustomer`).
     - **TIN Number** (`custom_tin_number`).
     - **Government ID Numbers & Types** (Passport, Driver's Licence, Voter ID, TIN Card).
   - **Transactional DocType Storage:** Transaction-specific details and snapshot records are stored directly on the respective transaction DocTypes:
     - **`Money Transfer`** (for MoneyGram send/receive remittances)
     - **`Currency Exchange For Customer`** (for retail foreign currency exchange trades)
     - **`Currency Exchange For Dealer`** (for institutional wholesale dealer forex trades)
     - These DocTypes store fields such as the customer's current address, immediate contact numbers, travel itinerary / ticket details, purpose of transaction (POT), source of funds, and receiver details.
   - **Audit & Historical Integrity:** This separation ensures that past transaction records preserve the exact address and contact details as they existed at the time of the transaction, while master compliance credentials (TIN, Risk Level, IDs) stay updated on the central `Customer` master record.

6. **User Switching, Form Resetting & Amount Section Preservation:**
   - **Form Reset Exclusively on Selecting an Existing Customer:** When the teller changes a customer by selecting one from the existing customer dropdown list, the form resets its customer-specific fields and cleanly loads that customer's stored details (preventing leftover fields from any previously selected profile).
   - **No Reset on Manual Typing or Editing:** Typing, editing, or entering a new customer name into the Full Name field does **not** trigger a form reset. Tellers can freely type or edit without wiping entered form fields.
   - **Amount Section Is Never Cleared:** Changing the customer or selecting an existing customer from the search dropdown **never clears the amount section** (including transaction amount, send amount, manual rate, denomination count, and currency calculation states). Tellers can adjust or pick a customer at any point without losing entered amounts.
   - **Cursor / Focus Remains In Place:** Changing or selecting a customer never forces the cursor to jump to the amount input field. Focus remains natural and uninterrupted.
   - **Strict Customer & Transaction Type Matching for Auto-Fill:**
     - Auto-fill requires that **both the Customer AND the specific transaction/exchange type match**:
       - **Currency Exchange (`BUY` vs `SELL`):** If a customer has a past record of a `BUY` exchange and is now performing a `SELL` exchange (or vice versa), only customer master details (name, date of birth, photo, phone, TIN, govt ID) coming from the `Customer` DocType will auto-fill. All travel, flight, ticket, and transaction compliance fields stay completely empty.
       - **Money Transfer (`Send` vs `Receive`):** If a customer has a past `Send` transfer and is now performing a `Receive` transfer (or vice versa), receiver details and remittance compliance fields stay completely empty; only the customer's master profile details are populated.
     - **Toggling Transaction Types:** Switching between BUY and SELL tabs (or Send and Receive tabs) dynamically re-evaluates the form. If the selected customer has no past history for the newly selected type, the transaction-specific fields remain clean and empty while preserving master customer data and entered amounts.

---

7. **Core Cash Denomination & Settlement Rules (Retail Exchange, Dealer Exchange, Money Transfer):**
   - **Currency In vs. Currency Out Definitions:**
     - **Currency In:** Represents physical cash **received by the teller from the customer** into the drawer.
     - **Currency Out:** Represents physical cash **disbursed by the teller to the customer** from the drawer.
   - **Currency Flow Across Trade Directions (Retail & Dealer Exchange):**
     - **BUY Forex (Teller Buys Foreign Currency, Pays FJD):**
       - **Currency In:** Foreign Currency (e.g., AUD). The target amount is the entered foreign currency value (`sendAmount`). Drawer stock check is bypassed (`enforceStockLimit={false}`) because cash is entering the counter.
       - **Currency Out:** Local FJD. The target amount is the calculated local payout (`receiverGets`). Till drawer stock is strictly enforced (`enforceStockLimit={true}`) because cash is being disbursed from the counter.
     - **SELL Forex (Teller Sells Foreign Currency, Collects FJD):**
       - **Currency In:** Local FJD. The target amount is the calculated local amount (`receiverGets`). Drawer stock check is bypassed (`enforceStockLimit={false}`).
       - **Currency Out:** Foreign Currency (e.g., AUD). The target amount is the foreign currency value (`sendAmount`). Till drawer stock is strictly enforced (`enforceStockLimit={true}`) to ensure sufficient foreign notes are in stock.
     - **Dealer Wholesale Exchange (`/dealer-exchange`):** Applies the exact same Currency In / Currency Out mapping and stock limit enforcement rules.
   - **Stock Availability Checking (`runStockCheck`):**
     - Validation runs strictly against the currency being **disbursed to the customer (`Currency Out`)**, eliminating false "out of stock" alerts when receiving cash from a customer.
   - **Money Transfer Settlement (`Send` vs `Receive`):**
     - **Send Remittance:** Customer pays FJD cash $\implies$ stock limits are not enforced on accepted cash.
     - **Receive Payout:** Customer receives FJD payout from teller $\implies$ counter drawer stock limits are enforced (`enforceStockLimit={true}`).
   - **Denomination Panel UI & Layout (`DenominationPanel`):**
     - **Stacked Sub-label Layout:** 3-column structured grid (`Denomination`, `Count`, `Subtotal`) with enlarged, legible typography (`text-sm font-bold`).
     - **Live Stock in Drawer ("in till"):** Live stock count for each note and coin denomination is queried directly from the active warehouse.
     - **`999999+` Quantity Threshold:** If available quantity in the counter exceeds 999,999, it displays **`999999+ in till`**. For quantities $\le 999,999$, the exact formatted count is shown (e.g. `1,250 in till`). Hovering over the badge shows the exact drawer quantity in a tooltip.
     - **Interactive Controls:** Stepper increment/decrement buttons (`+` / `-`), typed input with numeric bounds (`CurrencyInput`), and a quick `X` row clear button.

---

## 1. Landing & Operations Hub (`/` and `/home`)

- **Component File:** `apps/home/frontend/src/components/SoldiLanding.jsx` (with alternative public template in `apps/home/frontend/src/pages/Home.jsx`)
- **Route Path:** `/home/` and `/home/home`
- **Access:** Protected Route (renders `SoldiLanding`)
- **What the Page Has:**
  - **Header & Navbar:** MH Money Express branding, active branch indicator, navigation links to all operational modules, and user profile avatar.
  - **Hero Section:**
    - Live MoneyGram and FX service value propositions.
    - Quick Action CTAs: **Transfer Money** (`/money-transfer`), **Exchange Currency** (`/exchange`), and **Dealer Wholesale** (`/dealer-exchange`).
    - KPI Metrics: Global volume, currencies supported, and RBF (Reserve Bank of Fiji) compliance licensing badges.
  - **Interactive Mobile Terminal Mockup:** Visual terminal widget displaying live mid-market rate ticker (`1 FJD = 0.4430 USD`), active vault cash balance, and quick transaction shortcuts.
  - **Live Exchange Calculator (`SoldiExchangeForm`):** Real-time currency conversion widget for customer quotes.
  - **Information Sections:** `SoldiAboutSection`, `WorkingProcess`, `WhyChooseUs`, `PopularCountries`, and footer.
- **What It Does:**
  - Serves as the operational launchpad for tellers upon completing register opening or login.
  - Provides quick access to customer quotes, daily foreign currency exchange rates, and transaction workflows.

---

## 2. Login Page (`/login`)

- **Component File:** `apps/home/frontend/src/pages/Login.jsx`
- **Route Path:** `/home/login`
- **Access:** Public Route (redirects authenticated users)
- **What the Page Has:**
  - Branded login card with MH Money Express logo.
  - Email / Username and Password input fields with show/hide password toggle.
  - Submit button with loading spinner and inline error message alerts.
  - Links to customer support.
- **What It Does:**
  - Authenticates users against the ERPNext authentication API (`/api/method/login`).
  - Fetches CSRF tokens and user session details (`user_type`, assigned `warehouse`, and permitted `warehouses`).
  - Stores active session data in React Context (`UserContext`) and persists the selected branch warehouse in `localStorage`.
  - **Intelligent Post-Login Redirection:**
    - If user is **Administrator/Admin**: Redirects to ERPNext Desk (`/app`).
    - If user has **no assigned branch warehouse**: Redirects to `/settings` to choose an active location.
    - If user has an assigned branch: Queries Cash Counter status via `/api/method/moneygram.moneygram.api.custom_pos.get_cash_counter_status`:
      - If register is already **open** or disabled: Redirects directly to `/home`.
      - If register **needs opening**: Redirects immediately to `/pos/open`.

---

## 3. Cash Counter Register Management (`/pos`, `/pos/open`, `/pos/close`, `/pos/approvals`)

- **Component File:** `apps/home/frontend/src/pages/CustomPos.jsx`
- **Route Paths:**
  - `/home/pos` — Cash counter dashboard & status
  - `/home/pos/open` — Shift start / Open Register count
  - `/home/pos/close` — Shift end / Close Register count & vault sweep
  - `/home/pos/approvals` — Manager review & exception approval queue
- **Access:** Protected Route
- **What the Page Has:**
  - **Status Header:** Displays active location (warehouse), register status badge (`Open`, `Needs Opening`, `Waiting for Approval`, `Recount Required`, `Overdue`, `Closing`), and session refresh button.
  - **Denomination Counting Form (`CountForm`):**
    - Country & Currency selector with accordion breakdown for all configured notes and coins (FJD, USD, AUD, EUR, NZD, GBP, JPY, CAD, etc.).
    - Denomination input grid: Denomination face value, expected quantity (on closing), counted quantity input, and quick step buttons (+/-).
    - Summary sidebar: Total counted cash per currency, remarks input field for notes to management.
    - Closing option: Checkbox to automatically **"Transfer counted cash to this location’s vault after closing"**.
  - **Count Record Viewer (`CountRecord` & `CurrencyCountReport`):** Expandable breakdown showing recorded physical quantities, expected balances, variance amounts, and status.
  - **Manager Approvals Queue (`ManagerReviews`):**
    - List of pending count records with discrepancies waiting for review.
    - Currency variance summary highlighting overages (+) and shortages (-).
    - Manager remarks text area and action buttons: **Approve** and **Recount Required**.
  - **Manager Dashboard Overview (`ManagerDashboardSummary`):** KPI summary cards (All records, Opening counts, Closing counts, Pending approval) and recent count history table.
- **What It Does:**
  - Enforces mandatory daily cash controls at the teller counter.
  - **Open Register Workflow (`/pos/open`):** Tellers physically count cash in drawer at shift start. Compares count against system opening balance. If zero discrepancy, register status becomes `open` and transactions are unlocked. If discrepancy exceeds tolerance, triggers manager review.
  - **Close Register Workflow (`/pos/close`):** Reconciles cash drawer against all transactions conducted during shift (remittances, forex trades, vault sweeps). Supports automated vault return.
  - **Manager Exception Handling (`/pos/approvals`):** Allows authorized managers to sign off on count variances or demand an immediate recount before transactions continue.

---

## 4. Money Transfer — MoneyGram Send & Receive (`/money-transfer`)

- **Component File:** `apps/home/frontend/src/pages/MoneyTransfer.jsx`
- **Route Path:** `/home/money-transfer`
- **Access:** Protected Route, guarded by `PosRouteGuard`
- **What the Page Has:**
  - **Transfer Direction Switcher:** Toggle between **Send Money** (outbound remittance) and **Receive Money** (inbound MoneyGram payout).
  - **Customer Identification, Search & Editing (Non-Dealer):**
    - **Full Name Input:** Allows typing to search existing retail customers where `customer_group != "Dealer"`.
    - Also supports search by Customer ID, Passport, Phone Number, or Email.
    - **Live Editing:** Tellers can modify the customer's data on the page (e.g. updating risk level, phone number, address, or TIN).
    - **Data Persistence:**
      - Master fields like **Risk Level** (`custom_risk_level`) and **TIN Number** (`custom_tin_number`) are updated directly in the master `Customer` DocType.
      - Personal details and transaction-specific data like address, current contact number, and receiver information are stored on the `Money Transfer` DocType record.
    - **Auto-Creation:** If a new name is entered, when the money transfer proceeds, the system creates a new retail customer record in ERPNext with the entered details.
    - **User Switching & Amount Preservation:** Selecting an existing customer from the dropdown resets customer fields to cleanly populate that customer's profile, while strictly **preserving the amount section** (amount is never cleared). Typing or modifying the customer name does not reset the form.
    - Customer photo capture card (`CustomerPhotoCard`) with webcam snapshot support or image upload.
    - ID Document validation with automatic expiry warning badges (Expired, Expiring Soon, Valid).
    - **Identification Documents Upload Table (`DocumentUploadTable`):** Supports uploading government identity documents, passports, and proof of address. Auto-filled documents from customer records or previous transactions are marked with an "Autofilled" badge; tellers cannot edit auto-filled documents in place. Only the delete action is available on auto-filled documents so tellers can remove them and upload a fresh document if changes are needed. Newly uploaded documents support full editing.
    - Risk Level categorization (Low, Medium, High).
  - **Remittance Calculation Panel (`TransferAmountSection`):**
    - Send Amount, Payout Amount, Exchange Rate, and MoneyGram fee calculation.
    - Purpose of Transaction (POT) and Source of Funds selection.
    - Outward Exchange Transaction (OET) code selection.
  - **RBF Compliance Section (`RbfComplianceSection`):**
    - Reserve Bank of Fiji regulatory thresholds, declaration checkboxes, tax clearance / source of wealth document upload table (`DocumentUploadTable`).
  - **Denomination Panel (`DenominationPanel`):**
    - Denomination breakdown for physical cash collected (Send) or physical cash paid out (Receive).
    - Features the Stacked Sub-label layout displaying live till drawer inventory ("in till") with the `999999+` threshold format.
    - Automatic change, variance calculation, and counter stock enforcement on Receive payouts to ensure exact physical cash settlement.
  - **Split Payout Options:** Allows splitting large payout transactions across cash and bank deposits.
  - **Invoice & Thermal Slip Generator:** Viewable modal and printable receipt (`MoneyTransferInvoiceDocument`).
- **What It Does:**
  - Conducts MoneyGram send and receive transactions integrated with ERPNext DocTypes.
  - Validates customer KYC against regulatory databases, validates ID expiry, and tracks AML/CFT limits.
  - Verifies local cash counter balance before executing payouts.
  - Records the remittance transaction on the `Money Transfer` DocType, updates master `Customer` fields (risk level, TIN), creates the retail customer account if new, uploads compliance files, and generates thermal customer receipts.

---

## 5. Modernized Money Transfer Portal (`/money-transfer-new`)

- **Component File:** `apps/home/frontend/src/pages/MoneyTransferNew.jsx`
- **Route Path:** `/home/money-transfer-new`
- **Access:** Protected Route, guarded by `PosRouteGuard`
- **Relationship to `/money-transfer`:**
  - **Functionally identical to `/money-transfer`:** Executes the same remittance logic, validations, customer search/editing/creation rules (`customer_group != "Dealer"`), master data updates (Risk Level, TIN) on `Customer`, transaction-specific storage on `Money Transfer`, RBF checks, and ERPNext integration.
  - **Difference:** Features an **updated, modernized UI layout** with the `TransactionTabBar` for instant tab switching across transactions, the **Top Board Rates Bar (`BoardRatesBar`)** live exchange rate scrolling marquee, modernized `TransferAmountSection`, `CurrencyInput`, `DenominationPanel`, and `CustomerPhotoCard`.

---

## 6. Currency Exchange / Retail Forex (`/exchange`)

- **Component File:** `apps/home/frontend/src/pages/MoneyExchange.jsx`
- **Route Path:** `/home/exchange`
- **Access:** Protected Route, guarded by `PosRouteGuard`
- **What the Page Has:**
  - **Customer Identification, Search & Editing (Non-Dealer):**
    - **Full Name Input:** Allows typing to search from existing retail customers with `customer_group != "Dealer"`.
    - **Live Editing:** Tellers can update the customer's risk level, TIN, or ID numbers on-the-fly. Changes to risk level and TIN update the master `Customer` DocType, while the current address and travel details are captured on the `Currency Exchange For Customer` DocType.
    - **Auto-Creation:** If a new customer name is entered, when the currency exchange proceeds, the system creates a new Customer record in ERPNext.
    - **User Switching & Amount Preservation:** Selecting an existing customer from the dropdown resets the customer form fields while **never clearing the amount section** (`sendAmount`, `manualRate`, denomination rows). Editing or typing in the Full Name field does not reset the form.
  - **4-Step Transaction Stepper:**
    - `Step 1: ESTIMATE` — Currency pair selection, Buy/Sell toggle, amount converter, live exchange rate display.
    - `Step 2: DETAILS` — Customer information card (`SenderCard`), receiver details (`ReceiverForm`), ID documentation, airline ticket verification (for travel allowances), and customer photo capture.
    - `Step 3: REVIEW` — Complete trade summary: FX currency amount, exchange rate, local FJD total, transaction fees, and customer identity verification summary.
    - `Step 4: PAYMENT` — Denomination reconciliation for foreign currency notes and local FJD cash:
      - **BUY Mode:** Currency In is Foreign Currency (`sendAmount`); Currency Out is Local FJD (`receiverGets`).
      - **SELL Mode:** Currency In is Local FJD (`receiverGets`); Currency Out is Foreign Currency (`sendAmount`).
      - Validates counter stock strictly on Currency Out (disbursed cash) with live "in till" drawer inventory badges (`999999+` threshold).
  - **Success Screen (`TransferSuccess`):** Displays generated transaction number and print receipt action.
- **What It Does:**
  - Manages retail foreign currency exchange operations:
    - **BUY Mode:** MMEL buys foreign notes from customer and pays out FJD cash.
    - **SELL Mode:** MMEL sells foreign notes to customer and collects FJD cash.
  - Searches existing non-dealer customers, supports editing master details (Risk Level, TIN), or automatically registers a new customer upon completing the trade.
  - Stores transaction-specific address and travel details on the `Currency Exchange For Customer` record.
  - Validates branch stock availability before selling foreign currency notes (`useStockValidation`).
  - Enforces Reserve Bank of Fiji (RBF) travel allowance limits and travel document attachments.
  - Creates ERPNext currency exchange records, adjusts branch multi-currency inventory, and prints thermal customer receipts.

---

## 7. Modernized Currency Exchange Portal (`/exchange-new`)

- **Component File:** `apps/home/frontend/src/pages/MoneyExchangeNew.jsx`
- **Route Path:** `/home/exchange-new`
- **Access:** Protected Route, guarded by `PosRouteGuard`
- **Relationship to `/exchange`:**
  - **Functionally identical to `/exchange`:** Executes the same 4-step retail exchange workflow, BUY/SELL mechanics, customer search/editing/creation rules (`customer_group != "Dealer"`), master data updates (Risk Level, TIN) on `Customer`, transaction-specific storage on `Currency Exchange For Customer`, stock checks, and ERPNext document creation.
  - **Difference:** Features an **updated, modernized UI layout** with the unified `TransactionTabBar`, the **Top Board Rates Bar (`BoardRatesBar`)** live exchange rate scrolling marquee, modernized summary cards, redesigned sender/receiver forms, and upgraded completion screens (`TransferSuccessNew`).

---

## 8. Dealer Wholesale Exchange (`/dealer-exchange`)

- **Component File:** `apps/home/frontend/src/pages/DealerExchange.jsx`
- **Route Path:** `/home/dealer-exchange`
- **Access:** Protected Route, guarded by `PosRouteGuard`
- **What the Page Has:**
  - **Dealer Customer Search, Editing & Creation (`customer_group == "Dealer"`):**
    - **Full Name Input:** Allows tellers to search existing dealer records or enter a new corporate dealer name.
    - **Key Difference:** Specifically filtered by **`customer_group == "Dealer"`**. It only searches accredited dealer institutions, commercial banks, and corporate partners. If a new name is entered, the created customer is assigned to the `Dealer` customer group.
    - **Editing & Data Storage:** Allows editing the dealer's profile (e.g. Risk Level, corporate TIN, authorized representative). Master compliance fields update on the `Customer` DocType, while trade-specific addresses, settlement accounts, and delivery instructions are stored on the `Currency Exchange For Dealer` DocType.
    - **User Switching & Amount Preservation:** Selecting an existing dealer from the dropdown resets dealer-specific details while strictly preserving the amount section and entered rates. Typing or editing in the dealer name input does not reset the form.
  - **Top Board Rates Bar (`BoardRatesBar`):** Top scrolling marquee displaying live currency exchange rates against 1 unit of base FJD, automatically fetched and rendered via the standalone `BoardRatesBar` component.
  - **Wholesale Navigation Bar (`TransactionTabBar`):** Fast navigation between wholesale and retail modules.
  - **Dealer Progress Checklist:** Real-time completion tracker monitoring Amount Verified, Dealer Verified, Documents Attached, and Cash Reconciled.
  - **Section Quick-Jumper:** Smooth scrolling to Exchange Details, Customer Info, Documents, and Cash Denominations.
  - **Dealer Information Form (`DealerForm`):**
    - Selection of accredited corporate dealer or institutional partner.
    - Authorized representative credentials, TIN / Business registration numbers.
    - Negotiated wholesale exchange rates and volume pricing.
  - **High-Volume Denomination Panel:** Built for high-volume note counting and settlement, operating under the exact same Currency In / Currency Out trade mapping (Forex In / FJD Out for BUY, FJD In / Forex Out for SELL) with live drawer stock badges and `999999+` formatting.
- **What It Does:**
  - Handles high-value B2B foreign currency transactions between MH Money Express and licensed dealers, banks, or corporate clients.
  - Updates master dealer records (TIN, Risk Level) on `Customer` while recording transaction-level data on `Currency Exchange For Dealer`.
  - Applies institutional pricing rules and custom dealer margins.
  - Enforces corporate compliance and dual-signoff document collection.

---

## 9. Vault Transfer & Cash Replenishment (`/vault-transfer`, `/transfer`)

- **Component File:** `apps/home/frontend/src/pages/VaultTransfer.jsx`
- **Route Paths:** `/home/vault-transfer` and `/home/transfer` (redirects to vault transfer)
- **Access:** Protected Route, guarded by `PosRouteGuard`
- **What the Page Has:**
  - **Direction Selector:**
    - **Vault -> Cash Counter (Replenish):** Teller withdraws cash from branch main vault into the till.
    - **Cash Counter -> Vault (Deposit):** Teller deposits surplus till cash into branch main vault.
  - **Transfer Mode:** Single Currency or Multi-Currency Bulk Transfer.
  - **Denomination Grid:** Interactive note and coin matrix displaying live stock availability in source warehouse, entered quantities, and subtotal value.
  - **Interactive CRED-Style Slider (`CredSlider`):** Swipe/drag-to-confirm slider preventing accidental or double submissions.
  - **Thermal Transfer Slip Generator:** Produces receipt with dual signature lines (Teller Signature & Vault Custodian Signature).
- **What It Does:**
  - Manages internal movements of cash between a branch's secure vault and teller cash drawers.
  - Verifies sufficient balances in the origin warehouse before allowing transfers.
  - Submits ERPNext `Stock Entry` of type `Material Transfer` to update inventory levels in both warehouses.

---

## 10. Inter-Branch Stock & Cash Transfer (`/branch-transfer`)

- **Component File:** `apps/home/frontend/src/pages/BranchTransfer.jsx`
- **Route Path:** `/home/branch-transfer`
- **Access:** Protected Route, guarded by `PosRouteGuard`
- **What the Page Has:**
  - **Step 1: Route Selection Gate:**
    - Source Branch (`From Branch`): Restricted to branches the logged-in user is authorized to access.
    - Destination Branch (`To Branch`): Selectable active MMEL branches across the country.
    - "Confirm Route" gate locking selection before entering cash details.
  - **Step 2: Currency, Live Rates & Denominations:**
    - Currency selector with real-time stock balances and ERPNext FJD conversion rates.
    - Source Branch Foreign Denomination Breakdown (physical notes/coins counted).
    - Destination Branch physical FJD reconciliation toggle.
    - Remarks and courier/dispatch notes.
  - **Branch Transfer Voucher:** Thermal slip printing detailing branch locations, currency breakdown, exchange rate, and dual dispatch/receipt sign-offs.
- **What It Does:**
  - Coordinates physical currency shipments and rebalances between different MMEL branch locations (e.g., Suva Main to Nadi Airport).
  - Validates that source branch possesses sufficient physical quantities before dispatch.
  - Generates cross-warehouse inventory movements in ERPNext and creates dispatch documentation.

---

## 11. Customer Requests Queue (`/customer-requests`)

- **Component File:** `apps/home/frontend/src/pages/CustomerRequestsReports.jsx` (and base component in `apps/home/frontend/src/pages/CustomerRequests.jsx`)
- **Route Path:** `/home/customer-requests`
- **Access:** Protected Route
- **What the Page Has:**
  - **KPI Summary Cards:** Counts for All Requests, Awaiting Action (Pending / In Review), Approved, and Completed.
  - **Advanced Filters:** Search query (Request ID), Customer name / portal user, Status dropdown, and Date Range pickers.
  - **Request Register Table:** Displays Request Kind (Forex Request vs Money Transfer), Customer Name, Amount & Currency, Branch, Submission Date, and Status badges.
  - **Action Buttons:**
    - **Approve:** Moves request to Approved status.
    - **Create:** Converts request into an active transaction.
  - **Request Details Modal:** Inspects full customer profile, uploaded documents, and transaction details.
- **What It Does:**
  - Monitors orders and requests placed by customers via the online customer portal.
  - When teller clicks **Create**, the system automatically fetches transaction prefill data, writes prefilled customer and amount data into `sessionStorage`, and routes the teller directly to `/exchange` or `/money-transfer` with all fields pre-populated.

---

## 12. Real-Time Currency Stocks (`/stocks`)

- **Component File:** `apps/home/frontend/src/pages/Stocks.jsx`
- **Route Path:** `/home/stocks`
- **Access:** Protected Route
- **What the Page Has:**
  - **Location Switcher:** Toggle stock view between **Cash Counter** (POS drawer) and **Main Vault**.
  - **Country / Currency Tabs:** Tabs with national flags and ISO currency codes (AUD, FJD, MYR, NZD, SGD, THB, USD, EUR, etc.).
  - **Metric Stat Cards:** Total Stock Value (in FJD equivalent), Total Pieces in drawer, In-Stock item lines, and Out-of-Stock / Negative stock warnings.
  - **Denomination Stock Table:** Item Code, Face Value / Denomination, Stock Quantity Badge, and Total Calculated Line Value.
- **What It Does:**
  - Provides instant inventory visibility into physical cash holdings across currencies for the teller's branch and vault.
  - Helps tellers determine if vault replenishment is required before accepting large buy/sell orders.

---

## 13. Reports & Analytics Dashboard (`/report`)

- **Component File:** `apps/home/frontend/src/pages/Reports.jsx`
- **Route Path:** `/home/report`
- **Access:** Protected Route
- **What the Page Has:**
  - **Tab 1: Transactions Tab:**
    - Master transaction history covering Currency Exchange, Dealer Exchange, and Money Transfer.
    - Filters: Transaction Type, Action (Send, Receive, Buy, Sell), Date Range (All Time, Today, This Week, Monthly, Custom), and Text Search.
    - Export tools: **Download CSV** and **Download Excel (.xls)**.
    - Actions: Reprint thermal customer receipt (`printThermalReceipt`) and inspect full transaction breakdown modal.
  - **Tab 2: Stock Tab:**
    - Denomination stock balances and inventory values across currencies.
  - **Tab 3: Cash Counter Tab (Manager Only):**
    - Audit log of all shift openings and closings for the branch.
    - Expandable currency and denomination reports highlighting expected vs counted variances and manager review decisions.
- **What It Does:**
  - Serves as the central compliance, audit, and daily reporting dashboard for tellers, branch accountants, and managers.

---

## 14. Transaction History Log (`/transactions`)

- **Component File:** `apps/home/frontend/src/pages/TransactionHistory.jsx`
- **Route Path:** `/home/transactions`
- **Access:** Protected Route
- **What the Page Has:**
  - Clean table listing recent remittances: Transaction ID, Customer Name, Receiver Name, Date, Local Currency Sent, Foreign Currency Received, and Total Payable.
- **What It Does:**
  - Provides a quick, lightweight reference list of recent customer money transfers completed in ERPNext.

---

## 15. User & Workstation Settings (`/settings` and `/settings-new`)

- **Component File:** `apps/home/frontend/src/components/SettingspanelNew.jsx` (with legacy fallback `apps/home/frontend/src/components/Settingspanel.jsx`)
- **Route Paths:** `/home/settings` and `/home/settings-new` (legacy `/home/test`)
- **Access:** Protected Route
- **Design & Layout Architecture:**
  - Modernized 2-column card and sidebar layout aligned visually and functionally with `MoneyExchangeNew` and `MoneyTransferNew`.
  - Built entirely using custom semantic CSS theme tokens (`--color-page`, `--color-surface`, `--color-surface-alt`, `--color-line`, `--color-ink`, `--color-muted`, `--color-brand-600`), providing seamless light and dark mode adaptation.
- **What the Page Has:**
  - **Top Page Header Bar:** Configuration pill badge, workstation title, description, active session status pill, and currently selected branch indicator.
  - **Main Left Form Column (4 Structured Sections):**
    1. **Section 1: User Profile & Identity:**
       - Full Name, Verified Email, Phone Number, and Member Since / Session date.
       - Inline profile editing mode for Full Name and Phone Number with interactive Save and Cancel button states.
    2. **Section 2: Branch Location & Cash Counter:**
       - Active Branch Counter dropdown populated from the user's assigned branch warehouses in ERPNext.
       - Warning alert banner if the user profile has no branch location assigned.
       - Active POS Counter status pill with immediate live propagation across Money Transfer and Currency Exchange.
    3. **Section 3: Linked Secure Vault:**
       - Displays the associated target vault repository for cash replenishment and end-of-day balances.
       - Counter Warehouse and Vault Transfer Route indicator tags.
    4. **Section 4: Interface & Display Preferences:**
       - **Workstation Theme Mode (Light / Dark):**
         - Dedicated card selectors for **Light Theme** ("Crisp white and clean slate") and **Dark Theme** ("Reduced glare for night/long shifts").
         - **OS-Independent Default Theme:** The application default is strictly **Light Theme**, completely decoupled from OS-level `prefers-color-scheme`. Tellers explicitly choose their theme preference here.
         - Synchronizes `.dark` and `data-theme="dark"` on document root and persists in `localStorage` (`theme_mode`).
       - **Base Document Font Scaling:**
         - 4-tier typography scale selector (`Small` - 14px, `Normal` - 16px default, `Large` - 18px, `Larger` - 20px).
         - Auto-saves preference to `localStorage` (`document_font_size`) and immediately resizes root document font scale.
       - **Typography Live Preview Card:** Real-time preview card demonstrating the selected font scale and sample currency transaction text.
    - **Bottom Action Footer Bar:**
      - Persistent machine storage note and **"Save All Changes"** action button.
  - **Main Right Sidebar (Workstation & Readiness):**
    - **Account Summary Card:**
      - User avatar with dynamic two-letter monogram and online presence dot.
      - User full name, email, and Role badge (`Cashier`, `Teller`, `Manager`).
      - Summary detail rows: Assigned Counter, Linked Vault, Active Theme Mode (`light Mode` / `dark Mode`), Base Font Scale, and Workstation Status (`Active & Ready`).
    - **Workstation Readiness Checklist:**
      - Interactive progress completion bar (`4 of 4 completed - 100%`).
      - 4 readiness checklist milestones with active status indicators:
        1. *User Profile Configured*
        2. *Branch Counter Assigned*
        3. *Secure Vault Linked*
        4. *Display Scaling Applied*
    - **System Notice & Guidance Card:**
      - Operational notice advising tellers on multi-counter operations and cash drawer alignment.
- **What It Does:**
  - Serves as the central workstation control panel for tellers and branch managers.
  - Allows seamless switching between assigned branch counters, automatically querying the backend for associated secure vault routing.
  - Manages global workstation display ergonomics (Theme Mode and Font Scaling) with persistent local storage.

---

## 16. Supplementary Pages

### Contact Us (`ContactUs.jsx`)
- **Component File:** `apps/home/frontend/src/pages/ContactUs.jsx`
- **What It Has:** Contact inquiry form (Name, Email, Subject, Message) and MMEL branch contact information.
- **What It Does:** Allows public users and staff to submit inquiries or support requests.

### Dashboard (`Dashboard.jsx`)
- **Component File:** `apps/home/frontend/src/pages/Dashboard.jsx`
- **Status:** Empty placeholder module reserved for future operational analytics widgets.

---

## 17. Shared Transaction UI Components

### 1. Board Rates Marquee Bar (`BoardRatesBar.jsx`)
- **Component File:** `apps/home/frontend/src/components/common/BoardRatesBar.jsx`
- **Purpose:** A self-contained, drop-in ticker bar that displays a continuous scrolling marquee of live currency exchange rates (1 unit of foreign currency in local base currency, e.g. FJD).
- **Zero Parent Dependency:** Requires no props or parent state/context to function. Can be dropped into any page (`<BoardRatesBar />`) and immediately renders.
- **Independent Live Backend Fetching:**
  - Calls `useERPNextRates` to fetch live currency rates from `/api/method/moneygram.api.get_currency_exchange_rate`.
  - Calls `useBaseCurrency` to resolve the active base currency (defaulting to FJD).
  - When live rates are unavailable or no data is returned, displays a prominent red message ("Unable to get latest data") instead of using static mock fallback rates.
- **Encapsulated Styling & Animations:**
  - Contains its own scoped CSS keyframes (`boardRateMarqueeAnim`), gradient edge masking, pause-on-hover interaction, and badge chips.
  - Eliminates the need for parent pages to define separate `@keyframes boardRateMarquee` or `.marquee-container` rules.
- **Optional Customization Props:**
  - `exchangeType`: `'BUY' | 'SELL'` (defaults to `'BUY'`, or detected from `ExchangeContext`)
  - `baseCurrency`: Base currency override string (e.g. `'FJD'`)
  - `title`: Label string (default: `"Board rates · 1 unit in <BASE_CURRENCY>"`)
  - `currencies`: Custom currency rate array override `Array<{ code, rate }>`
  - `speed`: Marquee cycle duration in seconds (default: `40`)
  - `className` & `style`: Container styling overrides
- **Active Usage:** Used on `/exchange-new`, `/dealer-exchange`, and `/money-transfer-new`.

### 2. Transaction Tab Bar (`TransactionTabBar.jsx`)
- **Component File:** `apps/home/frontend/src/components/common/TransactionTabBar.jsx`
- **Purpose:** Shared navigation tab bar across all transaction pages (Buy forex, Sell forex, Transfer money, Dealer exchange, and Vault/Branch transfer).
- **Active Usage:** Used on `/exchange-new`, `/dealer-exchange`, and `/money-transfer-new`.