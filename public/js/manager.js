/* Manager view: approve or decline held bookings, see upcoming parties and every email the site sent. */
import * as R from './rules.js';
const { SPACES, esc, money, fmtShort, fmtT } = R;

document.getElementById('brand-line').textContent = `Manager view · ${R.BRAND} · ${R.LOCATION}`;
let D = null, open = null, busy = false, err = null, addOpen = false;
const freshAdd = () => ({ space: 'dr', date: '', block: 'dinner', time: '', ext: false, name: '', phone: '', email: '', guests: '', type: 'Birthday', food: '', org: '', notes: '', emailGuest: false });
let F = freshAdd();

async function api(path, body) {
  const r = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' });
  let j = {}; try { j = await r.json() } catch { }
  if (!r.ok) { const e = new Error(j.error || `Something went wrong (${r.status}).`); e.status = r.status; e.info = j; throw e }
  return j;
}
async function load() {
  try { D = await api('/api/manager/data'); err = null }
  catch (e) { err = e }
  render();
}
let toastT;
function toast(msg) { const t = document.getElementById('toast'); t.innerHTML = `<span>${esc(msg)}</span>`; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 6000) }

function timeOptions() {
  if (F.space === 'pdr' && F.block === 'lunch') return R.LUNCH_STARTS;
  const out = [], start = F.space === 'pdr' ? 15 * 60 : 11 * 60;
  const end = F.space === 'pdr' ? 20 * 60 : (R.isDate(F.date) ? R.closeMin(F.date) : 22 * 60) - 30;
  for (let m = start; m <= end; m += 30) out.push(m);
  return out;
}
function addForm() {
  if (!addOpen) return `<div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h3>Add a booking</h3><p class="small muted" style="margin-top:4px">For phone or walk-in parties. It's confirmed right away and blocks that time on the guest calendar.</p></div><button type="button" class="btn primary small" data-action="addopen">+ Add a booking</button></div>`;
  const sel = (k, opts) => `<select data-add="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(F[k]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const inp = (k, type = 'text', x = '') => `<input type="${type}" data-add="${k}" value="${esc(F[k])}" ${x}>`;
  const times = timeOptions();
  const foods = [['', 'Not decided yet'], ['menu', 'Order from the menu'], ...R.LUNCH_SET.map(p => [`set-l-${p}`, `Lunch set menu · $${p}`]), ...R.DINNER_SET.map(p => [`set-d-${p}`, `Dinner set menu · $${p}`]), ...R.BUFFETS.map(b => [b.id, b.name])];
  return `<div class="card" style="display:flex;flex-direction:column;gap:14px"><h3>Add a booking</h3><div id="add-errors"></div>
    <div class="form">
      <label class="f">Space${sel('space', Object.values(SPACES).map(x => [x.id, x.name]))}</label>
      <label class="f">Date${inp('date', 'date', `min="${R.todayLocal()}"`)}</label>
      ${F.space === 'pdr' ? `<label class="f">Lunch or dinner${sel('block', [['lunch', 'Lunch · 11 am–3 pm'], ['dinner', 'Dinner · until close']])}</label>` : ''}
      <label class="f">${F.space === 'pdr' ? (F.block === 'lunch' ? 'Lunch starts' : 'Dinner starts') : 'Arrival time'}${sel('time', [['', 'Choose a time'], ...times.map(m => [m, fmtT(m)])])}</label>
      ${F.space === 'pdr' && F.block === 'lunch' ? `<label class="check full"><input type="checkbox" data-add="ext" ${F.ext ? 'checked' : ''}><span>Keep the room until 4:00 pm</span></label>` : ''}
      <label class="f">Reservation name${inp('name', 'text', 'maxlength="120"')}</label>
      <label class="f">Guests${inp('guests', 'number', `min="1" ${SPACES[F.space].maxG ? `max="${SPACES[F.space].maxG}"` : ''} inputmode="numeric"`)}</label>
      <label class="f">Phone${inp('phone', 'tel', 'maxlength="40"')}</label>
      <label class="f">Email <span class="hint">Optional</span>${inp('email', 'email', 'maxlength="160"')}</label>
      <label class="f">Type of event${sel('type', R.EVENT_TYPES.map(t => [t, t]))}</label>
      <label class="f">Food${sel('food', foods)}</label>
      <label class="f full">Company or organization <span class="hint">Optional</span>${inp('org', 'text', 'maxlength="160"')}</label>
      <label class="f full">Notes <span class="hint">Optional</span><textarea data-add="notes" maxlength="2000">${esc(F.notes)}</textarea></label>
      <label class="check full"><input type="checkbox" data-add="emailGuest" ${F.emailGuest ? 'checked' : ''}><span>Email the guest a confirmation (needs their email)</span></label>
    </div>
    <div class="actions"><button type="button" class="btn ghost small" data-action="addcancel">Cancel</button><button type="button" class="btn primary small" data-action="addsave" ${busy ? 'disabled' : ''}>Add booking</button></div></div>`;
}
const when = b => b.space === 'pdr' ? (b.block === 'lunch' ? `Lunch${b.time != null ? ' ' + fmtT(b.time) : ''}${b.ext ? ' (room until 4)' : ''}` : 'Dinner ' + fmtT(b.time)) : fmtT(b.time);
function card(b) {
  const e = R.estimate(b);
  return `<div class="req"><div class="row"><b>${esc(b.name)}</b><span class="pill held">On hold</span></div><span class="why">${esc(b.why)}</span>
    <dl class="kv"><dt>When</dt><dd>${esc(R.whenText(b))}</dd><dt>Guests</dt><dd>${b.guests} · ${esc(b.type)}</dd>${b.org ? `<dt>Company</dt><dd>${esc(b.org)}</dd>` : ''}<dt>Food</dt><dd>${e.f ? esc(e.f.name) : '—'}${b.brunchAdd ? ' + coffee/tea/OJ' : ''}</dd>${(+b.platS || +b.platL) ? `<dt>Platters</dt><dd>${+b.platS || 0} small, ${+b.platL || 0} large</dd>` : ''}<dt>Bar</dt><dd>${esc(R.barText(b))}</dd><dt>Checks</dt><dd>${esc(b.checks)}</dd>${b.tv ? '<dt>TV</dt><dd>Yes ($75)</dd>' : ''}${e.priced ? `<dt>Estimate</dt><dd class="mono">${money(e.total)}</dd>` : ''}<dt>Card</dt><dd>${b.card ? `${esc(b.card.brand)} •••• ${esc(b.card.last4)}` : 'Not on file yet — call the guest'}</dd><dt>Contact</dt><dd><a href="mailto:${esc(b.email)}">${esc(b.email)}</a><br><a href="tel:${esc(b.phone.replace(/[^\d+]/g, ''))}">${esc(b.phone)}</a></dd><dt>Submitted</dt><dd>${esc(R.fmtStamp(b.createdAt))}</dd></dl>
    ${b.notes ? `<p class="small muted">“${esc(b.notes)}”</p>` : ''}
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn danger small" data-action="decline" data-id="${b.id}" ${busy ? 'disabled' : ''}>Decline</button><button type="button" class="btn primary small" data-action="approve" data-id="${b.id}" ${busy ? 'disabled' : ''}>Approve</button></div></div>`;
}
function render() {
  const app = document.getElementById('app');
  if (err) {
    app.innerHTML = `<div class="mgr"><div class="col"><div class="card"><h3>${err.status === 401 ? 'Please sign in again' : err.info?.setup ? 'Manager login not set up yet' : 'Could not load bookings'}</h3><p class="muted" style="margin-top:8px">${esc(err.message)}</p>${err.info?.why ? `<p class="small" style="margin-top:8px"><b>Reason:</b> ${esc(err.info.why)}</p>` : ''}
      <div class="actions" style="margin-top:12px"><span></span><button type="button" class="btn primary small" data-action="${err.status === 401 ? 'signin' : 'reload'}">${err.status === 401 ? 'Sign in' : 'Try again'}</button></div></div></div></div>`;
    return;
  }
  if (!D) return;
  document.getElementById('who').textContent = D.me ? `Signed in as ${D.me}` : '';
  const s = D.settings;
  app.innerHTML = `<div class="mgr"><div class="col">
    ${D.emailReady ? '' : '<div class="banner"><b>Email is not set up yet.</b> Bookings are saved, but no emails go out until the Resend step is finished. Each one is listed under “Emails” as not sent.</div>'}
    ${addForm()}
    <div class="panel-head"><span class="eyebrow">Manager view</span><h2>Needs your approval</h2><p class="muted">Held bookings keep the space until you decide. Approving or declining emails the guest.</p></div>
    ${D.held.length ? D.held.map(card).join('') : `<p class="empty">Nothing waiting. Private Dining Room and Bar bookings, lunch extensions, and the 3rd+ Dining Room party of a day show up here.</p>`}
    <div class="card"><h3 style="margin-bottom:8px">Upcoming parties</h3>${D.upcoming.length ? `<div class="tablewrap"><table class="up"><tbody>${D.upcoming.map(b => `<tr><td>${fmtShort(b.date)}</td><td>${SPACES[b.space].name}<br><span class="muted small">${when(b)}</span></td><td>${esc(b.name)}<br><span class="muted small">${b.guests} guests · <a href="tel:${esc(b.phone.replace(/[^\d+]/g, ''))}">${esc(b.phone)}</a></span></td><td><span class="pill ${b.status}">${b.status === 'held' ? 'On hold' : 'Confirmed'}</span>${b.manual ? '<br><span class="muted small">Added by hand</span>' : ''}</td><td>${b.status === 'confirmed' ? `<button type="button" class="btn danger small" data-action="cancelbk" data-id="${b.id}" ${busy ? 'disabled' : ''}>Cancel</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">No upcoming parties yet.</p>'}</div>
    ${D.declined.length ? `<div class="card"><h3 style="margin-bottom:8px">Recently declined or cancelled</h3><div class="tablewrap"><table class="up"><tbody>${D.declined.map(b => `<tr><td>${fmtShort(b.date)}</td><td>${SPACES[b.space].name}</td><td>${esc(b.name)}</td><td class="small muted">${b.cancelled ? 'Cancelled' : 'Declined'}${b.decidedBy ? ' by ' + esc(b.decidedBy) : ''}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
  </div><div class="col">
    <div class="panel-head"><span class="eyebrow">Email notifications</span><h2>Emails</h2><p class="muted">Every email the site sent or tried to send, newest first. Click one to read it.</p></div>
    <div class="inbox">${D.emails.length ? D.emails.map(m => `<div class="mail"><button type="button" data-action="mail" data-id="${m.id}" aria-expanded="${open === m.id}"><span class="unread r"></span><span style="min-width:0"><span class="subj" style="display:block">${m.kind === 'guest' ? '<span class="tag g">To guest</span>' : '<span class="tag">To managers</span>'}${esc(m.subject)}</span><span class="to">${esc(m.to_addr)}<span class="res ${m.result === 'Sent' ? '' : 'no'}">${esc(m.result)}</span></span></span><span class="t">${esc(R.fmtStamp(m.at))}</span></button>${open === m.id ? `<div class="body">${esc(m.body)}</div>` : ''}</div>`).join('') : '<p class="empty" style="padding:12px 14px">No emails yet.</p>'}</div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><h3>Alert settings</h3>
      <label class="f">Send manager alerts to <span class="hint">Separate several addresses with commas</span><input type="text" id="alertTo" value="${esc(s.alertTo)}" placeholder="name@example.com, other@example.com"></label>
      ${Object.entries(D.alertKinds).map(([k, l]) => `<label class="check"><input type="checkbox" data-pref="${k}" ${s.prefs[k] ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}
      <div><button type="button" class="btn primary small" data-action="save" ${busy ? 'disabled' : ''}>Save settings</button></div></div>
  </div></div>`;
}

document.addEventListener('click', async e => {
  const t = e.target.closest('[data-action]'); if (!t || t.disabled) return; const a = t.dataset.action;
  if (a === 'reload') { err = null; document.getElementById('app').innerHTML = '<p class="loading">Loading bookings…</p>'; return load() }
  if (a === 'signin') { location.href = '/cdn-cgi/access/logout'; return } // clears an old or stale sign-in, then the manager page asks for a fresh one
  if (a === 'mail') { const id = +t.dataset.id; open = open === id ? null : id; render(); return }
  if (a === 'approve' || a === 'decline') {
    const b = D.held.find(x => x.id === +t.dataset.id);
    if (!confirm(`${a === 'approve' ? 'Approve' : 'Decline'} ${b.name}, ${SPACES[b.space].name} on ${fmtShort(b.date)}?\n\nThe guest will be emailed.`)) return;
    busy = true; render();
    try { const r = await api('/api/manager/decide', { id: b.id, decision: a }); toast(`${a === 'approve' ? 'Approved' : 'Declined'}. Guest email: ${r.guestEmail}.`) }
    catch (x) { toast(x.message) }
    busy = false; return load();
  }
  if (a === 'addopen') { addOpen = true; render(); return }
  if (a === 'addcancel') { addOpen = false; F = freshAdd(); render(); return }
  if (a === 'addsave') {
    busy = true; render();
    try {
      const r = await api('/api/manager/add', F);
      toast(`Booking added for ${F.name}.${F.emailGuest ? ` Guest email: ${r.guestEmail}.` : ''}`);
      addOpen = false; F = freshAdd();
    } catch (x) {
      busy = false; render();
      const el = document.getElementById('add-errors'); if (el) { el.innerHTML = `<div class="errors" role="alert">${esc(x.message)}</div>`; el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
      return;
    }
    busy = false; return load();
  }
  if (a === 'cancelbk') {
    const b = D.upcoming.find(x => x.id === +t.dataset.id);
    if (!confirm(`Cancel ${b.name}, ${SPACES[b.space].name} on ${fmtShort(b.date)}?\n\nThe time opens up again on the guest calendar. The guest is NOT emailed, so let them know yourself.`)) return;
    busy = true; render();
    try { await api('/api/manager/cancel', { id: b.id }); toast(`Cancelled ${b.name}.`) } catch (x) { toast(x.message) }
    busy = false; return load();
  }
  if (a === 'save') {
    const prefs = {}; document.querySelectorAll('[data-pref]').forEach(el => prefs[el.dataset.pref] = el.checked);
    busy = true; render();
    const alertTo = document.getElementById('alertTo')?.value;
    try { await api('/api/manager/settings', { alertTo: pending.alertTo ?? alertTo, prefs: pending.prefs ?? prefs }); toast('Settings saved.') }
    catch (x) { toast(x.message) }
    pending = {}; busy = false; return load();
  }
});
/* Remember edits to the settings box so a re-render doesn't lose them */
let pending = {};
function addField(el) {
  const k = el.dataset.add; if (!k) return false;
  F[k] = el.type === 'checkbox' ? el.checked : el.value;
  if (k === 'email' && !F.email) F.emailGuest = false;
  return k;
}
document.addEventListener('input', e => { if (addField(e.target)) return; if (e.target.id === 'alertTo') { pending.alertTo = e.target.value; D.settings.alertTo = e.target.value } });
document.addEventListener('change', e => {
  const ak = addField(e.target);
  if (ak) { if (['space', 'block', 'date'].includes(ak)) { if (ak !== 'date') F.time = ''; render() } return }
  const k = e.target.dataset?.pref; if (k) { D.settings.prefs[k] = e.target.checked } });

load();
