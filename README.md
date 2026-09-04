# Afinity — Premium Personal Financial Command Center & Net-Worth Vault

Afinity is an executive-grade, offline-first personal financial management application and net-worth command center built with React, TypeScript, Tailwind CSS, and IndexedDB. It empowers individuals and investors to track, analyze, and manage their complete financial portfolio—including bank accounts, fixed deposits, physical cash vaults, digital wallets, credit cards, investment holdings, IPO applications, and peer-to-peer receivables—with zero reliance on external cloud servers or third-party data tracking.

---

## 🌟 Key Highlights & Philosophy

- **100% Client-Side & Offline-First**: All sensitive financial records, account numbers, transactions, and snapshots reside securely in the browser's local IndexedDB storage (powered by Dexie.js).
- **Zero Cloud Tracking / Privacy-First**: Your financial data never leaves your device unless you explicitly export an encrypted backup file.
- **Real-Time Net Worth Engine**: Automatically aggregates multi-asset balances and subtracts liabilities to compute true net worth, liquidity position, and debt-to-asset health metrics in real time.
- **Smart Theme & System Synchronization**: Automatically detects and harmonizes with the operating system's dark/light preference via `useSystemThemeSync`, while also supporting manual user overrides.
- **Biometric / Passcode Vault Security**: Protects your financial overview behind an optional 4-digit PIN lock with auto-lock timers and emergency data protection.
- **Comprehensive Asset Support**: Seamlessly accommodates traditional banking, market investments, physical cash denominations, digital wallets, credit limit groups, and Khatabook peer dues.

---

## 🚀 Core Features & Modules

### 1. Executive Command Center (Dashboard)
- **Net Worth Hero**: Live computation of Total Net Worth, Total Assets, Total Liabilities, Liquid Reserves, and Day/Month Changes.
- **Interactive Asset Allocation**: Donut charts and breakdown lists categorizing Banks, FDs, Cash, Wallets, Equities, Mutual Funds, Gold, and Crypto.
- **Historical Trajectory**: Net-worth trend line charts over 1-Week, 1-Month, 3-Month, 6-Month, 1-Year, and All-Time horizons.
- **Month-over-Month Comparisons**: Direct percentage growth and absolute rupee/currency differences comparing current valuations against past daily snapshots.
- **Quick Update Bar**: One-click quick balance edits, instant funds transfer, quick snapshot capture, and market price refresh.

### 2. Accounts, Cash Vault & Digital Wallets
- **Multi-Bank Management**: Track savings, current, and salary accounts with account numbers, IFSC codes, bank branding, and interest rates.
- **Fixed Deposits (FD) Tracker**: Principal amounts, maturity dates, interest rates, compounding frequencies, and accrued returns.
- **Physical Cash Denomination Counter**: Specific note counter (e.g., ₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10) with locker allocation notes.
- **Digital Wallets**: Track balances in Paytm, Amazon Pay, PhonePe, Mobikwik, etc., with lifetime cashback rewards monitoring.
- **Inter-Account Transfers**: Record seamless transfers between Bank-to-Bank, Bank-to-Cash, Cash-to-Bank, and Bank-to-Wallet with full audit trails.

### 3. Credit Cards & Liability Management
- **Credit Limit Groups**: Model shared credit limits across multiple cards issued by the same banking institution.
- **Card Statement Lifecycle**: Total credit limit, available limit, utilized limit, unbilled spends, statement generation dates, and payment due date countdowns.
- **Payment Reminders & Settlement**: Mark credit card bills as paid with automatic deduction from linked bank accounts.
- **Credit Health Scorecard**: Real-time credit utilization ratio indicators with smart warnings if utilization exceeds safe thresholds (e.g., >30%).

### 4. Investments, Market Pricing & IPO Tracker
- **Multi-Asset Portfolio**: Equities (Stocks), Mutual Funds, ETFs, Sovereign Gold Bonds / Physical Gold, Real Estate, and Cryptocurrencies.
- **Real-Time & Background Pricing**: Automated and manual market price refresh engine with configurable refresh frequencies (Manual, Twice Daily, Hourly).
- **Holdings Performance**: Realized and unrealized Profit & Loss (P&L), return percentage, average buy price, and current market value.
- **IPO Application Manager**: Track IPO applications across family members and accounts, including application status (Applied, Allotted, Refunded, Listed), application amount, and listing gains.

### 5. Khatabook (Dues & Peer-to-Peer Receivables)
- **Lending & Borrowing Ledger**: Track money owed to you ("You'll Get") and money you owe others ("You'll Give").
- **Partial Settlements**: Record split payments, partial clearings, interest notes, and settlement history.
- **Net Position Overview**: Instant visibility into net receivables and automated adjustments to liquid net-worth calculations.

### 6. Historical Snapshots & Audit System
- **Automated Daily Valuation**: Captures a daily financial snapshot on first app launch to build continuous long-term historical records.
- **Custom Manual Snapshots**: Create named milestone snapshots (e.g., "Year End 2025", "Post Bonus", "Quarterly Review") with personal notes.
- **Balance History Log**: Comprehensive audit trail of every balance alteration, transfer, and account modification.

