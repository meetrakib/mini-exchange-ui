# Mini Exchange UI

Demo **trading UI** for the [mini-derivatives-exchange](https://github.com/meetrakib/mini-derivatives-exchange) API: real-time price chart (Binance OHLC), order book, place/cancel orders, my orders, and my positions. Uses **signup/login** (email + password) so you get a JWT and never type a user ID; the app stores the token and sends it with every API request.

Part of the [Gamification](https://github.com/meetrakib/gamification-core) & [Mini Exchange](https://github.com/meetrakib/mini-derivatives-exchange) ecosystem. The backend lives in **mini-derivatives-exchange** (separate repo).

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Docker Setup](#docker-setup)
- [Local Development](#local-development)
- [Usage](#usage)
- [Tech Stack](#tech-stack)

---

## Features

- **Account**: Sign up or log in (email + password). Backend returns JWT and `user_id`; the UI stores the token and uses it for all trading endpoints.
- **Price chart**: OHLC data from the exchange API (`/api/v1/ticker/klines`), which uses **real Binance** market data (no API key). Default symbol: `BTC-PERP`.
- **Order book**: Live bids/asks from `GET /api/v1/orders/book` (symbol, depth).
- **Place order**: Limit or market, buy or sell; quantity and (for limit) price. Uses `POST /api/v1/orders` with Bearer token.
- **My orders**: List and cancel open orders via `GET /api/v1/orders` and `DELETE /api/v1/orders/{id}`.
- **My positions**: List positions from `GET /api/v1/positions`.

All trading is **paper/simulated**; no real funds. Optional: the exchange can emit trade events to a gamification backend for quests and leaderboards.

---

## Prerequisites

- **mini-derivatives-exchange** API must be running (e.g. `docker compose up` in the mini-derivatives-exchange repo). Default port: **8002**.
- The API URL must be reachable from the browser. If the UI runs in Docker and the API on the host, use `http://host.docker.internal:8002` for `NEXT_PUBLIC_API_URL`.

---

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the mini-derivatives-exchange API (no trailing slash). | `http://localhost:8002` |

Copy `.env.example` to `.env` and set `NEXT_PUBLIC_API_URL` if your API runs elsewhere (e.g. different host/port or Docker host).

---

## Docker Setup

1. Ensure **mini-derivatives-exchange** is running (e.g. `http://localhost:8002`).
2. Clone and enter the repo:
   ```bash
   cd mini-exchange-ui
   ```
3. Copy env:
   ```bash
   cp .env.example .env
   ```
4. If the UI runs in Docker and the API on the host, set in `.env`:
   ```bash
   NEXT_PUBLIC_API_URL=http://host.docker.internal:8002
   ```
5. Start the app:
   ```bash
   docker compose up --build
   ```
6. Open **http://localhost:3003** (or the port defined in `docker-compose.yml`).
7. Stop:
   ```bash
   docker compose down
   ```

---

## Local Development

- Node.js 18+ and npm (or yarn/pnpm).

```bash
npm install
cp .env.example .env   # set NEXT_PUBLIC_API_URL if needed
npm run dev
```

App: **http://localhost:3000** (or the port Next.js reports). Set `NEXT_PUBLIC_API_URL=http://localhost:8002` so the browser can reach the exchange API.

---

## Usage

1. **Sign up or log in** so the app has a JWT. All trading endpoints require the Bearer token.
2. **Dashboard**: View the price chart (Binance OHLC), order book, and your positions.
3. **Place order**: Choose limit or market, buy/sell, quantity, and (for limit) price. Submit; the order appears in “My orders” and may fill immediately (market or matching limit).
4. **My orders**: See open/filled/cancelled orders; cancel open orders if needed.
5. **My positions**: See your positions per symbol (size, entry price).

---

## Tech Stack

- **Next.js** (App Router)
- **React**, **Tailwind CSS**
- **Recharts** (or similar) for the price chart
- API client: `fetch` with `Authorization: Bearer <token>` (see `lib/api.ts`)

For full architecture, API details, and repo map, see the [mini-derivatives-exchange](https://github.com) README and `ARCHITECTURE_AND_PROJECTS.md` in the workspace root (if present).
