# ⚓ Kahlon Shipyard — Fleet Intelligence Platform

Full-stack web app with **authentication**, Express backend, SQLite database, and a professional multi-page frontend.

## 📁 Project Structure

```
kahlon-shipyard/
├── backend/
│   ├── server.js              ← Express entry point
│   ├── db.js                  ← SQLite setup & seed data
│   ├── middleware/
│   │   └── auth.js            ← JWT auth middleware
│   ├── routes/
│   │   ├── auth.js            ← /api/auth/* (login, register, me)
│   │   └── fleet.js           ← /api/* (ships, eexi, emissions, etc.)
│   └── package.json
└── frontend/
    ├── index.html             ← Login / Register page
    ├── dashboard.html         ← Full fleet dashboard (auth protected)
    ├── css/
    │   ├── base.css           ← Design system (colors, buttons, tables, etc.)
    │   └── dashboard.css      ← Sidebar, topbar, layout
    └── js/
        └── app.js             ← API client, auth helpers, shared utilities
```

## 🚀 Quick Start

### 1 — Install backend dependencies
```bash
cd backend
npm install
```

### 2 — Start the server
```bash
npm start
# or with auto-reload:
npm run dev
```

### 3 — Open the app
Visit: **http://localhost:3001**

Default credentials (seeded automatically):
- **Email:** `admin@kahlon-shipyard.com`
- **Password:** `admin123`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create new account |
| POST | /api/auth/login | Login → returns JWT token |
| GET  | /api/auth/me | Get current user (auth required) |
| GET  | /api/auth/users | List all users (admin only) |

### Fleet (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/summary | Dashboard stats |
| GET/POST/PUT/DELETE | /api/ships | Fleet management |
| GET/POST/PUT/DELETE | /api/eexi | EEXI compliance |
| GET/POST/PUT/DELETE | /api/emissions | Emissions data |
| GET | /api/cii | CII ratings |
| GET | /api/fuel-costs | LNG vs VLSFO costs |
| GET | /api/financials | Dividend projections |
| GET | /api/nav | NAV per share |
| GET | /api/scrapping | Scrapping candidates |
| GET | /api/lng-share | LNG fleet share |

---

## 🗄️ Database

SQLite file auto-created at `backend/kahlon.db` on first run.

**Tables:** `users`, `ships`, `eexi_compliance`, `environmental_emissions`, `cii_ratings`, `fuel_cost_comparison`, `financial_projections`, `nav_projections`, `scrapping_candidates`, `lng_fleet_share`

---

## 🔐 Authentication Flow

1. User visits `index.html` → enters credentials
2. POST to `/api/auth/login` → receives JWT
3. Token stored in `localStorage`
4. All dashboard API calls include `Authorization: Bearer <token>`
5. Backend validates JWT on every protected route
6. Token expires after 7 days

---

## Requirements
- Node.js 16+
- npm
# shipping
# NewShipping
