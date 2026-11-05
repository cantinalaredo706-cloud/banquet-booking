/* Restaurant rules for banquet and large-party bookings.
   This one file is used by both the guest page and the server, so the
   prices, fees, times and email wording only ever need changing here.
   Source: the 2026–2027 party contracts and Jim's answers. */

/* ---------- Names shown to guests (change once the name is approved) ---------- */
export const BRAND = 'Cantina Laredo';
export const LOCATION = 'Fort Myers';
export const GM = 'Joe Valenza\nGeneral Manager';
export const TZ = 'America/New_York';

/* ---------- Money and timing rules ---------- */
export const GRAT = 0.22, TAX = 0.065, NOTICE_H = 48, MAXDAYS = 270;

export const SPACES = {
  dr: { id: 'dr', name: 'Dining Room', short: 'Up to 100 guests · shared room', minG: 11, maxG: 100, cancelH: 12, countDays: 2,
    desc: 'Our Dining Room seats up to 100. We arrange tables to make your group comfortable. Pick any arrival time.' },
  pdr: { id: 'pdr', name: 'Private Dining Room', short: 'Up to 40 guests · private', minG: 1, maxG: 40, cancelH: 72, countDays: 2,
    desc: 'A private room for up to 40 guests (32 with a buffet, to make room for the buffet setup). No rental fee, just a food & beverage minimum. TV with HDMI available for $75.' },
  bar: { id: 'bar', name: 'Bar', short: 'Up to about 50 guests · bar area', minG: 11, maxG: 50, cancelH: 24, countDays: 2,
    desc: 'Our Bar Area seats about 50 guests. We arrange tables to make your group comfortable. Pick any arrival time.' }
};
const DR_FEES = [[8, 150], [15, 200], [25, 250], [Infinity, 300]];
export const drFee = g => DR_FEES.find(([max]) => g <= max)[1];
const BAR_FEES = [[8, 100], [15, 150], [25, 200], [Infinity, 250]]; // from the 2026–2027 Bar contract
export const barFee = g => BAR_FEES.find(([max]) => g <= max)[1];
/* Dinner set menus, from the menu sheets Jim sent on Nov 5, 2026 (one per price).
   Each menu: appetizers for the table, entrée choices, dessert choices.
   To add, remove or reprice a menu, change this list only. */
