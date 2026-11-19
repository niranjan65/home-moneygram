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
    - Customer photo capture card (`CustomerPhotoCard`) with webcam snapshot support or image upload.
    - ID Document validation with automatic expiry warning badges (Expired, Expiring Soon, Valid).
    - Risk Level categorization (Low, Medium, High).
  - **Remittance Calculation Panel (`TransferAmountSection`):**
    - Send Amount, Payout Amount, Exchange Rate, and MoneyGram fee calculation.
    - Purpose of Transaction (POT) and Source of Funds selection.
    - Outward Exchange Transaction (OET) code selection.
  - **RBF Compliance Section (`RbfComplianceSection`):**
    - Reserve Bank of Fiji regulatory thresholds, declaration checkboxes, tax clearance / source of wealth document upload table (`DocumentUploadTable`).
  - **Denomination Panel (`DenominationPanel`):**
    - Denomination breakdown for physical cash collected (Send) or physical cash paid out (Receive).
    - Automatic change and variance calculation to ensure exact physical cash settlement.
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
  - **Difference:** Features an **updated, modernized UI layout** with the `TransactionTabBar` for instant tab switching across transactions, modernized `TransferAmountSection`, `CurrencyInput`, `DenominationPanel`, and `CustomerPhotoCard`.

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
  - **4-Step Transaction Stepper:**
    - `Step 1: ESTIMATE` — Currency pair selection, Buy/Sell toggle, amount converter, live exchange rate display.
    - `Step 2: DETAILS` — Customer information card (`SenderCard`), receiver details (`ReceiverForm`), ID documentation, airline ticket verification (for travel allowances), and customer photo capture.
    - `Step 3: REVIEW` — Complete trade summary: FX currency amount, exchange rate, local FJD total, transaction fees, and customer identity verification summary.
    - `Step 4: PAYMENT` — Denomination reconciliation for foreign currency notes and FJD cash.
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
  - **Difference:** Features an **updated, modernized UI layout** with the unified `TransactionTabBar`, modernized summary cards, redesigned sender/receiver forms, and upgraded completion screens (`TransferSuccessNew`).

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
  - **Wholesale Navigation Bar (`TransactionTabBar`):** Fast navigation between wholesale and retail modules.
  - **Dealer Progress Checklist:** Real-time completion tracker monitoring Amount Verified, Dealer Verified, Documents Attached, and Cash Reconciled.
  - **Section Quick-Jumper:** Smooth scrolling to Exchange Details, Customer Info, Documents, and Cash Denominations.
  - **Dealer Information Form (`DealerForm`):**
    - Selection of accredited corporate dealer or institutional partner.
    - Authorized representative credentials, TIN / Business registration numbers.
    - Negotiated wholesale exchange rates and volume pricing.
  - **High-Volume Denomination Panel:** Built for high-volume note counting and settlement.
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

## 15. User & Location Settings (`/settings` and `/test`)

- **Component File:** `apps/home/frontend/src/components/Settingspanel.jsx`
- **Route Paths:** `/home/settings` and `/home/test`
- **Access:** Protected Route
- **What the Page Has:**
  - **User Profile Card:** Name, Email, Phone, Role badge (`Teller`, `Manager`, etc.), and membership date.
  - **Active Branch Location Selector:** Dropdown displaying all branch warehouses assigned to the user in ERPNext.
  - **Linked Vault Card:** Shows the specific secure vault warehouse configured for the chosen branch location.
  - **Connection Indicators:** Active Counter status and Linked Vault status badges.
- **What It Does:**
  - Allows tellers and managers to select or switch their active operating branch location.
  - Automatically queries the backend for the associated secure vault and synchronizes the session across all POS modules.

---

## 16. Supplementary Pages

### Contact Us (`ContactUs.jsx`)
- **Component File:** `apps/home/frontend/src/pages/ContactUs.jsx`
- **What It Has:** Contact inquiry form (Name, Email, Subject, Message) and MMEL branch contact information.
- **What It Does:** Allows public users and staff to submit inquiries or support requests.

### Dashboard (`Dashboard.jsx`)
- **Component File:** `apps/home/frontend/src/pages/Dashboard.jsx`
- **Status:** Empty placeholder module reserved for future operational analytics widgets.