<div align="center">

# 🌐 ISPCore

**A multi-provider ISP billing & operations platform — VAT-compliant invoicing, payments across three rails, ERP and CRM sync, SMS notifications, and automated network enforcement, all tied together by one adapter-based architecture.**

![PHP](https://img.shields.io/badge/-PHP-777BB4?style=flat-square&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/-Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![M-Pesa](https://img.shields.io/badge/-M--Pesa-00A651?style=flat-square)
![Paystack](https://img.shields.io/badge/-Paystack-00C3F7?style=flat-square)
![KCB](https://img.shields.io/badge/-KCB%20Buni-006437?style=flat-square)
![Odoo](https://img.shields.io/badge/-Odoo-714B67?style=flat-square&logo=odoo&logoColor=white)
![HubSpot](https://img.shields.io/badge/-HubSpot-FF7A59?style=flat-square&logo=hubspot&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-00A896?style=flat-square)

</div>

---

## 📖 Overview

ISPCore simulates how a real Kenyan ISP runs its back office end-to-end: bill a customer, collect payment on whichever rail they prefer, push the transaction into real accounting, flag at-risk accounts for the sales team, and automatically throttle service for anyone who doesn't pay.

The point of the project isn't any single integration — it's proving that eight very different external systems (two payment gateways, a bank, an accounting ERP, a CRM, an SMS gateway, and a simulated network layer) can all sit behind one clean internal architecture without the codebase turning into spaghetti. Every external system implements the same pattern: authenticate, act, record the result in a shared `payments` table (or equivalent), and stay swappable.

---

## ✨ What's built — all 8 phases complete

| # | Phase | What it proves |
|---|---|---|
| 1 | **Core billing engine** | VAT-compliant invoicing (16% KE VAT), sequential gap-free invoice numbers, subscription management |
| 2 | **M-Pesa Daraja** | Full STK Push flow — OAuth token caching, push initiation, async webhook confirmation, matched by `CheckoutRequestID` (not a client-supplied reference, which Safaricom's callback doesn't echo back) |
| 3 | **SMS (Africa's Talking)** | Payment confirmations and overdue reminders, fired automatically from payment/billing events |
| 4 | **Paystack** | A second, independent payment rail sharing the exact same `payments` table and adapter pattern as M-Pesa — the concrete proof the architecture is provider-agnostic, not just M-Pesa with extra steps |
| 5 | **KCB Buni (banking)** | Full OAuth2 + FundsTransfer integration, verified request-for-request against KCB's own official sandbox test tool; IPN webhook handler for transfer confirmations |
| 6 | **Odoo (ERP)** | JSON-RPC integration (a different protocol from every other REST-based integration in this project) that finds-or-creates the customer and pushes a real invoice into Odoo's accounting — visually confirmed in the live Odoo UI |
| 7 | **HubSpot (CRM)** | Contact find-or-create plus deal creation, used to surface overdue accounts to a sales/support pipeline automatically |
| 8 | **Network automation** | A simulated RADIUS/Mikrotik-style session layer, tied to a scheduled command that throttles or suspends service based on how overdue an invoice is — and restores it automatically the moment a payment succeeds |

---

## 🏗️ Architecture

```
Customer ──▶ Subscription ──▶ Invoice (VAT calculated, sequential numbering)
                                   │
                     ┌─────────────┼─────────────┐
                     ▼             ▼             ▼
                 M-Pesa        Paystack      (bank transfer
              STK Push        Checkout        via KCB, for
                     │             │           supplier payouts)
                     ▼             ▼
            ┌───────────────────────────────┐
            │      payments table            │
            │  provider · status · receipt   │
            └───────────────┬────────────────┘
                             │  on success
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        Invoice → paid   NetworkSession   (Odoo sync,
                          restored          on demand)

  ── overdue lifecycle (php artisan ispcore:check-overdue) ──

  Invoice overdue ──▶ SMS reminder (Africa's Talking)
                  ├──▶ NetworkSession throttled/suspended
                  └──▶ HubSpot deal created for sales follow-up
```

**The one idea that ties it all together:** every external system sits behind a `*Service` class with a consistent shape (authenticate → act → return a normalized result). `MpesaService`, `PaystackService`, `KcbService`, `OdooService`, and `HubSpotService` are all independently swappable — M-Pesa could be replaced with another mobile money provider, or KCB with Co-op or Equity, by writing one new service class, not by touching the billing engine.

---

## 🔍 Honest notes on real-world integration limits

Not every integration completes a full happy-path transaction in sandbox, and that's worth being upfront about rather than hiding:

- **KCB Buni**: the FundsTransfer request is built exactly to KCB's official spec and verified to produce *the same validation response as KCB's own test tool* using their own sample data. Full completion requires KCB to whitelist real test account numbers — an manual onboarding step their own documentation confirms, not a gap in this integration.
- **Odoo**: uses a free 15-day trial (Odoo doesn't offer a permanent free hosted sandbox). The integration itself — auth, customer sync, invoice creation — is fully proven and visually confirmed in the live UI.
- **Network automation**: intentionally simulated. In production, `NetworkService`'s methods would issue real RADIUS CoA (Change of Authorization) packets to network hardware instead of updating a database row — the business logic (when to throttle, when to restore) is real and identical either way.

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.4+, Composer
- A PostgreSQL database (e.g. free tier on [Neon](https://neon.tech))
- Sandbox accounts: Safaricom Daraja, Paystack, Africa's Talking, KCB Buni, Odoo Online, HubSpot (all free)

### Installation

```bash
git clone https://github.com/william-obote-dev/ispcore.git
cd ispcore
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Key `.env` variables

```env
DB_CONNECTION=pgsql
DB_HOST=... DB_DATABASE=... DB_USERNAME=... DB_PASSWORD=... DB_SSLMODE=require

MPESA_CONSUMER_KEY=... MPESA_CONSUMER_SECRET=... MPESA_SHORTCODE=174379
MPESA_PASSKEY=... MPESA_CALLBACK_URL=https://your-public-url/api/mpesa/callback

PAYSTACK_SECRET_KEY=sk_test_...

AT_USERNAME=sandbox AT_API_KEY=...

KCB_CONSUMER_KEY=... KCB_CONSUMER_SECRET=... KCB_COMPANY_CODE=... KCB_DEBIT_ACCOUNT=...

ODOO_URL=https://yourdb.odoo.com ODOO_DATABASE=... ODOO_USERNAME=... ODOO_API_KEY=...

HUBSPOT_ACCESS_TOKEN=...
```

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/customers` | Create a customer |
| `POST` | `/api/customers/{id}/subscriptions` | Subscribe a customer to a plan |
| `POST` | `/api/subscriptions/{id}/invoice` | Generate a VAT-compliant invoice |
| `POST` | `/api/invoices/{id}/pay` | Trigger M-Pesa STK Push |
| `POST` | `/api/invoices/{id}/pay-with-card` | Trigger Paystack checkout |
| `GET` | `/api/payments/{id}` | Check payment status |
| `POST` | `/api/mpesa/callback` | Safaricom webhook |
| `GET` | `/api/paystack/callback` | Paystack verification callback |
| `POST` | `/api/kcb/ipn` | KCB transfer notification webhook |
| — | `php artisan ispcore:check-overdue` | Console command: detects overdue invoices, throttles/suspends network access, sends SMS reminders, creates HubSpot deals |

---

## 📸 Proof of work

**Odoo — synced invoice appears as a real draft invoice in the accounting UI**

![Odoo invoice draft](./proof-screenshots/odoo-invoice-draft.png)

**Odoo — invoice list confirming the sync (KES 3,000, matching ISPCore's invoice total)**

![Odoo invoices list](./proof-screenshots/odoo-invoices-list.png)

**HubSpot — customer synced as a real CRM contact**

![HubSpot contacts](./proof-screenshots/hubspot-contacts.png)

*(Add a HubSpot deals screenshot here too, showing the "Overdue: INV-..." deal created by `php artisan ispcore:check-overdue`.)*

---

## 🛠️ Tech Stack

**Backend:** PHP, Laravel 13
**Database:** PostgreSQL (Neon)
**Payments:** M-Pesa Daraja, Paystack
**Banking:** KCB Buni
**ERP:** Odoo (JSON-RPC)
**CRM:** HubSpot
**SMS:** Africa's Talking
**Dev environment:** GitHub Codespaces (zero local setup)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

Built by **[William Obote](https://github.com/william-obote-dev)** · [LinkedIn](https://linkedin.com/in/william-obote)

</div>
