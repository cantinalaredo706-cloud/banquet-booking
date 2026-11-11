/* Guest booking page: spaces → date, time & guests → menus → party details → agreement → submit. */
import * as R from './rules.js';
const { SPACES, BUFFETS, BAROPTS, LUNCH_SET, DINNER_SET, money, money0, esc, fmtLong, fmtShort, fmtT, pad } = R;

document.getElementById('brand-line').textContent = `${R.BRAND} · ${R.LOCATION}`;
document.title = `Parties & Private Events · ${R.BRAND}`;

/* ---------- state ---------- */
let A = R.makeAvail([]), loaded = false, SQ = false; // SQ: Square settings when the card step is on
const today = () => R.todayLocal();
const firstMonth = () => { const t = today(); return { y: +t.slice(0, 4), m: +t.slice(5, 7) - 1 } };
const S = {
  step: 1, space: 'pdr', month: firstMonth(), sel: { date: null, block: null, time: null, ext: false },
  form: R.freshForm(), agree: false, sig: '', menusDone: false, inquirySent: false, contractSent: false, done: null, busy: false
};
const STEPS = ['Spaces', 'Date & time', 'Menus', 'Your party', 'Agreement', 'Submit', 'Done'];
const DONE = STEPS.length;
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
  try { const j = await api('/api/availability'); A = R.makeAvail(j.slots); SQ = j.card || false; loaded = true }
  catch (e) { loaded = 'error'; toast(e.message) }
  render();
}

/* ---------- render ---------- */
const timeChosen = () => !!S.sel.date && S.sel.time != null && (S.space !== 'pdr' || !!S.sel.block);
function maxStep() {
  if (S.step === DONE) return DONE;
  let m = 2;
  if (timeChosen() && !R.validateGuests(S.space, S.form).length) m = 3;
  if (m === 3 && S.menusDone) m = 4;
  if (m === 4 && S.inquirySent) m = 5;
  if (m === 5 && S.contractSent) m = 6;
  return Math.max(m, S.step);
}
function render() {
  const ms = maxStep();
  const st = `<ol class="stepper">${STEPS.map((t, i) => {
    const n = i + 1, cls = n === S.step ? 'cur' : n < S.step ? 'done' : '', dis = S.step === DONE ? n !== DONE : n > ms;
    return `<li><button type="button" class="${cls}" data-action="goto" data-n="${n}" ${dis ? 'disabled' : ''}><span class="n">${n < S.step && S.step !== DONE ? '✓' : n}</span>${t}</button></li>`
  }).join('')}</ol>`;
  document.getElementById('app').innerHTML = `<div class="layout"><section class="main">${st}${[0, stepSpaces, stepDate, stepMenus, stepDetails, stepContract, stepSubmit, stepDone][S.step]()}</section><aside class="summary" id="summary">${summary()}</aside></div>`;
  if (S.step === 3 || S.step === 4) syncDetailsUI();
  if (S.step === 6 && SQ) mountCard();
}