const E = (name, desc) => ({ name, desc });
const POLLO_TAMPICO = E('Pollo Tampico', 'Grilled chicken breast topped with sauteed artichoke, mushrooms, spinach and red bell pepper. With sour cream poblano sauce and Monterey Jack cheese.');
const CL_SALAD = E('Cilantro Lime Chicken Salad', 'Fajita chicken with black beans, red bell peppers, Monterey Jack cheese and avocado. With cilantro lime dressing.');
const CL_SALAD_1 = E('Cilantro Lime Chicken Salad', 'Fajita chicken with black beans, red bell pepper, Monterey Jack cheese and avocado. With cilantro lime dressing.');
const CARNITAS_BOWL = E('Crispy Carnitas Bowl', 'Crispy pork carnitas, cilantro lime rice, black beans, corn, fresh jalapeños pico de gallo and Monterey Jack cheese. Topped with chipotle wine sauce and cilantro.');
const FAJITAS = E('Fajitas', 'Choice of chicken or steak fajitas with rice and refried beans. Served with sour cream, guacamole, flour tortillas and pico de gallo.');
const SALMON = E('Salmon', 'Grilled salmon with chimichurri sauce. Served with cilantro lime rice and fresh grilled asparagus.');
const SHRIMP_ENCH = E('Shrimp Enchiladas', 'Enchiladas with Monterey Jack cheese, sauteed shrimp and red bell pepper on a bed of spinach and Veracruz vegetables. Topped with sour cream sauce, with a side of cilantro lime rice.');
const ASADA_8 = E('Carne Asada', '8 oz grilled steak topped with marinated onions and chimichurri sauce. Served with cilantro lime rice, black beans and avocado slices.');
const TACOS_CARBON = E('Tacos al Carbon', 'Choice of grilled chicken or steak tacos inside grilled flour tortillas. Served with rice, refried beans, chili con queso, sour cream, guacamole and pico de gallo.');
const RIBEYE = E('Cascabel Ribeye', '16 oz Certified Angus Beef cowboy-cut bone-in ribeye, aged 21 days, then basted with Cascabel sauce. Served with confit potatoes and fresh grilled asparagus.');
const SEA_BASS = E('Chilean Sea Bass', '8 oz pan-seared sea bass topped with jalapeño beurre blanc sauce. Served with cilantro lime rice and fresh grilled asparagus.');
const MAR_Y_TIERRA = E('Mar y Tierra', '8 oz Certified Angus Beef filet mignon with grilled shrimp and red wine mushroom sauce. Served with confit potatoes and fresh grilled asparagus.');
const RIBEYE_FAJITA = E('Ribeye Fajita', '16 oz Certified Angus Beef cowboy-cut bone-in ribeye, served fajita style. With rice, beans, tortillas, sour cream, guacamole and pico de gallo.');
const CHIPS = 'Fire-roasted salsa and chips', GUAC = 'Top Shelf Guacamole';
export const DINNER_MENUS = {
  25: { apps: [CHIPS, 'Queso y Guac'], entrees: [
      E('Quesadillas', 'Chicken fajita or beef fajita quesadilla with onions and tomatoes. Served with sour cream and guacamole.'),
      E('Pollo Chipotle', 'Grilled chicken breast with chipotle wine sauce and Monterey Jack cheese. Served with charred corn and black beans.'),
      CARNITAS_BOWL, CL_SALAD_1], desserts: 'Taste of Brownie or Flan' },
  27: { apps: [CHIPS, 'Chili con Queso'], entrees: [
      E('Tamales Dinner', 'Spiced seasoned pulled beef tamales topped with roasted red peppers, tomatillo sauce, cilantro, queso fresco and roasted chorizo corn. With rice and refried beans.'),
      E('Pollo Tampico', 'Grilled chicken breast topped with sauteed artichokes, mushrooms, spinach and red bell pepper. Topped with sour cream poblano sauce and Monterey Jack cheese.'),
      E('Shrimp Quesadilla', 'Shrimp, spinach, mushrooms and Monterey Jack cheese in a flour tortilla, served with sour cream and guacamole.'),
      CL_SALAD_1, CARNITAS_BOWL], desserts: 'Taste of Brownie or Flan' },
  30: { apps: [CHIPS, GUAC], entrees: [FAJITAS, POLLO_TAMPICO, SALMON, CL_SALAD,
      E('Cantina Bowl', 'Crispy pork carnitas or grilled chicken with cilantro lime rice, black beans, corn, fresh jalapeños pico de gallo and Monterey Jack cheese. Topped with chipotle wine sauce and cilantro.')],
      desserts: 'Flan or Raspberry Cheesecake' },
  35: { apps: [CHIPS, GUAC], entrees: [FAJITAS, POLLO_TAMPICO,
      E('Grouper Tacos', 'Flour tortillas with fresh fried grouper filets, lettuce, tomato and queso fresco. Rice and black beans.'),
      CL_SALAD, SHRIMP_ENCH], desserts: 'Taste of Brownie or Flan' },
  40: { apps: [CHIPS, 'Queso y Guac Combination'], entrees: [ASADA_8, POLLO_TAMPICO,
      E('Mahi Mahi', 'Pan-seared mahi mahi with roasted red pepper sauce. Served with cilantro lime rice and fresh grilled asparagus.'),
      CL_SALAD, CARNITAS_BOWL], desserts: 'Flan or Raspberry Cheesecake' },
  45: { apps: [CHIPS, GUAC], entrees: [ASADA_8, POLLO_TAMPICO, SALMON, CL_SALAD,
      E('Cantina Bowl', 'Crispy pork carnitas or grilled chicken, with cilantro lime rice, black beans, corn, fresh jalapeños pico de gallo and Monterey Jack cheese. Topped with chipotle wine sauce, queso fresco and cilantro.')],
      desserts: 'Flan or Raspberry Cheesecake' },
  50: { apps: [CHIPS, GUAC], entrees: [
      E('Carne Asada', 'Fire-charred skirt steak with chimichurri sauce, lime-marinated onions, avocado, black beans and cilantro lime rice.'),
      POLLO_TAMPICO,
      E('Tacos al Carbon', 'Choice of grilled chicken or steak tacos inside grilled flour tortillas. Served with rice, black beans, chili con queso, sour cream, guacamole and pico de gallo.'),
      SALMON, SHRIMP_ENCH], desserts: 'Flan or Raspberry Cheesecake' },
  55: { apps: [CHIPS, GUAC], entrees: [FAJITAS, POLLO_TAMPICO, ASADA_8,
      E('Cilantro Salad', 'Choice of chicken, shrimp or salmon with black beans, red bell peppers, Monterey Jack cheese and avocado. With cilantro lime dressing.'),
      TACOS_CARBON], desserts: 'Raspberry Cheesecake or Flan' },
  60: { apps: [CHIPS, GUAC], entrees: [
      E('Asada Camarones', 'Fire-charred skirt steak with Oaxaca shrimp, red bell pepper, grilled mushrooms and queso fresco on a bed of chimichurri sauce. Served with cilantro lime rice and black beans.'),
      POLLO_TAMPICO, SALMON, TACOS_CARBON,
      E('Cantina Laredo Platter', 'Monterey Jack chile relleno, beef tamale, chicken enchilada and steak carbon taco. With rice and beans.')],
      desserts: 'Raspberry Cheesecake or Flan' },
  65: { apps: [CHIPS, GUAC], entrees: [
      E('Filet Portabella', '8 oz Certified Angus Beef filet mignon on a portabella mushroom cap with red wine mushroom sauce. Served with confit potatoes and fresh grilled asparagus.'),
      POLLO_TAMPICO, RIBEYE, SALMON, SHRIMP_ENCH], desserts: 'Raspberry Cheesecake or Flan' },
  70: { apps: [CHIPS, GUAC], entrees: [MAR_Y_TIERRA, POLLO_TAMPICO, RIBEYE, SEA_BASS], desserts: '6-Layer Chocolate Cake or Raspberry Cheesecake' },
  75: { apps: [CHIPS, GUAC], entrees: [
      E('Filet Chimichurri', 'Thinly sliced 8 oz Certified Angus Beef filet mignon with chimichurri sauce. Served with confit potatoes and fresh grilled asparagus.'),
      RIBEYE, SEA_BASS,
      E('Oaxaca Shrimp', 'Six bacon-wrapped shrimp stuffed with Oaxaca cheese and jalapeño. Served on a bed of cilantro lime rice with a side of tomatillo sauce.')],
      desserts: 'Raspberry Cheesecake or 6-Layer Chocolate Cake' },
  80: { apps: [CHIPS, GUAC], entrees: [MAR_Y_TIERRA,
      E('Tres Amigos', 'A delicious combination of carnitas, carne asada and Oaxaca shrimp. Served with rice and refried beans.'),
      RIBEYE_FAJITA, SEA_BASS], desserts: '6-Layer Chocolate Cake or Raspberry Cheesecake' },
  90: { apps: [CHIPS, GUAC, 'Shrimp Cocktail'], entrees: [MAR_Y_TIERRA,
      E('Super Tres Amigos', 'A delicious combination of grilled salmon, carnitas, carne asada and Oaxaca shrimp. Served with mixed vegetables.'),
      RIBEYE_FAJITA, SEA_BASS], desserts: 'Raspberry Cheesecake, 6-Layer Chocolate Cake or Caramel Flan' },
  100: { apps: [CHIPS, 'Queso y Guacamole', 'Choice of Sopa de Tortilla or Garden Salad'], entrees: [
      E('Wagyu Fajitas', 'Australian Wagyu beef with tomatoes and an exotic mushroom mix. Topped with a balsamic glaze and marinated leeks. With sour cream, guacamole, pico de gallo and tortillas.'),
      MAR_Y_TIERRA,
      E('Super Tres Amigos', 'A delicious combination of salmon, carnitas, carne asada and Oaxaca shrimp. Served with rice and veggies.'),
      SEA_BASS], desserts: 'Raspberry Cheesecake or 6-Layer Chocolate Cake' }
};
export const DINNER_SET = Object.keys(DINNER_MENUS).map(Number).sort((a, b) => a - b);
/* Prices no longer offered, kept only so older bookings still show their menu in the manager view. */
const RETIRED_DINNER = [85];

