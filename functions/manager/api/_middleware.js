/* The manager's data now lives under /manager/api/, inside the same Cloudflare Access address (/manager)
   as the manager page itself, so it always gets the same sign-in. Same check as /api/manager/. */
export { onRequest } from '../../api/manager/_middleware.js';