function stepSpaces() {
  return `<div class="panel-head"><span class="eyebrow">Step 1</span><h2>Spaces</h2><p class="muted">We don't charge rental fees. A credit card on file holds your space and is not charged unless you cancel late or don't show. It isn't used to pay for your party, so bring a card or other payment to the restaurant.</p></div>
    ${`<div class="grid">
    <article class="card offer"><h3>Private Dining Room</h3><p class="muted">${SPACES.pdr.desc}</p>
      <div class="tablewrap"><table class="up prices"><tbody><tr><td></td><td><b>Minimum</b></td><td><b>Cancel fee</b></td></tr>
      <tr><td>Lunch Sun–Thu</td><td class="mono">$550</td><td class="mono">$275</td></tr><tr><td>Dinner Sun–Thu</td><td class="mono">$1,100</td><td class="mono">$550</td></tr>
      <tr><td>Lunch Fri, Sat, holidays</td><td class="mono">$650</td><td class="mono">$325</td></tr><tr><td>Dinner Fri, Sat, holidays</td><td class="mono">$1,300</td><td class="mono">$650</td></tr></tbody></table></div>
      <p class="small muted">Minimums are before tax and gratuity. Lunch 11 am–3 pm. Dinner starts 3–8 pm and runs until close. Cancel fee applies within 72 hours.</p>
      <div class="spacer"></div><button type="button" class="btn ghost small" data-action="pickspace" data-s="pdr">Check Private Dining Room dates</button></article>
    <article class="card offer"><h3>Dining Room</h3><p class="muted">${SPACES.dr.desc}</p>
      <dl class="facts"><dt>Party size</dt><dd>11 to 100 guests</dd><dt>Arrival</dt><dd>11 am to 30 min before close</dd><dt>Rental fee</dt><dd>None</dd></dl>
      <div class="tablewrap"><table class="up prices"><tbody><tr><td><b>Party size</b></td><td><b>Cancel fee</b></td></tr><tr><td>9–15</td><td class="mono">$200</td></tr><tr><td>16–25</td><td class="mono">$250</td></tr><tr><td>Over 25</td><td class="mono">$300</td></tr></tbody></table></div>
      <p class="small muted">Fee applies within 12 hours of the event, or if the party hasn't arrived 30 minutes after its time.</p>
      <div class="spacer"></div><button type="button" class="btn ghost small" data-action="pickspace" data-s="dr">Check Dining Room dates</button></article>
    <article class="card offer"><h3>Bar</h3><p class="muted">${SPACES.bar.desc}</p>
      <dl class="facts"><dt>Party size</dt><dd>11 to about 50 guests</dd><dt>Arrival</dt><dd>11 am to 30 min before close</dd><dt>Rental fee</dt><dd>None</dd></dl>
      <div class="tablewrap"><table class="up prices"><tbody><tr><td><b>Party size</b></td><td><b>Cancel fee</b></td></tr><tr><td>9–15</td><td class="mono">$150</td></tr><tr><td>16–25</td><td class="mono">$200</td></tr><tr><td>Over 25</td><td class="mono">$250</td></tr></tbody></table></div>
      <p class="small muted">Fee applies within 24 hours of the event, or if the party hasn't arrived 30 minutes after its time.</p>
      <div class="spacer"></div><button type="button" class="btn ghost small" data-action="pickspace" data-s="bar">Check Bar dates</button></article></div>
    <p class="small muted">Parties of 10 or fewer in the Dining Room or Bar: please use our regular reservations. A 22% gratuity and 6.5% sales tax are added to every party's check.</p>`}
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
          <span class="small">Start time</span><div class="times">${R.LUNCH_STARTS.map(m => `<button type="button" data-action="lstart" data-m="${m}" aria-pressed="${S.sel.block === 'lunch' && S.sel.time === m}">${fmtT(m)}</button>`).join('')}</div>`}</div>
        <div class="block ${dn ? 'taken' : ''} ${S.sel.block === 'dinner' ? 'chosen' : ''}"><b>Dinner · start 3–8 pm, until close (${fmtT(R.closeMin(ds))})</b><span class="small">Minimum <span class="mono">${money0(dt.min)}</span> · cancel fee <span class="mono">${money0(dt.fee)}</span></span>
          ${dn ? '<span class="small">Already booked</span>' : `<div class="times">${A.dinnerStarts(ds).map(x => `<button type="button" data-action="dstart" data-m="${x.m}" ${x.ok ? '' : 'disabled'} aria-pressed="${S.sel.block === 'dinner' && S.sel.time === x.m}">${fmtT(x.m)}</button>`).join('')}</div>`}</div></div></div>`;
    } else {
      const n = A.partiesOn(sp, ds).length, appr = A.needsApproval(sp, ds);
      pick = `<div class="card"><h3>${fmtLong(ds)}</h3><p class="muted small" style="margin:4px 0 12px">Pick an arrival time. ${n ? `${n} other part${n > 1 ? 'ies' : 'y'} booked this day. ` : ''}${appr && sp === 'dr' ? '<b>Your booking will need manager approval.</b>' : sp === 'dr' ? 'Your booking will be confirmed right away.' : 'A manager will confirm your Bar booking.'}</p>
        <div class="times">${A.arrivalTimes(ds).map(x => `<button type="button" data-action="atime" data-m="${x.m}" ${x.ok ? '' : 'disabled'} aria-pressed="${S.sel.time === x.m}">${fmtT(x.m)}</button>`).join('')}</div></div>`
    }
  }
  const ready = timeChosen();
  const spc = SPACES[sp];
  const guests = ready ? `<div class="card"><label class="f">How many guests? <span class="hint">${sp === 'pdr' ? 'Up to 40, or 32 with a buffet' : sp === 'dr' ? '11 to 100' : '11 to about 50'}</span><input type="number" id="f-guests" data-f="guests" min="${spc.minG}" ${spc.maxG ? `max="${spc.maxG}"` : ''} value="${esc(S.form.guests)}" inputmode="numeric" style="max-width:160px"></label></div>` : '';
  const monthName = new Date(Date.UTC(y, mo, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `<div class="panel-head"><span class="eyebrow">Step 2</span><h2>Date and time</h2><p class="muted">Choose a space, then a date. Bookings must be at least 48 hours away; for anything sooner, please call a manager.</p></div>${tabs}
   <div class="card"><div class="calhead"><button type="button" class="btn ghost small" data-action="mon" data-dir="-1" ${key <= minKey ? 'disabled' : ''} aria-label="Previous month">←</button><h3>${monthName}</h3><button type="button" class="btn ghost small" data-action="mon" data-dir="1" ${key >= maxKey ? 'disabled' : ''} aria-label="Next month">→</button></div>
   <div class="cal">${cells}</div><div class="legend"><span><i style="background:var(--ok)"></i>${sp === 'pdr' ? 'Lunch & dinner open' : 'Open'}</span><span><i style="background:var(--gold)"></i>${sp === 'pdr' ? 'One open' : 'Needs approval'}</span><span><i style="background:var(--chile)"></i>Booked</span><span><i style="background:var(--off)"></i>Closed or call us</span></div></div>
   ${pick}${guests}<div id="form-errors"></div><div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="1">← Back</button><button type="button" class="btn primary" data-action="next" ${ready ? '' : 'disabled'}>Choose your menu →</button></div>`
}

function stepMenus() {
  const f = S.form, ds = S.sel.date, g = parseInt(f.guests, 10) || 0;
  const daytime = S.space === 'pdr' ? S.sel.block === 'lunch' : S.sel.time < 15 * 60; const brunchOK = R.isSatSun(ds) && daytime;
  const lunchOK = R.lunchMenusOK(S.sel.time); // lunch menus only for parties starting before 3:00 pm
  if (!lunchOK && f.food.startsWith('set-l-')) f.food = ''; // a later start time was picked after choosing a lunch menu
  const radio = (id, label, sub, dis) => `<label class="choice ${dis ? 'dis' : ''}"><input type="radio" name="food" id="fd-${id}" data-f="food" value="${id}" ${f.food === id ? 'checked' : ''} ${dis ? 'disabled' : ''}><span><b>${label}</b>${sub}</span></label>`;
  const menuCard = (k, p, m) => `<label class="card menucard"><span class="mc-head"><input type="radio" name="food" id="fd-set-${k}-${p}" data-f="food" value="set-${k}-${p}" ${f.food === `set-${k}-${p}` ? 'checked' : ''}><span class="price">${money0(p)} <small>per guest · food only</small></span></span>${menuDetail(m)}</label>`;
  return `<div class="panel-head"><span class="eyebrow">Step 3</span><h2>Menus</h2><p class="muted">${esc(R.whenText(Object.assign({ space: S.space }, S.sel)))} · ${g} guests. Choose one food option and how you'd like to handle the bar.</p></div><div id="form-errors"></div>
  <div class="card"><fieldset class="full menus"><legend>Food <span class="hint muted" style="font-weight:400">· parties of more than 25 choose a set menu or buffet</span></legend>
    ${radio('menu', 'Order from our menu at the event', '<span class="small muted" id="menuNote">25 guests or fewer. No estimate.</span>', R.menuBlocked(f.guests))}
    <p class="drinks-note"><b>Set menu, buffet and appetizer prices are for food only.</b> They do not include drinks, non-alcoholic or alcoholic. The Brunch Buffet includes one complimentary Bloody Mary or Mimosa per guest 21+.</p>
    ${lunchOK ? `<div><span class="eyebrow">Lunch set menus · per guest</span></div><div class="grid">${LUNCH_SET.map(p => menuCard('l', p, R.LUNCH_MENUS[p])).join('')}</div>` : ''}
    <div><span class="eyebrow">Dinner set menus · per guest</span></div>
    <div class="grid">${DINNER_SET.map(p => menuCard('d', p, R.DINNER_MENUS[p])).join('')}</div>
    <div><span class="eyebrow">Buffets & appetizers · 12 guest minimum · one check</span>${S.space === 'pdr' ? ' <span class="small muted">· a buffet in the Private Dining Room allows up to 32 guests</span>' : ''}</div>
    <div class="choices">${BUFFETS.map(b => radio(b.id, b.name, `<span class="mono">${money(b.price)}</span>/guest${b.brunch ? ' · includes one Bloody Mary or Mimosa (21+)' : ' · food only'}<br><span class="small muted">${esc(b.desc)}</span>${b.brunch && !brunchOK ? '<br><span class="small">Sat & Sun, 10 am–3 pm only</span>' : ''}`, b.brunch && !brunchOK)).join('')}</div>
    <label class="check" id="brunchAddRow" ${f.food === 'brunch' ? '' : 'hidden'}><input type="checkbox" id="f-brunchAdd" data-fc="brunchAdd" ${f.brunchAdd ? 'checked' : ''}><span>Add coffee, tea and orange juice ($2 per guest)</span></label>
    <div class="inline"><span class="small"><b>Appetizer platters</b> (optional) · chef's choice · food only</span><label class="small">Small, feeds 12–15 ($75) <input type="number" min="0" max="10" id="f-platS" data-f="platS" value="${esc(f.platS)}"></label><label class="small">Large, feeds 18–21 ($95) <input type="number" min="0" max="10" id="f-platL" data-f="platL" value="${esc(f.platL)}"></label></div>
  </fieldset></div>
  <div class="card"><fieldset class="full"><legend>Bar</legend>
    ${BAROPTS.map(b => `<div><label class="choice"><input type="radio" name="bar" id="br-${b.id}" data-f="bar" value="${b.id}" ${f.bar === b.id ? 'checked' : ''}><span><b>${b.name}</b>${b.desc}</span></label>${barSub(b.id)}</div>`).join('')}
    <p class="small muted">We don't offer flat-rate bar packages. These options let you control the experience and the budget.</p>
  </fieldset></div>
  <div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="2">← Back</button><button type="button" class="btn primary" data-action="next">Continue →</button></div>`
}
function stepDetails() {
  const f = S.form, o = cur(), e = R.estimate(o);
  const inp = (k, l, type = 'text', x = '') => `<label class="f">${l}<input type="${type}" id="f-${k}" data-f="${k}" value="${esc(f[k])}" ${x}></label>`;
  return `<div class="panel-head"><span class="eyebrow">Step 4</span><h2>Your party</h2><p class="muted">${esc(R.whenText(o))} · ${e.g} guests · ${e.f ? esc(e.f.name) : '—'} · ${esc(R.barText(o))} <button type="button" class="linkbtn" data-action="goto" data-n="3">Change menu</button></p></div><div id="form-errors"></div>
  <div class="card"><div class="form">
    ${inp('name', 'Reservation name', 'text', 'autocomplete="name" maxlength="120"')}${inp('email', 'Email', 'email', 'autocomplete="email" maxlength="160"')}
    ${inp('phone', 'Phone', 'tel', 'autocomplete="tel" maxlength="40"')}${inp('org', 'Company or organization <span class="hint">Optional</span>', 'text', 'maxlength="160"')}
    <label class="f">Type of event<select id="f-type" data-f="type">${R.EVENT_TYPES.map(o => `<option ${f.type === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
    <fieldset class="full"><legend>How will the bill be paid?</legend><div class="inline" id="checksRow">${[1, 2, 3].map(n => `<label class="check"><input type="radio" name="checks" id="ck-${n}" data-f="checks" value="${n}" ${f.checks == n ? 'checked' : ''}><span>${n} check${n > 1 ? 's' : ''}</span></label>`).join('')}</div>
      <span class="small muted" id="checksNote">Maximum of 3 checks. Buffet or appetizer parties pay all food on one check.</span></fieldset>
    ${S.space === 'pdr' ? `<label class="check full"><input type="checkbox" id="f-tv" data-fc="tv" ${f.tv ? 'checked' : ''}><span>TV with HDMI ($75)</span></label>` : ''}
    <label class="f full">Special instructions <span class="hint">Food allergies, timing, decorations. Confetti and confetti poppers are not allowed.</span><textarea id="f-notes" data-f="notes" maxlength="2000">${esc(f.notes)}</textarea></label>
    <label class="hp" aria-hidden="true">Website<input type="text" id="hp-website" tabindex="-1" autocomplete="off"></label>
  </div></div>
  <div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="3">← Back</button><button type="button" class="btn primary" data-action="next">Review agreement →</button></div>`
}
function menuDetail(m) {
  if (!m) return '';
  return `<div class="menu-sec"><span class="eyebrow">${esc(m.appsLabel || 'Appetizers')}</span><p class="small">${m.apps.map(esc).join(' · ')}</p></div>
    <div class="menu-sec"><span class="eyebrow">Entrées</span><ul class="entrees">${m.entrees.map(x => `<li><b>${esc(x.name)}</b> <span class="muted">${esc(x.desc)}</span></li>`).join('')}</ul></div>
    ${m.desserts ? `<div class="menu-sec"><span class="eyebrow">Postres</span><p class="small">${esc(m.desserts)}</p></div>` : ''}`;
}
function barSub(id) {
  const f = S.form, show = f.bar === id;
  if (id === 'open') return `<div class="sub" data-for="open" ${show ? '' : 'hidden'}><div class="inline"><label class="check"><input type="radio" name="barOpen" id="bo-full" data-f="barOpen" value="full" ${f.barOpen === 'full' ? 'checked' : ''}><span>Fully open</span></label><label class="check"><input type="radio" name="barOpen" id="bo-lim" data-f="barOpen" value="limited" ${f.barOpen === 'limited' ? 'checked' : ''}><span>Limited</span></label></div><label class="f">Which drinks? <span class="hint">For a limited bar</span><input type="text" id="f-barLimited" data-f="barLimited" value="${esc(f.barLimited)}" maxlength="300" placeholder="beer, wine, and house margaritas only"></label><span class="suggest">Suggested: beer, wine, and house margaritas only</span></div>`;
  if (id === 'cap') return `<div class="sub" data-for="cap" ${show ? '' : 'hidden'}><label class="f">Spending limit ($)<input type="number" min="1" id="f-barCap" data-f="barCap" value="${esc(f.barCap)}"></label></div>`;
  if (id === 'tickets') return `<div class="sub" data-for="tickets" ${show ? '' : 'hidden'}><label class="f">Tickets per guest<input type="number" min="1" max="10" id="f-barTickets" data-f="barTickets" value="${esc(f.barTickets)}" placeholder="2"></label><span class="suggest">Suggested: 2 tickets per guest</span></div>`;
  return '';
}
function syncDetailsUI() {
  const f = S.form, fi = R.foodInfo(f.food);
  document.querySelectorAll('.sub[data-for]').forEach(el => el.hidden = el.dataset.for !== f.bar);
  const br = document.getElementById('brunchAddRow'); if (br) br.hidden = f.food !== 'brunch';
  const mr = document.getElementById('fd-menu');
  if (mr) {
    const blocked = R.menuBlocked(f.guests);
    mr.disabled = blocked; mr.closest('.choice').classList.toggle('dis', blocked);
    const note = document.getElementById('menuNote'); if (note) note.textContent = blocked ? 'Not available for more than 25 guests. Please choose a set menu or a buffet.' : '25 guests or fewer. No estimate.';
    if (blocked && f.food === 'menu') { f.food = ''; mr.checked = false; updateSummary() }
  }
  const one = fi && fi.oneCheck; ['2', '3'].forEach(n => { const el = document.getElementById('ck-' + n); if (el) el.disabled = !!one });
  if (one && f.checks !== '1') { f.checks = '1'; const c = document.getElementById('ck-1'); if (c) c.checked = true }
  const note = document.getElementById('checksNote'); if (note) note.textContent = one ? 'Buffet or appetizer party: all food is paid on one check.' : 'Maximum of 3 checks. Buffet or appetizer parties pay all food on one check.';
}

function contractHtml() { return R.agreementHtml(cur()) }
function stepContract() {
  return `<div class="panel-head"><span class="eyebrow">Step 5</span><h2>Review and sign</h2><p class="muted">Read the agreement, then type your full name to sign it.</p></div><div id="form-errors"></div>
  <div class="card" style="display:flex;flex-direction:column;gap:16px"><div class="contract" tabindex="0">${contractHtml()}</div>
  <label class="check"><input type="checkbox" id="agree" data-f2="agree" ${S.agree ? 'checked' : ''}><span>I have read and agree to this agreement and its policies.</span></label>
  <div class="sigline"><label class="f">Signature <span class="hint">Type your full name exactly: ${esc(S.form.name)}</span><input type="text" id="sig" data-f2="sig" value="${esc(S.sig)}" autocomplete="off" maxlength="120"></label><div class="muted small">Dated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div></div>
  <div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="4">← Back</button><button type="button" class="btn primary" data-action="next">Sign and continue →</button></div>`
}
function stepSubmit() {
  const o = cur();
  const bring = `<p class="bring"><b>This card can't be used to pay for your party.</b> Please bring a physical credit card or other payment to pay your bill at the restaurant.</p>`;
  const holdCard = SQ
    ? `<div class="secure"><div class="shead">🔒 Hold your space with a card · secured by Square</div>
        <p>Your card is saved by Square, our payment processor. It is <b>not charged</b> now. It is only charged the cancellation fee (${esc(R.cancelText(o))}) if you cancel late or don't show.</p>${bring}
        <label class="f">Name on card<input type="text" id="c-holder" value="${esc(S.cardHolder ?? S.form.name)}" autocomplete="cc-name" maxlength="96"></label>
        <div id="sq-card" class="sq-card"><p class="small muted">Loading the secure card form…</p></div>
        ${SQ.env === 'sandbox' ? '<p class="small notice">Test mode: use Square\'s test card 4111 1111 1111 1111, any future date, any CVV and ZIP. Real cards won\'t work yet.</p>' : ''}</div>
      <label class="check"><input type="checkbox" id="c-consent"><span>I authorize ${esc(R.BRAND)} ${esc(R.LOCATION)} to save this card with Square and to charge it only for a cancellation or no-show fee as described in the agreement. I understand it won't be used to pay my bill.</span></label>`
    : `<div class="secure"><div class="shead">💳 Holding your space with a card</div>
        <p>A manager will call you at <b>${esc(S.form.phone)}</b> to put a credit card on file. Your card is <b>not charged</b> at booking. It is only charged the cancellation fee (${esc(R.cancelText(o))}).</p>${bring}</div>
      <label class="check"><input type="checkbox" id="c-ack"><span>I understand a credit card is required to hold my party, that it is charged only as described in the agreement, and that I need to bring a card or other payment for my bill.</span></label>`;
  return `<div class="panel-head"><span class="eyebrow">Step 6</span><h2>Send your booking</h2><p class="muted">${esc(R.whenText(o))}</p></div><div id="form-errors"></div>
  <div class="card" style="display:flex;flex-direction:column;gap:14px">${holdCard}</div>
  <div class="actions"><button type="button" class="btn ghost" data-action="goto" data-n="5">← Back</button><button type="button" class="btn primary" id="submitBtn" data-action="submit" ${S.busy ? 'aria-busy="true" disabled' : ''}>${S.busy ? 'Sending…' : 'Submit booking'}</button></div>`
}
function stepDone() {
  const b = S.done, st = b.status, sp = SPACES[b.space];
  return `<div class="card done-hero"><span class="stamp" style="${st === 'confirmed' ? 'background:var(--ok-soft);color:var(--ok)' : ''}">${st === 'confirmed' ? 'Confirmed' : 'Request received · on hold'}</span>
    <h2>${st === 'confirmed' ? 'Your party is booked.' : `Thanks, ${esc(b.name.split(' ')[0])}. Your space is on hold.`}</h2>
    <p class="muted">${st === 'confirmed' ? 'A confirmation email is on its way.' : 'Our manager will review your request and confirm by email.'} ${b.card ? `Your ${esc(b.card.brand)} ending ${esc(b.card.last4)} is saved with Square and was not charged.` : "We'll call you to put a card on file."} Please bring a card or other payment to pay your bill at the restaurant.</p></div>
  <div class="card"><h3 style="margin-bottom:12px">What happens next</h3><ul class="timeline">
    <li class="ok"><span class="m"></span><span>Agreement signed</span></li>
    <li class="${st === 'confirmed' ? 'ok' : 'wait'}"><span class="m"></span><span>${st === 'confirmed' ? 'Confirmed' : 'Manager confirms your booking'}</span></li>
    <li class="${b.card ? 'ok' : 'wait'}"><span class="m"></span><span>${b.card ? 'Card saved with Square (not charged)' : 'Card on file by phone'}</span></li>
    <li><span class="m"></span><span>Final guest count due ${sp.countDays === 1 ? '1 day' : '2 days'} before</span></li>
    <li><span class="m"></span><span>Cancel by ${sp.cancelH} hours before to avoid the fee</span></li>
    <li><span class="m"></span><span>Bring a card or other payment for your bill</span></li></ul></div>
  <div class="actions"><span></span><button type="button" class="btn ghost" data-action="restart">Start another booking</button></div>`
}
function summary() {
  const o = cur(), e = R.estimate(o), sp = SPACES[S.space];
  if (!S.sel.date) return `<div class="ticket"><div class="th"><span class="eyebrow" style="color:inherit;opacity:.8">Your party</span><h3>${sp.name}</h3></div><div class="tb"><p class="muted small">Choose a date and time. Your estimate shows up here.</p></div></div>`;
  const timeTxt = S.space === 'pdr' ? (S.sel.block === 'lunch' ? (S.sel.time != null ? `Lunch from ${fmtT(S.sel.time)}` : 'Lunch') : S.sel.time != null ? `Dinner from ${fmtT(S.sel.time)}` : '—') : (S.sel.time != null ? `Arrive ${fmtT(S.sel.time)}` : '—');
  return `<div class="ticket"><div class="th"><span class="eyebrow" style="color:inherit;opacity:.8">${sp.name}</span><h3>${fmtShort(S.sel.date)}</h3></div><div class="tb">
    <dl class="kv"><dt>Time</dt><dd>${timeTxt}</dd><dt>Guests</dt><dd>${e.g || '—'}</dd><dt>Food</dt><dd>${e.f ? esc(e.f.name) : '—'}</dd><dt>Bar</dt><dd>${esc(R.barText(o))}</dd>${e.pt ? `<dt>F&amp;B minimum</dt><dd class="mono">${money0(e.pt.min)}</dd>` : ''}<dt>Cancel fee</dt><dd>${esc(R.cancelText(o))}</dd></dl>
    ${e.priced ? `<div class="est"><span class="eyebrow">Estimate</span><dl class="kv" style="margin-top:6px">
      ${e.per != null ? `<dt>Food (${e.g} × ${money(e.per)})</dt><dd>${money(e.food)}</dd>` : ''}${e.plat ? `<dt>Platters</dt><dd>${money(e.plat)}</dd>` : ''}
      ${e.short ? `<dt>To reach ${money0(e.pt.min)} minimum</dt><dd>${money(e.short)}</dd>` : ''}
      <dt>Gratuity 22%</dt><dd>${money(e.grat)}</dd><dt>Sales tax 6.5%</dt><dd>${money(e.tax)}</dd>${e.tv ? `<dt>TV with HDMI</dt><dd>${money(e.tv)}</dd>` : ''}
      <div class="total" style="display:contents"><dt>Estimated total</dt><dd>${money(e.total)}</dd></div></dl>
      <p class="muted small" style="margin-top:8px">${R.foodOnly(e.f) || e.plat ? 'Food prices don\'t include drinks. ' : ''}${o.bar !== 'cash' ? 'Bar charges are billed on what guests order and count toward any minimum. ' : ''}Final bill is based on your final guest count.</p></div>`
      : e.f && e.f.id === 'menu' ? `<p class="muted small">Guests order from the menu at the event, so there's no estimate.${e.pt ? ` Your check must reach ${money0(e.pt.min)} before tax and gratuity.` : ''}</p>` : ''}</div></div>`
}
const updateSummary = () => { const el = document.getElementById('summary'); if (el) el.innerHTML = summary() };
function showErrors(list) { const el = document.getElementById('form-errors'); if (!el) return; el.innerHTML = list.length ? `<div class="errors" role="alert"><b>Please fix the following:</b><ul>${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''; if (list.length) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
let toastT;
function toast(msg) { const t = document.getElementById('toast'); t.innerHTML = `<span>${esc(msg)}</span>`; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 6000) }

/* ---------- interactions ---------- */
function go(n) { S.step = n; render(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
const clearSel = () => { S.sel = { date: null, block: null, time: null, ext: false } };
const resetProgress = () => { S.menusDone = false; S.inquirySent = false; S.contractSent = false };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action]'); if (!t || t.disabled || t.getAttribute('aria-disabled') === 'true') return; const a = t.dataset.action;
  if (a === 'goto') { go(+t.dataset.n); return }
  if (a === 'reload') { loaded = false; render(); loadAvail(); return }
  if (a === 'pickspace') { if (S.space !== t.dataset.s) { clearSel(); resetProgress() } S.space = t.dataset.s; go(2); return }
  if (a === 'space') { if (S.space !== t.dataset.s) { S.space = t.dataset.s; clearSel(); resetProgress() } render(); return }
  if (a === 'mon') { const k = S.month.y * 12 + S.month.m + +t.dataset.dir; S.month = { y: Math.floor(k / 12), m: k % 12 }; render(); return }
  if (a === 'day') { if (S.sel.date !== t.dataset.d) { clearSel(); resetProgress(); S.sel.date = t.dataset.d } render(); return }
  if (a === 'lstart') { S.sel.block = 'lunch'; S.sel.time = +t.dataset.m; const x = document.getElementById('ext'); S.sel.ext = !!(x && x.checked); resetProgress(); render(); return }
  if (a === 'dstart') { S.sel.block = 'dinner'; S.sel.time = +t.dataset.m; S.sel.ext = false; resetProgress(); render(); return }
  if (a === 'atime') { S.sel.time = +t.dataset.m; resetProgress(); render(); return }
  if (a === 'next') return next();
  if (a === 'submit') return submit();
  if (a === 'restart') { S.step = 1; clearSel(); S.form = R.freshForm(); S.agree = false; S.sig = ''; resetProgress(); S.done = null; render(); window.scrollTo({ top: 0 }); return }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.f && el.type !== 'radio') { S.form[el.dataset.f] = el.value; if (el.dataset.f === 'guests') { S.menusDone = false; S.inquirySent = false; S.contractSent = false } if (['guests', 'platS', 'platL', 'barTickets', 'barCap', 'barLimited'].includes(el.dataset.f)) updateSummary(); return }
  if (el.dataset.f2 === 'sig') { S.sig = el.value; return }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'ext') { if (S.sel.block === 'lunch') S.sel.ext = el.checked; updateSummary(); return }
  if (el.dataset.f) { S.form[el.dataset.f] = el.value; syncDetailsUI(); updateSummary(); const fe = document.getElementById('form-errors'); if (fe && ['food', 'bar'].includes(el.dataset.f)) fe.innerHTML = '' }
  if (el.dataset.fc) { S.form[el.dataset.fc] = el.checked; updateSummary() }
  if (el.dataset.f2 === 'agree') S.agree = el.checked;
});
function next() {
  if (S.step === 2) {
    const errs = R.validateGuests(S.space, S.form);
    if (errs.length) return showErrors(errs);
    go(3); return
  }
  if (S.step === 3) {
    const errs = R.validateFood(S.space, S.sel, S.form);
    if (errs.length) return showErrors(errs);
    S.menusDone = true; go(4); return
  }
  if (S.step === 4) {
    if (R.validateGuests(S.space, S.form).length || R.validateFood(S.space, S.sel, S.form).length) { S.menusDone = false; go(3); return showErrors(R.validateFood(S.space, S.sel, S.form)) }
    const errs = R.validateContact(S.form);
    if (errs.length) return showErrors(errs);
    S.hp = document.getElementById('hp-website')?.value || '';
    if (!S.inquirySent) { S.inquirySent = true; api('/api/inquiry', payload()).catch(() => { }) }
    go(5); return
  }
  if (S.step === 5) {
    const errs = []; if (!S.agree) errs.push('Check the box to agree to the agreement.');
    if (!R.sigMatches(S.sig, S.form.name)) errs.push(`Type your name exactly as entered: ${S.form.name}.`);
    if (errs.length) return showErrors(errs);
    if (!S.contractSent) { S.contractSent = true; api('/api/signed', { ...payload(), sig: S.sig.trim() }).catch(() => { }) }
    go(6); return
  }
}
/* ---------- Square card box (Web Payments SDK). The card number goes straight to Square, never to this site. ---------- */
let sqCard = null, sqLoading = null;
function loadSquareJs() {
  if (window.Square) return Promise.resolve();
  if (sqLoading) return sqLoading;
  sqLoading = new Promise((ok, bad) => {
    const el = document.createElement('script');
    el.src = SQ.env === 'production' ? 'https://web.squarecdn.com/v1/square.js' : 'https://sandbox.web.squarecdn.com/v1/square.js';
    el.onload = ok; el.onerror = () => { sqLoading = null; bad(new Error('The secure card form could not load. Check your connection and try again, or call us.')) };
    document.head.appendChild(el);
  });
  return sqLoading;
}
async function mountCard() {
  const box = document.getElementById('sq-card'); if (!box) return;
  try {
    await loadSquareJs();
    if (sqCard) { try { await sqCard.destroy() } catch { } sqCard = null }
    const payments = window.Square.payments(SQ.appId, SQ.locationId);
    const card = await payments.card();
    if (!document.getElementById('sq-card')) return; // the guest left this step while it loaded
    box.innerHTML = ''; await card.attach('#sq-card'); sqCard = card;
  } catch (e) { box.innerHTML = `<p class="small error-text">${esc(e.message || 'The secure card form could not load. Please refresh, or call us.')}</p>` }
}
function setBusy(on) { S.busy = on; const b = document.getElementById('submitBtn'); if (b) { b.disabled = on; b.textContent = on ? 'Sending…' : 'Submit booking'; on ? b.setAttribute('aria-busy', 'true') : b.removeAttribute('aria-busy') } }
async function submit() {
  const extra = { ack: true };
  if (SQ) {
    const holder = (document.getElementById('c-holder')?.value || '').trim(); S.cardHolder = holder;
    const errs = [];
    if (!holder) errs.push('Enter the name on the card.');
    if (!document.getElementById('c-consent')?.checked) errs.push('Check the box to let us keep your card on file.');
    if (!sqCard) errs.push('The secure card form is still loading. Please wait a moment and try again.');
    if (errs.length) return showErrors(errs);
    setBusy(true);
    try {
      const [given, ...rest] = S.form.name.trim().split(/\s+/);
      const t = await sqCard.tokenize({ intent: 'STORE', customerInitiated: true, sellerKeyedIn: false, billingContact: { givenName: given, familyName: rest.join(' '), email: S.form.email, phone: S.form.phone.replace(/[^\d+]/g, ''), countryCode: 'US' } });
      if (t.status !== 'OK') { setBusy(false); return showErrors([(t.errors || []).map(x => x.message).filter(Boolean).join(' ') || 'Please check your card details.']) }
      Object.assign(extra, { cardToken: t.token, cardHolder: holder, cardConsent: true });
    } catch (e) { setBusy(false); return showErrors([e.message || 'Your card could not be checked. Please try again.']) }
  } else if (!document.getElementById('c-ack')?.checked) return showErrors(['Check the box to confirm you understand how your space is held.']);
  else setBusy(true);
  try {
    S.done = await api('/api/book', { ...payload(), sig: S.sig.trim(), agree: S.agree, ...extra });
    S.busy = false; S.cardHolder = undefined; go(DONE); loadAvail();
  } catch (err) {
    setBusy(false);
    if (err.status === 409) { await loadAvail(); go(2) }
    showErrors([err.message]);
  }
}

render(); loadAvail();
