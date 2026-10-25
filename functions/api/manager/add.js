/* POST /api/manager/add — a manager adds a booking by hand (phone or walk-in party).
   It is confirmed straight away, blocks the time on the guest calendar, and skips the 48-hour notice rule. */
import { getDB, json, fail, readJson, alertManagers, sendMail, HttpError, SLOT_COLS } from '../../../lib/server.js';
import * as R from '../../../public/js/rules.js';

const str = (v, max = 200) => String(v ?? '').slice(0, max).trim();

export async function onRequestPost({ request, env, data }) {
  try {
    const body = await readJson(request);
    const space = str(body.space, 10), sp = R.SPACES[space];
    if (!sp) throw new HttpError(400, 'Choose a space.');
    const date = str(body.date, 10);
    if (!R.isDate(date)) throw new HttpError(400, 'Choose a date.');
    const diff = Math.round((R.parse(date) - R.parse(R.todayLocal())) / 864e5);
    if (diff < 0) throw new HttpError(400, 'That date has already passed.');
    if (diff > 730) throw new HttpError(400, 'Choose a date within the next two years.');

    const DB = await getDB(env);
    const { results } = await DB.prepare(`SELECT ${SLOT_COLS} FROM bookings WHERE date = ? AND status <> 'declined'`).bind(date).all();
    const A = R.makeAvail(results.map(r => ({ ...r, ext: !!r.ext })));

    let block = null, time = null, ext = false;
    if (space === 'pdr') {
      block = ['lunch', 'dinner'].includes(body.block) ? body.block : null;
      if (!block) throw new HttpError(400, 'Choose lunch or dinner.');
      if (block === 'lunch') {
        ext = !!body.ext; time = parseInt(body.time, 10);
        if (!R.LUNCH_STARTS.includes(time)) throw new HttpError(400, 'Choose a lunch start time between 11:00 am and 2:00 pm.');
        if (A.pdrLunch(date)) throw new HttpError(409, 'The Private Dining Room is already booked for lunch that day.');
        if (ext && !A.extOK(date)) throw new HttpError(409, 'A dinner party starts before 4:00 pm that day, so lunch can’t run until 4.');
      } else {
        time = parseInt(body.time, 10);
        if (!A.dinnerStarts(date).some(x => x.m === time)) throw new HttpError(400, 'Choose a dinner start time between 3:00 and 8:00 pm.');
        if (A.pdrDinner(date)) throw new HttpError(409, 'The Private Dining Room is already booked for dinner that day.');
        const l = A.pdrLunch(date); if (l && l.ext && time < 16 * 60) throw new HttpError(409, 'Lunch that day runs until 4:00 pm, so dinner has to start at 4:00 or later.');
      }
    } else {
      time = parseInt(body.time, 10);
      if (!A.arrivalTimes(date).some(x => x.m === time)) throw new HttpError(400, 'Choose an arrival time.');
    }

    const name = str(body.name, 120), phone = str(body.phone, 40), email = str(body.email, 160);
    if (!name) throw new HttpError(400, 'Enter the reservation name.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'That email address doesn’t look right.');
    if (!phone && !email) throw new HttpError(400, 'Enter a phone number or an email address.');
    const guests = parseInt(body.guests, 10);
    if (!(guests >= 1 && guests <= (sp.maxG || 200))) throw new HttpError(400, `Enter the number of guests${sp.maxG ? ` (up to ${sp.maxG})` : ''}.`);
    const food = str(body.food, 20);
    if (food && !R.foodInfo(food)) throw new HttpError(400, 'Choose a food option.');
    const emailGuest = !!body.emailGuest;
    if (emailGuest && !email) throw new HttpError(400, 'Enter the guest’s email to send them a confirmation.');

    const now = Date.now(), who = data.manager;
    const extra = {
      ...R.freshForm(), org: str(body.org, 160), type: R.EVENT_TYPES.includes(body.type) ? body.type : 'Other', food: food || 'menu',
      notes: str(body.notes, 2000), card: null, manual: true, addedBy: who
    };
    const { name: _n, email: _e, phone: _p, guests: _g, ...rest } = extra;
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
    await alertManagers(env, DB, 'confirmed', { s: `Added: ${name}, ${sp.name}, ${R.fmtShort(date)}`, b: `${who} added this booking in the manager view.\n\n${R.reqBody(b)}` }, id);
    let guestEmail = 'Not sent (not requested)';
    if (emailGuest) { const g = R.guestEmail(b, 'confirmed'); guestEmail = await sendMail(env, DB, { kind: 'guest', to: email, subject: g.s, body: g.b, bookingId: id }) }
    return json({ ok: true, id, guestEmail });
  } catch (e) { return fail(e) }
}
