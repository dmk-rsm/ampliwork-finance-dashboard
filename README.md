# Full-Stack Financial Dashboard: Take-Home Exercise

Hello! Thank you for taking the time to apply!
If you’re reading this, we’re considering you for a role at **Ampliwork**. Congratulations! 🎉

This is a take-home case study. Your job is to build a small but complete full-stack financial dashboard using **Next.js**, **React**, and **TypeScript**. We want to see how you think, how you structure code, and how you handle real-world data problems.

**Deadline:** You have **3 days** from when you receive this to submit.

**What matters most:** working features, clean code, and good decisions around API design, auth, and data handling. We are not grading you on pixel-perfect design. Just implement the Figma layouts reasonably well using Tailwind CSS.

If you run out of time and can't finish everything, that's okay. Prioritize the requirements in the order they are listed and note what you skipped in `project/README.md`. If you used any AI tools, mention which ones and how you used them.

---

## The scenario

**Circuit Labs, Inc.** is a B2B SaaS startup. Their finance team tracks company spending across three bank accounts: **Chase**, **Bank of America (BoA)**, and **American Express (Amex)**.

The problem: each bank returns data in a completely different format, and transactions can be in different currencies (USD, EUR, GBP, CAD). Your job is to build a dashboard that pulls all of this together into one clean, unified view.

There are **four users** who will use this app, each with a different role that controls what they can see. You can find all user data in `project/data/users/user.json`.

---

## What's already provided

The `project/` folder has a Next.js app bootstrapped and ready to go. You just need to build on top of it.

| File / Folder | What it is |
|---|---|
| `project/` | Next.js 16, React 19, TypeScript, Tailwind CSS, SWR (all installed) |
| `project/data/transactions/chase.json` | Raw transaction data from Chase bank |
| `project/data/transactions/boa.json` | Raw transaction data from Bank of America |
| `project/data/transactions/amex.json` | Raw transaction data from American Express |
| `project/data/users/user.json` | The four users, including their emails, passwords, roles, and which tabs they can access |
| `project/data/rates.json` | Static currency exchange rates (USD, EUR, GBP, CAD). Use these directly. **Do not call a live rates API.** |

> **Important:** Each bank's JSON file has a completely different structure and different field names for the same things. For example, the field that tells you who authorized a transaction is called `initiatedBy` in Chase, `originator` in BoA, and `employee` in Amex. Part of this exercise is figuring out how to map all of that into one consistent shape.

---

## Requirements

### 1. Login & access control

**How it should work:**

1. Build a login page at `/login`. The user types their email and password and submits the form.
2. The form calls `POST /api/auth/login`, which checks the credentials against `user.json`.
3. If the credentials are correct, save the user's data to `localStorage`: their `id`, `name`, `role`, and `allowedTabs`. **Do not save their password.**
4. Every page inside `/dashboard` should check `localStorage` for a logged-in user. If nothing is there, redirect to `/login`.
5. When the user clicks Logout, clear `localStorage` and redirect them to `/login`.

**Role-based access (RBAC):**

Not every user can see every tab. Use the `role` and `allowedTabs` values you saved in `localStorage` to control which tabs are shown and accessible. The rules are defined in `user.json` under `tabAccessMatrix`.

| Tab | Who can access it |
|---|---|
| **Transactions** | `admin`, `finance_lead`, `viewer` |
| **Stats** | `admin`, `finance_lead`, `analyst` |
| **Custom** *(bonus)* | `admin`, `finance_lead` |

If a user tries to visit a tab their role doesn't allow, redirect them away or show an access-denied message.

**API rule:** Never include a user's password in any API response.

---

### 2. Bank API routes

Build the following API routes in Next.js:

| Route | What it does |
|---|---|
| `GET /api/banks/chase/transactions` | Returns the raw Chase JSON exactly as-is from `chase.json` |
| `GET /api/banks/boa/transactions` | Returns the raw BoA JSON exactly as-is from `boa.json` |
| `GET /api/banks/amex/transactions` | Returns the raw Amex JSON exactly as-is from `amex.json` |
| `GET /api/transactions` | Returns a **normalized** list of transactions merged from all three banks (see below) |
| `GET /api/transactions/[id]` | Returns a single normalized transaction by its ID, including its original raw data from the source bank |

**What "normalized" means:**

The `/api/transactions` endpoint should not return three different shapes of data. Instead, convert every transaction from every bank into one consistent model before returning it. At minimum your normalized transaction should include:

