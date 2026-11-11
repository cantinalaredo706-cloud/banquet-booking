/* Printable copy of one booking, for the restaurant's paper files. Opened from the manager view. */
import * as R from './rules.js';
const { SPACES, esc, money, money0, fmtLong, fmtT } = R;

const sheet = document.getElementById('sheet'), btn = document.getElementById('printBtn');
btn.addEventListener('click', () => window.print());

const STATUS = { held: 'On hold — waiting for manager approval', confirmed: 'Confirmed', declined: 'Declined' };
const row = (k, v) => v ? `<div class="pair"><dt>${k}</dt><dd>${v}</dd></div>` : '';

function menuBlock(m) {
  if (!m) return '';
  return `<div class="menu"><p><b>${esc(m.appsLabel || 'Appetizers')}:</b> ${m.apps.map(esc).join(' · ')}</p>
    <p class="muted small">Food only; drinks (non-alcoholic and alcoholic) are not included.</p>
    <p><b>Entrées (guest choice):</b></p><ul>${m.entrees.map(x => `<li><b>${esc(x.name)}</b> — ${esc(x.desc)}</li>`).join('')}</ul>
    ${m.desserts ? `<p><b>Postres:</b> ${esc(m.desserts)}</p>` : ''}</div>`;
}

function render(b) {
  const o = Object.assign(R.freshForm(), b, { guests: String(b.guests) }), e = R.estimate(o), sp = SPACES[b.space];
  const status = b.cancelled ? 'Cancelled' : (STATUS[b.status] || b.status);
  document.title = `${b.name} · ${sp.name} · ${R.fmtShort(b.date)}`;
  const timeLine = b.space === 'pdr'
    ? (b.block === 'lunch' ? `Lunch, starts ${b.time != null ? fmtT(b.time) : '11:00 am'}, room until ${b.ext ? '4:00 pm' : '3:00 pm'}` : `Dinner, starts ${fmtT(b.time)}, room until close (${fmtT(R.closeMin(b.date))})`)
    : `Arrival ${fmtT(b.time)}`;
  const food = e.f ? esc(e.f.name) + (b.brunchAdd ? ' + coffee, tea &amp; orange juice' : '') : 'Not decided yet';
  const platters = (+b.platS || +b.platL) ? `${+b.platS || 0} small, ${+b.platL || 0} large` : '';
  const signed = b.sig
    ? `<p>Signed online by typing <b class="sigtxt">${esc(b.sig)}</b> on ${esc(R.fmtStamp(b.signedAt))}.</p>`
    : `<p class="muted">Not signed online${b.manual ? ` (booking entered by ${esc(b.enteredBy || 'a manager')})` : ''}.</p>
       <div class="lines"><div><span>Guest signature</span></div><div><span>Date</span></div></div>`;
  sheet.innerHTML = `
  <header class="head">
    <div class="headl"><img class="plogo" src="/img/logo.jpg" alt="Cantina Laredo"><div><div class="brand">${esc(R.BRAND)} · ${esc(R.LOCATION)}</div><h1>${esc(sp.name)} booking</h1></div></div>
    <div class="meta"><div>Booking <b>#${b.id}</b></div><div class="status ${b.cancelled ? 'declined' : b.status}">${esc(status)}</div><div class="muted">Printed ${esc(R.fmtStamp(Date.now()))}</div></div>
  </header>

  <section><h2>Party</h2><dl class="pairs">
    ${row('Date', esc(fmtLong(b.date)))}${row('Time', esc(timeLine))}${row('Space', esc(sp.name))}
    ${row('Reservation name', esc(b.name) + (b.org ? ', ' + esc(b.org) : ''))}${row('Phone', esc(b.phone))}${row('Email', esc(b.email))}
    ${row('Type of event', esc(b.type))}${row('Guests', String(b.guests))}
    ${row('Food', food)}${row('Appetizer platters', platters)}${row('Bar', esc(R.barText(o)))}
    ${row('Bill paid with', `${o.checks} check${o.checks > 1 ? 's' : ''}`)}${b.space === 'pdr' ? row('TV with HDMI', b.tv ? 'Yes, $75' : 'No') : ''}
    ${row('Card on file', b.card ? esc(R.cardText(b.card)) : (b.manual ? 'Not taken online' : 'Not on file yet'))}
    ${row('Cancellation fee', esc(R.cancelText(o)))}${e.pt ? row('Food &amp; beverage minimum', money0(e.pt.min) + ' before tax and gratuity') : ''}
  </dl></section>

  ${b.notes ? `<section><h2>Special instructions</h2><p class="notes">${esc(b.notes)}</p></section>` : ''}

  <div class="duo">${e.f && e.f.menu ? `<section><h2>${esc(e.f.name)}</h2>${menuBlock(e.f.menu)}</section>` : ''}

  ${e.priced ? `<section><h2>Estimate</h2><table class="est">
    ${e.per != null ? `<tr><th>Food (${e.g} × ${money(e.per)})</th><td>${money(e.food)}</td></tr>` : ''}${e.plat ? `<tr><th>Appetizer platters</th><td>${money(e.plat)}</td></tr>` : ''}
    ${e.short ? `<tr><th>To reach the ${money0(e.pt.min)} minimum</th><td>${money(e.short)}</td></tr>` : ''}
    <tr><th>Gratuity 22%</th><td>${money(e.grat)}</td></tr><tr><th>Sales tax 6.5%</th><td>${money(e.tax)}</td></tr>${e.tv ? `<tr><th>TV with HDMI</th><td>${money(e.tv)}</td></tr>` : ''}
    <tr class="total"><th>Estimated total</th><td>${money(e.total)}</td></tr></table>
    <p class="muted small">${R.foodOnly(e.f) || e.plat ? 'Food prices don\'t include drinks. ' : ''}${e.f && e.f.brunch ? 'Brunch includes one complimentary Bloody Mary or Mimosa per guest 21+. ' : ''}Bar charges, if any, are added from what guests order. The final bill is based on the final guest count.</p></section>` : ''}</div>

  <section class="agreement">${R.agreementHtml(o)}</section>

  <div class="duo"><section><h2>Signature</h2>${signed}</section>

  <section><h2>Record</h2><dl class="pairs one">
    ${row('Submitted', esc(R.fmtStamp(b.createdAt)))}${row('Entered by', esc(b.enteredBy || ''))}${row('Last changed by', esc(b.lastChangedBy || ''))}
    ${row(b.cancelled ? 'Cancelled' : b.status === 'declined' ? 'Declined' : 'Approved', b.decidedAt ? esc(R.fmtStamp(b.decidedAt)) + (b.decidedBy ? ' by ' + esc(b.decidedBy) : '') : '')}
    ${row('Why it needed approval', esc(b.why || ''))}
  </dl></section></div>`;
  btn.disabled = false;
}

(async () => {
  const id = new URLSearchParams(location.search).get('id');
  try {
    const r = await fetch(`/api/manager/booking?id=${encodeURIComponent(id || '')}`, { cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Please sign in to the manager view first, then open this copy again.' : (j.error || `Something went wrong (${r.status}).`));
    render(j.booking);
  } catch (x) { sheet.innerHTML = `<p class="error">${esc(x.message)}</p>` }
})();
