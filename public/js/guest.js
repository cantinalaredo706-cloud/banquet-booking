/* Guest booking page: spaces & menus → date & time → party details → agreement → submit. */
import * as R from './rules.js';
const { SPACES, BUFFETS, BAROPTS, LUNCH_SET, DINNER_SET, money, money0, esc, fmtLong, fmtShort, fmtT, pad } = R;

document.getElementById('brand-line').textContent = `${R.BRAND} · ${R.LOCATION}`;
document.title = `Parties & Private Events · ${R.BRAND}`;

/* ---------- state ---------- */
let A = R.makeAvail([]), loaded = false;
const today = () => R.todayLocal();
const firstMonth = () => { const t = today(); return { y: +t.slice(0, 4), m: +t.slice(5, 7) - 1 } };
const S = {
  step: 1, tab: 'spaces', space: 'pdr', month: firstMonth(), sel: { date: null, block: null, time: null, ext: false },
  form: R.freshForm(), agree: false, sig: '', inquirySent: false, contractSent: false, done: null, busy: false
};
const STEPS = ['Spaces & menus', 'Date & time', 'Your party', 'Agreement', 'Submit', 'Done'];
const cur = () => Object.assign({ space: S.space }, S.sel, S.form);
const payload = () => ({ space: S.space, sel: S.sel, form: S.form, website: S.hp || '' });

/* ---------- talking to the server ---------- */
async function api(path, body) {
  const r = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  let j = {}; try { j = await r.json() } catch { }
  if (!r.ok) { const e = new Error(j.error || `Something went wrong (${r.status}). Please try again, or call us.`); e.status = r.status; throw e }
  return j;
}
async function loadAvail() {
  try { const j = await api('/api/availability'); A = R.makeAvail(j.slots); loaded = true }
  catch (e) { loaded = 'error'; toast(e.message) }
  render();
}

/* ---------- render ---------- */
function maxStep() { if (S.step === 6) return 6; let m = 2; if (S.sel.date && (S.sel.block || S.sel.time != null)) m = 3; if (S.inquirySent) m = 4; if (S.contractSent) m = 5; return Math.max(m, S.step) }
function render() {
  const ms = maxStep();
  const st = `<ol class="stepper">${STEPS.map((t, i) => {
    const n = i + 1, cls = n === S.step ? 'cur' : n < S.step ? 'done' : '', dis = S.step === 6 ? n !== 6 : n > ms;
    return `<li><button type="button" class="${cls}" data-action="goto" data-n="${n}" ${dis ? 'disabled' : ''}><span class="n">${n < S.step && S.step !== 6 ? '✓' : n}</span>${t}</button></li>`
  }).join('')}</ol>`;
  document.getElementById('app').innerHTML = `<div class="layout"><section class="main">${st}${[0, stepBrowse, stepDate, stepDetails, stepContract, stepSubmit, stepDone][S.step]()}</section><aside class="summary" id="summary">${summary()}</aside></div>`;
  if (S.step === 3) syncDetailsUI();
}

