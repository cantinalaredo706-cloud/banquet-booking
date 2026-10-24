/* GET /api/availability — which spaces and times are already taken (no guest details). */
import { getDB, json, fail, SLOT_COLS } from '../../lib/server.js';
import * as R from '../../public/js/rules.js';

export async function onRequestGet({ env }) {
  try {
    const DB = await getDB(env), today = R.todayLocal();
    const { results } = await DB.prepare(`SELECT ${SLOT_COLS} FROM bookings WHERE status <> 'declined' AND date >= ? AND date <= ?`)
      .bind(today, R.addDays(today, R.MAXDAYS)).all();
    return json({ now: Date.now(), slots: results.map(r => ({ ...r, ext: !!r.ext })), card: false });
  } catch (e) { return fail(e) }
}
