# Banquet & large-party booking site

Guests book the Private Dining Room, Dining Room or Bar online. Managers approve held bookings at `/manager/`.

## How it's put together
- `public/` — the pages guests and managers see. `public/js/rules.js` holds every price, fee, time and email wording in one place.
- `functions/api/` — the server side: saves bookings in the Cloudflare D1 database (tables are created automatically) and sends emails through Resend.
- `functions/api/manager/` — only works for people signed in through Cloudflare Access.

## Cloudflare Pages settings
- Framework preset: **None** · Build command: *(leave empty)* · Build output directory: **public**
- Binding: D1 database, variable name **DB**

## Settings (Cloudflare → the Pages project → Settings → Variables and Secrets)
| Name | What it is |
|---|---|
| `RESEND_API_KEY` | Resend key — add as **Secret** (encrypted) |
| `MAIL_FROM` | Who emails come from, e.g. `Parties <events@yourdomain.com>` |
| `REPLY_TO` | Where guest replies go, e.g. `Cantinalaredo706@gmail.com` |
| `ALERT_TO` | Starting address for manager alerts (changeable later in the manager view) |
| `SITE_URL` | The site's address, used for the manager-view link in alert emails |
| `ACCESS_TEAM_DOMAIN` | From Cloudflare Access, e.g. `yourteam.cloudflareaccess.com` |
| `ACCESS_AUD` | Optional: the Access application's "AUD tag", to tie sign-ins to that one application |
| `SQUARE_ENV` | `sandbox` while testing, `production` for real cards |
| `SQUARE_APP_ID` | Square Developer Dashboard → your application → Application ID (sandbox or production, to match `SQUARE_ENV`) |
| `SQUARE_LOCATION_ID` | Square Developer Dashboard → Locations → the restaurant's Location ID (sandbox or production) |
| `SQUARE_ACCESS_TOKEN` | Square Developer Dashboard → Access token — add as **Secret** (encrypted). Never paste it anywhere else. |

Until email is set up, bookings still save and every email shows in the manager view as "Not sent".
## Card on file (Square)
When the three Square settings above are filled in, the Submit step shows Square's own card box. The card is saved to a
Square customer and **not charged**; this site only keeps the card type, last 4 digits and expiration. Until then the step
is off and guests are told a manager will call to take a card.
- Guests are told the card is only for a cancellation or no-show fee and that they must bring a card or other payment for the bill.
- To charge a fee: in Square (Virtual Terminal or the Square app), enter the fee, choose **Card on file**, and pick the guest.
- Declining a booking removes its card from Square automatically. Cancelling keeps it (in case you charge a fee); use
  **Remove card** in the manager view afterward. Remove cards after each event, too.
Before launch: set `BRAND` in `public/js/rules.js` to the approved name and remove the `noindex` lines in `public/_headers`.

## Publishing a change to styles or scripts
Browsers keep copies of `public/css` and `public/js` files for hours. Every page links them with `?v=<number>`;
run `python3 scripts/bump-version.py` before committing so browsers fetch the new copy right away.