/* Lunch set menus, from the menu sheets Jim sent on Nov 5, 2026. */
const L = (name, desc) => ({ name, desc });
export const LUNCH_MENUS = {
  18: { appsLabel: 'Beginning', apps: ['Fire-Roasted Salsa & Chips'], entrees: [
      L('Traditional Tacos', 'Crispy tacos with seared ground sirloin, lettuce, tomato and cheddar cheese. With rice & beans.'),
      L('Cantina Chicken Bowl', 'Grilled chicken breast, cilantro lime rice, black beans, corn, jalapeño, pico de gallo and Monterey Jack cheese. With chipotle wine sauce, queso fresco and cilantro.'),
      L('Tamales', '2 seared ground sirloin tamales with chili con carne sauce. Served with rice & beans.'),
      L('Cilantro Lime Chicken Salad', 'Fajita chicken with black beans, red pepper, Monterey Jack cheese and avocado. With cilantro-lime dressing.')],
      desserts: null },
  20: { appsLabel: 'Beginning', apps: ['Fire-Roasted Salsa & Chips'], entrees: [
      L('Traditional Tacos', 'Crispy tacos with seared ground sirloin, lettuce, tomato and cheddar cheese.'),
      L('Crispy Carnita Bowl', 'Crispy pork carnitas, cilantro lime rice, black beans, corn, jalapeño, pico de gallo and Monterey Jack cheese. With chipotle wine sauce and cilantro.'),
      L('Monterey', 'Chicken enchilada, soft chicken taco with rice and beans.'),
      L('Taco Salad', 'Ground beef or shredded chicken served on top of a bed of lettuce with sour cream and guacamole in a taco bowl.')],
      desserts: 'Taste of Flan or Brownie' },
  25: { apps: [CHIPS, GUAC], entrees: [
      L('Tamales', 'Spiced seasoned pulled beef tamales topped with roasted red peppers, tomatillo sauce, cilantro, queso fresco and roasted chorizo corn.'),
      L('Pollo Tampico', 'Grilled chicken breast topped with sauteed artichokes, mushrooms, spinach and red bell pepper. Topped with sour cream poblano sauce and Monterey Jack cheese.'),
      L('Cilantro Lime Chicken Salad', 'Fajita chicken with black beans, red bell pepper, Monterey Jack cheese and avocado. With cilantro lime dressing.'),
      L('Asada y Enchilada', 'Grilled skirt steak with house marinated onions and chimichurri sauce. With a Veracruz enchilada, black beans and cilantro lime rice.'),
      L('Shrimp & Strawberry Salad', 'Grilled shrimp with field greens, pineapple, jicama, strawberries, avocado, candied walnuts and queso fresco.')],
      desserts: 'Taste of Brownie or Flan' }
};
export const LUNCH_SET = Object.keys(LUNCH_MENUS).map(Number).sort((a, b) => a - b);
const RETIRED_LUNCH = [22];
export const BUFFETS = [
  { id: 'appbuf', table: true, name: 'Appetizer Buffet', price: 15.99, desc: "Chef's choice: potato kegs, corn nuggets, quesadillas, chicken wings, fried cauliflower, Southwest eggrolls, queso, and chips & salsa." },
  { id: 'taco2', table: true, name: 'Taco Buffet · 2 per guest', price: 14.99, desc: 'Ground beef, shredded chicken, rice, refried beans, flour tortillas and all the taco fillings. Chips & salsa.' },
  { id: 'taco3', table: true, name: 'Taco Buffet · 3 per guest', price: 16.49, desc: 'Same as above, three tacos per guest.' },
  { id: 'fajl', table: true, name: 'Fajita Buffet · lunch portion', price: 18.99, desc: 'Steak, chicken, grilled peppers & onions, rice, refried beans, flour tortillas, sour cream, guacamole, pico de gallo. Chips & salsa.' },
  { id: 'fajd', table: true, name: 'Fajita Buffet · dinner portion', price: 27.99, desc: 'Same as above, dinner portions.' },
  { id: 'brunch', table: true, name: 'Brunch Buffet', price: 13.99, brunch: true, desc: 'Chorizo con Huevos, Tostar, Chilaquiles, Migas and mixed fruit. One complimentary Bloody Mary or Mimosa per guest 21+. Saturdays & Sundays, 10 am–3 pm.' },
  { id: 'fl', name: 'Floating Apps · Light', price: 14.99, desc: 'Two hours of finger-food appetizers brought to your group.' },
  { id: 'fm', name: 'Floating Apps · Medium', price: 17.99, desc: 'Two hours of finger-food appetizers, a fuller mix.' },
  { id: 'fh', name: 'Floating Apps · Heavy', price: 20.99, desc: 'Two hours of heavier appetizers, guacamole included.' }
];
export const PLATTERS = { s: { name: 'Small appetizer platter', price: 75, feeds: '12–15' }, l: { name: 'Large appetizer platter', price: 95, feeds: '18–21' } };
export const BAROPTS = [
  { id: 'open', name: 'Open bar (hosted tab)', desc: 'You host the bar and we run a tab on what guests order. Fully open, or limited to certain drinks.' },
  { id: 'cap', name: 'Consumption with a cap', desc: 'Like an open bar, but you set a spending limit. When it is reached, we let you know or switch to a cash bar.' },
  { id: 'tickets', name: 'Drink tickets', desc: 'Each guest gets a set number of drink tickets. Anything beyond that goes on their own tab.' },
  { id: 'cash', name: 'Cash bar', desc: 'Guests pay for their own drinks.' }
];
export const EVENT_TYPES = ['Birthday', 'Anniversary', 'Rehearsal dinner', 'Shower', 'Business meal', 'Holiday party', 'Graduation', 'Celebration of life', 'Medical/pharmaceutical', 'Other'];

