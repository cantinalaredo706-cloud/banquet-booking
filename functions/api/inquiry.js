/* POST /api/inquiry — a guest finished Step 3. Lets managers know someone started a booking. */
import { getDB, json, fail, readJson, cleanBooking, alertManagers, bookingView } from '../../lib/server.js';
import * as R from '../../public/js/rules.js';

export async function onRequestPost({ request, env }) {
  try {
    const req = cleanBooking(await readJson(request));
    const DB = await getDB(env);
    await alertManagers(env, DB, 'inquiry', R.inquiryEmail(bookingView(req)));
    return json({ ok: true });
  } catch (e) { return fail(e) }
}
