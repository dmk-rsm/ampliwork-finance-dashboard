# Bank transaction data

**Circuit Labs Inc** — 600 transactions per bank (Jun 2023 – May 2025). See root README for UI and filter rules.

| File | Format |
|------|--------|
| `chase.json` | `{ account, transactions[], pagination }` — signed `amount` + per-transaction currency |
| `boa.json` | `{ accountSummary, transactionList[] }` — positive `amount` + `debitCreditMemo` + currency |
| `amex.json` | `{ cardMember, data: { charges[] } }` — `amountInCents` + currency |

**Not all transactions do not use the same currency.** Field names differ per bank (`initiatedBy`, `originator`, `employee` for who initiated; currency fields differ too). Match people to `../users/user.json`.
