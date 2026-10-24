import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { formatTimeRange, isOngoing, relativeDayLabel } from '../utils/dates.js';

/** Calendar-style month/day tile. */
export function DateBlock({ iso, tone = 'default' }) {
  const d = new Date(iso);
  return (
    <div className={`date-block tone-${tone}`} aria-hidden="true">
      <span className="date-block-month">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
      <span className="date-block-day">{d.getDate()}</span>
    </div>
  );
}

/** Clickable meeting summary used on the dashboard and the meetings list. */
export default function MeetingCard({ meeting: m, past = false }) {
  const ongoing = isOngoing(m.startTime, m.endTime);
  const dayLabel = !past && !ongoing && relativeDayLabel(m.startTime);
  return (
    <Link
      to={`/meetings/${m.id}`}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-white p-4 text-inherit no-underline shadow-sm shadow-slate-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100 ${
        ongoing ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200/80'
      } ${past ? 'opacity-80 hover:opacity-100' : ''}`}
    >
      {ongoing && <span className="absolute inset-y-0 left-0 w-1 bg-emerald-500" aria-hidden="true" />}
      <DateBlock iso={m.startTime} tone={ongoing ? 'live' : past ? 'past' : 'default'} />
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-center gap-y-1 text-[0.95rem] leading-snug group-hover:text-indigo-700">
          <span className="truncate">{m.title}</span>
          {ongoing && (
            <span className="badge badge-now">
              <span className="live-dot" aria-hidden="true" />
              Happening now
            </span>
          )}
          {dayLabel && <span className="badge badge-day">{dayLabel}</span>}
          {past && (
            <span className="badge badge-past">
              <Icon name="lock" size={11} strokeWidth={2.4} />
              Completed
            </span>
          )}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <Icon name="clock" size={15} className="shrink-0" />
          <span className="truncate">{formatTimeRange(m.startTime, m.endTime)}</span>
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
          <span className={`badge ml-0 ${m.owner ? 'badge-owner' : 'badge-invited'}`}>
            {m.owner ? 'Organizer' : `Invited by ${m.organizerName}`}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="users" size={15} />
            {m.participantCount} participant{m.participantCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <Icon
        name="chevronRight"
        size={18}
        className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-indigo-500"
      />
    </Link>
  );
}
