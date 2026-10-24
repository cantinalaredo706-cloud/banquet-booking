/* Manager view: approve or decline held bookings, see upcoming parties and every email the site sent. */
import * as R from './rules.js';
const { SPACES, esc, money, fmtShort, fmtT } = R;

document.getElementById('brand-line').textContent = `Manager view · ${R.BRAND} · ${R.LOCATION}`;
let D = null, open = null, busy = false, err = null;

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

const when = b => b.space === 'pdr' ? (b.block === 'lunch' ? `Lunch${b.ext ? ' (until 4)' : ''}` : 'Dinner ' + fmtT(b.time)) : fmtT(b.time);
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
    app.innerHTML = `<div class="mgr"><div class="col"><div class="card"><h3>${err.status === 401 ? 'Please sign in again' : err.info?.setup ? 'Manager login not set up yet' : 'Could not load bookings'}</h3><p class="muted" style="margin-top:8px">${esc(err.message)}</p>
      <div class="actions" style="margin-top:12px"><span></span><button type="button" class="btn primary small" data-action="${err.status === 401 ? 'signin' : 'reload'}">${err.status === 401 ? 'Sign in' : 'Try again'}</button></div></div></div></div>`;
    return;
  }
  if (!D) return;
  document.getElementById('who').textContent = D.me ? `Signed in as ${D.me}` : '';
  const s = D.settings;
  app.innerHTML = `<div class="mgr"><div class="col">
    ${D.emailReady ? '' : '<div class="banner"><b>Email is not set up yet.</b> Bookings are saved, but no emails go out until the Resend step is finished. Each one is listed under “Emails” as not sent.</div>'}
    <div class="panel-head"><span class="eyebrow">Manager view</span><h2>Needs your approval</h2><p class="muted">Held bookings keep the space until you decide. Approving or declining emails the guest.</p></div>
    ${D.held.length ? D.held.map(card).join('') : `<p class="empty">Nothing waiting. Private Dining Room and Bar bookings, lunch extensions, and the 3rd+ Dining Room party of a day show up here.</p>`}
    <div class="card"><h3 style="margin-bottom:8px">Upcoming parties</h3>${D.upcoming.length ? `<div class="tablewrap"><table class="up"><tbody>${D.upcoming.map(b => `<tr><td>${fmtShort(b.date)}</td><td>${SPACES[b.space].name}<br><span class="muted small">${when(b)}</span></td><td>${esc(b.name)}<br><span class="muted small">${b.guests} guests · <a href="tel:${esc(b.phone.replace(/[^\d+]/g, ''))}">${esc(b.phone)}</a></span></td><td><span class="pill ${b.status}">${b.status === 'held' ? 'On hold' : 'Confirmed'}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">No upcoming parties yet.</p>'}</div>
    ${D.declined.length ? `<div class="card"><h3 style="margin-bottom:8px">Recently declined</h3><div class="tablewrap"><table class="up"><tbody>${D.declined.map(b => `<tr><td>${fmtShort(b.date)}</td><td>${SPACES[b.space].name}</td><td>${esc(b.name)}</td><td class="small muted">${esc(b.decidedBy || '')}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
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
  if (a === 'signin') { location.reload(); return }
  if (a === 'mail') { const id = +t.dataset.id; open = open === id ? null : id; render(); return }
  if (a === 'approve' || a === 'decline') {
    const b = D.held.find(x => x.id === +t.dataset.id);
    if (!confirm(`${a === 'approve' ? 'Approve' : 'Decline'} ${b.name}, ${SPACES[b.space].name} on ${fmtShort(b.date)}?\n\nThe guest will be emailed.`)) return;
    busy = true; render();
    try { const r = await api('/api/manager/decide', { id: b.id, decision: a }); toast(`${a === 'approve' ? 'Approved' : 'Declined'}. Guest email: ${r.guestEmail}.`) }
    catch (x) { toast(x.message) }
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
document.addEventListener('input', e => { if (e.target.id === 'alertTo') { pending.alertTo = e.target.value; D.settings.alertTo = e.target.value } });
document.addEventListener('change', e => { const k = e.target.dataset?.pref; if (k) { D.settings.prefs[k] = e.target.checked } });

load();
