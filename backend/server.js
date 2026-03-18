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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const db = initDB();

app.get("/health", (req,res) => res.send("OK"));
app.get("/", (req,res) => res.send("Kahlon Shipyard API running"));

app.use('/api/auth', authRoutes(db));
app.use('/api/payments', paymentRoutes(db));
app.use('/api', fleetRoutes(db));

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.path.endsWith('.html')) {
    return res.sendFile(path.join(frontendPath, req.path));
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚓ Kahlon Shipyard running on ${PORT}`);
});
