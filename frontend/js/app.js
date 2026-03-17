// ═══════════════════════════════════════════════════════
//  KAHLON SHIPYARD — Shared JS Module
// ═══════════════════════════════════════════════════════

// Auto-detects: same origin in production (Railway serves frontend + backend together),
// localhost:3001 in local development
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001/api'
  : (window.location.origin + '/api');

// ── AUTH HELPERS ──────────────────────────────────────
const Auth = {
  token: () => localStorage.getItem('hm_token'),
  user:  () => JSON.parse(localStorage.getItem('hm_user') || 'null'),
  logout: () => {
    localStorage.removeItem('hm_token');
    localStorage.removeItem('hm_user');
    window.location.href = 'index.html';
  },
  require: () => {
    if (!localStorage.getItem('hm_token')) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
};

// ── API CLIENT ────────────────────────────────────────
async function api(endpoint, opts = {}) {
  const token = Auth.token();
  try {
    const res = await fetch(API_BASE + endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      ...opts
    });
    if (res.status === 401 || res.status === 403) {
      Auth.logout();
      return null;
    }
    return await res.json();
  } catch (e) {
    toast('Connection error: ' + e.message, false);
    return null;
  }
}

// ── TOAST ─────────────────────────────────────────────
function toast(msg, ok = true) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast show ' + (ok ? 'toast-ok' : 'toast-err');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── BAR CHART ─────────────────────────────────────────
function renderBars(containerId, data, maxVal, cls = 'b-green') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const max = maxVal || Math.max(...data.map(d => d.v), 1);
  el.innerHTML = data.map(d => `
    <div class="bar-row">
      <div class="bar-lbl" title="${d.label}">${d.label}</div>
      <div class="bar-track">
        <div class="bar-fill ${cls}" style="width:${Math.max(3, (d.v / max) * 100)}%">
          ${d.display}
        </div>
      </div>
    </div>`).join('');
}

// ── MODAL HELPERS ─────────────────────────────────────
function openModal(id)  { document.getElementById('modal-' + id).classList.add('open'); }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('open'); }

function initModalClose() {
  document.querySelectorAll('.overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
  );
}

// ── FORMAT HELPERS ────────────────────────────────────
function fmt(n)       { return n != null ? Number(n).toLocaleString() : '—'; }
function fmtM(n)      { return n != null ? '$' + n + 'm' : '—'; }
function fmtSave(n)   { return (n >= 0 ? '+' : '') + '$' + (n / 1e6).toFixed(2) + 'm/yr'; }

// ── PAGE NAV ──────────────────────────────────────────
function showPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  if (el) el.classList.add('active');
  const titles = {
    dashboard: 'Dashboard', ships: 'Fleet Registry', eexi: 'EEXI Compliance',
    emissions: 'Emissions', cii: 'CII Ratings', fuel: 'Fuel Costs',
    scrapping: 'Scrapping Candidates', financials: 'Dividend Projections', nav: 'NAV Projections'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[page] || page;
  if (window.LOADERS && LOADERS[page]) LOADERS[page]();
}
