const express  = require('express');
const crypto   = require('crypto');
const axios    = require('axios');
const { authMiddleware } = require('../middleware/auth');
const config   = require('../config');

function paymentRoutes(db) {
  const router = express.Router();

  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER,
      gateway         TEXT NOT NULL,
      gateway_order_id TEXT,
      gateway_payment_id TEXT,
      amount          REAL NOT NULL,
      currency        TEXT DEFAULT 'INR',
      method          TEXT,
      status          TEXT DEFAULT 'created',
      description     TEXT,
      reference       TEXT UNIQUE,
      card_last4      TEXT,
      vpa             TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── RAZORPAY: Create Order ────────────────────────────
  router.post('/razorpay/create-order', authMiddleware, async (req, res) => {
    const { amount, currency = 'INR', description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const reference   = 'KS-RZP-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
    const amountPaise = Math.round(parseFloat(amount) * 100);

    try {
      const rzpRes = await axios.post(
        'https://api.razorpay.com/v1/orders',
        { amount: amountPaise, currency, receipt: reference, notes: { description: description || 'Kahlon Shipyard', user_id: String(req.user.id) } },
        { auth: { username: config.razorpay.key_id, password: config.razorpay.key_secret } }
      );
      const order = rzpRes.data;
      const result = db.prepare(
        `INSERT INTO payments (user_id,gateway,gateway_order_id,amount,currency,status,description,reference) VALUES (?,?,?,?,?,?,?,?)`
      ).run(req.user.id, 'razorpay', order.id, amount, currency, 'created', description||'', reference);

      res.json({ order_id: order.id, key_id: config.razorpay.key_id, amount: amountPaise, currency, reference, payment_db_id: result.lastInsertRowid, merchant: { name: config.merchant_name, upi: config.merchant_upi } });
    } catch (err) {
      console.error('RZP order error:', err.response?.data || err.message);
      res.status(502).json({ error: err.response?.data?.error?.description || err.message });
    }
  });

  // ── RAZORPAY: Verify Signature ────────────────────────
  router.post('/razorpay/verify', authMiddleware, (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: 'Missing fields' });

    const expected = crypto.createHmac('sha256', config.razorpay.key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    const isValid = expected === razorpay_signature;

    db.prepare(`UPDATE payments SET status=?,gateway_payment_id=?,updated_at=datetime('now') WHERE gateway_order_id=?`)
      .run(isValid ? 'completed' : 'failed', razorpay_payment_id, razorpay_order_id);

    const payment = db.prepare('SELECT * FROM payments WHERE gateway_order_id=?').get(razorpay_order_id);
    isValid
      ? res.json({ success: true, message: 'Payment verified', payment })
      : res.status(400).json({ success: false, error: 'Signature mismatch', payment });
  });

  // ── RAZORPAY: Webhook ────────────────────────────────
  router.post('/razorpay/webhook', express.raw({ type: '*/*' }), (req, res) => {
    const sig    = req.headers['x-razorpay-signature'];
    const secret = config.razorpay.webhook_secret;
    if (secret && sig) {
      const exp = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
      if (exp !== sig) return res.status(400).json({ error: 'Bad signature' });
    }
    try {
      const event  = JSON.parse(req.body);
      const entity = event.payload?.payment?.entity;
      if (entity) {
        const status = event.event === 'payment.captured' ? 'completed' : event.event === 'payment.failed' ? 'failed' : null;
        if (status) db.prepare(`UPDATE payments SET status=?,gateway_payment_id=?,method=?,vpa=?,card_last4=?,updated_at=datetime('now') WHERE gateway_order_id=?`)
          .run(status, entity.id, entity.method||null, entity.vpa||null, entity.card?.last4||null, entity.order_id);
      }
    } catch(e) { console.error('Webhook parse:', e.message); }
    res.json({ received: true });
  });

  // ── CASHFREE: Create Order ────────────────────────────
  const CF_BASE = config.cashfree.environment === 'PROD'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

  const cfH = () => ({
    'x-client-id':     config.cashfree.app_id,
    'x-client-secret': config.cashfree.secret_key,
    'x-api-version':   '2023-08-01',
    'Content-Type':    'application/json',
  });

  router.post('/cashfree/create-order', authMiddleware, async (req, res) => {
    const { amount, currency = 'INR', description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const user      = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
    const reference = 'KS-CF-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();

    try {
      const cfRes = await axios.post(`${CF_BASE}/orders`, {
        order_id: reference,
        order_amount: parseFloat(amount),
        order_currency: currency,
        order_note: description || 'Kahlon Shipyard Payment',
        customer_details: {
          customer_id:    'KS_' + req.user.id,
          customer_name:  user?.name  || 'Kahlon User',
          customer_email: user?.email || 'user@kahlon.com',
          customer_phone: '9999999999',
        },
        order_meta: {
          return_url: `${config.app_url}/payments.html?cf_order={order_id}&status=SUCCESS`,
          notify_url: `${config.app_url}/api/payments/cashfree/webhook`,
        }
      }, { headers: cfH() });

      const order = cfRes.data;
      db.prepare(`INSERT INTO payments (user_id,gateway,gateway_order_id,amount,currency,status,description,reference) VALUES (?,?,?,?,?,?,?,?)`)
        .run(req.user.id, 'cashfree', reference, amount, currency, 'created', description||'', reference);

      res.json({ order_id: reference, payment_session_id: order.payment_session_id, environment: config.cashfree.environment, amount, currency, reference, merchant: { name: config.merchant_name, upi: config.merchant_upi } });
    } catch (err) {
      console.error('CF order error:', err.response?.data || err.message);
      res.status(502).json({ error: err.response?.data?.message || err.message });
    }
  });

  // ── CASHFREE: Verify ─────────────────────────────────
  router.post('/cashfree/verify', authMiddleware, async (req, res) => {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id required' });
    try {
      const cfRes = await axios.get(`${CF_BASE}/orders/${order_id}/payments`, { headers: cfH() });
      const latest  = Array.isArray(cfRes.data) ? cfRes.data[0] : cfRes.data;
      const success = latest?.payment_status === 'SUCCESS';
      db.prepare(`UPDATE payments SET status=?,gateway_payment_id=?,method=?,updated_at=datetime('now') WHERE gateway_order_id=?`)
        .run(success ? 'completed' : 'failed', latest?.cf_payment_id||null, latest?.payment_method ? Object.keys(latest.payment_method)[0] : null, order_id);
      const payment = db.prepare('SELECT * FROM payments WHERE gateway_order_id=?').get(order_id);
      res.json({ success, payment, cf_status: latest?.payment_status });
    } catch (err) {
      res.status(502).json({ error: 'CF verify failed: ' + err.message });
    }
  });

  // ── CASHFREE: Webhook ─────────────────────────────────
  router.post('/cashfree/webhook', express.raw({ type: '*/*' }), (req, res) => {
    // Verify Cashfree signature if secret is configured
    const ts  = req.headers['x-webhook-timestamp'];
    const sig = req.headers['x-webhook-signature'];
    if (config.cashfree.secret_key && ts && sig) {
      const expected = crypto.createHmac('sha256', config.cashfree.secret_key)
        .update(ts + req.body).digest('base64');
      if (expected !== sig) return res.status(400).json({ error: 'Bad signature' });
    }
    try {
      const body   = JSON.parse(req.body);
      const status = body.type === 'PAYMENT_SUCCESS_WEBHOOK' ? 'completed' : body.type === 'PAYMENT_FAILED_WEBHOOK' ? 'failed' : null;
      if (status && body.data?.order?.order_id)
        db.prepare(`UPDATE payments SET status=?,updated_at=datetime('now') WHERE gateway_order_id=?`).run(status, body.data.order.order_id);
    } catch(e) { console.error('CF webhook:', e.message); }
    res.json({ received: true });
  });

  // ── SHARED: List & Summary ────────────────────────────
  router.get('/', authMiddleware, (req, res) => {
    res.json(db.prepare(`SELECT p.*,u.name as user_name FROM payments p LEFT JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC LIMIT 100`).all());
  });

  router.get('/summary', authMiddleware, (req, res) => {
    res.json({
      total_revenue: db.prepare("SELECT ROUND(SUM(amount),2) as t FROM payments WHERE status='completed'").get().t || 0,
      completed:     db.prepare("SELECT COUNT(*) as c FROM payments WHERE status='completed'").get().c,
      pending:       db.prepare("SELECT COUNT(*) as c FROM payments WHERE status='created'").get().c,
      failed:        db.prepare("SELECT COUNT(*) as c FROM payments WHERE status='failed'").get().c,
      by_gateway:    db.prepare("SELECT gateway,COUNT(*) as count,ROUND(SUM(amount),2) as total FROM payments WHERE status='completed' GROUP BY gateway").all(),
    });
  });

  // ── SHARED: Refund ────────────────────────────────────
  router.post('/refund', authMiddleware, async (req, res) => {
    const { payment_id } = req.body;
    const rec = db.prepare('SELECT * FROM payments WHERE id=?').get(payment_id);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (rec.status !== 'completed') return res.status(400).json({ error: 'Only completed payments can be refunded' });

    if (rec.gateway === 'razorpay' && rec.gateway_payment_id) {
      try {
        await axios.post(`https://api.razorpay.com/v1/payments/${rec.gateway_payment_id}/refund`,
          { amount: Math.round(rec.amount * 100) },
          { auth: { username: config.razorpay.key_id, password: config.razorpay.key_secret } }
        );
      } catch(e) { console.error('RZP refund:', e.response?.data); }
    }
    db.prepare("UPDATE payments SET status='refunded',updated_at=datetime('now') WHERE id=?").run(payment_id);
    res.json({ message: 'Refund initiated' });
  });

  return router;
}

module.exports = paymentRoutes;