- A unique `id`
- `date`: the transaction date
- `description`: what the transaction was for
- `amount`: the value of the transaction
- `currency`: the original currency code (e.g. `"USD"`, `"EUR"`)
- `type`: whether it is a debit (money out) or credit (money in)
- `category`: the spending category (e.g. `"Software"`, `"Payroll"`)
- `vendor`: the merchant or payee name
- `bank`: which bank this came from (`"chase"`, `"boa"`, or `"amex"`)
- `authorizedBy`: the user who initiated the transaction, looked up from `user.json` by matching the name in the bank data
- `source`: the original raw object from the bank (used for the detail modal)

**Filters on `/api/transactions`:**

The endpoint should accept the following optional query parameters to filter results:

| Param | What it does |
|---|---|
| `bank` | Only return transactions from this bank (e.g. `?bank=chase`) |
| `authorizedBy` | Only return transactions initiated by this user ID |
| `amount` | Only return transactions at or above this amount |
| `fromDate` | Only return transactions on or after this date (e.g. `?fromDate=2024-01-01`) |

Results should always be sorted **earliest date first**.

---

### 3. Transactions tab

This tab shows the full list of transactions in a table. Refer to the Figma for the layout.

**Table columns:** Transaction name/description, Amount, Date, Category, Bank Account, Authorized By, Vendor.

**Authorized By tooltip:** When a user hovers over a name in the Authorized By column, show a tooltip with that user's photo/initials, email address, and role (sourced from `user.json`).

**Filters (shown above the table as dropdowns / a date picker):**
- **Bank**: filter by bank (Chase, BoA, Amex, or All)
- **Authorized By**: filter by which user initiated the transaction
- **Show Currency In**: see all amounts converted to a single currency (e.g. All USD, All CAD)
- **From Date**: only show transactions from this date onwards

When a filter changes, the table updates without a full page reload. Always show at most 30 rows on the table.

**Currency behaviour:**
- By default, each row shows the transaction's **original currency and amount** exactly as it came from the bank (e.g. `USD $12,480.00`, `EUR $9,200.00`, `CAD $284,950.00`).
- When the user picks a currency from "Show Currency In", convert every row's amount to that currency using `rates.json` and display the converted value.

**Transaction detail modal:**
Clicking any row opens a modal that shows a full breakdown of that transaction: amount, date, category, bank account, authorized by, vendor, and any additional fields from the raw bank data.

**CSV export:**
Add an "Export CSV" button above the table. Clicking it downloads a `.csv` file containing all transactions that match the currently active filters (or all transactions if no filters are applied). The exported file should include the same columns shown in the table.

**Loading and empty states:** Show a loading indicator while data is being fetched. Show a helpful empty message if no transactions match the filters.

---

### 4. Stats tab

This tab gives Finance and the CEO a high-level summary of company spending across all banks and all time.

> Since transactions can be in different currencies, you need to convert everything to one currency (USD is fine) before doing any math. Use `rates.json` for this. Explain your approach in `project/README.md`.

**KPI cards (required):** Display 2 KPI cards at the top of the page, just like in the Figma. Choose any 2 from the list below:

| KPI | What it is |
|---|---|
| Total cash in | Sum of all credit transactions (money coming in) |
| Total cash out | Sum of all debit transactions (money going out) |
| Net cash flow | Cash in minus cash out |
| Top vendor | The vendor with the highest total spend |
| Top spend category | The category with the highest total spend |
| Vendor count | Number of unique vendors across all transactions |

**Top vendors breakdown table (required):** A table ranking all vendors by total spend. Include at least the vendor name and total amount.

**Charts: pick any 2 of the 4 below** (do all 4 if you want):

1. **Bank account balance over time**: a line chart showing the running balance for each bank over the full statement period
2. **Money in vs money out by month**: a bar chart comparing total inflows and outflows for each month
3. **Spend by category**: a chart breaking down total spending by category
4. **Top spender**: a chart or list showing which user/employee authorized the most spend

**Loading and empty states** apply here too.

---

### 5. Custom tab *(bonus, optional)*

If you have time, build a third tab of your own design. You decide what it shows and what it's called. It just needs to:

- Use only the data already provided (transactions and/or users). No new data sources.
- Only be accessible to `admin` and `finance_lead` roles
- Include a brief explanation in `project/README.md` of what it is and why you built it.

