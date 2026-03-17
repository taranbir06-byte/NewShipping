# 💳 Kahlon Shipyard — Payment Gateway Setup Guide

## Your UPI ID: 9878097904@ptyes

---

## ⚡ RAZORPAY SETUP (10 minutes, recommended)

### Step 1 — Register (free)
1. Go to **https://dashboard.razorpay.com/register**
2. Enter your business name: **Kahlon Shipyard**
3. Verify mobile + email OTP
4. You get instant **Test Mode** access — no KYC needed for testing

### Step 2 — Get API Keys
1. Dashboard → **Settings** (left sidebar)
2. → **API Keys** tab
3. Click **Generate Key for Test Mode**
4. Copy **Key ID** (starts with `rzp_test_...`) and **Key Secret**

### Step 3 — Add UPI for Settlements (live mode)
1. Dashboard → **Settings** → **Business Profile**
2. Add your UPI: `9878097904@ptyes`
3. Complete KYC (PAN + Aadhaar) — takes 1–2 business days

### Step 4 — Paste keys into config.js
```js
// backend/config.js
razorpay: {
  key_id:     'rzp_test_XXXXXXXXXXXX',   // ← paste here
  key_secret: 'XXXXXXXXXXXXXXXXXXXXXXXX', // ← paste here
}
```

### Step 5 — Set up Webhook (optional but recommended)
1. Dashboard → **Settings** → **Webhooks** → **Add New Webhook**
2. URL: `https://your-domain.com/api/payments/razorpay/webhook`
3. Events: `payment.captured`, `payment.failed`
4. Copy the **Webhook Secret** → paste into `config.js`

---

## ⚡ CASHFREE SETUP (alternative)

### Step 1 — Register
1. Go to **https://merchant.cashfree.com/merchants/signup**
2. Register with your mobile number
3. Sandbox (test) access is instant

### Step 2 — Get API Keys
1. Dashboard → **Developers** → **API Keys**
2. Copy **App ID** and **Secret Key** from the **Test** tab

### Step 3 — Add to config.js
```js
cashfree: {
  app_id:      'YOUR_APP_ID',    // ← paste here
  secret_key:  'YOUR_SECRET',   // ← paste here
  environment: 'TEST',          // change to 'PROD' when live
}
```

---

## 🔄 SWITCHING TEST → LIVE

### Razorpay
- In `config.js`, replace `rzp_test_...` keys with `rzp_live_...` keys
- Live keys appear after KYC is approved

### Cashfree
- Change `environment: 'TEST'` → `environment: 'PROD'`
- Replace test keys with live keys from the **Production** tab

---

## 🏃 RUNNING THE APP

```bash
cd backend
npm install
npm start
# → http://localhost:3001
```

Default login: `admin@kahlon-shipyard.com` / `admin123`

---

## 📡 PAYMENT API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/payments/razorpay/create-order | Create Razorpay order |
| POST | /api/payments/razorpay/verify | Verify payment signature |
| POST | /api/payments/razorpay/webhook | Razorpay webhook receiver |
| POST | /api/payments/cashfree/create-order | Create Cashfree order |
| POST | /api/payments/cashfree/verify | Verify Cashfree payment |
| POST | /api/payments/cashfree/webhook | Cashfree webhook receiver |
| GET  | /api/payments | List all transactions |
| GET  | /api/payments/summary | Revenue stats |
| POST | /api/payments/refund | Initiate refund |

---

## 💡 HOW THE PAYMENT FLOW WORKS

```
User clicks "Pay"
      ↓
Backend: POST /razorpay/create-order
      ↓ (creates order in Razorpay + saves to SQLite as 'created')
Frontend: Opens official Razorpay checkout popup
      ↓ (user enters UPI / card details on Razorpay's secure page)
User pays → Razorpay processes → calls your backend webhook
      ↓
Backend: POST /razorpay/verify (HMAC-SHA256 signature check)
      ↓ (marks payment 'completed' in SQLite)
Money lands in your bank/UPI: 9878097904@ptyes ✅
```
