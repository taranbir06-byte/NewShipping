// ═══════════════════════════════════════════════════════
//  KAHLON SHIPYARD — Payment Gateway Configuration
//
//  LOCAL:      Create backend/.env and fill in values
//  RAILWAY:    Set these in Railway → Variables tab (never hardcode keys)
// ═══════════════════════════════════════════════════════

if (process.env.NODE_ENV === 'production') {
  const missing = ['RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','CASHFREE_APP_ID','CASHFREE_SECRET_KEY']
    .filter(k => !process.env[k]);
  if (missing.length)
    console.warn(`⚠️  WARNING: Payment env vars not set: ${missing.join(', ')} — payment routes will fail`);
}

module.exports = {

  // ── RAZORPAY ────────────────────────────────────────
  // Railway env var names: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
  razorpay: {
    key_id:         process.env.RAZORPAY_KEY_ID         || '',
    key_secret:     process.env.RAZORPAY_KEY_SECRET     || '',
    webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  // ── CASHFREE ────────────────────────────────────────
  // Railway env var names: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV
  cashfree: {
    app_id:      process.env.CASHFREE_APP_ID     || '',
    secret_key:  process.env.CASHFREE_SECRET_KEY || '',
    environment: process.env.CASHFREE_ENV        || 'TEST',
  },

  // ── MERCHANT INFO ────────────────────────────────────
  merchant_upi:  '9878097904@ptyes',
  merchant_name: 'Kahlon Shipyard',

  // ── APP URL (auto-set on Railway via RAILWAY_STATIC_URL) ──
  app_url: process.env.RAILWAY_STATIC_URL
    ? 'https://' + process.env.RAILWAY_STATIC_URL
    : (process.env.APP_URL || 'http://localhost:3001'),
};
