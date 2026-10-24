/* Locks every /api/manager/ request. Only people Cloudflare Access has signed in get through.
   Until ACCESS_TEAM_DOMAIN and ACCESS_AUD are set (step 5 of the setup), everything here is refused. */
import { json } from '../../../lib/server.js';

const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const b64uText = s => new TextDecoder().decode(b64u(s));
let certs = { at: 0, keys: [] };

async function getKeys(team, force) {
  if (!force && certs.keys.length && Date.now() - certs.at < 3600e3) return certs.keys;
  const r = await fetch(`${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('could not load Access certificates');
  certs = { at: Date.now(), keys: (await r.json()).keys || [] };
  return certs.keys;
}

async function verify(token, env) {
  const team = 'https://' + String(env.ACCESS_TEAM_DOMAIN).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const header = JSON.parse(b64uText(h)), payload = JSON.parse(b64uText(p));
  if (header.alg !== 'RS256') return null;
  let jwk = (await getKeys(team)).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(team, true)).find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const now = Math.floor(Date.now() / 1000);
  if (!aud.includes(env.ACCESS_AUD) || payload.iss !== team || !(payload.exp > now) || (payload.nbf && payload.nbf > now + 60)) return null;
  return payload.email || payload.common_name || 'manager';
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  // Local testing only: never set LOCAL_TEST_MANAGER on the live site; it also only works on localhost.
  const host = new URL(request.url).hostname;
  if (env.LOCAL_TEST_MANAGER === '1' && (host === 'localhost' || host === '127.0.0.1')) { ctx.data.manager = 'test@localhost'; return ctx.next() }
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return json({ error: 'The manager login is not set up yet. Finish the Cloudflare Access step first.', setup: true }, 403);
  const cookie = (request.headers.get('cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  const token = request.headers.get('cf-access-jwt-assertion') || (cookie && cookie[1]);
  let who = null;
  try { if (token) who = await verify(token, env) } catch (e) { console.error('access check failed', e) }
  if (!who) return json({ error: 'Please sign in again to use the manager view.', signin: true }, 401);
  ctx.data.manager = who;
  return ctx.next();
}
