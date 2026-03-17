const express = require('express');
const { authMiddleware } = require('../middleware/auth');

function fleetRoutes(db) {
  const router = express.Router();
  router.use(authMiddleware);

  // ── SUMMARY ──────────────────────────────────────────
  router.get('/summary', (req, res) => {
    res.json({
      total_ships:       db.prepare('SELECT COUNT(*) as c FROM ships').get().c,
      total_fleet_value: db.prepare('SELECT ROUND(SUM(price_usdm),1) as t FROM ships').get().t || 0,
      avg_ship_price:    db.prepare('SELECT ROUND(AVG(price_usdm),2) as a FROM ships').get().a || 0,
      eexi_compliant:    db.prepare("SELECT COUNT(*) as c FROM eexi_compliance WHERE compliant='Yes'").get().c,
      eexi_noncompliant: db.prepare("SELECT COUNT(*) as c FROM eexi_compliance WHERE compliant='No'").get().c,
      co2_reduction_pct: 40, nox_reduction_pct: 99, sox_reduction_pct: 99,
    });
  });

  // ── SHIPS CRUD ────────────────────────────────────────
  router.get('/ships', (req, res) => res.json(db.prepare('SELECT * FROM ships').all()));
  router.get('/ships/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM ships WHERE id=?').get(req.params.id);
    row ? res.json(row) : res.status(404).json({ error: 'Not found' });
  });
  router.post('/ships', (req, res) => {
    const { ship_name, price_usdm, yard, size_dwtk, ship_type, target_delivery_date, fuel_type } = req.body;
    if (!ship_name) return res.status(400).json({ error: 'ship_name required' });
    const r = db.prepare(`INSERT INTO ships (ship_name,price_usdm,yard,size_dwtk,ship_type,target_delivery_date,fuel_type) VALUES (?,?,?,?,?,?,?)`)
      .run(ship_name, price_usdm, yard, size_dwtk, ship_type, target_delivery_date, fuel_type);
    res.status(201).json({ id: r.lastInsertRowid, message: 'Ship created' });
  });
  router.put('/ships/:id', (req, res) => {
    const { ship_name, price_usdm, yard, size_dwtk, ship_type, target_delivery_date, fuel_type } = req.body;
    const r = db.prepare(`UPDATE ships SET ship_name=?,price_usdm=?,yard=?,size_dwtk=?,ship_type=?,target_delivery_date=?,fuel_type=? WHERE id=?`)
      .run(ship_name, price_usdm, yard, size_dwtk, ship_type, target_delivery_date, fuel_type, req.params.id);
    r.changes ? res.json({ message: 'Updated' }) : res.status(404).json({ error: 'Not found' });
  });
  router.delete('/ships/:id', (req, res) => {
    const r = db.prepare('DELETE FROM ships WHERE id=?').run(req.params.id);
    r.changes ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Not found' });
  });

  // ── EEXI CRUD ─────────────────────────────────────────
  router.get('/eexi', (req, res) => res.json(db.prepare('SELECT * FROM eexi_compliance').all()));
  router.post('/eexi', (req, res) => {
    const { ship_label, build_year, build_country, size_kdwt, eexi_required, eexi_calculated, compliant } = req.body;
    const r = db.prepare(`INSERT INTO eexi_compliance (ship_label,build_year,build_country,size_kdwt,eexi_required,eexi_calculated,compliant) VALUES (?,?,?,?,?,?,?)`)
      .run(ship_label, build_year, build_country, size_kdwt, eexi_required, eexi_calculated, compliant);
    res.status(201).json({ id: r.lastInsertRowid });
  });
  router.put('/eexi/:id', (req, res) => {
    const { ship_label, build_year, build_country, size_kdwt, eexi_required, eexi_calculated, compliant } = req.body;
    db.prepare(`UPDATE eexi_compliance SET ship_label=?,build_year=?,build_country=?,size_kdwt=?,eexi_required=?,eexi_calculated=?,compliant=? WHERE id=?`)
      .run(ship_label, build_year, build_country, size_kdwt, eexi_required, eexi_calculated, compliant, req.params.id);
    res.json({ message: 'Updated' });
  });
  router.delete('/eexi/:id', (req, res) => {
    db.prepare('DELETE FROM eexi_compliance WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  });

  // ── EMISSIONS CRUD ────────────────────────────────────
  router.get('/emissions', (req, res) => res.json(db.prepare('SELECT * FROM environmental_emissions').all()));
  router.post('/emissions', (req, res) => {
    const { ship_type, co2_kt_per_year, nox_t_per_year, sox_t_per_year } = req.body;
    const r = db.prepare(`INSERT INTO environmental_emissions (ship_type,co2_kt_per_year,nox_t_per_year,sox_t_per_year) VALUES (?,?,?,?)`)
      .run(ship_type, co2_kt_per_year, nox_t_per_year, sox_t_per_year);
    res.status(201).json({ id: r.lastInsertRowid });
  });
  router.put('/emissions/:id', (req, res) => {
    const { ship_type, co2_kt_per_year, nox_t_per_year, sox_t_per_year } = req.body;
    db.prepare(`UPDATE environmental_emissions SET ship_type=?,co2_kt_per_year=?,nox_t_per_year=?,sox_t_per_year=? WHERE id=?`)
      .run(ship_type, co2_kt_per_year, nox_t_per_year, sox_t_per_year, req.params.id);
    res.json({ message: 'Updated' });
  });
  router.delete('/emissions/:id', (req, res) => {
    db.prepare('DELETE FROM environmental_emissions WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  });

  // ── READ-ONLY ─────────────────────────────────────────
  router.get('/cii',        (req, res) => res.json(db.prepare('SELECT * FROM cii_ratings ORDER BY year').all()));
  router.get('/fuel-costs', (req, res) => res.json(db.prepare('SELECT * FROM fuel_cost_comparison ORDER BY year').all()));
  router.get('/financials', (req, res) => res.json(db.prepare('SELECT * FROM financial_projections ORDER BY rate_per_day').all()));
  router.get('/nav',        (req, res) => res.json(db.prepare('SELECT * FROM nav_projections ORDER BY ship_value_usdm').all()));
  router.get('/scrapping',  (req, res) => res.json(db.prepare('SELECT * FROM scrapping_candidates ORDER BY year').all()));
  router.get('/lng-share',  (req, res) => res.json(db.prepare('SELECT * FROM lng_fleet_share ORDER BY year').all()));

  return router;
}

module.exports = fleetRoutes;
