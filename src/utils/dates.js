const pad = (n) => String(n).padStart(2, '0');

/** Local calendar date -> 'YYYY-MM-DD'. */
export function toDateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' -> Date at local midnight. */
export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 'HH:MM' -> minutes after midnight. */
export function minutesOf(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes after midnight -> 'HH:MM'. */
export function timeOf(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** 'HH:MM' -> locale time, e.g. "9:30 AM". */
export function formatTimeValue(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** 90 -> "1 hr 30 min", 1500 -> "1 day 1 hr". */
export function formatDuration(minutes) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return [days && `${days} day${days === 1 ? '' : 's'}`, hours && `${hours} hr`, mins && `${mins} min`]
    .filter(Boolean)
    .join(' ') || '0 min';
}

/** ISO instant -> value for <input type="datetime-local"> in the user's local time zone. */
export function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) -> ISO-8601 UTC instant for the API. */
export function fromLocalInputValue(value) {
  return value ? new Date(value).toISOString() : null;
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const endText = sameDay
    ? end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : formatDateTime(endIso);
  return `${formatDateTime(startIso)} – ${endText}`;
}

export function isPast(iso, now = Date.now()) {
  return new Date(iso).getTime() < now;
}

export function isOngoing(startIso, endIso, now = Date.now()) {
  return new Date(startIso).getTime() <= now && now < new Date(endIso).getTime();
}

/** 'Today' or 'Tomorrow' for meetings starting soon, otherwise null. */
export function relativeDayLabel(iso, now = new Date()) {
  const day = new Date(iso);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (day.toDateString() === now.toDateString()) return 'Today';
  if (day.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return null;
}