function stepBrowse() {
  const t = S.tab;
  const tabs = `<div class="tabs" role="tablist">${[['spaces', 'Spaces'], ['set', 'Set menus'], ['buffets', 'Buffets & appetizers'], ['bar', 'Bar options']].map(([k, l]) => `<button type="button" role="tab" aria-selected="${t === k}" data-action="tab" data-t="${k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (t === 'spaces') body = `<div class="grid">
    <article class="card offer"><h3>Private Dining Room</h3><p class="muted">${SPACES.pdr.desc}</p>
      <div class="tablewrap"><table class="up"><tbody><tr><td></td><td><b>Minimum</b></td><td><b>Cancel fee</b></td></tr>
      <tr><td>Lunch Sun–Thu</td><td class="mono">$550</td><td class="mono">$275</td></tr><tr><td>Dinner Sun–Thu</td><td class="mono">$1,100</td><td class="mono">$550</td></tr>
      <tr><td>Lunch Fri, Sat, holidays</td><td class="mono">$650</td><td class="mono">$325</td></tr><tr><td>Dinner Fri, Sat, holidays</td><td class="mono">$1,300</td><td class="mono">$650</td></tr></tbody></table></div>
      <p class="small muted">Minimums are before tax and gratuity. Lunch 11 am–3 pm. Dinner starts 3–8 pm and runs until close. Cancel fee applies within 72 hours.</p>
      <div class="spacer"></div><button type="button" class="btn ghost small" data-action="pickspace" data-s="pdr">Check Private Dining Room dates</button></article>
    <article class="card offer"><h3>Dining Room</h3><p class="muted">${SPACES.dr.desc}</p>
      <dl class="facts"><dt>Party size</dt><dd>11 to 100 guests</dd><dt>Arrival</dt><dd>11 am to 30 min before close</dd><dt>Rental fee</dt><dd>None</dd></dl>
      <div class="tablewrap"><table class="up"><tbody><tr><td><b>Party size</b></td><td><b>Cancel fee</b></td></tr><tr><td>9–15</td><td class="mono">$200</td></tr><tr><td>16–25</td><td class="mono">$250</td></tr><tr><td>Over 25</td><td class="mono">$300</td></tr></tbody></table></div>
      <p class="small muted">Fee applies within 12 hours of the event, or if the party hasn't arrived 30 minutes after its time.</p>
      <div class="spacer"></div><button type="button" class="btn ghost small" data-action="pickspace" data-s="dr">Check Dining Room dates</button></article>
    <article class="card offer"><h3>Bar <span class="pending">Agreement pending</span></h3><p class="muted">${SPACES.bar.desc}</p>
      <dl class="facts"><dt>Party size</dt><dd>11 or more</dd><dt>Arrival</dt><dd>11 am to 30 min before close</dd><dt>Cancel</dt><dd>24 hours before</dd><dt>Final count</dt><dd>1 day before</dd></dl>
      <div class="spacer"></div><button type="button" class="btn ghost small" data-action="pickspace" data-s="bar">Check Bar dates</button></article></div>
    <p class="small muted">Parties of 10 or fewer in the Dining Room or Bar: please use our regular reservations. A 22% gratuity and 6.5% sales tax are added to every party's check.</p>`;
  if (t === 'set') body = `<div class="card setgrid"><p class="muted">Parties of 25 or more choose a set menu. <span class="pending">Menu details coming soon</span></p>
    <div class="setrow"><div><span class="eyebrow">Lunch</span></div><div class="chips">${LUNCH_SET.map(p => `<span class="chip"><span>${money0(p)}</span></span>`).join('')}</div></div>
    <div class="setrow"><div><span class="eyebrow">Dinner</span></div><div class="chips">${DINNER_SET.map(p => `<span class="chip"><span>${money0(p)}</span></span>`).join('')}</div></div>
    <p class="small muted">Prices are per guest, before tax and gratuity.</p></div>`;
  if (t === 'buffets') body = `<p class="muted">Buffets need at least 12 guests and are available in all three spaces. For buffet or appetizer parties, all food is paid on one check.</p><div class="grid">${BUFFETS.map(b => `<article class="card offer"><h3>${b.name}</h3><div class="price">${money(b.price)} <small>per guest</small></div><p class="muted small">${b.desc}</p></article>`).join('')}
    <article class="card offer"><h3>Appetizer Platters</h3><div class="price">$75 / $95</div><p class="muted small">Small feeds 12–15, large feeds 18–21. Chef's choice from potato kegs, corn nuggets, empanadas, quesadillas, fried cauliflower, chicken wings, Southwest eggrolls, queso & guacamole, chips & salsa.</p></article></div>
    <p class="small muted">Brunch add-on: coffee, tea and orange juice for $2 per guest. "Chef's choice" means the chef selects the appetizers based on availability; we're happy to consider your preferences.</p>`;
  if (t === 'bar') body = `<div class="grid">${BAROPTS.map(b => `<article class="card offer"><h3>${b.name}</h3><p class="muted">${b.desc}</p>${b.id !== 'cash' && b.id !== 'open' ? '<span class="pending">Suggestions coming</span>' : ''}</article>`).join('')}</div><p class="small muted">We don't offer flat-rate bar packages. These options let you control the experience and the budget.</p>`;
  return `<div class="panel-head"><span class="eyebrow">Step 1</span><h2>Spaces and menus</h2><p class="muted">We don't charge rental fees. A credit card on file holds your space and is not charged unless you cancel late or don't show.</p></div>${tabs}${body}
    <div class="actions"><span></span><button type="button" class="btn primary" data-action="goto" data-n="2">Check available dates →</button></div>`
}

