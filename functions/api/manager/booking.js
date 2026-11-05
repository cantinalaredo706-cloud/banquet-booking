/* GET /api/manager/booking?id=123 — one booking, for the printable copy. Managers only (see _middleware.js). */
import { getDB, json, fail, rowToBooking, HttpError } from '../../../lib/server.js';

export async function onRequestGet({ request, env }) {
  try {
    const id = parseInt(new URL(request.url).searchParams.get('id'), 10);
    if (!(id > 0)) throw new HttpError(400, 'Which booking? The link is missing its number.');
    const DB = await getDB(env);
    const row = await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
    if (!row) throw new HttpError(404, `Booking #${id} was not found.`);
    return json({ booking: rowToBooking(row) });
  } catch (e) { return fail(e) }
}
