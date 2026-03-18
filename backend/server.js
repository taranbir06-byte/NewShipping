const express = require('express');
const path = require('path');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const fleetRoutes = require('./routes/fleet');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 8080;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

const db = initDB();

app.get('/health', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.send('Kahlon Shipyard API running'));

app.use('/api/auth', authRoutes(db));
app.use('/api/payments', paymentRoutes(db));
app.use('/api', fleetRoutes(db));

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚓ Kahlon Shipyard running on ${PORT}`);
});