---

### Technical notes

- Use **TypeScript** throughout. Avoid `any` types.
- Use the **Next.js App Router** (the `app/` directory).
- Use **Tailwind CSS** for all styling.
- Use **SWR** for client-side data fetching (it's already installed). If you prefer something else, note it in `project/README.md`.
- Keep your code organized. Normalization logic, access control checks, and data utilities should live in their own files, not inside UI components.

**Suggested project structure** (you do not have to follow this exactly, but it gives you a starting point):

```
project/
├── data/
│   ├── transactions/
│   │   ├── chase.json
│   │   ├── boa.json
│   │   └── amex.json
│   ├── users/
│   │   └── user.json
│   └── rates.json
│
└── src/
    ├── app/
    │   ├── layout.tsx              # Root layout
    │   ├── page.tsx                # Redirects to /login or /dashboard
    │   ├── login/
    │   │   └── page.tsx            # Login page
    │   ├── dashboard/
    │   │   ├── layout.tsx          # Dashboard shell (sidebar, nav, auth guard)
    │   │   ├── page.tsx            # Default redirect to /dashboard/transactions
    │   │   ├── transactions/
    │   │   │   └── page.tsx        # Transactions tab
    │   │   ├── stats/
    │   │   │   └── page.tsx        # Stats tab
    │   │   └── custom/             # Bonus tab (your choice)
    │   │       └── page.tsx
    │   └── api/
    │       ├── auth/
    │       │   └── login/
    │       │       └── route.ts    # POST /api/auth/login
    │       ├── banks/
    │       │   ├── chase/
    │       │   │   └── transactions/
    │       │   │       └── route.ts
    │       │   ├── boa/
    │       │   │   └── transactions/
    │       │   │       └── route.ts
    │       │   └── amex/
    │       │       └── transactions/
    │       │           └── route.ts
    │       └── transactions/
    │           ├── route.ts        # GET /api/transactions
    │           └── [id]/
    │               └── route.ts   # GET /api/transactions/[id]
    │
    ├── components/
    │   ├── TransactionsTable.tsx
    │   ├── TransactionModal.tsx
    │   ├── StatKPICard.tsx
    │   ├── Charts/                 # One file per chart
    │   └── ...
    │
    └── lib/
        ├── normalize.ts            # Merges all 3 banks into one transaction model
        ├── currency.ts             # Conversion logic using rates.json
        ├── auth.ts                 # localStorage helpers (getUser, clearUser)
        └── rbac.ts                 # Tab access checks
```

---

## Design (Figma)

The full UI design for this dashboard is in Figma. Open it and use it as your reference when building the layout and components.

**[Open Figma file →](https://www.figma.com/design/8PcquzMDxopS84lDY2ttXA/CASE-STUDY?node-id=0-1&t=V0BBfFPT5eN0IL54-1)**

The layout and structure should match the designs. Pixel-perfect polish is not required. You will not be judged as a visual designer.

---

## How you will be evaluated

| Area | What we look for |
|---|---|
| Auth & access control | Login flow works, localStorage is used correctly, RBAC is enforced per role |
| Data normalization | All three banks are merged into one model, field names are mapped correctly, `authorizedBy` resolves to a real user |
| Multi-currency | Original currencies are preserved, conversion via `rates.json` works correctly |
| Transactions tab | Filters work, table updates without full reload, modal shows correct details, currency switching works, Authorized By tooltip shows correct user info, CSV export works with and without filters applied |
| Stats tab | 2 KPI cards shown, at least 2 charts implemented, vendor breakdown table present |
| Code quality | TypeScript used properly, logic separated from UI, sensible folder structure |
| Submission README | Clear setup instructions, architecture notes, tradeoffs explained, AI tool usage disclosed |
| *(Bonus)* Custom tab | Original idea, well explained, access control enforced |

---

## Getting started

```bash
cd project
npm install
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## Submission

Submit within **3 days** of receiving this exercise.

1. Complete the exercise inside the `project/` folder.
2. Push your work to a GitHub repository.
3. Update `project/README.md` with:
   - How to run the app locally
   - A brief description of your architecture and any tradeoffs you made
   - What you skipped or didn't finish (if anything)
   - Which AI tools you used and how (if any)
4. Delete `project/node_modules/` before zipping.
5. Zip the entire `fullstack-case-study` folder and email it back to your recruiter along with the link to your repository.

Good luck!
