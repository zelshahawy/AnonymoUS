# AnonymoUS
# Secure Chat & Trading Platform

A real‐time chat application built with Go and Next.js, featuring:

- **Secure WebSockets** for peer‐to‐peer messaging
- **JWT HS256 cookie authentication**, protected by Google reCAPTCHA and rate limiting
- **Stock market integration** via Yahoo Finance and Alpaca API
- **In‐chat Strategy Lab** for EMA/EMSTD backtests and auto‐deploy (220% simulated return)

---

## Features

1. **Chat**
   - Two‐pane UI: contacts sidebar + chat window
   - Message history on connect
   - WebSocket echo so both sender and recipient see messages

2. **Security**
   - JWT cookie (`session_token`) with `HttpOnly`, `Secure`, `SameSite=Lax`
   - Google reCAPTCHA on login
   - Rate limiting on login, heartbeat, and WS endpoints

3. **Trading & Monitoring**
   - Yahoo Finance API for real‐time quotes and indicators
   - Alpaca API for automated position sizing and order execution
   - In‐chat Strategy Lab: sweep EMA/EMSTD parameters, compute Sharpe, backtest, auto‐deploy

---
## Prerequisites

- **Node.js** ≥ 16, **npm**
- **Go** ≥ 1.20
- **MongoDB** 8.0 (local or via Docker)
- **Alpaca** account (API key/secret)
- **reCAPTCHA** site key & secret

---

## Environment Variables

Create a `.env` (or `.env.local`) at the project root:

```env
# Backend (Go)
PORT=8081
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=chatapp
JWT_SIGNING_KEY=<your_jwt_secret>
RECAPTCHA_SITE_KEY=<your_recaptcha_site_key>
RECAPTCHA_SECRET_KEY=<your_recaptcha_secret_key>
ALPACA_API_KEY=<your_alpaca_key>
ALPACA_API_SECRET=<your_alpaca_secret>
ALPACA_BASE_URL=https://paper-api.alpaca.markets
