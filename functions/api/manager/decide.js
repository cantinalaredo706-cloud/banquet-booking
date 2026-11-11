/* POST /api/manager/decide — approve or decline a booking that is on hold. Emails the guest. */
import { getDB, json, fail, readJson, rowToBooking, alertManagers, sendMail, HttpError } from '../../../lib/server.js';
import * as R from '../../../public/js/rules.js';
import { removeCard } from '../../../lib/square.js';

export async function onRequestPost({ request, env, data }) {
  try {
    const { id, decision } = await readJson(request);
    if (!['approve', 'decline'].includes(decision)) throw new HttpError(400, 'Choose approve or decline.');
    const DB = await getDB(env), status = decision === 'approve' ? 'confirmed' : 'declined';
    const r = await DB.prepare(`UPDATE bookings SET status = ?, decided_at = ?, decided_by = ? WHERE id = ? AND status = 'held'`)
      .bind(status, Date.now(), data.manager, parseInt(id, 10)).run();
    if (!r.meta.changes) throw new HttpError(409, 'This booking was already approved or declined. Refresh to see the latest.');
    const b = rowToBooking(await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(parseInt(id, 10)).first());

    // A declined booking's card comes off file in Square right away.
    if (status === 'declined' && b.card && !b.card.removed) {
      try { await removeCard(env, b.card); b.card = { ...b.card, removed: true, removedAt: Date.now(), removedBy: data.manager }; await DB.prepare(`UPDATE bookings SET data = json_set(data, '$.card', json(?)) WHERE id = ?`).bind(JSON.stringify(b.card), b.id).run() }
      catch (x) { console.error('card removal on decline failed', x); b.cardRemoveFailed = true }
    }
    const g = R.guestEmail(b, status);
    const guestResult = await sendMail(env, DB, { kind: 'guest', to: b.email, subject: g.s, body: g.b, bookingId: b.id });
    if (status === 'confirmed') await alertManagers(env, DB, 'confirmed', R.approvedAlert(b, data.manager), b.id);
    return json({ ok: true, status, guestEmail: guestResult, cardRemoveFailed: !!b.cardRemoveFailed });
  } catch (e) { return fail(e) }
}
