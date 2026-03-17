const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'kahlon.db');

function initDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // ── USERS ───────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'viewer',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── SHIPS ───────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS ships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_name TEXT NOT NULL,
      price_usdm REAL,
      yard TEXT,
      size_dwtk INTEGER,
      ship_type TEXT,
      target_delivery_date TEXT,
      fuel_type TEXT
    );
    CREATE TABLE IF NOT EXISTS eexi_compliance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_label TEXT,
      build_year INTEGER,
      build_country TEXT,
      size_kdwt INTEGER,
      eexi_required REAL,
      eexi_calculated REAL,
      compliant TEXT
    );
    CREATE TABLE IF NOT EXISTS environmental_emissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_type TEXT,
      co2_kt_per_year REAL,
      nox_t_per_year REAL,
      sox_t_per_year REAL
    );
    CREATE TABLE IF NOT EXISTS cii_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER,
      kahlon_rating TEXT,
      avg_capesize_rating TEXT,
      fleet_noncompliant_pct REAL
    );
    CREATE TABLE IF NOT EXISTS fuel_cost_comparison (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER,
      lng_usd_per_day REAL,
      vlsfo_usd_per_day REAL,
      incremental_saving_usd_per_year REAL
    );
    CREATE TABLE IF NOT EXISTS financial_projections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario TEXT,
      rate_per_day INTEGER,
      dividend_per_share_usd REAL,
      yield_pct REAL
    );
    CREATE TABLE IF NOT EXISTS nav_projections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario TEXT,
      ship_value_usdm REAL,
      nav_per_share_usd REAL
    );
    CREATE TABLE IF NOT EXISTS scrapping_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER,
      scrapped_at_20_years INTEGER,
      scrapped_at_15_years INTEGER
    );
    CREATE TABLE IF NOT EXISTS lng_fleet_share (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER,
      lng_capable_pct REAL
    );
  `);

  // ── SEED ─────────────────────────────────────────────
  if (db.prepare('SELECT COUNT(*) as c FROM users').get().c === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)`)
      .run('Admin User', 'admin@kahlon-shipyard.com', hash, 'admin');
    console.log('✅ Default user seeded: admin@kahlon-shipyard.com / admin123');
  }

  if (db.prepare('SELECT COUNT(*) as c FROM ships').get().c === 0) {
    const ins = db.prepare(`INSERT INTO ships (ship_name,price_usdm,yard,size_dwtk,ship_type,target_delivery_date,fuel_type) VALUES (?,?,?,?,?,?,?)`);
    [
      ['Mount Kilimanjaro',67.8,'NTS',208,'Dual Fuel Newcastlemax','Mar-23','LNG/LSFO'],
      ['Mount Ita',67.8,'NTS',208,'Dual Fuel Newcastlemax','Mar-23','LNG/LSFO'],
      ['Mount Etna',67.8,'NTS',208,'Dual Fuel Newcastlemax','Apr-23','LNG/LSFO'],
      ['Mount Blanc',67.8,'NTS',208,'Dual Fuel Newcastlemax','Jul-23','LNG/LSFO'],
      ['Mount Matterhorn',69.6,'NTS',208,'Dual Fuel Newcastlemax','Sep-23','LNG/LSFO'],
      ['Mount Neblina',69.6,'NTS',208,'Dual Fuel Newcastlemax','Oct-23','LNG/LSFO'],
      ['Mount Bandeira',69.6,'NTS',208,'Dual Fuel Newcastlemax','Feb-24','LNG/LSFO'],
      ['Mount Hua',69.6,'NTS',208,'Dual Fuel Newcastlemax','Feb-24','LNG/LSFO'],
      ['Mount Elbrus',70.1,'NTS',208,'Dual Fuel Newcastlemax','Apr-24','LNG/LSFO'],
      ['Mount Emai',70.1,'NTS',208,'Dual Fuel Newcastlemax','Jul-24','LNG/LSFO'],
      ['Mount Denali',70.1,'NTS',208,'Dual Fuel Newcastlemax','Aug-24','LNG/LSFO'],
      ['Mount Aconcagua',70.1,'NTS',208,'Dual Fuel Newcastlemax','Sep-24','LNG/LSFO'],
    ].forEach(r => ins.run(...r));

    const ie = db.prepare(`INSERT INTO eexi_compliance (ship_label,build_year,build_country,size_kdwt,eexi_required,eexi_calculated,compliant) VALUES (?,?,?,?,?,?,?)`);
    [
      ['Capesize X',2009,'Korea',169,2.47,3.17,'No'],
      ['Capesize Y',2014,'China',180,2.40,2.43,'No'],
      ['Newcastlemax X',2019,'China',208,2.37,2.11,'Yes'],
      ['Kahlon Shipyard',2023,'China',208,2.37,1.51,'Yes'],
    ].forEach(r => ie.run(...r));

    const em = db.prepare(`INSERT INTO environmental_emissions (ship_type,co2_kt_per_year,nox_t_per_year,sox_t_per_year) VALUES (?,?,?,?)`);
    em.run('Standard 180k Capesize (adj.208k)', 37, 2110, 1640);
    em.run('Dual-Fuel LNG Newcastlemax', 22, 0, 2);

    [[2019,'A','C',0],[2023,'A','D',58],[2026,'A','D',74],[2030,'A','E',89]]
      .forEach(r => db.prepare(`INSERT INTO cii_ratings (year,kahlon_rating,avg_capesize_rating,fleet_noncompliant_pct) VALUES (?,?,?,?)`).run(...r));

    [[2024,19101,18201,-328000],[2025,15002,17605,950000],[2026,12564,17294,1700000],[2027,11440,17128,2000000]]
      .forEach(r => db.prepare(`INSERT INTO fuel_cost_comparison (year,lng_usd_per_day,vlsfo_usd_per_day,incremental_saving_usd_per_year) VALUES (?,?,?,?)`).run(...r));

    [['2020 Average',15400,0.4,7],['2023 FFA',23500,1.9,35],['20 Year Average',32800,3.6,64],
     ['2021 Average',33500,3.7,66],['20 Year High',148000,24.8,442]]
      .forEach(r => db.prepare(`INSERT INTO financial_projections (scenario,rate_per_day,dividend_per_share_usd,yield_pct) VALUES (?,?,?,?)`).run(...r));

    [['Current Implied Chinese Quotes',75.5,5.5],['2025 Delivery',83.0,8.2],
     ['Order Made Jan-22',88.0,10.1],['Previous Peak',148.0,32.5]]
      .forEach(r => db.prepare(`INSERT INTO nav_projections (scenario,ship_value_usdm,nav_per_share_usd) VALUES (?,?,?)`).run(...r));

    [[2022,57,287],[2023,28,45],[2024,41,110],[2025,47,212],[2026,58,251],
     [2027,56,214],[2028,45,103],[2029,110,94],[2030,212,88]]
      .forEach(r => db.prepare(`INSERT INTO scrapping_candidates (year,scrapped_at_20_years,scrapped_at_15_years) VALUES (?,?,?)`).run(...r));

    [[2022,0.3],[2023,0.6],[2024,1.9],[2025,3.1]]
      .forEach(r => db.prepare(`INSERT INTO lng_fleet_share (year,lng_capable_pct) VALUES (?,?)`).run(...r));

    console.log('✅ Fleet data seeded');
  }

  return db;
}

module.exports = { initDB };
