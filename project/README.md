# Circuit Labs — Finance Dashboard Case Study

This is a complete, full-stack corporate financial dashboard built for **Circuit Labs, Inc.** using Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.

It aggregates corporate transactions from three different banks (**Chase**, **Bank of America**, and **American Express**), unifies their data structures, converts currencies dynamically, and enforces Role-Based Access Control (RBAC).

---

## 🚀 Getting Started

### 1. Installation
Navigate to the `project` directory and install the dependencies:
```bash
cd project
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

---

## 🔐 Authentication & Access Matrix (Mock)

You can sign in with any of the mock accounts defined in `data/users/user.json` (passwords are stored as plain text for the sake of this test):

| Name | Role | Allowed Tabs |
| --- | --- | --- |
| **Alex Rivera** | `admin` | Transactions, Stats, Security |
| **Priya Shah** | `finance_lead` | Transactions, Stats, Security |
| **Marcus Chen** | `analyst` | Stats |
| **Jordan Lee** | `viewer` | Transactions |

---

## 🧪 Testing the API Endpoints

Because all API routes are protected by backend Bearer Token authentication, you cannot simply `GET` the endpoints anonymously via Postman or your browser.

To test an API endpoint (e.g., `GET /api/transactions`):
1. Pick any valid user ID from the `user.json` file (for example: `usr_001`).
2. Add an `Authorization` header to your request with the value `Bearer <user_id>`.

**Example using cURL:**
```bash
curl -H "Authorization: Bearer usr_001" http://localhost:3000/api/transactions
```

---

## 🏗️ Architecture & Implementation

### 1. Data Normalization
The core challenge of this project was taking three entirely different JSON structures and unifying them into a single, predictable `NormalizedTransaction` type. 
- **Chase**: Handled signed amounts (debits as negative, credits as positive).
- **BoA**: Uses an absolute amount with a `debitCreditMemo` ("DEBIT" or "CREDIT").
- **Amex**: Uses cents (`amountInCents`) requiring division by 100.
- All operators (e.g., `initiatedBy`, `originator`, `employee`) are dynamically matched against `data/users/user.json` to extract the full `User` object for tooltips.

### 2. Currency Conversion
Static conversion rates from `data/rates.json` are utilized. 
- USD is treated as the base currency.
- All aggregate math in the "Stats" tab (total cash in, total outflow, top spenders) is calculated by first converting every original transaction amount to USD.

### 3. Role-Based Access Control (RBAC)
- State is preserved in `localStorage` containing the user's `role` and `allowedTabs` (passwords are stripped by the API).
- Route guards in `src/app/dashboard/layout.tsx` check the user's allowed tabs against the current URL path.
- Unauthorized attempts to access a tab redirect the user to their highest-priority allowed tab.

### 4. Custom Bonus Tab: Security Log
A custom third tab was built called "Security". It is restricted strictly to `admin` and `finance_lead` roles. It utilizes the existing user data to render a mock "Audit Log" of system access and permissions.

---

## ⚖️ Tradeoffs & Limitations

- **Mock Authentication:** While sessions are stored in `localStorage` rather than HTTP-only cookies (as per case study instructions), the application enforces **full backend API protection**. The custom SWR fetcher automatically injects the user's ID as a `Bearer` token in the `Authorization` header, and all API routes strictly validate this token against the internal directory before returning data.
- **Client-Side SWR Fetching:** SWR is heavily utilized for client-side filtering and sorting instead of Next.js Server Actions. This allows the Transactions table to filter instantly without full page reloads.
- **Static Exchange Rates:** As requested, currency conversions use static JSON rather than calling a live financial API.

---

## ✅ What Was Skipped

**Nothing was skipped.** All required features have been fully implemented, including the bonus custom tab:
- Login & RBAC.
- All bank API routes and normalized transactions endpoint.
- Transactions tab (table, filters, currency toggles, tooltips, detail modal, CSV export).
- Stats tab (2 KPI cards, Bank Balance line chart, Inflow/Outflow bar chart, Vendor Table).

---

## 🤖 AI Assistance & Tooling

To build this project efficiently, I adopted an AI-orchestration approach, acting as the prompt engineer to guide multiple LLMs to produce production-ready code:

1. **Initial Generation (Gemini Flash 3.5):** I detailed the exact case study requirements, data structures, and Figma layouts in a comprehensive prompt. Gemini Flash was used to rapidly bootstrap the initial architecture, API routes, and Tailwind components.
2. **Review & Verification (Claude Opus 4.6):** Claude was utilized to review the generated logic—specifically verifying the mathematical correctness of the data normalization (handling Chase negatives, BoA memos, and Amex cents) and the currency conversion math.
3. **Refining & Polishing (Gemini 3.1 Pro):** Finally, I used Gemini 3.1 Pro directly in my IDE to run a complete project audit, enforce strict TypeScript union types (`UserRole`, `CurrencyCode`), extract reusable components (like `StatKPICard`), and replace native browser alerts with custom polished UI modals.
