/* Square: saves the guest's card on file (no charge) so a manager can charge a late-cancellation
   or no-show fee from the Square Dashboard. The card number never touches this site: the guest
   types it into Square's own card box, and we only get back a one-time token.

   Settings (Cloudflare → Pages project → Settings → Variables and Secrets):
     SQUARE_ENV           sandbox (testing) or production (real cards)
     SQUARE_APP_ID        Application ID from the Square Developer Dashboard
     SQUARE_LOCATION_ID   Location ID of the restaurant
     SQUARE_ACCESS_TOKEN  Access token — add as a Secret (encrypted). Never paste it anywhere else.
   Until all three IDs/tokens are set, the card step stays off and guests are told a manager will call. */
import { HttpError } from './server.js';

const S = v => String(v || '').trim().replace(/^(["'])(.*)\1$/, '$2').trim(); // tolerate quotes around pasted values
const SQUARE_VERSION = '2025-01-23';
export const squareEnv = env => S(env.SQUARE_ENV).toLowerCase() === 'production' ? 'production' : 'sandbox';
export const squareReady = env => !!(S(env.SQUARE_APP_ID) && S(env.SQUARE_LOCATION_ID) && S(env.SQUARE_ACCESS_TOKEN));
/* What the guest page needs to show Square's card box (all public values, no secrets). */
export const squarePublic = env => squareReady(env) ? { appId: S(env.SQUARE_APP_ID), locationId: S(env.SQUARE_LOCATION_ID), env: squareEnv(env) } : false;

const api = env => squareEnv(env) === 'production' ? 'https://connect.squareup.com/v2' : 'https://connect.squareupsandbox.com/v2';
const BRANDS = { VISA: 'Visa', MASTERCARD: 'Mastercard', AMERICAN_EXPRESS: 'Amex', DISCOVER: 'Discover', DISCOVER_DINERS: 'Diners Club', JCB: 'JCB', CHINA_UNIONPAY: 'UnionPay' };

async function call(env, method, path, body) {
  let r, j = {};
  try {
    r = await fetch(api(env) + path, {
      method,
      headers: { 'Square-Version': SQUARE_VERSION, authorization: `Bearer ${S(env.SQUARE_ACCESS_TOKEN)}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    try { j = await r.json() } catch { }
  } catch (e) { console.error('Square unreachable', e); throw new HttpError(502, 'We couldn’t reach our card processor. Please try again in a minute, or call us.') }
  if (!r.ok) {
    const err = (j.errors || [])[0] || {};
    console.error('Square error', r.status, JSON.stringify(j.errors || j).slice(0, 500));
    const code = String(err.code || '');
    // Card problems the guest can fix get a plain message; anything else is on our side.
    if (/CVV|ADDRESS|POSTAL|EXPIRATION|CARD|DECLINE|VERIFY|INSUFFICIENT|GENERIC_DECLINE|INVALID_ACCOUNT/i.test(code) && r.status < 500)
      throw new HttpError(402, `Your card couldn’t be saved: ${String(err.detail || 'it was declined').replace(/[.\s]+$/, '')}. Please check the details or try another card.`);
    throw new HttpError(502, 'We couldn’t save your card right now. Please try again, or call us.');
  }
  return j;
}

const splitName = n => { const p = String(n || '').trim().split(/\s+/); return { given: p[0] || '', family: p.slice(1).join(' ') } };
const phoneE164 = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? '+1' + d : d.length === 11 && d[0] === '1' ? '+' + d : undefined };

/* Create a Square customer for the guest and save the card to it. Nothing is charged. */
export async function saveCard(env, { token, verificationToken, holder, name, email, phone, ref }) {
  if (!token || typeof token !== 'string' || token.length > 500) throw new HttpError(400, 'Please enter your card in the card box.');
  const n = splitName(name);
  const cust = await call(env, 'POST', '/customers', {
    idempotency_key: crypto.randomUUID(),
    given_name: n.given.slice(0, 100), family_name: n.family.slice(0, 100),
    email_address: email, phone_number: phoneE164(phone),
    reference_id: ref, note: 'Party booking at cantinafortmyersevents.com. Card saved for cancellation/no-show fees only.'
  });
  const customerId = cust.customer?.id;
  if (!customerId) throw new HttpError(502, 'We couldn’t save your card right now. Please try again, or call us.');
  const body = { idempotency_key: crypto.randomUUID(), source_id: token, card: { customer_id: customerId, cardholder_name: String(holder || name).slice(0, 96), reference_id: ref } };
  if (verificationToken && typeof verificationToken === 'string' && verificationToken.length < 1000) body.verification_token = verificationToken;
  const c = (await call(env, 'POST', '/cards', body)).card || {};
  return {
    brand: BRANDS[c.card_brand] || (c.card_brand ? c.card_brand.charAt(0) + c.card_brand.slice(1).toLowerCase().replace(/_/g, ' ') : 'Card'),
    last4: c.last_4 || '????', exp: c.exp_month && c.exp_year ? `${String(c.exp_month).padStart(2, '0')}/${String(c.exp_year).slice(-2)}` : '',
    holder: c.cardholder_name || holder || name, squareCustomerId: customerId, squareCardId: c.id, squareEnv: squareEnv(env), savedAt: Date.now()
  };
}

/* Take a saved card off file in Square (it can no longer be charged). */
export async function removeCard(env, card) {
  if (!card?.squareCardId || card.removed) return false;
  await call(env, 'POST', `/cards/${encodeURIComponent(card.squareCardId)}/disable`);
  return true;
}
