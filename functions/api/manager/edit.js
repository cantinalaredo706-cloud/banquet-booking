/* POST /api/manager/edit — a manager changes an existing booking (on hold or confirmed).
   Its status stays the same. Details the guest chose that the form doesn't show (bar, checks, platters, TV) are kept. */
import { getDB, json, fail, readJson, rowToBooking, alertManagers, sendMail, HttpError } from '../../../lib/server.js';
import { checkManualBooking } from '../../../lib/manual.js';
import * as R from '../../../public/js/rules.js';

const KEYS = ['space', 'date', 'block', 'time', 'ext', 'name', 'email', 'phone', 'guests'];

export async function onRequestPost({ request, env, data }) {
  try {
    const body = await readJson(request);
    const id = parseInt(body.id, 10);
    const DB = await getDB(env);
    const row = await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
    if (!row) throw new HttpError(404, 'That booking no longer exists. Refresh to see the latest.');
    if (row.status === 'declined') throw new HttpError(409, 'This booking was cancelled or declined, so it can’t be edited.');
    const before = rowToBooking(row);
    const m = await checkManualBooking(DB, body, id);
    const who = data.manager;

    const oldData = JSON.parse(row.data || '{}');
    const newData = { ...oldData, ...m.details, tv: m.space === 'pdr' ? !!oldData.tv : false, editedBy: who, editedAt: Date.now(), lastChangedBy: m.manager };
    try {
      await DB.prepare(`UPDATE bookings SET space = ?, date = ?, block = ?, time = ?, ext = ?, name = ?, email = ?, phone = ?, guests = ?, data = ? WHERE id = ? AND status <> 'declined'`)
        .bind(m.space, m.date, m.block, m.time, m.ext ? 1 : 0, m.name, m.email, m.phone, m.guests, JSON.stringify(newData), id).run();
    } catch (e) {
      if (/UNIQUE/i.test(String(e.message || e))) throw new HttpError(409, 'That time was just booked. Refresh and pick another.');
      throw e;
    }
    const b = rowToBooking(await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first());

    const label = { space: 'Space', date: 'Date', block: 'Lunch/dinner', time: 'Time', ext: 'Stay until 4', name: 'Name', email: 'Email', phone: 'Phone', guests: 'Guests', org: 'Company', type: 'Event', food: 'Food', notes: 'Notes' };
    const show = (k, v) => k === 'space' ? R.SPACES[v]?.name : k === 'date' ? R.fmtShort(v) : k === 'time' ? (v == null ? '—' : R.fmtT(v)) : k === 'ext' ? (v ? 'yes' : 'no') : k === 'food' ? (R.foodInfo(v)?.name || '—') : (v === '' || v == null ? '—' : String(v));
    const changes = [...KEYS, 'org', 'type', 'food', 'notes'].filter(k => String(before[k] ?? '') !== String(b[k] ?? '')).map(k => `• ${label[k]}: ${show(k, before[k])} → ${show(k, b[k])}`);

    await alertManagers(env, DB, 'confirmed', {
      s: `Changed: ${b.name}, ${R.SPACES[b.space].name}, ${R.fmtShort(b.date)}`,
      b: `${m.manager} (signed in as ${who}) changed this booking in the manager view.${b.enteredBy ? `\nOriginally entered by: ${b.enteredBy}` : ''}\n\n${changes.length ? 'What changed:\n' + changes.join('\n') : 'Nothing was changed.'}\n\n${R.reqBody(b)}`
    }, id);
    let guestEmail = 'Not sent (not requested)';
    if (m.emailGuest) {
      const g = R.guestEmail(b, b.status === 'held' ? 'received' : 'confirmed');
      guestEmail = await sendMail(env, DB, { kind: 'guest', to: b.email, subject: 'Updated: ' + g.s, body: g.b.replace(/\n\n/, '\n\nWe’ve updated your booking. Here are the latest details.\n\n'), bookingId: id });
    }
    return json({ ok: true, changes: changes.length, guestEmail });
  } catch (e) { return fail(e) }
}
