/* GET /manager/api/calendar?month=YYYY-MM — every party (on hold or confirmed) in one month, for the manager calendar. */
import { getDB, json, fail, rowToBooking, HttpError } from '../../../lib/server.js';
import * as R from '../../../public/js/rules.js';

export async function onRequestGet({ request, env }) {
  try {
    const month = new URL(request.url).searchParams.get('month') || R.todayLocal().slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'Choose a month like 2026-12.');
    const DB = await getDB(env);
    const { results } = await DB.prepare(`SELECT * FROM bookings WHERE status <> 'declined' AND date >= ? AND date <= ? ORDER BY date, COALESCE(time, 660)`)
      .bind(`${month}-01`, `${month}-31`).all();
    return json({ month, bookings: results.map(rowToBooking) });
  } catch (e) { return fail(e) }
}
