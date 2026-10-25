/* POST /api/manager/cancel — cancel a booking so its time opens up again. No email goes to the guest. */
import { getDB, json, fail, readJson, HttpError } from '../../../lib/server.js';

export async function onRequestPost({ request, env, data }) {
  try {
    const { id } = await readJson(request);
    const DB = await getDB(env);
    const r = await DB.prepare(`UPDATE bookings SET status = 'declined', decided_at = ?, decided_by = ?, data = json_set(data, '$.cancelled', json('true'))
      WHERE id = ? AND status <> 'declined'`).bind(Date.now(), data.manager, parseInt(id, 10)).run();
    if (!r.meta.changes) throw new HttpError(409, 'This booking was already cancelled or declined. Refresh to see the latest.');
    return json({ ok: true });
  } catch (e) { return fail(e) }
}