function stepDate() {
  const sp = S.space, { y, m: mo } = S.month, first = new Date(Date.UTC(y, mo, 1)).getUTCDay(), days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  const t = today(), mx = R.addDays(t, R.MAXDAYS), key = y * 12 + mo;
  const minKey = (+t.slice(0, 4)) * 12 + (+t.slice(5, 7) - 1), maxKey = (+mx.slice(0, 4)) * 12 + (+mx.slice(5, 7) - 1);
  const tabs = `<div class="spacetabs" role="group" aria-label="Space">${Object.values(SPACES).map(s => `<button type="button" data-action="space" data-s="${s.id}" aria-pressed="${sp === s.id}"><b>${s.name}</b><span>${s.short}</span></button>`).join('')}</div>`;
  if (loaded !== true) return `<div class="panel-head"><span class="eyebrow">Step 2</span><h2>Date and time</h2></div>${tabs}<div class="card"><p class="loading">${loaded === 'error' ? 'We couldn\'t load available dates. <button type="button" class="btn ghost small" data-action="reload">Try again</button>' : 'Loading available dates…'}</p></div>`;
  let cells = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < first; i++) cells += `<div class="day blank"></div>`;
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${pad(mo + 1)}-${pad(d)}`, info = A.dayInfo(sp, ds), dis = info.state === 'off' || info.state === 'full';
    cells += `<button type="button" class="day ${info.state} ${S.sel.date === ds ? 'sel' : ''}" data-action="day" data-d="${ds}" ${dis ? 'aria-disabled="true"' : ''} aria-label="${fmtLong(ds)}${info.label ? ', ' + info.label : ''}"><span class="num">${d}</span>${info.state !== 'off' ? '<span class="dot"></span>' : ''}<span class="lbl">${esc(info.label)}</span></button>`
  }
  let pick = '';
  if (S.sel.date) {
    const ds = S.sel.date, hol = R.holidayName(ds);
    if (sp === 'pdr') {
      const l = A.pdrLunch(ds), dn = A.pdrDinner(ds), lt = R.pdrTerms(ds, 'lunch'), dt = R.pdrTerms(ds, 'dinner'), lo = A.lunchOK(ds), xo = A.extOK(ds);
      pick = `<div class="card"><h3>${fmtLong(ds)}</h3><p class="muted small" style="margin:4px 0 12px">${hol ? `${hol} — holiday minimums apply. ` : ''}Choose lunch or dinner.</p><div class="blocks">
        <div class="block ${l ? 'taken' : ''} ${S.sel.block === 'lunch' ? 'chosen' : ''}"><b>Lunch · 11:00 am–3:00 pm</b><span class="small">Minimum <span class="mono">${money0(lt.min)}</span> · cancel fee <span class="mono">${money0(lt.fee)}</span></span>
          ${l ? '<span class="small">Already booked</span>' : !lo ? '<span class="small">Less than 48 hours away — please call</span>' : `<label class="check small"><input type="checkbox" id="ext" ${S.sel.ext ? 'checked' : ''} ${xo ? '' : 'disabled'}><span>Request to stay until 4:00 pm${xo ? ' (manager approval)' : ' — not available, dinner party starts before 4'}</span></label>
          <button type="button" class="btn ${S.sel.block === 'lunch' ? 'primary' : 'ghost'} small" data-action="block" data-b="lunch">${S.sel.block === 'lunch' ? '✓ Lunch selected' : 'Choose lunch'}</button>`}</div>
        <div class="block ${dn ? 'taken' : ''} ${S.sel.block === 'dinner' ? 'chosen' : ''}"><b>Dinner · start 3–8 pm, until close (${fmtT(R.closeMin(ds))})</b><span class="small">Minimum <span class="mono">${money0(dt.min)}</span> · cancel fee <span class="mono">${money0(dt.fee)}</span></span>
          ${dn ? '<span class="small">Already booked</span>' : `<div class="times">${A.dinnerStarts(ds).map(x => `<button type="button" data-action="dstart" data-m="${x.m}" ${x.ok ? '' : 'disabled'} aria-pressed="${S.sel.block === 'dinner' && S.sel.time === x.m}">${fmtT(x.m)}</button>`).join('')}</div>`}</div></div></div>`;
    } else {
      const n = A.partiesOn(sp, ds).length, appr = A.needsApproval(sp, ds);
      pick = `<div class="card"><h3>${fmtLong(ds)}</h3><p class="muted small" style="margin:4px 0 12px">Pick an arrival time. ${n ? `${n} other part${n > 1 ? 'ies' : 'y'} booked this day. ` : ''}${appr && sp === 'dr' ? '<b>Your booking will need manager approval.</b>' : sp === 'dr' ? 'Your booking will be confirmed right away.' : 'A manager will confirm your Bar booking.'}</p>
        <div class="times">${A.arrivalTimes(ds).map(x => `<button type="button" data-action="atime" data-m="${x.m}" ${x.ok ? '' : 'disabled'} aria-pressed="${S.sel.time === x.m}">${fmtT(x.m)}</button>`).join('')}</div></div>`
    }
  }
  const ready = S.sel.date && (sp === 'pdr' ? (S.sel.block === 'lunch' || (S.sel.block === 'dinner' && S.sel.time != null)) : S.sel.time != null);
  const monthName = new Date(Date.UTC(y, mo, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `<div class="panel-head"><span class="eyebrow">Step 2</span><h2>Date and time</h2><p class="muted">Choose a space, then a date. Bookings must be at least 48 hours away; for anything sooner, please call a manager.</p></div>${tabs}
   <div class="card"><div class="calhead"><button type="button" class="btn ghost small" data-action="mon" data-dir="-1" ${key <= minKey ? 'disabled' : ''} aria-label="Previous month">←</button><h3>${monthName}</h3><button type="button" class="btn ghost small" data-action="mon" data-dir="1" ${key >= maxKey ? 'disabled' : ''} aria-label="Next month">→</button></div>
   <div class="cal">${cells}</div><div class="legend"><span><i style="background:var(--ok)"></i>${sp === 'pdr' ? 'Lunch & dinner open' : 'Open'}</span><span><i style="background:var(--gold)"></i>${sp === 'pdr' ? 'One open' : 'Needs approval'}</span><span><i style="background:var(--chile)"></i>Booked</span><span><i style="background:var(--off)"></i>Closed or call us</span></div></div>
   ${pick}<div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="1">← Back</button><button type="button" class="btn primary" data-action="next" ${ready ? '' : 'disabled'}>Continue →</button></div>`
}

function stepDetails() {
  const f = S.form, sp = SPACES[S.space], ds = S.sel.date;
  const inp = (k, l, type = 'text', x = '') => `<label class="f">${l}<input type="${type}" id="f-${k}" data-f="${k}" value="${esc(f[k])}" ${x}></label>`;
  const daytime = S.space === 'pdr' ? S.sel.block === 'lunch' : S.sel.time < 15 * 60; const brunchOK = R.isSatSun(ds) && daytime;
  const radio = (id, label, sub, dis) => `<label class="choice ${dis ? 'dis' : ''}"><input type="radio" name="food" id="fd-${id}" data-f="food" value="${id}" ${f.food === id ? 'checked' : ''} ${dis ? 'disabled' : ''}><span><b>${label}</b>${sub}</span></label>`;
  return `<div class="panel-head"><span class="eyebrow">Step 3</span><h2>Your party</h2><p class="muted">${R.whenText(Object.assign({ space: S.space }, S.sel))}</p></div><div id="form-errors"></div>
  <div class="card"><div class="form">
    ${inp('name', 'Reservation name', 'text', 'autocomplete="name" maxlength="120"')}${inp('email', 'Email', 'email', 'autocomplete="email" maxlength="160"')}
    ${inp('phone', 'Phone', 'tel', 'autocomplete="tel" maxlength="40"')}${inp('org', 'Company or organization <span class="hint">Optional</span>', 'text', 'maxlength="160"')}
    <label class="f">Type of event<select id="f-type" data-f="type">${R.EVENT_TYPES.map(o => `<option ${f.type === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
    <label class="f">Number of guests <span class="hint">${sp.id === 'pdr' ? 'Up to 40' : sp.id === 'dr' ? '11 to 100' : '11 or more'}</span><input type="number" id="f-guests" data-f="guests" min="${sp.minG}" ${sp.maxG ? `max="${sp.maxG}"` : ''} value="${esc(f.guests)}" inputmode="numeric"></label>
    <fieldset class="full"><legend>Food <span class="hint muted" style="font-weight:400">· parties of 25+ choose a set menu or buffet</span></legend>
      ${radio('menu', 'Order from our menu at the event', '<span class="small muted">Under 25 guests only. No estimate.</span>')}
      <div><span class="eyebrow">Set menus · per guest</span> <span class="pending">Details coming soon</span></div>
      <div class="setrow"><span class="small muted">Lunch</span><div class="chips">${LUNCH_SET.map(p => `<label class="chip"><input type="radio" name="food" id="fd-set-l-${p}" data-f="food" value="set-l-${p}" ${f.food === 'set-l-' + p ? 'checked' : ''}><span>${money0(p)}</span></label>`).join('')}</div></div>
      <div class="setrow"><span class="small muted">Dinner</span><div class="chips">${DINNER_SET.map(p => `<label class="chip"><input type="radio" name="food" id="fd-set-d-${p}" data-f="food" value="set-d-${p}" ${f.food === 'set-d-' + p ? 'checked' : ''}><span>${money0(p)}</span></label>`).join('')}</div></div>
      <div><span class="eyebrow">Buffets & appetizers · 12 guest minimum · one check</span></div>
      <div class="choices">${BUFFETS.map(b => radio(b.id, b.name, `<span class="mono">${money(b.price)}</span>/guest${b.brunch && !brunchOK ? '<br><span class="small">Sat & Sun, 10 am–3 pm only</span>' : ''}`, b.brunch && !brunchOK)).join('')}</div>
      <label class="check" id="brunchAddRow" ${f.food === 'brunch' ? '' : 'hidden'}><input type="checkbox" id="f-brunchAdd" data-fc="brunchAdd" ${f.brunchAdd ? 'checked' : ''}><span>Add coffee, tea and orange juice ($2 per guest)</span></label>
      <div class="inline"><span class="small"><b>Appetizer platters</b> (optional)</span><label class="small">Small, feeds 12–15 ($75) <input type="number" min="0" max="10" id="f-platS" data-f="platS" value="${esc(f.platS)}"></label><label class="small">Large, feeds 18–21 ($95) <input type="number" min="0" max="10" id="f-platL" data-f="platL" value="${esc(f.platL)}"></label></div>
    </fieldset>
    <fieldset class="full"><legend>Bar</legend>
      ${BAROPTS.map(b => `<div><label class="choice"><input type="radio" name="bar" id="br-${b.id}" data-f="bar" value="${b.id}" ${f.bar === b.id ? 'checked' : ''}><span><b>${b.name}</b>${b.desc}</span></label>${barSub(b.id)}</div>`).join('')}
    </fieldset>
    <fieldset class="full"><legend>How will the bill be paid?</legend><div class="inline" id="checksRow">${[1, 2, 3].map(n => `<label class="check"><input type="radio" name="checks" id="ck-${n}" data-f="checks" value="${n}" ${f.checks == n ? 'checked' : ''}><span>${n} check${n > 1 ? 's' : ''}</span></label>`).join('')}</div>
      <span class="small muted" id="checksNote">Maximum of 3 checks. Buffet or appetizer parties pay all food on one check.</span></fieldset>
    ${S.space === 'pdr' ? `<label class="check full"><input type="checkbox" id="f-tv" data-fc="tv" ${f.tv ? 'checked' : ''}><span>TV with HDMI ($75)</span></label>` : ''}
    <label class="f full">Special instructions <span class="hint">Food allergies, timing, decorations. Confetti and confetti poppers are not allowed.</span><textarea id="f-notes" data-f="notes" maxlength="2000">${esc(f.notes)}</textarea></label>
    <label class="hp" aria-hidden="true">Website<input type="text" id="hp-website" tabindex="-1" autocomplete="off"></label>
  </div></div>
  <div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="2">← Back</button><button type="button" class="btn primary" data-action="next">Review agreement →</button></div>`
}
function barSub(id) {
  const f = S.form, show = f.bar === id;
  if (id === 'open') return `<div class="sub" data-for="open" ${show ? '' : 'hidden'}><div class="inline"><label class="check"><input type="radio" name="barOpen" id="bo-full" data-f="barOpen" value="full" ${f.barOpen === 'full' ? 'checked' : ''}><span>Fully open</span></label><label class="check"><input type="radio" name="barOpen" id="bo-lim" data-f="barOpen" value="limited" ${f.barOpen === 'limited' ? 'checked' : ''}><span>Limited</span></label></div><label class="f">Which drinks? <span class="hint">For a limited bar</span><input type="text" id="f-barLimited" data-f="barLimited" value="${esc(f.barLimited)}" maxlength="300"></label></div>`;
  if (id === 'cap') return `<div class="sub" data-for="cap" ${show ? '' : 'hidden'}><label class="f">Spending limit ($)<input type="number" min="1" id="f-barCap" data-f="barCap" value="${esc(f.barCap)}"></label><span class="pending">Suggested amount coming</span></div>`;
  if (id === 'tickets') return `<div class="sub" data-for="tickets" ${show ? '' : 'hidden'}><label class="f">Tickets per guest<input type="number" min="1" max="10" id="f-barTickets" data-f="barTickets" value="${esc(f.barTickets)}"></label><span class="pending">Suggestion coming</span></div>`;
  return '';
}
function syncDetailsUI() {
  const f = S.form, fi = R.foodInfo(f.food);
  document.querySelectorAll('.sub[data-for]').forEach(el => el.hidden = el.dataset.for !== f.bar);
  const br = document.getElementById('brunchAddRow'); if (br) br.hidden = f.food !== 'brunch';
  const one = fi && fi.oneCheck; ['2', '3'].forEach(n => { const el = document.getElementById('ck-' + n); if (el) el.disabled = !!one });
  if (one && f.checks !== '1') { f.checks = '1'; const c = document.getElementById('ck-1'); if (c) c.checked = true }
  const note = document.getElementById('checksNote'); if (note) note.textContent = one ? 'Buffet or appetizer party: all food is paid on one check.' : 'Maximum of 3 checks. Buffet or appetizer parties pay all food on one check.';
}

function contractHtml() {
  const o = cur(), e = R.estimate(o), g = e.g;
  const head = `<dl class="kv"><dt>Reservation name</dt><dd>${esc(o.name)}${o.org ? ', ' + esc(o.org) : ''}</dd><dt>Contact</dt><dd>${esc(o.phone)} · ${esc(o.email)}</dd><dt>Event</dt><dd>${esc(o.type)}</dd><dt>When</dt><dd>${esc(R.whenText(o))}</dd><dt>Guests</dt><dd>${g}</dd><dt>Food</dt><dd>${e.f ? esc(e.f.name) : '—'}</dd><dt>Bar</dt><dd>${esc(R.barText(o))}</dd><dt>Bill paid with</dt><dd>${o.checks} check${o.checks > 1 ? 's' : ''}</dd>${o.tv && S.space === 'pdr' ? '<dt>TV with HDMI</dt><dd>Yes, $75</dd>' : ''}</dl>`;
  const common = `<li>Parties of 25 or more choose a set menu, and the bill is paid on a <u>maximum</u> of 3 checks.</li><li>In the event of a buffet or appetizer party, all food must be paid for on one check.</li><li>If any guests have food allergies, please tell us so we can accommodate them.</li>`;
  if (S.space === 'pdr') {
    const pt = R.pdrTerms(o.date, o.block);
    return `<h4>Private Party Agreement</h4>${head}<h4>Policies</h4><ol>
    <li>We do not charge room rental fees. We require a food &amp; beverage minimum. The minimum charge on the final guest check for your event, before tax and gratuity, is <b>${money0(pt.min)}</b>.</li>
    <li>The credit card on file secures the room for your event. It is not charged at booking.</li>
    <li><b>Cancellation:</b> Due to staffing requirements, your card <b>will be charged ${money0(pt.fee)}</b> if you cancel less than 72 hours before the scheduled event. The cancellation fee is only charged if the reservation is cancelled within that time frame.</li>
    <li>A final guest count must be received no later than 2 days before the party.</li>${common}
    <li>Applicable sales tax and a 22% banquet gratuity will be added to your check(s).</li>
    <li>Use of confetti or confetti poppers is prohibited. A $100 cleaning fee will be charged if any are used.</li>
    ${o.block === 'lunch' && o.ext ? '<li>Your request to keep the room until 4:00 pm is subject to manager approval.</li>' : ''}</ol>
    <p>Your signature indicates acceptance of the material contained herein and of the Banquet Event Policies, and authorizes us to keep your card on file and charge it as described above.</p>`
  }
  if (S.space === 'dr') return `<h4>Dining Room Party Agreement</h4>${head}<h4>Policies</h4><ol>
    <li>We do not charge rental fees. We require a credit card on file to guarantee the space for your event. It is not charged at booking.</li>
    <li>We will hold your table for 30 minutes past your reservation time. After that, it is considered a no-show and the cancellation fee is charged.</li>
    <li><b>Cancellation:</b> cancellations made less than 12 hours before the event are charged the cancellation fee for your party size: 9–15 guests $200, 16–25 guests $250, over 25 guests $300. Your fee: <b>${money0(R.drFee(g))}</b>.</li>
    <li>A final guest count must be received no later than 2 days before the party.</li>${common}
    <li>You may pre-select wines, beers and spirits, or we can run a cash bar.</li>
    <li>Applicable sales tax and a 22% event gratuity will be added to your check(s).</li>
    <li>Use of confetti or confetti poppers is prohibited. A $100 cleaning fee will be charged if any are used.</li></ol>
    <p>Your signature indicates acceptance of the material contained herein and of the Event Policies, and authorizes us to keep your card on file and charge it as described above.</p>`;
  return `<h4>Bar Party Agreement <span class="pending">Bar contract not yet provided</span></h4>${head}<h4>Policies known so far</h4><ol>
    <li>The credit card provided will not be charged at booking. It secures your bar seating.</li>
    <li>You may cancel up to 24 hours before your event without a fee. Cancellations within 24 hours are charged the cancellation fee.</li>
    <li>A final guest count is required 1 day before your event.</li>
    <li>In the event of a buffet or appetizer party, all food is paid on one check.</li></ol>
    <p>Your signature indicates acceptance of the material contained herein and authorizes us to keep your card on file and charge it as described above.</p>`
}
function stepContract() {
  return `<div class="panel-head"><span class="eyebrow">Step 4</span><h2>Review and sign</h2><p class="muted">Read the agreement, then type your full name to sign it.</p></div><div id="form-errors"></div>
  <div class="card" style="display:flex;flex-direction:column;gap:16px"><div class="contract" tabindex="0">${contractHtml()}</div>
  <label class="check"><input type="checkbox" id="agree" data-f2="agree" ${S.agree ? 'checked' : ''}><span>I have read and agree to this agreement and its policies.</span></label>
  <div class="sigline"><label class="f">Signature <span class="hint">Type your full name exactly: ${esc(S.form.name)}</span><input type="text" id="sig" data-f2="sig" value="${esc(S.sig)}" autocomplete="off" maxlength="120"></label><div class="muted small">Dated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div></div>
  <div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="3">← Back</button><button type="button" class="btn primary" data-action="next">Sign and continue →</button></div>`
}
function stepSubmit() {
  const o = cur();
  return `<div class="panel-head"><span class="eyebrow">Step 5</span><h2>Send your booking</h2><p class="muted">${esc(R.whenText(o))}</p></div><div id="form-errors"></div>
  <div class="card" style="display:flex;flex-direction:column;gap:14px">
    <div class="secure"><div class="shead">💳 Holding your space with a card</div>
      <p>A manager will call you at <b>${esc(S.form.phone)}</b> to put a credit card on file. Your card is <b>not charged</b> at booking. It is only charged the cancellation fee (${esc(R.cancelText(o))}).</p></div>
    <label class="check"><input type="checkbox" id="c-ack"><span>I understand a credit card is required to hold my party, and that it is charged only as described in the agreement.</span></label></div>
  <div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="4">← Back</button><button type="button" class="btn primary" data-action="submit" ${S.busy ? 'aria-busy="true" disabled' : ''}>${S.busy ? 'Sending…' : 'Submit booking'}</button></div>`
}
function stepDone() {
  const b = S.done, st = b.status, sp = SPACES[b.space];
  return `<div class="card done-hero"><span class="stamp" style="${st === 'confirmed' ? 'background:var(--ok-soft);color:var(--ok)' : ''}">${st === 'confirmed' ? 'Confirmed' : 'Request received · on hold'}</span>
    <h2>${st === 'confirmed' ? 'Your party is booked.' : `Thanks, ${esc(b.name.split(' ')[0])}. Your space is on hold.`}</h2>
    <p class="muted">${st === 'confirmed' ? 'A confirmation email is on its way.' : 'Our manager will review your request and confirm by email.'} We'll call you to put a card on file.</p></div>
  <div class="card"><h3 style="margin-bottom:12px">What happens next</h3><ul class="timeline">
    <li class="ok"><span class="m"></span><span>Agreement signed</span></li>
    <li class="${st === 'confirmed' ? 'ok' : 'wait'}"><span class="m"></span><span>${st === 'confirmed' ? 'Confirmed' : 'Manager confirms your booking'}</span></li>
    <li class="wait"><span class="m"></span><span>Card on file by phone</span></li>
    <li><span class="m"></span><span>Final guest count due ${sp.countDays === 1 ? '1 day' : '2 days'} before</span></li>
    <li><span class="m"></span><span>Cancel by ${sp.cancelH} hours before to avoid the fee</span></li></ul></div>
  <div class="actions"><span></span><button type="button" class="btn ghost" data-action="restart">Start another booking</button></div>`
}
function summary() {
  const o = cur(), e = R.estimate(o), sp = SPACES[S.space];
  if (!S.sel.date) return `<div class="ticket"><div class="th"><span class="eyebrow" style="color:inherit;opacity:.8">Your party</span><h3>${sp.name}</h3></div><div class="tb"><p class="muted small">Choose a date and time. Your estimate shows up here.</p></div></div>`;
  const timeTxt = S.space === 'pdr' ? (S.sel.block === 'lunch' ? `Lunch, 11–${S.sel.ext ? '4' : '3'}` : S.sel.time != null ? `Dinner from ${fmtT(S.sel.time)}` : '—') : (S.sel.time != null ? `Arrive ${fmtT(S.sel.time)}` : '—');
  return `<div class="ticket"><div class="th"><span class="eyebrow" style="color:inherit;opacity:.8">${sp.name}</span><h3>${fmtShort(S.sel.date)}</h3></div><div class="tb">
    <dl class="kv"><dt>Time</dt><dd>${timeTxt}</dd><dt>Guests</dt><dd>${e.g || '—'}</dd><dt>Food</dt><dd>${e.f ? esc(e.f.name) : '—'}</dd><dt>Bar</dt><dd>${esc(R.barText(o))}</dd>${e.pt ? `<dt>F&amp;B minimum</dt><dd class="mono">${money0(e.pt.min)}</dd>` : ''}<dt>Cancel fee</dt><dd>${esc(R.cancelText(o))}</dd></dl>
    ${e.priced ? `<div class="est"><span class="eyebrow">Estimate</span><dl class="kv" style="margin-top:6px">
      ${e.per != null ? `<dt>Food (${e.g} × ${money(e.per)})</dt><dd>${money(e.food)}</dd>` : ''}${e.plat ? `<dt>Platters</dt><dd>${money(e.plat)}</dd>` : ''}
      ${e.short ? `<dt>To reach ${money0(e.pt.min)} minimum</dt><dd>${money(e.short)}</dd>` : ''}
      <dt>Gratuity 22%</dt><dd>${money(e.grat)}</dd><dt>Sales tax 6.5%</dt><dd>${money(e.tax)}</dd>${e.tv ? `<dt>TV with HDMI</dt><dd>${money(e.tv)}</dd>` : ''}
      <div class="total" style="display:contents"><dt>Estimated total</dt><dd>${money(e.total)}</dd></div></dl>
      <p class="muted small" style="margin-top:8px">${o.bar !== 'cash' ? 'Bar charges are billed on what guests order and count toward any minimum. ' : ''}Final bill is based on your final guest count.</p></div>`
      : e.f && e.f.id === 'menu' ? `<p class="muted small">Guests order from the menu at the event, so there's no estimate.${e.pt ? ` Your check must reach ${money0(e.pt.min)} before tax and gratuity.` : ''}</p>` : ''}</div></div>`
}
const updateSummary = () => { const el = document.getElementById('summary'); if (el) el.innerHTML = summary() };
function showErrors(list) { const el = document.getElementById('form-errors'); if (!el) return; el.innerHTML = list.length ? `<div class="errors" role="alert"><b>Please fix the following:</b><ul>${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''; if (list.length) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
let toastT;
function toast(msg) { const t = document.getElementById('toast'); t.innerHTML = `<span>${esc(msg)}</span>`; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 6000) }

/* ---------- interactions ---------- */
function go(n) { S.step = n; render(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
const clearSel = () => { S.sel = { date: null, block: null, time: null, ext: false } };
const resetProgress = () => { S.inquirySent = false; S.contractSent = false };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action]'); if (!t || t.disabled || t.getAttribute('aria-disabled') === 'true') return; const a = t.dataset.action;
  if (a === 'tab') { S.tab = t.dataset.t; render(); return }
  if (a === 'goto') { go(+t.dataset.n); return }
  if (a === 'reload') { loaded = false; render(); loadAvail(); return }
  if (a === 'pickspace') { if (S.space !== t.dataset.s) { clearSel(); resetProgress() } S.space = t.dataset.s; go(2); return }
  if (a === 'space') { if (S.space !== t.dataset.s) { S.space = t.dataset.s; clearSel(); resetProgress() } render(); return }
  if (a === 'mon') { const k = S.month.y * 12 + S.month.m + +t.dataset.dir; S.month = { y: Math.floor(k / 12), m: k % 12 }; render(); return }
  if (a === 'day') { if (S.sel.date !== t.dataset.d) { clearSel(); resetProgress(); S.sel.date = t.dataset.d } render(); return }
  if (a === 'block') { S.sel.block = 'lunch'; S.sel.time = null; const x = document.getElementById('ext'); S.sel.ext = !!(x && x.checked); resetProgress(); render(); return }
  if (a === 'dstart') { S.sel.block = 'dinner'; S.sel.time = +t.dataset.m; S.sel.ext = false; resetProgress(); render(); return }
  if (a === 'atime') { S.sel.time = +t.dataset.m; resetProgress(); render(); return }
  if (a === 'next') return next();
  if (a === 'submit') return submit();
  if (a === 'restart') { S.step = 1; clearSel(); S.form = R.freshForm(); S.agree = false; S.sig = ''; resetProgress(); S.done = null; render(); window.scrollTo({ top: 0 }); return }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.f && el.type !== 'radio') { S.form[el.dataset.f] = el.value; if (['guests', 'platS', 'platL'].includes(el.dataset.f)) updateSummary(); return }
  if (el.dataset.f2 === 'sig') { S.sig = el.value; return }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'ext') { if (S.sel.block === 'lunch') S.sel.ext = el.checked; updateSummary(); return }
  if (el.dataset.f) { S.form[el.dataset.f] = el.value; syncDetailsUI(); updateSummary() }
  if (el.dataset.fc) { S.form[el.dataset.fc] = el.checked; updateSummary() }
  if (el.dataset.f2 === 'agree') S.agree = el.checked;
});
function next() {
  if (S.step === 2) { go(3); return }
  if (S.step === 3) {
    const errs = R.validateDetails(S.space, S.sel, S.form);
    if (errs.length) return showErrors(errs);
    S.hp = document.getElementById('hp-website')?.value || '';
    if (!S.inquirySent) { S.inquirySent = true; api('/api/inquiry', payload()).catch(() => { }) }
    go(4); return
  }
  if (S.step === 4) {
    const errs = []; if (!S.agree) errs.push('Check the box to agree to the agreement.');
    if (!R.sigMatches(S.sig, S.form.name)) errs.push(`Type your name exactly as entered: ${S.form.name}.`);
    if (errs.length) return showErrors(errs);
    if (!S.contractSent) { S.contractSent = true; api('/api/signed', { ...payload(), sig: S.sig.trim() }).catch(() => { }) }
    go(5); return
  }
}
async function submit() {
  if (!document.getElementById('c-ack').checked) return showErrors(['Check the box to confirm you understand how your space is held.']);
  S.busy = true; render(); document.getElementById('c-ack').checked = true;
  try {
    S.done = await api('/api/book', { ...payload(), sig: S.sig.trim(), agree: S.agree, ack: true });
    S.busy = false; go(6); loadAvail();
  } catch (err) {
    S.busy = false;
    if (err.status === 409) await loadAvail(); else render();
    const ack = document.getElementById('c-ack'); if (ack) ack.checked = true;
    showErrors([err.message]);
  }
}

render(); loadAvail();
