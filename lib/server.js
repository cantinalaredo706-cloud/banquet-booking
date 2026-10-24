/* Shared server helpers: database, settings, email sending, and reading requests. */
import * as R from '../public/js/rules.js';

export class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status } }
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export const fail = e => e instanceof HttpError ? json({ error: e.message }, e.status) : (console.error(e), json({ error: 'Something went wrong on our end. Please try again, or call us.' }, 500));

/* ---------- Database (tables are created automatically the first time) ---------- */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS bookings (
     id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, status TEXT NOT NULL,
     space TEXT NOT NULL, date TEXT NOT NULL, block TEXT, time INTEGER, ext INTEGER NOT NULL DEFAULT 0,
     name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, guests INTEGER NOT NULL, why TEXT,
     data TEXT NOT NULL, decided_at INTEGER, decided_by TEXT)`,
  `CREATE INDEX IF NOT EXISTS bookings_date ON bookings(date)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS pdr_one_per_block ON bookings(date, block) WHERE space = 'pdr' AND status <> 'declined'`,
  `CREATE TABLE IF NOT EXISTS emails (
     id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, kind TEXT NOT NULL, to_addr TEXT NOT NULL,
     subject TEXT NOT NULL, body TEXT NOT NULL, result TEXT NOT NULL, booking_id INTEGER)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
];
let schemaReady = false;
export async function getDB(env) {
  if (!env.DB) throw new HttpError(503, 'Bookings are not open yet (the database is not connected).');
  if (!schemaReady) { await env.DB.batch(SCHEMA.map(s => env.DB.prepare(s))); schemaReady = true }
  return env.DB;
}

export const SLOT_COLS = 'space, date, block, time, ext, status';
export function rowToBooking(r) {
  const d = JSON.parse(r.data || '{}');
  return Object.assign(d, { id: r.id, createdAt: r.created_at, status: r.status, space: r.space, date: r.date, block: r.block, time: r.time, ext: !!r.ext, name: r.name, email: r.email, phone: r.phone, guests: r.guests, why: r.why, decidedAt: r.decided_at, decidedBy: r.decided_by });
}

/* ---------- Manager settings (alert address and which alerts to send) ---------- */
export const ALERT_KINDS = { inquiry: 'Guest starts a booking', contract: 'Guest signs the agreement', request: 'Booking needs approval', confirmed: 'Booking confirmed' };
export async function getSettings(env, DB) {
  const rows = (await DB.prepare('SELECT key, value FROM settings').all()).results || [];
  const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
  let prefs = { inquiry: true, contract: true, request: true, confirmed: true };
  try { if (m.prefs) prefs = Object.assign(prefs, JSON.parse(m.prefs)) } catch { }
  return { alertTo: m.alertTo ?? (env.ALERT_TO || ''), prefs };
}
export async function saveSettings(DB, s) {
  await DB.batch([
    DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind('alertTo', s.alertTo),
    DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind('prefs', JSON.stringify(s.prefs))
  ]);
}

/* ---------- Email through Resend. Never throws; every attempt is logged for the manager view. ---------- */
export const emailReady = env => !!(env.RESEND_API_KEY && env.MAIL_FROM);
export async function sendMail(env, DB, { kind, to, subject, body, bookingId = null }) {
  const list = (Array.isArray(to) ? to : String(to || '').split(/[,;\s]+/)).map(s => s.trim()).filter(Boolean);
  let result;
  if (!list.length) result = 'Not sent: no address';
  else if (!emailReady(env)) result = 'Not sent: email is not set up yet';
  else {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: env.MAIL_FROM, to: list, subject, text: body, ...(env.REPLY_TO ? { reply_to: env.REPLY_TO } : {}) })
      });
      if (r.ok) result = 'Sent';
      else { let msg = ''; try { msg = (await r.json()).message || '' } catch { } result = `Not sent: ${r.status} ${msg}`.trim().slice(0, 300) }
    } catch (e) { result = 'Not sent: ' + String(e.message || e).slice(0, 200) }
  }
  try {
    await DB.prepare('INSERT INTO emails (at, kind, to_addr, subject, body, result, booking_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(Date.now(), kind, list.join(', ') || '(none)', subject, body, result, bookingId).run();
  } catch (e) { console.error('email log failed', e) }
  return result;
}
export async function alertManagers(env, DB, kind, mail, bookingId = null) {
  const s = await getSettings(env, DB);
  if (!s.prefs[kind]) return;
  const link = env.SITE_URL ? `\n\nManager view: ${env.SITE_URL.replace(/\/$/, '')}/manager/` : '';
  return sendMail(env, DB, { kind, to: s.alertTo, subject: mail.s, body: mail.b + link, bookingId });
}

/* ---------- Reading what the guest page sends ---------- */
export async function readJson(request) {
  const text = await request.text();
  if (text.length > 20000) throw new HttpError(413, 'That request is too large.');
  try { return JSON.parse(text) } catch { throw new HttpError(400, 'Something went wrong sending your details. Please refresh and try again.') }
}
const str = (v, max = 200) => String(v ?? '').slice(0, max);
const int = v => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null };
/* Keep only the fields we expect, in the shapes we expect. */
export function cleanBooking(body) {
  if (body && body.website) throw new HttpError(400, 'Please refresh and try again.'); // hidden field bots fill in
  const space = str(body?.space, 10);
  if (!R.SPACES[space]) throw new HttpError(400, 'Choose a space.');
  const s = body.sel || {}, f = body.form || {};
  const sel = { date: str(s.date, 10), block: space === 'pdr' ? (['lunch', 'dinner'].includes(s.block) ? s.block : null) : null, time: null, ext: false };
  if (space === 'pdr') { if (sel.block === 'dinner') sel.time = int(s.time); if (sel.block === 'lunch') sel.ext = !!s.ext }
  else sel.time = int(s.time);
  const form = {
    name: str(f.name, 120).trim(), email: str(f.email, 160).trim(), phone: str(f.phone, 40).trim(), org: str(f.org, 160).trim(),
    type: R.EVENT_TYPES.includes(f.type) ? f.type : 'Other', guests: str(f.guests, 6), food: str(f.food, 20),
    brunchAdd: !!f.brunchAdd, platS: Math.max(0, int(f.platS) || 0), platL: Math.max(0, int(f.platL) || 0),
    bar: str(f.bar, 10), barOpen: f.barOpen === 'limited' ? 'limited' : 'full', barLimited: str(f.barLimited, 300).trim(),
    barCap: str(f.barCap, 10), barTickets: str(f.barTickets, 4), checks: str(f.checks, 1), tv: space === 'pdr' && !!f.tv, notes: str(f.notes, 2000).trim()
  };
  const errs = R.validateDetails(space, sel, form);
  if (errs.length) throw new HttpError(400, errs.join(' '));
  return { space, sel, form, sig: str(body.sig, 120).trim() };
}
export const bookingView = ({ space, sel, form }, extra = {}) => Object.assign({ space }, sel, form, { guests: parseInt(form.guests, 10) }, extra);
