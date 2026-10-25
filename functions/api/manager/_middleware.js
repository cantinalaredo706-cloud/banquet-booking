/* Locks every /api/manager/ request. Only people Cloudflare Access has signed in get through.
   Until ACCESS_TEAM_DOMAIN is set (step 5 of the setup), everything here is refused.
   Every sign-in must be signed by this restaurant's own Cloudflare Access team. If ACCESS_AUD is also set,
   it must come from that exact Access application too. */
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
  const team = 'https://' + String(env.ACCESS_TEAM_DOMAIN).trim().replace(/^["']|["']$/g, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return { why: 'The sign-in pass is not in the expected format.' };
  const header = JSON.parse(b64uText(h)), payload = JSON.parse(b64uText(p));
  if (header.alg !== 'RS256') return { why: 'The sign-in pass uses an unexpected format.' };
  let jwk = (await getKeys(team)).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(team, true)).find(k => k.kid === header.kid);
  if (!jwk) return { why: `The sign-in pass was not issued by ${team.replace('https://', '')}. Check ACCESS_TEAM_DOMAIN.` };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return { why: 'The sign-in pass signature did not check out.' };
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const now = Math.floor(Date.now() / 1000);
  const wantAud = String(env.ACCESS_AUD || '').trim();
  if (payload.iss !== team) return { why: `The sign-in came from ${String(payload.iss).replace('https://', '')}, but ACCESS_TEAM_DOMAIN is set to ${team.replace('https://', '')}.` };
  if (wantAud && !aud.includes(wantAud)) return { why: 'ACCESS_AUD does not match this Access application. Delete the ACCESS_AUD setting (it is optional) and redeploy.' };
  if (!(payload.exp > now)) return { why: 'The sign-in has expired.' };
  return { who: payload.email || payload.common_name || 'manager' };
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  // Local testing only: never set LOCAL_TEST_MANAGER on the live site; it also only works on localhost.
  const host = new URL(request.url).hostname;
  if (env.LOCAL_TEST_MANAGER === '1' && (host === 'localhost' || host === '127.0.0.1')) { ctx.data.manager = 'test@localhost'; return ctx.next() }
  if (!String(env.ACCESS_TEAM_DOMAIN || '').trim()) return json({ error: 'The manager login is not set up yet. Finish the Cloudflare Access step first.', setup: true }, 403);
  const cookie = (request.headers.get('cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  const token = request.headers.get('cf-access-jwt-assertion') || (cookie && cookie[1]);
  let r = { why: 'No sign-in pass reached the site. Check that the Access application covers cantinafortmyersevents.com/api/manager.' };
  try { if (token) r = await verify(token, env) } catch (e) { console.error('access check failed', e); r = { why: 'Could not check the sign-in: ' + String(e.message || e).slice(0, 120) } }
  if (!r.who) return json({ error: 'Please sign in again to use the manager view.', why: r.why, signin: true }, 401);
  ctx.data.manager = r.who;
  return ctx.next();
}
