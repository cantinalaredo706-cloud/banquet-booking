/* POST /api/manager/add — a manager adds a booking by hand (phone or walk-in party).
   It is confirmed straight away, blocks the time on the guest calendar, and skips the 48-hour notice rule. */
import { getDB, json, fail, readJson, alertManagers, sendMail, HttpError } from '../../../lib/server.js';
import { checkManualBooking } from '../../../lib/manual.js';
import * as R from '../../../public/js/rules.js';

export async function onRequestPost({ request, env, data }) {
  try {
    const DB = await getDB(env);
    const m = await checkManualBooking(DB, await readJson(request));
    const { space, date, block, time, ext, name, email, phone, guests } = m;
    const now = Date.now(), who = data.manager;
    const { name: _n, email: _e, phone: _p, guests: _g, ...base } = R.freshForm();
    const rest = { ...base, ...m.details, card: null, manual: true, addedBy: who, enteredBy: m.manager };
    let id;
    try {
      const r = await DB.prepare(`INSERT INTO bookings (created_at, status, space, date, block, time, ext, name, email, phone, guests, why, data, decided_at, decided_by)
        VALUES (?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`)
        .bind(now, space, date, block, time, ext ? 1 : 0, name, email, phone, guests, JSON.stringify(rest), now, who).run();
      id = r.meta.last_row_id;
    } catch (e) {
      if (/UNIQUE/i.test(String(e.message || e))) throw new HttpError(409, 'That time was just booked. Refresh and pick another.');
      throw e;
    }

    const b = { ...rest, id, status: 'confirmed', space, date, block, time, ext, name, email, phone, guests };
    await alertManagers(env, DB, 'confirmed', { s: `Added: ${name}, ${R.SPACES[space].name}, ${R.fmtShort(date)}`, b: `${m.manager} (signed in as ${who}) added this booking in the manager view.\n\n${R.reqBody(b)}` }, id);
    let guestEmail = 'Not sent (not requested)';
    if (m.emailGuest) { const g = R.guestEmail(b, 'confirmed'); guestEmail = await sendMail(env, DB, { kind: 'guest', to: email, subject: g.s, body: g.b, bookingId: id }) }
    return json({ ok: true, id, guestEmail });
  } catch (e) { return fail(e) }
}
