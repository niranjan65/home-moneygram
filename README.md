# Home App — MH Money Express Frontend Portal

Modern Point-of-Sale (POS) and web portal for **MH Money Express (MMEL)**, built on **React 19**, **Vite**, and **Tailwind CSS**, integrated into the **Frappe / ERPNext** platform.

---

## 🚀 Key Modules

- **Money Transfers (`/money-transfer`)**: Inward and outward remittance entry with customer lookup, Annual FX & MoneyGram limit tracking, optional cash denomination tallying, and thermal receipt printing.
- **Retail Currency Exchange (`/exchange`)**: Multi-currency Buy/Sell operations with live daily rates from ERPNext `Currency Master Data`, automated 5-cent rounding, Reserve Bank of Fiji (RBF) compliance rules, and automated Sales Invoice creation.
- **Dealer Exchange (`/dealer-exchange`)**: Wholesale foreign currency transactions with custom dealer pricing.
- **Reports & Branch Analytics (`/report`)**:
  - Unified multi-transaction log across Retail FX, Dealer FX, and Remittances.
  - Strict status filter: `Paid`, `Cancelled`, and `All`.
  - Searchable Customer link filter matching both customer IDs and full names.
  - Branch Location selector (`All Branch Locations` default).
  - Day End Closing report and Currency Stock vault inventory.
- **Landing Page (`/` or `/home`)**: Modern brand landing page with signature MH Red (`#E00000`) theme, real-time rates table, interactive currency converter, and responsive layout.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Axios
- **Backend**: Frappe Framework v15 / ERPNext
- **Database**: MariaDB
- **Build System**: Vite (`--base=/assets/home/frontend/`)

---

## 💻 Quick Start & Build

### Development
```bash
cd apps/home/frontend
npm install
npm run dev
```

### Production Build
```bash
cd apps/home/frontend
npm run build
bench --site mmel.local clear-cache
```

> **Note**: `npm run build` bundles the React SPA and automatically syncs the output HTML entry point to `home/www/home.html`.

---

## 📖 Complete Documentation & Workflows

For the comprehensive architectural handover, business logic rules, conversion formulas, and developer guidelines, see:

👉 **[HANDOVER.md](HANDOVER.md)**
