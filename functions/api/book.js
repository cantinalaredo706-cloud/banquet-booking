/* POST /api/book — the guest submits the booking. Checks the time is still open, saves it, and sends the emails. */
import { getDB, json, fail, readJson, cleanBooking, alertManagers, sendMail, bookingView, HttpError, SLOT_COLS } from '../../lib/server.js';
import * as R from '../../public/js/rules.js';
import { squareReady, saveCard, removeCard } from '../../lib/square.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const req = cleanBooking(body);
    if (!body.agree || !R.sigMatches(req.sig, req.form.name)) throw new HttpError(400, 'Please go back and sign the agreement.');
    if (!body.ack) throw new HttpError(400, 'Check the box to confirm you understand how your space is held.');

    const DB = await getDB(env);
    const { results } = await DB.prepare(`SELECT ${SLOT_COLS} FROM bookings WHERE date = ? AND status <> 'declined'`).bind(req.sel.date).all();
    const A = R.makeAvail(results.map(r => ({ ...r, ext: !!r.ext })));
    const problem = A.slotProblem(req.space, req.sel);
    if (problem) throw new HttpError(409, problem);

    // Save the card in Square first (nothing is charged). If the booking then can't be saved, the card is taken off file again.
    let card = null;
    if (squareReady(env)) {
      if (!body.cardConsent) throw new HttpError(400, 'Check the box to let us keep your card on file.');
      card = await saveCard(env, { token: body.cardToken, verificationToken: body.verificationToken, holder: String(body.cardHolder || '').slice(0, 96).trim(), name: req.form.name, email: req.form.email, phone: req.form.phone, ref: `${req.space}-${req.sel.date}` });
    }

    const why = A.needsApproval(req.space, req.sel.date) || (req.space === 'pdr' && req.sel.block === 'lunch' && req.sel.ext ? 'Lunch extension to 4 pm requested' : null);
    const now = Date.now();
    const b = bookingView(req, { status: why ? 'held' : 'confirmed', why, card, sig: req.sig, signedAt: now });
    const { space, date, block, time, ext, name, email, phone, guests, status, ...rest } = b;
    const data = JSON.stringify({ ...rest, ext: undefined, why: undefined });

    let id;
    try {
      const r = await DB.prepare(`INSERT INTO bookings (created_at, status, space, date, block, time, ext, name, email, phone, guests, why, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(now, status, space, date, block, time, ext ? 1 : 0, name, email, phone, guests, why, data).run();
      id = r.meta.last_row_id;
    } catch (e) {
      if (card) { try { await removeCard(env, card) } catch (x) { console.error('could not remove card after failed save', x) } }
      if (/UNIQUE/i.test(String(e.message || e))) throw new HttpError(409, 'Someone just reserved this time. Go back and pick another.');
      throw e;
    }
    b.id = id;

    await alertManagers(env, DB, status === 'held' ? 'request' : 'confirmed', R.managerAlert(b), id);
    const g = R.guestEmail(b, status === 'held' ? 'received' : 'confirmed');
    await sendMail(env, DB, { kind: 'guest', to: email, subject: g.s, body: g.b, bookingId: id });

    return json({ id, status, space, date, name, card: card ? { brand: card.brand, last4: card.last4 } : null });
  } catch (e) { return fail(e) }
}
