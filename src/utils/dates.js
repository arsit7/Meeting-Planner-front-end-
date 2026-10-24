const pad = (n) => String(n).padStart(2, '0');

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
