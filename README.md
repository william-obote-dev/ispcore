<div align="center">

# 🌐 ISPCore

**API-first billing & operations platform for ISPs — VAT-compliant invoicing, subscription management, and M-Pesa Daraja payment integration.**

![PHP](https://img.shields.io/badge/-PHP-777BB4?style=flat-square&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/-Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![M-Pesa](https://img.shields.io/badge/-M--Pesa%20Daraja-00A651?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-00A896?style=flat-square)

</div>

---

## 📖 Overview

ISPCore is a billing and operations platform built for a real-world scenario: how a small-to-mid-size ISP actually runs its back office — invoicing customers, collecting payment via M-Pesa, and eventually reconciling with banks and syncing to accounting/CRM systems.

Most billing systems bolt payment providers on as an afterthought, tightly coupled to one API. ISPCore is built the opposite way: every external integration sits behind an adapter interface, so swapping M-Pesa for a bank, or Paystack for Flutterwave, is a configuration change — not a rewrite.

---

## ✨ Features (implemented so far)

- **VAT-compliant invoicing** — Kenyan 16% VAT calculated and stored explicitly, with sequential, gap-free invoice numbering (`INV-2026-0001`, `INV-2026-0002`, ...)
- **Customer & subscription management** — customers, internet plans, and active subscriptions with proper relational integrity
- **M-Pesa Daraja integration** — full STK Push flow: OAuth token generation (cached), push initiation, and asynchronous webhook confirmation
- **Payment tracking** — a dedicated `payments` table decoupled from invoices, tracking provider, status, and raw provider responses — built to support multiple payment providers side by side
- **REST API** — fully testable via curl/Postman, no frontend required

---

## 🏗️ Architecture
**Key design decision:** Safaricom's callback doesn't echo back your original reference — it only returns `CheckoutRequestID`. So `CheckoutRequestID` is stored on the `Payment` record *before* the STK push is even sent, and used to match the callback when it arrives. This is a common mistake in M-Pesa integrations that this project explicitly avoids.

Customer ──▶ Subscription ──▶ Invoice (VAT calculated, sequential numbering)
│
▼
POST /invoices/{id}/pay
│
▼
MpesaService::stkPush() ──▶ Safaricom Daraja API
│ │
Payment record created STK push sent to phone
(status: pending) │
│ ▼
│ Customer enters M-Pesa PIN
│ │
▼ ▼
POST /api/mpesa/callback ◀── Safaricom sends result
│
▼
Payment matched by CheckoutRequestID,
status updated (completed/failed),
Invoice marked paid on success

## 🚀 Getting Started

### Prerequisites
- PHP 8.4+
- Composer
- A PostgreSQL database (e.g. free tier on [Neon](https://neon.tech))
- A Safaricom Developer sandbox account for M-Pesa credentials

### Installation

```bash
git clone https://github.com/william-obote-dev/ispcore.git
cd ispcore
composer install
cp .env.example .env
php artisan key:generate
```

### Configuration

Set these in `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=your-postgres-host
DB_PORT=5432
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_SSLMODE=require

MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-sandbox-passkey
MPESA_CALLBACK_URL=https://your-public-url/api/mpesa/callback
```

### Run migrations

```bash
php artisan migrate
```

### Start the server

```bash
php artisan serve
```

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/customers` | Create a customer |
| `GET` | `/api/customers/{id}` | View customer with subscriptions & invoices |
| `POST` | `/api/customers/{id}/subscriptions` | Subscribe a customer to a plan |
| `POST` | `/api/subscriptions/{id}/invoice` | Generate a VAT-compliant invoice |
| `POST` | `/api/invoices/{id}/pay` | Trigger M-Pesa STK Push for an invoice |
| `GET` | `/api/payments/{id}` | Check payment status |
| `POST` | `/api/mpesa/callback` | Safaricom webhook (not called by clients) |

---

## 🗺️ Roadmap

- [x] Core billing engine with VAT-compliant invoicing
- [x] M-Pesa Daraja STK Push + webhook confirmation
- [ ] Banking API reconciliation (Jenga)
- [ ] Payment gateway integration (Paystack)
- [ ] ERP sync (Odoo) for accounting/journal entries
- [ ] CRM sync (HubSpot) for sales/support handoff
- [ ] Network session simulation (RADIUS-style)

---

## 🛠️ Tech Stack

**Backend:** PHP, Laravel 13
**Database:** PostgreSQL (Neon)
**Payments:** M-Pesa Daraja API
**Dev environment:** GitHub Codespaces (zero local setup)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

Built by **[William Obote](https://github.com/william-obote-dev)** · [LinkedIn](https://linkedin.com/in/william-obote)

</div>
