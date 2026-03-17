const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const fleetRoutes = require('./routes/fleet');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ─────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off so frontend assets load
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://shipping-orpin.vercel.app",
    ...(process.env.RAILWAY_STATIC_URL ? [`https://${process.env.RAILWAY_STATIC_URL}`] : []),
    ...(process.env.APP_URL ? [process.env.APP_URL] : []),
  ],
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());

// ── DATABASE ───────────────────────────────────────────
const db = initDB();

// ── HEALTH ROUTES ──────────────────────────────────────
app.get("/health", (req,res)=>res.send("OK"));
app.get("/", (req,res)=>res.send("Kahlon Shipyard API running"));

// ── API ROUTES ─────────────────────────────────────────
app.use('/api/auth', authRoutes(db));
app.use('/api/payments', paymentRoutes(db));
app.use('/api', fleetRoutes(db));

// ── STATIC FRONTEND ────────────────────────────────────
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('*',(req,res)=>{
  res.sendFile(path.join(frontendPath,'index.html'));
});

// ── START SERVER ───────────────────────────────────────
app.listen(PORT,'0.0.0.0',()=>{
  console.log(`⚓ Kahlon Shipyard running on ${PORT}`);
});
