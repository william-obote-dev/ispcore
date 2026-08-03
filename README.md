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
