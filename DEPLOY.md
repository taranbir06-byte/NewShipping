# ⚓ Kahlon Shipyard — Deployment Guide

## 🚀 Deploy to Railway (Recommended — One URL, Everything Together)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Kahlon Shipyard"
```
Go to **github.com** → New repository → `kahlon-shipyard` → create it, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/kahlon-shipyard.git
git push -u origin main
```

### Step 2 — Deploy on Railway
1. Go to **railway.app** → Login with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select `kahlon-shipyard`
4. Railway auto-detects and deploys ✅

### Step 3 — Add Environment Variables
Railway Dashboard → your service → **Variables** tab → add:
```
PORT                    = 3001
NODE_ENV                = production
JWT_SECRET              = any_long_random_string_32chars_minimum
RAZORPAY_KEY_ID         = rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET     = xxxxxxxxxxxxxxxxxxxxxxxx
CASHFREE_APP_ID         = your_cashfree_app_id
CASHFREE_SECRET_KEY     = your_cashfree_secret
CASHFREE_ENV            = TEST
```

### Step 4 — Add Persistent Volume (so database survives redeploys)
1. Railway Dashboard → **New** → **Volume**
2. Attach to your service
3. Mount path: `/app/data`
4. Add one more variable:
```
DB_PATH = /app/data/kahlon.db
```

### Step 5 — Done! 🎉
Railway gives you a live URL like:
```
https://kahlon-shipyard-production.up.railway.app
```
Your app is live. Share this URL with anyone.

---

## 🔑 Getting Payment Keys

### Razorpay (free)
1. **dashboard.razorpay.com/register**
2. Settings → API Keys → Generate Key
3. Copy Key ID + Key Secret → paste into Railway Variables

### Cashfree (free)
1. **merchant.cashfree.com/merchants/signup**
2. Developers → API Keys → Test tab
3. Copy App ID + Secret Key → paste into Railway Variables

---

## 💻 Running Locally
```bash
# 1. Copy environment file
cp .env.example backend/.env
# Edit backend/.env with your keys

# 2. Install & start
cd backend
npm install
npm start

# 3. Open http://localhost:3001
# Login: admin@kahlon-shipyard.com / admin123
```
