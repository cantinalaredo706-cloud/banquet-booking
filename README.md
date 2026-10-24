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
| `ACCESS_AUD` | The "Application Audience (AUD) Tag" from the Access application |

Until email is set up, bookings still save and every email shows in the manager view as "Not sent".
The card-on-file step (Stripe) is switched off; guests are told a manager will call to take a card.
Before launch: set `BRAND` in `public/js/rules.js` to the approved name and remove the `noindex` lines in `public/_headers`.
