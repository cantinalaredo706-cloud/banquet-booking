/* POST /api/signed — a guest signed the agreement (Step 4). Lets managers know. */
import { getDB, json, fail, readJson, cleanBooking, alertManagers, bookingView, HttpError } from '../../lib/server.js';
import * as R from '../../public/js/rules.js';

export async function onRequestPost({ request, env }) {
  try {
    const req = cleanBooking(await readJson(request));
    if (!R.sigMatches(req.sig, req.form.name)) throw new HttpError(400, `Type your name exactly as entered: ${req.form.name}.`);
    const DB = await getDB(env);
    await alertManagers(env, DB, 'contract', R.signedEmail(bookingView(req), req.sig, Date.now()));
    return json({ ok: true });
  } catch (e) { return fail(e) }
}
