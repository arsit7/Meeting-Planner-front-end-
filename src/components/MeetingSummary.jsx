import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import { DateBlock } from './MeetingCard.jsx';
import { formatDuration, formatTimeValue, parseDateKey } from '../utils/dates.js';

const MAX_AVATARS = 5;

/**
 * Live preview beside the meeting form, with the submit and cancel buttons. `values` is the form's state;
 * pass `participants` only when the form collects them (create mode).
 */
export default function MeetingSummary({ values, durationMin, participants, submitLabel, submitting, onCancel }) {
  const date = values.date ? parseDateKey(values.date) : null;
  const endsOnAnotherDay = values.multiDay && values.endDate !== values.date;
  const invitees = participants?.filter((p) => p.name.trim() || p.email.trim());

  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
      <div className="card mb-0 overflow-hidden p-0">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" aria-hidden="true" />
        <div className="p-5">
          <p className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">Summary</p>
          <div className="flex items-start gap-3">
            {date ? <DateBlock iso={date.toISOString()} /> : <div className="date-block" aria-hidden="true" />}
            <div className="min-w-0">
              <p
                className={`m-0 font-semibold [overflow-wrap:anywhere] ${
                  values.title.trim() ? 'text-slate-900' : 'text-slate-400 italic'
                }`}
              >
                {values.title.trim() || 'Untitled meeting'}
              </p>
              {date && (
                <p className="m-0 mt-0.5 text-sm text-slate-500">
                  {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-4 mb-0 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
            <SummaryRow icon="clock" label="Time">
              {values.startTime && values.endTime
                ? `${formatTimeValue(values.startTime)} – ${formatTimeValue(values.endTime)}${
                    endsOnAnotherDay
                      ? ` (${parseDateKey(values.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`
                      : ''
                  }`
                : '—'}
            </SummaryRow>
            <SummaryRow icon="trend" label="Duration">
              {durationMin === null ? (
                '—'
              ) : durationMin > 0 ? (
                formatDuration(durationMin)
              ) : (
                <span className="text-red-600">End is before start</span>
              )}
            </SummaryRow>
            {invitees && (
              <SummaryRow icon="users" label="Invited">
                {invitees.length === 0 ? 'Just you so far' : <AvatarStack people={invitees} />}
              </SummaryRow>
            )}
          </dl>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 p-4">
          <button type="submit" className="btn btn-primary btn-block py-3" disabled={submitting} aria-busy={submitting}>
            {submitting && <span className="btn-spinner" aria-hidden="true" />}
            {submitting ? 'Saving…' : submitLabel}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-block" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-slate-500">
        <Icon name={icon} size={16} className="text-slate-400" />
        {label}
      </dt>
      <dd className="m-0 text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function AvatarStack({ people }) {
  return (
    <span className="flex -space-x-2">
      {people.slice(0, MAX_AVATARS).map((p) => (
        <span key={p.key} className="rounded-full ring-2 ring-white">
          <Avatar user={{ name: p.name.trim() || p.email.trim() }} size={26} />
        </span>
      ))}
      {people.length > MAX_AVATARS && (
        <span className="flex size-[26px] items-center justify-center rounded-full bg-slate-100 text-[0.65rem] font-bold text-slate-600 ring-2 ring-white">
          +{people.length - MAX_AVATARS}
        </span>
      )}
    </span>
  );
}
