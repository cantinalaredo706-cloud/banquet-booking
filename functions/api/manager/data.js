/* GET /api/manager/data — everything the manager view shows. */
import { getDB, json, fail, rowToBooking, getSettings, emailReady, ALERT_KINDS } from '../../../lib/server.js';
import * as R from '../../../public/js/rules.js';

export async function onRequestGet({ env, data }) {
  try {
    const DB = await getDB(env), today = R.todayLocal();
    const held = (await DB.prepare(`SELECT * FROM bookings WHERE status = 'held' ORDER BY date, time`).all()).results.map(rowToBooking);
    const upcoming = (await DB.prepare(`SELECT * FROM bookings WHERE status <> 'declined' AND date >= ? ORDER BY date, COALESCE(time, 660) LIMIT 60`).bind(today).all()).results.map(rowToBooking);
    const recent = (await DB.prepare(`SELECT * FROM bookings WHERE status = 'declined' ORDER BY decided_at DESC LIMIT 10`).all()).results.map(rowToBooking);
    const emails = (await DB.prepare(`SELECT id, at, kind, to_addr, subject, body, result, booking_id FROM emails ORDER BY id DESC LIMIT 60`).all()).results;
    return json({ me: data.manager, held, upcoming, declined: recent, emails, settings: await getSettings(env, DB), alertKinds: ALERT_KINDS, emailReady: emailReady(env) });
  } catch (e) { return fail(e) }
}
