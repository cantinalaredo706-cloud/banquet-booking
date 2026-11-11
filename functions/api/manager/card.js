/* POST /api/manager/card — take a booking's saved card off file in Square (e.g. after the event, or after charging a fee). */
import { getDB, json, fail, readJson, rowToBooking, HttpError } from '../../../lib/server.js';
import { removeCard } from '../../../lib/square.js';

export async function onRequestPost({ request, env, data }) {
  try {
    const { id } = await readJson(request);
    const DB = await getDB(env);
    const row = await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(parseInt(id, 10)).first();
    if (!row) throw new HttpError(404, 'That booking was not found. Refresh to see the latest.');
    const b = rowToBooking(row);
    if (!b.card?.squareCardId) throw new HttpError(400, 'This booking has no card saved in Square.');
    if (b.card.removed) return json({ ok: true, already: true });
    await removeCard(env, b.card);
    const card = { ...b.card, removed: true, removedAt: Date.now(), removedBy: data.manager };
    await DB.prepare(`UPDATE bookings SET data = json_set(data, '$.card', json(?)) WHERE id = ?`).bind(JSON.stringify(card), b.id).run();
    return json({ ok: true });
  } catch (e) { return fail(e) }
}
