/* POST /api/manager/settings — change who gets alert emails and which alerts are sent. */
import { getDB, json, fail, readJson, saveSettings, ALERT_KINDS, HttpError } from '../../../lib/server.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const list = String(body.alertTo || '').split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    if (list.length > 10) throw new HttpError(400, 'Use 10 addresses or fewer.');
    const bad = list.find(a => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
    if (bad) throw new HttpError(400, `"${bad}" doesn't look like an email address.`);
    const prefs = Object.fromEntries(Object.keys(ALERT_KINDS).map(k => [k, !!(body.prefs && body.prefs[k])]));
    await saveSettings(await getDB(env), { alertTo: list.join(', '), prefs });
    return json({ ok: true });
  } catch (e) { return fail(e) }
}