### 7. Security, Backup & Export
- **Passcode Vault**: Client-side PIN passcode with hash verification, auto-lock on inactivity, and quick lock actions.
- **JSON Backup & Restore**: Full database export to a single portable JSON file, with validation and one-click restore.
- **CSV Data Export**: Export structured spreadsheet reports for Banks, FDs, Wallets, Credit Cards, Investments, and Khatabook.

---

## 🎨 Theme & Appearance Engine

Afinity includes an adaptive theme engine that synchronizes the application's appearance:

- **System Preference Synchronization (`useSystemThemeSync`)**:
  - When no manual theme has been explicitly saved in `localStorage`, the app automatically queries `window.matchMedia('(prefers-color-scheme: dark)')` and applies the corresponding theme class to `document.documentElement`.
  - Dynamically responds in real-time when the user switches their OS theme between Light and Dark mode.
- **Manual Theme Overrides**:
  - **Dark Titanium**: Deep-contrast OLED-optimized palette (`#0a0f1d`) with vibrant cyan and emerald accents for low-light environments.
  - **High-Contrast Light**: High-legibility paper-white surfaces (`#f1f5f9` / `#ffffff`) with deep slate typography for daylight visibility.
  - Explicit theme choices are saved in `localStorage` under `afinity_theme` and synchronized across all open browser tabs.

---

## 📁 Project Structure

```
afinity/
├── public/                     # Static icons, manifest, and PWA assets
├── src/
│   ├── components/             # Modular React UI components
│   │   ├── accounts/           # Bank, FD, cash, and wallet dialogs & cards
│   │   ├── analysis/           # Asset allocation charts & historical analytics
│   │   ├── brand/              # Afinity logo & branding assets
│   │   ├── credit/             # Credit card cards, limit groups, and payment modals
│   │   ├── dashboard/          # Dashboard cards & customization controls
│   │   ├── financial/          # NetWorthHero, QuickUpdateSheet & summary widgets
│   │   ├── investments/        # Investment holdings tables, cards & IPO modals
│   │   ├── khatabook/          # Peer dues ledger, settlement dialogs & filter tabs
│   │   ├── navigation/         # DesktopSidebar, TopHeader, BottomNav & SecondaryMenuSheet
│   │   ├── onboarding/         # First-time tour and welcome guide
│   │   ├── security/           # PasscodeLockScreen & PasscodeSetupModal
│   │   ├── settings/           # SettingsModal, DataBackupModal & CsvExportModal
│   │   ├── splash/             # Startup splash screen
│   │   └── ui/                 # Reusable buttons, modals, dropdowns & inputs
│   ├── context/
│   │   ├── FinancialDataContext.tsx   # Global state provider for all financial entities & calculations
│   │   └── SecurityContext.tsx        # Vault passcode lock & authentication state
│   ├── data/                   # Default bank templates and sample demo data
│   ├── hooks/
│   │   └── useSystemThemeSync.ts      # Automatic OS/system theme synchronization hook
│   ├── pages/                  # Top-level route pages
│   │   ├── Accounts/           # Bank accounts, FDs, physical cash & wallets
│   │   ├── Analysis/           # In-depth portfolio analytics & trends
│   │   ├── Credit/             # Credit cards & limit groups
│   │   ├── Home/               # Executive dashboard
│   │   └── Investments/        # Investment holdings & IPO manager
│   ├── services/               # Business logic & storage layer
│   │   ├── calculations.ts     # Pure functions for net-worth, asset & liability sums
│   │   ├── dashboardConfig.ts  # Dashboard layout presets and arrangement
│   │   ├── db.ts               # Dexie.js IndexedDB schema definition
│   │   ├── marketPrice/        # Price retrieval & valuation services
│   │   └── repository.ts       # Database CRUD operations & data export/import
│   ├── types/                  # TypeScript interfaces, enums, and type models
│   ├── utils/                  # Formatting utilities (currency, dates, numbers)
│   ├── App.tsx                 # Main application layout, routes & modals
│   ├── index.css               # Tailwind CSS imports & global styles
│   └── main.tsx                # React DOM entry point
├── metadata.json               # Application metadata and capabilities
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | React 18 with Vite |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS with custom color primitives |
| **Icons** | Lucide React |
| **Database** | Dexie.js (IndexedDB local client database) |
| **Routing** | React Router v6 |
| **Data Visualization** | Recharts, SVG, HTML5 Canvas |
| **Animations** | Tailwind CSS transitions & Motion |

---

## 💻 Getting Started & Local Development

### Prerequisites
- Node.js 18+ or Bun installed on your machine.

### Installation
1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd afinity
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build:
   ```bash
   npm run preview
   ```

---

## 🛡️ Security & Privacy Recommendations

1. **Regular Backups**: Because Afinity stores all data inside your browser's local IndexedDB, clearing your browser cookies/storage will erase local records. Always use the **Settings > Backup & Restore** feature to periodically download a JSON backup file.
2. **Passcode Protection**: For shared devices, enable a 4-digit Passcode PIN from **Settings > Security & Passcode Lock**.
3. **Private Browsing Notice**: Using the app in Incognito / Private mode will discard your financial records once the private window is closed. Use normal browser profiles for persistent tracking.

---

## 📄 License & Credits

Built with precision for private personal finance management. Free to use and customize for personal financial tracking.