/* Checks the manager's Add / Edit booking form. Shared by /api/manager/add and /api/manager/edit.
   Manager bookings skip the 48-hour notice and approval rules, but can't double-book the Private Dining Room. */
import { HttpError } from './server.js';
import * as R from '../public/js/rules.js';

const str = (v, max = 200) => String(v ?? '').slice(0, max).trim();

/* exceptId: when editing, ignore the booking being edited so it doesn't clash with itself. */
export async function checkManualBooking(DB, body, exceptId = null) {
  const space = str(body.space, 10), sp = R.SPACES[space];
  if (!sp) throw new HttpError(400, 'Choose a space.');
  const date = str(body.date, 10);
  if (!R.isDate(date)) throw new HttpError(400, 'Choose a date.');
  const diff = Math.round((R.parse(date) - R.parse(R.todayLocal())) / 864e5);
  if (diff < 0) throw new HttpError(400, 'That date has already passed.');
  if (diff > 730) throw new HttpError(400, 'Choose a date within the next two years.');

  const { results } = await DB.prepare(`SELECT id, space, date, block, time, ext, status FROM bookings WHERE date = ? AND status <> 'declined'`).bind(date).all();
  const A = R.makeAvail(results.filter(r => r.id !== exceptId).map(r => ({ ...r, ext: !!r.ext })));

  let block = null, time = null, ext = false;
  if (space === 'pdr') {
    block = ['lunch', 'dinner'].includes(body.block) ? body.block : null;
    if (!block) throw new HttpError(400, 'Choose lunch or dinner.');
    time = parseInt(body.time, 10);
    if (block === 'lunch') {
      ext = !!body.ext;
      if (!R.LUNCH_STARTS.includes(time)) throw new HttpError(400, 'Choose a lunch start time between 11:00 am and 2:00 pm.');
      if (A.pdrLunch(date)) throw new HttpError(409, 'The Private Dining Room is already booked for lunch that day.');
      if (ext && !A.extOK(date)) throw new HttpError(409, 'A dinner party starts before 4:00 pm that day, so lunch can’t run until 4.');
    } else {
      if (!A.dinnerStarts(date).some(x => x.m === time)) throw new HttpError(400, 'Choose a dinner start time between 3:00 and 8:00 pm.');
      if (A.pdrDinner(date)) throw new HttpError(409, 'The Private Dining Room is already booked for dinner that day.');
      const l = A.pdrLunch(date); if (l && l.ext && time < 16 * 60) throw new HttpError(409, 'Lunch that day runs until 4:00 pm, so dinner has to start at 4:00 or later.');
    }
  } else {
    time = parseInt(body.time, 10);
    if (!A.arrivalTimes(date).some(x => x.m === time)) throw new HttpError(400, 'Choose an arrival time.');
  }

  const manager = str(body.manager, 60);
  if (!manager) throw new HttpError(400, 'Enter your name in “Manager” so we know who to ask about this booking.');
  const name = str(body.name, 120), phone = str(body.phone, 40), email = str(body.email, 160);
  if (!name) throw new HttpError(400, 'Enter the reservation name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter the guest’s email address.');
  if (phone.replace(/\D/g, '').length < 10) throw new HttpError(400, 'Enter a phone number with area code.');
  const guests = parseInt(body.guests, 10);
  if (!(guests >= 1 && guests <= (sp.maxG || 200))) throw new HttpError(400, `Enter the number of guests${sp.maxG ? ` (up to ${sp.maxG})` : ''}.`);
  const food = str(body.food, 20);
  if (food && !R.foodInfo(food)) throw new HttpError(400, 'Choose a food option.');

  return {
    space, date, block, time, ext, name, phone, email, guests,
    details: { org: str(body.org, 160), type: R.EVENT_TYPES.includes(body.type) ? body.type : 'Other', food: food || 'menu', notes: str(body.notes, 2000) },
    manager, emailGuest: !!body.emailGuest
  };
}