/* ---------- Dates (calendar days as 'YYYY-MM-DD', always Fort Myers time) ---------- */
export const pad = n => String(n).padStart(2, '0');
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) };
export const ymd = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const addDays = (ds, n) => { const x = parse(ds); x.setUTCDate(x.getUTCDate() + n); return ymd(x) };
export const dow = ds => parse(ds).getUTCDay();
export const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && ymd(parse(s)) === s;
export const fmtLong = s => parse(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
export const fmtShort = s => parse(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
export const fmtT = m => { const h = Math.floor(m / 60), mi = m % 60, h12 = ((h + 11) % 12) + 1; return `${h12}:${pad(mi)} ${h < 12 ? 'am' : 'pm'}` };
export const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money0 = n => '$' + n.toLocaleString('en-US');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtStamp = ms => new Date(ms).toLocaleString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const tzFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
function tzOffsetMin(ms) {
  const p = tzFmt.formatToParts(new Date(ms)), g = t => +p.find(x => x.type === t).value;
  return Math.round((Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - Math.floor(ms / 1000) * 1000) / 60000);
}
/* The real moment that is `min` minutes after midnight on day `ds`, Fort Myers time */
export function localInstant(ds, min) {
  const [y, m, d] = ds.split('-').map(Number), guess = Date.UTC(y, m - 1, d, 0, min);
  let t = guess - tzOffsetMin(guess) * 60000; const off2 = tzOffsetMin(t);
  return guess - off2 * 60000;
}
export const todayLocal = (now = Date.now()) => ymd(new Date(now + tzOffsetMin(now) * 60000));

const D = (y, m, d) => ymd(new Date(Date.UTC(y, m, d)));
const nth = (y, m, w, n) => { const f = new Date(Date.UTC(y, m, 1)).getUTCDay(); return D(y, m, 1 + ((w - f + 7) % 7) + 7 * (n - 1)) };
const lastDow = (y, m, w) => { const l = new Date(Date.UTC(y, m + 1, 0)); return D(y, m, l.getUTCDate() - ((l.getUTCDay() - w + 7) % 7)) };
const hcache = {};
function holidays(y) {
  if (hcache[y]) return hcache[y];
  const h = {}, add = (ds, n) => h[ds] = n;
  add(D(y, 0, 1), "New Year's Day"); add(nth(y, 0, 1, 3), 'MLK Day'); add(D(y, 1, 14), "Valentine's Day"); add(nth(y, 1, 1, 3), "Presidents' Day");
  add(nth(y, 4, 0, 2), "Mother's Day"); add(lastDow(y, 4, 1), 'Memorial Day'); add(D(y, 5, 19), 'Juneteenth'); add(nth(y, 8, 1, 1), 'Labor Day');
  add(nth(y, 9, 1, 2), 'Columbus Day'); add(D(y, 10, 11), 'Veterans Day'); add(D(y, 11, 24), 'Christmas Eve'); add(D(y, 11, 31), "New Year's Eve");
  return hcache[y] = h;
}
export function closedName(ds) {
  const y = +ds.slice(0, 4);
  if (ds === D(y, 6, 4)) return 'Closed · July 4th'; if (ds === nth(y, 10, 4, 4)) return 'Closed · Thanksgiving'; if (ds === D(y, 11, 25)) return 'Closed · Christmas'; return null;
}
export const holidayName = ds => holidays(+ds.slice(0, 4))[ds] || null;
export const closeMin = ds => { const w = dow(ds); return (w === 5 || w === 6) ? 22 * 60 : 21 * 60 };
export const isWeekendRate = ds => { const w = dow(ds); return w === 5 || w === 6 || !!holidayName(ds) };
/* Private Dining Room lunch: the room is held 11:00 am–3:00 pm; the party picks a start time within that. */
export const LUNCH_STARTS = [660, 690, 720, 750, 780, 810, 840]; // 11:00 am – 2:00 pm
export const pdrTerms = (ds, block) => { const hi = isWeekendRate(ds); return block === 'lunch' ? (hi ? { min: 650, fee: 325 } : { min: 550, fee: 275 }) : (hi ? { min: 1300, fee: 650 } : { min: 1100, fee: 550 }) };
export const noticeOK = (ds, m, now = Date.now()) => localInstant(ds, m) - now >= NOTICE_H * 36e5;
export const isSatSun = ds => { const w = dow(ds); return w === 0 || w === 6 };

/* ---------- Availability, given the list of booked slots ---------- */
export function makeAvail(slots, now = Date.now()) {
  const today = todayLocal(now);
  const live = b => b.status !== 'declined';
  const pdrLunch = ds => slots.find(b => live(b) && b.space === 'pdr' && b.date === ds && b.block === 'lunch');
  const pdrDinner = ds => slots.find(b => live(b) && b.space === 'pdr' && b.date === ds && b.block === 'dinner');
  const partiesOn = (sp, ds) => slots.filter(b => live(b) && b.space === sp && b.date === ds);
  function dinnerStarts(ds) {
    const out = [], l = pdrLunch(ds), d = pdrDinner(ds);
    for (let m = 15 * 60; m <= 20 * 60; m += 30) out.push({ m, ok: !d && noticeOK(ds, m, now) && !(l && l.ext && m < 16 * 60) });
    return out;
  }
  const lunchOK = ds => !pdrLunch(ds) && noticeOK(ds, 11 * 60, now);
  const extOK = ds => { const d = pdrDinner(ds); return !d || d.time >= 16 * 60 };
  function arrivalTimes(ds) { const out = []; for (let m = 11 * 60; m <= closeMin(ds) - 30; m += 30) out.push({ m, ok: noticeOK(ds, m, now) }); return out }
  const daysOut = ds => Math.round((parse(ds) - parse(today)) / 864e5);
  function dayInfo(sp, ds) {
    const diff = daysOut(ds);
    if (diff < 0 || diff > MAXDAYS) return { state: 'off', label: '' };
    if (closedName(ds)) return { state: 'off', label: 'Closed' };
    if (sp === 'pdr') {
      const l = lunchOK(ds), dn = dinnerStarts(ds).some(x => x.ok);
      if (!l && !dn) { const noticeOnly = !pdrLunch(ds) || !pdrDinner(ds); return noticeOnly && diff <= 3 ? { state: 'off', label: 'Call us' } : { state: 'full', label: 'Booked' } }
      return { state: l && dn ? 'open' : 'some', label: l && dn ? 'Lunch & dinner' : l ? 'Lunch open' : 'Dinner open' };
    }
    if (!arrivalTimes(ds).some(x => x.ok)) return { state: 'off', label: 'Call us' };
    const n = partiesOn(sp, ds).length;
    if (sp === 'dr' && n >= 2) return { state: 'some', label: 'Approval' };
    return { state: 'open', label: n ? `${n} booked` : 'Open' };
  }
  function needsApproval(sp, ds) {
    if (sp === 'pdr') return 'Private Dining Room — every booking needs your approval';
    if (sp === 'bar') return 'Bar — every booking needs your approval';
    const n = partiesOn('dr', ds).length; return n >= 2 ? `Dining Room — party #${n + 1} that day` : null;
  }
  /* Server-side check that the chosen slot is still open. Returns a message, or null if fine. */
  function slotProblem(sp, sel) {
    const taken = 'Someone just reserved this time. Go back and pick another.';
    if (!SPACES[sp]) return 'Choose a space.';
    if (!isDate(sel.date)) return 'Choose a date.';
    const diff = daysOut(sel.date);
    if (diff < 0 || diff > MAXDAYS || closedName(sel.date)) return 'That date is not available.';
    if (sp === 'pdr') {
      if (sel.block === 'lunch') {
        if (pdrLunch(sel.date)) return taken;
        if (!noticeOK(sel.date, 11 * 60, now)) return 'Bookings must be at least 48 hours away. For anything sooner, please call a manager.';
        if (sel.ext && !extOK(sel.date)) return 'Staying until 4:00 pm is not available that day.';
        if (!LUNCH_STARTS.includes(sel.time)) return 'Choose a lunch start time.';
        return null;
      }
      if (sel.block === 'dinner') {
        const s = dinnerStarts(sel.date).find(x => x.m === sel.time);
        if (!s) return 'Choose a dinner start time.';
        if (pdrDinner(sel.date)) return taken;
        return s.ok ? null : 'That start time is not available. Please pick another.';
      }
      return 'Choose lunch or dinner.';
    }
    const t = arrivalTimes(sel.date).find(x => x.m === sel.time);
    if (!t) return 'Choose an arrival time.';
    return t.ok ? null : 'Bookings must be at least 48 hours away. For anything sooner, please call a manager.';
  }
  return { today, pdrLunch, pdrDinner, partiesOn, dinnerStarts, lunchOK, extOK, arrivalTimes, dayInfo, needsApproval, slotProblem };
}

/* ---------- Menus and the estimate ---------- */
/* Parties of more than 25 can't order from the regular menu; they choose a set menu or a buffet. */
/* Lunch set menus are only for parties that start before 3:00 pm. Dinner menus are open to everyone. */
export const LUNCH_MENU_CUTOFF = 15 * 60;
export const lunchMenusOK = time => time !== '' && time != null && !isNaN(+time) && +time < LUNCH_MENU_CUTOFF;
export const MENU_MAX_GUESTS = 25;
/* A buffet table (table: true in BUFFETS) takes up room in the Private Dining Room. */
export const PDR_BUFFET_MAX = 32;
export const menuBlocked = guests => (parseInt(guests, 10) || 0) > MENU_MAX_GUESTS;
export function foodInfo(id) {
  if (!id) return null; if (id === 'menu') return { id, name: 'Order from our menu at the event', price: null };
  if (id.startsWith('set-')) {
    const [, k, p] = id.split('-'); const list = k === 'l' ? LUNCH_SET : k === 'd' ? DINNER_SET : [];
    const retired = (k === 'd' && RETIRED_DINNER.includes(+p)) || (k === 'l' && RETIRED_LUNCH.includes(+p));
    if (!list.includes(+p) && !retired) return null;
    return { id, name: `${k === 'l' ? 'Lunch' : 'Dinner'} set menu · ${money0(+p)}${retired ? ' (no longer offered)' : ''}`, price: +p, set: true, retired, menu: (k === 'd' ? DINNER_MENUS : k === 'l' ? LUNCH_MENUS : {})[+p] || null };
  }
  const b = BUFFETS.find(x => x.id === id); return b ? Object.assign({ buffet: true, oneCheck: true }, b) : null;
}
export function estimate(o) {
  const g = parseInt(o.guests, 10) || 0, f = foodInfo(o.food);
  const plat = (+o.platS || 0) * 75 + (+o.platL || 0) * 95;
  const per = f && f.price != null ? f.price + (f.brunch && o.brunchAdd ? 2 : 0) : null;
  const food = per != null ? per * g : 0, fb = food + plat;
  const pt = o.space === 'pdr' && o.block ? pdrTerms(o.date, o.block) : null;
  const billed = pt ? Math.max(fb, pt.min) : fb, short = pt ? Math.max(0, pt.min - fb) : 0;
  const tv = o.tv && o.space === 'pdr' ? 75 : 0;
  return { g, f, per, food, plat, fb, pt, billed, short, grat: billed * GRAT, tax: billed * TAX, tv, total: billed * (1 + GRAT + TAX) + tv, priced: per != null || plat > 0 };
}
export function cancelText(o) {
  if (o.space === 'pdr') { if (!o.block) return 'Depends on lunch or dinner'; const pt = pdrTerms(o.date, o.block); return `${money0(pt.fee)} if cancelled less than 72 hours before` }
  if (o.space === 'dr') { const g = parseInt(o.guests, 10) || 0; return g ? `${money0(drFee(g))} if cancelled within 12 hours, or 30 min no-show` : 'Based on party size' }
  const g = parseInt(o.guests, 10) || 0; return g ? `${money0(barFee(g))} if cancelled within 24 hours, or 30 min no-show` : 'Based on party size';
}
export function whenText(b) {
  if (b.space === 'pdr') return `Private Dining Room · ${fmtLong(b.date)} · ${b.block === 'lunch' ? `Lunch${b.time != null ? ` starting ${fmtT(b.time)}` : ''} · room 11:00 am–${b.ext ? '4:00 pm (extension requested)' : '3:00 pm'}` : `Dinner, ${fmtT(b.time)} until close (${fmtT(closeMin(b.date))})`}`;
  return `${SPACES[b.space].name} · ${fmtLong(b.date)} · Arrival ${fmtT(b.time)}`;
}
export function barText(o) {
  const b = BAROPTS.find(x => x.id === o.bar); if (!b) return '—';
  if (o.bar === 'open') return o.barOpen === 'limited' ? `Limited open bar: ${o.barLimited || 'drinks to be confirmed'}` : 'Fully open bar';
  if (o.bar === 'cap') return `Open bar capped at ${o.barCap ? money0(+o.barCap) : '(amount TBD)'}`;
  if (o.bar === 'tickets') return `${o.barTickets || '?'} drink ticket(s) per guest`; return 'Cash bar';
}

/* ---------- The party agreement (Step 4, and the manager's printed copy) ---------- */
/* Same wording everywhere: the guest signs this, and the printout shows exactly this. */
export function agreementHtml(o) {
  const e = estimate(o), g = e.g;
  const head = `<dl class="kv"><dt>Reservation name</dt><dd>${esc(o.name)}${o.org ? ', ' + esc(o.org) : ''}</dd><dt>Contact</dt><dd>${esc(o.phone)} · ${esc(o.email)}</dd><dt>Event</dt><dd>${esc(o.type)}</dd><dt>When</dt><dd>${esc(whenText(o))}</dd><dt>Guests</dt><dd>${g}</dd><dt>Food</dt><dd>${e.f ? esc(e.f.name) : '—'}</dd><dt>Bar</dt><dd>${esc(barText(o))}</dd><dt>Bill paid with</dt><dd>${o.checks} check${o.checks > 1 ? 's' : ''}</dd>${o.tv && o.space === 'pdr' ? '<dt>TV with HDMI</dt><dd>Yes, $75</dd>' : ''}</dl>`;
  const common = `<li>Parties of more than 25 choose a set menu or a buffet. The bill is paid on a <u>maximum</u> of 3 checks.</li><li>In the event of a buffet or appetizer party, all food must be paid for on one check.</li><li>If any guests have food allergies, please tell us so we can accommodate them.</li>`;
  if (o.space === 'pdr') {
    const pt = pdrTerms(o.date, o.block);
    return `<h4>Private Party Agreement</h4>${head}<h4>Policies</h4><ol>
    <li>We do not charge room rental fees. We require a food &amp; beverage minimum. The minimum charge on the final guest check for your event, before tax and gratuity, is <b>${money0(pt.min)}</b>.</li>
    <li>The credit card on file secures the room for your event. It is not charged at booking.</li>
    <li><b>Cancellation:</b> Due to staffing requirements, your card <b>will be charged ${money0(pt.fee)}</b> if you cancel less than 72 hours before the scheduled event. The cancellation fee is only charged if the reservation is cancelled within that time frame.</li>
    <li>A final guest count must be received no later than 2 days before the party.</li>${common}
    <li>Applicable sales tax and a 22% banquet gratuity will be added to your check(s).</li>
    <li>Use of confetti or confetti poppers is prohibited. A $100 cleaning fee will be charged if any are used.</li>
    ${o.block === 'lunch' && o.ext ? '<li>Your request to keep the room until 4:00 pm is subject to manager approval.</li>' : ''}</ol>
    <p>Your signature indicates acceptance of the material contained herein and of the Banquet Event Policies, and authorizes us to keep your card on file and charge it as described above.</p>`
  }
  if (o.space === 'dr') return `<h4>Dining Room Party Agreement</h4>${head}<h4>Policies</h4><ol>
    <li>We do not charge rental fees. We require a credit card on file to guarantee the space for your event. It is not charged at booking.</li>
    <li>We will hold your table for 30 minutes past your reservation time. After that, it is considered a no-show and the cancellation fee is charged.</li>
    <li><b>Cancellation:</b> cancellations made less than 12 hours before the event are charged the cancellation fee for your party size: 9–15 guests $200, 16–25 guests $250, over 25 guests $300. Your fee: <b>${money0(drFee(g))}</b>.</li>
    <li>A final guest count must be received no later than 2 days before the party.</li>${common}
    <li>You may pre-select wines, beers and spirits, or we can run a cash bar.</li>
    <li>Applicable sales tax and a 22% event gratuity will be added to your check(s).</li>
    <li>Use of confetti or confetti poppers is prohibited. A $100 cleaning fee will be charged if any are used.</li></ol>
    <p>Your signature indicates acceptance of the material contained herein and of the Event Policies, and authorizes us to keep your card on file and charge it as described above.</p>`;
  return `<h4>Bar Party Agreement</h4>${head}<h4>Policies</h4><ol>
    <li>We do not charge rental fees. We require a credit card on file to guarantee the space for your event. It is not charged at booking.</li>
    <li>We will hold your table for 30 minutes past your reservation time. After that, it is considered a cancellation/no-show and the cancellation fee is charged.</li>
    <li><b>Cancellation:</b> cancellations made less than 24 hours before the event are charged the cancellation fee for your party size: 9–15 guests $150, 16–25 guests $200, over 25 guests $250. Your fee: <b>${money0(barFee(g))}</b>.</li>
    <li>A final guest count must be received no later than 2 days before the party.</li>${common}
    <li>You may pre-select wines, beers and spirits, or we can run a cash bar.</li>
    <li>Applicable sales tax and a 22% event gratuity will be added to your check(s).</li></ol>
    <p>Your signature indicates acceptance of the material contained herein and of the Bar Event Policies, and authorizes us to keep your card on file and charge it as described above.</p>`
}

/* ---------- Checking the party details (Step 3) ---------- */
export const freshForm = () => ({ name: '', email: '', phone: '', org: '', type: 'Birthday', guests: '', food: '', brunchAdd: false, platS: 0, platL: 0, bar: 'cash', barOpen: 'full', barLimited: '', barCap: '', barTickets: '', checks: '1', tv: false, notes: '' });
/* Step 2: the guest count for the chosen space. */
export function validateGuests(space, f) {
  const sp = SPACES[space], g = parseInt(f.guests, 10), errs = [];
  if (!sp) return ['Choose a space.'];
  if (!g || g < 1) errs.push('Enter the number of guests.');
  else {
    if (g < sp.minG) errs.push(`The ${sp.name} books parties of ${sp.minG} or more online. For 10 or fewer, please use our regular reservations.`);
    if (sp.maxG && g > sp.maxG) errs.push(`The ${sp.name} holds up to ${sp.maxG} guests.`);
  }
  return errs;
}
/* Step 3: food, platters and bar. */
export function validateFood(space, sel, f) {
  const sp = SPACES[space], g = parseInt(f.guests, 10), fi = foodInfo(f.food), errs = [];
  if (!sp) return ['Choose a space.'];
  if (!fi || fi.retired) errs.push('Choose a food option.');
  else if (fi.id.startsWith('set-l-') && !lunchMenusOK(sel.time)) errs.push('Lunch menus are for parties starting before 3:00 pm. Please choose a dinner menu or another option.');
  else if (g) {
    if (fi.id === 'menu' && menuBlocked(g)) errs.push('Parties of more than 25 choose a set menu or a buffet.');
    if (fi.buffet && g < 12) errs.push('Buffets and appetizer parties need at least 12 guests.');
    if (space === 'pdr' && fi.table && g > PDR_BUFFET_MAX && !(sp.maxG && g > sp.maxG)) errs.push(`With a buffet, the Private Dining Room holds up to ${PDR_BUFFET_MAX} guests to make room for the buffet setup. Lower your guest count to ${PDR_BUFFET_MAX} or fewer, or choose a set menu or Floating Apps.`);
  }
  if (fi && fi.brunch && sel.date) { const day = space === 'pdr' ? sel.block === 'lunch' : sel.time < 15 * 60; if (!(isSatSun(sel.date) && day)) errs.push('Brunch is only offered Saturdays and Sundays, 10 am–3 pm.') }
  if ((+f.platS || 0) < 0 || (+f.platS || 0) > 10 || (+f.platL || 0) < 0 || (+f.platL || 0) > 10) errs.push('Choose between 0 and 10 platters.');
  if (!BAROPTS.some(b => b.id === f.bar)) errs.push('Choose a bar option.');
  if (f.bar === 'open' && f.barOpen === 'limited' && !f.barLimited.trim()) errs.push('List which drinks the limited bar includes.');
  if (f.bar === 'cap' && !(+f.barCap > 0)) errs.push('Enter the bar spending limit.');
  if (f.bar === 'tickets' && !(+f.barTickets > 0)) errs.push('Enter how many drink tickets each guest gets.');
  return errs;
}
/* Step 4: contact details and how the bill is paid. */
export function validateContact(f) {
  const fi = foodInfo(f.food), errs = [];
  if (!f.name.trim()) errs.push('Enter the reservation name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.push('Enter a valid email address.');
  if (f.phone.replace(/\D/g, '').length < 10) errs.push('Enter a phone number with area code.');
  if (!['1', '2', '3'].includes(String(f.checks))) errs.push('Choose how many checks.');
  else if (fi && fi.oneCheck && String(f.checks) !== '1') errs.push('Buffet or appetizer parties pay all food on one check.');
  return errs;
}
/* Everything at once (the server checks this before saving a booking). */
export function validateDetails(space, sel, f) {
  if (!SPACES[space]) return ['Choose a space.'];
  return [...validateContact(f), ...validateGuests(space, f), ...validateFood(space, sel, f)];
}
export const sigMatches = (sig, name) => String(sig).trim().toLowerCase() === String(name).trim().toLowerCase() && !!String(name).trim();

/* ---------- Email wording ---------- */
const NO_CARD = 'not collected yet (the online card step is switched off). Please call the guest to put a card on file.';
export function inquiryEmail(b) {
  const e = estimate(b), sp = SPACES[b.space];
  return {
    s: `New inquiry: ${sp.name}, ${fmtShort(b.date)}`,
    b: `${b.name} (${b.email}, ${b.phone}) started a booking.\n\n${whenText(b)}\nGuests: ${b.guests} · ${b.type}\nFood: ${e.f ? e.f.name : '—'}\nBar: ${barText(b)}${e.priced ? `\nEstimated total: ${money(e.total)}` : ''}${b.notes ? '\n\nSpecial instructions: ' + b.notes : ''}\n\nIf they don't finish, you can follow up directly.`
  };
}
export function signedEmail(b, sig, at) {
  return {
    s: `Agreement signed: ${b.name}, ${fmtShort(b.date)}`,
    b: `${b.name} signed the ${SPACES[b.space].name} agreement as "${sig}" on ${fmtStamp(at)}.\n\n${whenText(b)}\nGuests: ${b.guests}\n\nNext: the guest submits the booking.`
  };
}
export function reqBody(b) {
  const e = estimate(b);
  const card = b.card ? `${b.card.brand} ending ${b.card.last4}, name on card ${b.card.holder} (held by the payment processor, not charged)` : NO_CARD;
  return `${b.name} ${b.status === 'confirmed' ? 'booked' : 'submitted a booking request'}${b.card ? ' and put a card on file' : ''}.${b.status === 'held' ? ' The space is on HOLD until you approve or decline.\nReason: ' + b.why : ''}\n\n${whenText(b)}\nGuests: ${b.guests} · ${b.type}${b.org ? '\nCompany: ' + b.org : ''}\nFood: ${e.f ? e.f.name : '—'}${b.brunchAdd ? ' + coffee/tea/OJ' : ''}${(+b.platS || +b.platL) ? `\nPlatters: ${+b.platS || 0} small, ${+b.platL || 0} large` : ''}\nBar: ${barText(b)}\nChecks: ${b.checks}${b.tv ? '\nTV with HDMI: yes ($75)' : ''}\n${e.priced ? `Estimated total: ${money(e.total)}\n` : ''}${e.pt ? `Food & beverage minimum: ${money0(e.pt.min)}\n` : ''}Cancellation: ${cancelText(b)}\n\nContact: ${b.email} · ${b.phone}${b.enteredBy ? `\nEntered by: ${b.enteredBy}` : ''}\nCard on file: ${card}${b.notes ? '\n\nSpecial instructions: ' + b.notes : ''}`;
}
export function managerAlert(b) {
  const sp = SPACES[b.space];
  if (b.status === 'held') return { s: `Needs approval: ${sp.name}, ${fmtShort(b.date)} — ${b.name}`, b: reqBody(b) };
  return { s: `Booked: ${b.name}, ${sp.name}, ${fmtShort(b.date)}`, b: reqBody(b) + '\n\nThis booking was confirmed automatically (first 2 Dining Room parties of the day).' };
}
export function approvedAlert(b, by) {
  return {
    s: `Booked: ${b.name}, ${SPACES[b.space].name}, ${fmtShort(b.date)}`,
    b: `${by ? by + ' approved' : 'You approved'} this booking. The guest has been emailed a confirmation.\n\n${whenText(b)}\n${b.guests} guests\nCard on file: ${b.card ? `${b.card.brand} ending ${b.card.last4}` : NO_CARD}`
  };
}
export function guestEmail(b, stage) { /* stage: received | confirmed | declined */
  const first = b.name.split(' ')[0];
  if (stage === 'declined') return { s: `About your request for ${fmtShort(b.date)}`, b: `Hi ${first},\n\nUnfortunately we can't host your party in the ${SPACES[b.space].name} on ${fmtLong(b.date)}. ${b.card ? 'Your card on file has been removed and was never charged.' : 'No card was taken.'}\n\nPlease reply or call us and we'll help find another date or space.\n\nBest regards,\n${GM}` };
  let out;
  if (b.space === 'pdr') {
    const pt = pdrTerms(b.date, b.block);
    const time = b.block === 'lunch' ? `from 11:00 am until ${b.ext ? '4:00 pm (if approved)' : '3:00 pm'}${b.time != null ? `, with your party starting at ${fmtT(b.time)}` : ''}` : `from ${fmtT(b.time)} until we close at ${fmtT(closeMin(b.date))}`;
    out = {
      s: stage === 'confirmed' ? `Confirmed: Private Dining Room on ${fmtShort(b.date)}` : `We received your Private Dining Room request for ${fmtShort(b.date)}`,
      b: `Hi ${first},\n\nThank you so much for thinking of us! ${stage === 'confirmed' ? `Your Private Dining Room booking for ${fmtLong(b.date)} is confirmed.` : `We received your Private Dining Room request for ${fmtLong(b.date)}. We'll confirm it shortly.`}\n\nThere are no fees other than the food and beverage minimum of ${money0(pt.min)}. This does not include the tax and gratuity. The credit card provided WILL NOT be charged at this time. It is to secure the room for you. You may cancel up to 72 hours before your event. If you cancel within 72 hours, the card will be charged the cancellation fee of ${money0(pt.fee)}. You will have the use of the room ${time}.\n\nYour final guest count is due 2 days before your event.\n\nPlease let me know what other questions you may have.\n\nBest regards,\n${GM}`
    };
  } else if (b.space === 'dr') {
    const fee = drFee(b.guests);
    out = {
      s: stage === 'confirmed' ? `Confirmed: Dining Room party on ${fmtShort(b.date)}` : `We received your Dining Room request for ${fmtShort(b.date)}`,
      b: `Hi ${first},\n\nThank you for considering us for your upcoming event. We look forward to helping you create an enjoyable, memorable, and stress-free occasion.\n\n${stage === 'confirmed' ? `Your Dining Room reservation for ${b.guests} guests on ${fmtLong(b.date)} at ${fmtT(b.time)} is confirmed.` : `We received your Dining Room request for ${b.guests} guests on ${fmtLong(b.date)} at ${fmtT(b.time)}. Our manager will confirm it shortly.`} A credit card is on file to hold the reservation, but your card will not be charged at the time of booking.\n\nPlease keep the following deadlines in mind:\n\n• Cancellation: You may cancel without a cancellation fee up to 12 hours before your event. Cancellations made within 12 hours are subject to the ${money0(fee)} cancellation fee. We will hold your table for 30 minutes past your reservation time; after that, it is considered a no-show and the cancellation fee applies.\n• Final guest count: Your final guest count is due two days before your event.\n\nFor buffet or appetizer parties, all food charges must be paid on one check.\n\nIf you have questions or would like help selecting the best menu for your group, I would be happy to assist.\n\nThank you again for considering us. We look forward to hosting your event!\n\nBest regards,\n${GM}`
    };
  } else {
    out = {
      s: stage === 'confirmed' ? `Confirmed: Bar seating on ${fmtShort(b.date)}` : `We received your Bar request for ${fmtShort(b.date)}`,
      b: `Dear ${b.name},\n\nThank you for considering us for your upcoming event. We are committed to ensuring that your event is enjoyable, memorable, and stress-free.\n\n${stage === 'confirmed' ? `Your Bar seating for ${b.guests} guests on ${fmtLong(b.date)} at ${fmtT(b.time)} is confirmed.` : `We received your Bar request for ${b.guests} guests on ${fmtLong(b.date)} at ${fmtT(b.time)}.`}\n\nPlease note:\n\n• The credit card provided will not be charged at this time. It is simply to secure your bar seating.\n• You will have 24 hours before your event to cancel without incurring any fees. If you choose to cancel within 24 hours, a cancellation fee of ${money0(barFee(b.guests))} will be charged to your card.\n• We will hold your table for 30 minutes past your reservation time; after that, it is considered a no-show and the cancellation fee applies.\n• A final guest count is required 2 days prior to your event date for preparation purposes.\n\nIf your event includes a buffet or appetizer-style service, please note that all food charges will be consolidated into a single bill.\n\nIf you have any questions or need further assistance, please don't hesitate to reach out. We're here to help make your event a success!\n\nBest regards,\n${GM}`
    };
  }
  if (!b.card) {
    out.b = out.b.replace('A credit card is on file to hold the reservation', 'A credit card is needed to hold the reservation');
    // Bookings a manager added by hand were arranged on the phone, so no "we'll call you" line.
    if (!b.manual && b.phone) out.b = out.b.replace(/\n\nBest regards,/, `\n\nA manager will call you at ${b.phone} to put a credit card on file to hold your space.\n\nBest regards,`);
  }
  return out;
}
