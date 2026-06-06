# Circuit Labs — Finance Dashboard

This is a full-stack corporate financial dashboard for **Circuit Labs, Inc.** built with Next.js, React, TypeScript, and Tailwind CSS. It aggregates corporate transactions from three separate banks (**Chase**, **Bank of America**, and **American Express**), converts all transactions dynamically into a unified currency, and enforces role-based access control (RBAC).

---

## 🚀 Getting Started

### 1. Installation
Navigate to the project directory and install the dependencies:
```bash
cd project
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 3. Production Build
Verify TypeScript and Next.js static optimizations compile successfully:
```bash
npm run build
npm run start
```

---

## 🔐 Mock Credentials & Access Matrix

You can sign in with any of the following accounts from `data/users/user.json`:

| Name | Email | Password | Role | Allowed Tabs |
| --- | --- | --- | --- | --- |
| **Alex Rivera** | `alex.rivera@circuitlabs.io` | `CircuitAdmin2025!` | `admin` | Transactions, Stats, Security Log |
| **Priya Shah** | `priya.shah@circuitlabs.io` | `CircuitFinance2025!` | `finance_lead` | Transactions, Stats, Security Log |
| **Marcus Chen** | `marcus.chen@circuitlabs.io` | `CircuitAnalyst2025!` | `analyst` | Stats |
| **Jordan Lee** | `jordan.lee@circuitlabs.io` | `CircuitViewer2025!` | `viewer` | Transactions |

---

## 🏗️ Architecture & Implementation Details

### 1. Data Normalization (`src/lib/normalize.ts`)
Each bank has a distinct ledger format. The normalization library standardizes these structures into a unified `NormalizedTransaction` shape:
- **Chase**: Amounts are signed (negative values represent spending/debits, positive represent credit payouts).
- **BoA**: All amounts are positive, accompanied by a `debitCreditMemo`. Transactions are normalized as `debitCreditMemo === 'DEBIT' ? -amount : amount`.
- **Amex**: Amounts are positive cents for charges and negative cents for payments. Standardized as `-amountInCents / 100`.
- **Authorized By Matching**: Transaction operators are looked up dynamically from `data/users/user.json` by matching the employee name (`initiatedBy.name` for Chase, `originator.name` for BoA, and `employee.name` for Amex).

### 2. Currency Conversion (`src/lib/currency.ts`)
Static conversion rates from `data/rates.json` are utilized (USD is the base currency: $1.00$):
- **Formula (to USD)**: `amountInUSD = amount * rate[original_currency]` (e.g., $1\text{ EUR} = 1.08\text{ USD}$, $1\text{ GBP} = 1.27\text{ USD}$, $1\text{ CAD} = 0.74\text{ USD}$).
- **Formula (from USD to Target)**: `amountInTarget = amountInUSD / rate[target_currency]`.
- All dashboard statistics (KPI cards, top spenders, monthly inflow/outflow, and balance lines) are calculated in USD base values.

### 3. Role-Based Access Control (`src/lib/rbac.ts` & Layout Guards)
Reusable RBAC helpers live in `src/lib/rbac.ts` (`canAccessTab`, `getDefaultTab`, `filterAllowedTabs`) and are consumed by `src/app/dashboard/layout.tsx` on client-side route mounts:
- If a session is missing from `localStorage`, users are redirected to `/login`.
- If an authenticated user attempts to access a tab not listed in their role access permissions (`allowedTabs`), the guard redirects them back to their highest-priority allowed tab.
- The sidebar navigation only renders tabs the current user is allowed to see.

### 4. Interactive Custom SVG Charts (`src/components/Charts/`)
To bypass dependency conflicts between React 19, Next.js 16, and third-party libraries (e.g., Recharts), two interactive chart components were developed from scratch using pure React SVG tags:
- **BalanceOverTimeChart**: Computes starting balances backwards from the current bank ledger values (Chase: `$284,750.42`, BoA: `$6,324,448.17`, Amex: `$24,842.17`) and plots monthly asset totals.
- **InflowOutflowChart**: Renders side-by-side monthly columns showing credit sums (+) vs debit magnitudes (-).
- Features include precise grid ticks, smooth lines, hover crosshairs, and dynamic interactive floating tooltips.

### 5. Custom Tab: Security Log (`src/app/dashboard/custom/page.tsx`)
A custom security dashboard page restricted to `admin` and `finance_lead` roles:
- Lists all system users, credentials status, and access rights.
- Displays a mock real-time audit log tracking login initiations, CSV downloads, and unauthorized routing requests.

---

## ⚖️ Tradeoffs & Limitations

- **No real authentication layer**: Session management relies on `localStorage` only, as specified. In production, this would use server-side sessions or JWT tokens with `httpOnly` cookies.
- **Static exchange rates**: All currency conversions use the fixed rates from `data/rates.json`. No live API is called, as specified in the exercise instructions.
- **Custom SVG charts instead of Recharts**: To avoid compatibility warnings with React 19 Server Components and minimize bundle size, all charts (Balance Over Time, Inflow vs Outflow) are rendered as pure React SVG elements. This trades charting library features (zooming, tooltips out-of-box) for full control and zero third-party runtime cost.
- **CSV export is client-side**: The CSV download is generated in the browser from the currently fetched data. A production app would stream this from the server to handle large datasets.
- **Balance Over Time chart**: Starting balances are reverse-calculated from the final balances published by each bank. This is an approximation since we only have the statement-period transactions.

---

## ✅ What Was Skipped

Nothing was skipped — all required features have been implemented:
- Login & RBAC, all bank API routes, normalized transactions endpoint with filters
- Transactions tab with table, filters, currency switching, tooltip, detail modal, CSV export
- Stats tab with 2 KPI cards, all 4 chart options, and vendor breakdown table
- Custom bonus tab (Security Log) with access control

---

## 🤖 AI Assistance & Tooling

The application was built with the assistance of **Antigravity**, an agentic AI coding assistant designed by Google DeepMind.
- **Use Cases**: Normalization code mapping, layout skeleton setup, interactive SVG drawing arithmetic, and CSS optimization.
- **Trade-offs**: Chose custom SVG nodes over Recharts to avoid compilation warnings with React 19's Server Components and to keep bundle size minimal.
