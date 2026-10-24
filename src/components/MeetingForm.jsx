import { useEffect, useRef, useState } from 'react';
import FormField from './FormField.jsx';
import DatePicker from './DatePicker.jsx';
import TimePicker from './TimePicker.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import { DateBlock } from './MeetingCard.jsx';
import { validateMeeting } from '../utils/validation.js';
import {
  formatDuration,
  formatTimeValue,
  fromLocalInputValue,
  parseDateKey,
  toLocalInputValue,
} from '../utils/dates.js';
import { focusFirstInvalid } from '../utils/ui.js';

let nextRowKey = 0;
const NO_ERRORS = {};
const DESCRIPTION_MAX = 2000;
const MINUTE_MS = 60 * 1000;
const DEFAULT_DURATION_MIN = 60;
const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Splits a Date into the form's separate date ('YYYY-MM-DD') and time ('HH:MM') parts. */
function splitDateTime(date) {
  const [day, time] = toLocalInputValue(date.toISOString()).split('T');
  return { day, time };
}

/** Next half-hour slot from now, with a one-hour meeting after it. */
function defaultTimes() {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(Math.floor(start.getMinutes() / 30) * 30 + 30);
  return { start, end: new Date(start.getTime() + DEFAULT_DURATION_MIN * MINUTE_MS) };
}

function initialValues(meeting) {
  const { start, end } = meeting
    ? { start: new Date(meeting.startTime), end: new Date(meeting.endTime) }
    : defaultTimes();
  const s = splitDateTime(start);
  const e = splitDateTime(end);
  return {
    title: meeting?.title ?? '',
    description: meeting?.description ?? '',
    date: s.day,
    startTime: s.time,
    endTime: e.time,
    multiDay: e.day !== s.day,
    endDate: e.day,
  };
}

/** Builds local Date objects for the chosen start and end, or null where a part is missing. */
function resolveRange(v) {
  const endDay = v.multiDay ? v.endDate : v.date;
  return {
    start: v.date && v.startTime ? new Date(`${v.date}T${v.startTime}`) : null,
    end: endDay && v.endTime ? new Date(`${endDay}T${v.endTime}`) : null,
  };
}

/**
 * Create/edit form: details, date & time, and (in create mode) participants on the left, with a live
 * summary and the submit button on the right. When `withParticipants` is true the initial participant
 * list is saved together with the meeting in a single request.
 *
 * onSubmit receives the API payload and may throw; serverErrors maps field names to messages.
 */
export default function MeetingForm({
  initialMeeting,
  withParticipants = false,
  submitLabel = 'Save meeting',
  onSubmit,
  onCancel,
  serverErrors = NO_ERRORS,
  submitting = false,
}) {
  const formRef = useRef(null);
  const [values, setValues] = useState(() => initialValues(initialMeeting));
  const [participants, setParticipants] = useState([]);
  const [errors, setErrors] = useState({});
  // Server errors for fields the user has edited since they arrived are hidden.
  const [editedFields, setEditedFields] = useState({});

  useEffect(() => {
    setEditedFields({});
    if (Object.keys(serverErrors).length > 0) focusFirstInvalid(formRef.current);
  }, [serverErrors]);

  const visibleServerErrors = Object.fromEntries(
    Object.entries(serverErrors).filter(([field]) => !editedFields[field]),
  );
  const allErrors = { ...visibleServerErrors, ...errors };

  const clearErrors = (...fields) => {
    setErrors((errs) => ({ ...errs, ...Object.fromEntries(fields.map((f) => [f, undefined])) }));
    setEditedFields((edited) => ({ ...edited, ...Object.fromEntries(fields.map((f) => [f, true])) }));
  };

  const { start, end } = resolveRange(values);
  const durationMin = start && end ? Math.round((end - start) / MINUTE_MS) : null;

  /** Sets the end so the meeting lasts `minutes` from the current start, spilling into the next day if needed. */
  const applyEnd = (v, startDate, minutes) => {
    const e = splitDateTime(new Date(startDate.getTime() + minutes * MINUTE_MS));
    const multiDay = e.day !== v.date;
    return { ...v, endTime: e.time, multiDay, endDate: multiDay ? e.day : v.date };
  };

  // Moving the start keeps the meeting's length, like most calendar apps.
  const changeStart = (field) => (value) => {
    setValues((v) => {
      const next = { ...v, [field]: value };
      if (!next.multiDay) next.endDate = next.date;
      const newStart = resolveRange(next).start;
      return newStart && durationMin > 0 ? applyEnd(next, newStart, durationMin) : next;
    });
    clearErrors('date', 'startTime', 'endTime');
  };

  const setField = (field) => (e) => {
    const { value } = e.target;
    setValues((v) => ({ ...v, [field]: value }));
    clearErrors(field);
  };

  const setDuration = (minutes) => {
    if (!start) return;
    setValues((v) => applyEnd(v, start, minutes));
    clearErrors('endTime');
  };

  const toggleMultiDay = (e) => {
    const { checked } = e.target;
    setValues((v) => ({ ...v, multiDay: checked, endDate: v.date }));
    clearErrors('endTime');
  };

  const updateParticipant = (index, field, value) => {
    setParticipants((list) => list.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    clearErrors(`participants[${index}].${field}`);
  };

  const removeParticipant = (index) => {
    setParticipants((list) => list.filter((_, i) => i !== index));
    // Row indexes shift after a removal, so per-row errors no longer line up.
    setErrors((errs) => Object.fromEntries(Object.entries(errs).filter(([k]) => !k.startsWith('participants['))));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const endDay = values.multiDay ? values.endDate : values.date;
    const validation = validateMeeting(
      {
        title: values.title,
        description: values.description,
        start: values.date && values.startTime ? `${values.date}T${values.startTime}` : '',
        end: endDay && values.endTime ? `${endDay}T${values.endTime}` : '',
      },
      participants,
    );
    if (!values.date) validation.date = 'Date is required';
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      startTime: fromLocalInputValue(`${values.date}T${values.startTime}`),
      endTime: fromLocalInputValue(`${endDay}T${values.endTime}`),
    };
    if (withParticipants) {
      payload.participants = participants.map((p) => ({ name: p.name.trim(), email: p.email.trim() }));
    }
    onSubmit(payload);
  };

  const sameDayEnd = !values.multiDay || values.endDate === values.date;
  const filledParticipants = participants.filter((p) => p.name.trim() || p.email.trim());

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <Section icon="edit" title="Details" subtitle="Give the meeting a clear name and agenda.">
          <FormField
            label="Title"
            value={values.title}
            onChange={setField('title')}
            error={allErrors.title}
            maxLength={150}
            placeholder="e.g. Sprint planning"
            autoFocus={!initialMeeting}
          />
          <FormField
            label="Description (optional)"
            as="textarea"
            rows={5}
            value={values.description}
            onChange={setField('description')}
            error={allErrors.description}
            maxLength={DESCRIPTION_MAX}
            placeholder="Agenda, links, notes…"
            hint={`${values.description.length} / ${DESCRIPTION_MAX} characters`}
          />
        </Section>

        <Section icon="clock" title="Date & time" subtitle={`Times are in your time zone (${TIME_ZONE}).`}>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <DatePicker label="Date" value={values.date} onChange={changeStart('date')} error={allErrors.date} />
            <TimePicker
              label="Start time"
              value={values.startTime}
              onChange={changeStart('startTime')}
              error={allErrors.startTime}
            />
            <TimePicker
              label="End time"
              value={values.endTime}
              after={sameDayEnd ? values.startTime : undefined}
              onChange={(t) => {
                setValues((v) => ({ ...v, endTime: t }));
                clearErrors('endTime');
              }}
              error={allErrors.endTime}
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-slate-700">Duration</span>
            {DURATION_PRESETS.map((m) => {
              const selected = durationMin === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  disabled={!start}
                  aria-pressed={selected}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                  }`}
                >
                  {formatDuration(m)}
                </button>
              );
            })}
            {durationMin > 0 && !DURATION_PRESETS.includes(durationMin) && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {formatDuration(durationMin)}
              </span>
            )}
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 select-none">
            <input type="checkbox" className="peer sr-only" checked={values.multiDay} onChange={toggleMultiDay} />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-indigo-600 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
            Ends on a different day
          </label>
          {values.multiDay && (
            <div className="mt-4 animate-fade-in sm:w-1/3">
              <DatePicker
                label="End date"
                value={values.endDate}
                min={values.date}
                onChange={(d) => {
                  setValues((v) => ({ ...v, endDate: d }));
                  clearErrors('endTime');
                }}
              />
            </div>
          )}
        </Section>

        {withParticipants && (
          <Section
            icon="users"
            title="Participants"
            subtitle="Invite people now, or add them later from the meeting page."
          >
            {participants.length === 0 && (
              <p className="mb-4 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                No participants yet. You can also add them later.
              </p>
            )}
            {participants.map((p, i) => (
              <div className="grid animate-fade-in items-start gap-x-3 sm:grid-cols-[1fr_1fr_auto]" key={p.key}>
                <FormField
                  label={`Participant ${i + 1} name`}
                  value={p.name}
                  onChange={(e) => updateParticipant(i, 'name', e.target.value)}
                  error={allErrors[`participants[${i}].name`]}
                  autoFocus
                />
                <FormField
                  label={`Participant ${i + 1} email`}
                  type="email"
                  value={p.email}
                  onChange={(e) => updateParticipant(i, 'email', e.target.value)}
                  error={allErrors[`participants[${i}].email`]}
                />
                <button
                  type="button"
                  className="btn btn-danger-text mb-4 sm:mt-7 sm:mb-0"
                  onClick={() => removeParticipant(i)}
                  aria-label={`Remove participant ${i + 1}`}
                >
                  <Icon name="trash" size={16} />
                  <span className="sm:sr-only">Remove</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-transparent px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
              onClick={() => setParticipants((list) => [...list, { key: (nextRowKey += 1), name: '', email: '' }])}
            >
              <Icon name="plus" size={16} strokeWidth={2.4} />
              Add participant
            </button>
          </Section>
        )}
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
        <div className="card mb-0 overflow-hidden p-0">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" aria-hidden="true" />
          <div className="p-5">
            <p className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">Summary</p>
            <div className="flex items-start gap-3">
              {values.date ? (
                <DateBlock iso={parseDateKey(values.date).toISOString()} />
              ) : (
                <div className="date-block" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className={`m-0 font-semibold [overflow-wrap:anywhere] ${values.title.trim() ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {values.title.trim() || 'Untitled meeting'}
                </p>
                {values.date && (
                  <p className="m-0 mt-0.5 text-sm text-slate-500">
                    {parseDateKey(values.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <dl className="mt-4 mb-0 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
              <SummaryRow icon="clock" label="Time">
                {values.startTime && values.endTime
                  ? `${formatTimeValue(values.startTime)} – ${formatTimeValue(values.endTime)}${
                      values.multiDay && values.endDate !== values.date
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
              {withParticipants && (
                <SummaryRow icon="users" label="Invited">
                  {filledParticipants.length === 0 ? (
                    'Just you so far'
                  ) : (
                    <span className="flex -space-x-2">
                      {filledParticipants.slice(0, 5).map((p) => (
                        <span key={p.key} className="rounded-full ring-2 ring-white">
                          <Avatar user={{ name: p.name.trim() || p.email.trim() }} size={26} />
                        </span>
                      ))}
                      {filledParticipants.length > 5 && (
                        <span className="flex size-[26px] items-center justify-center rounded-full bg-slate-100 text-[0.65rem] font-bold text-slate-600 ring-2 ring-white">
                          +{filledParticipants.length - 5}
                        </span>
                      )}
                    </span>
                  )}
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
    </form>
  );
}

function Section({ icon, title, subtitle, children }) {
  return (
    <section className="card mb-0 p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <Icon name={icon} size={20} />
        </span>
        <div>
          <h2 className="text-base">{title}</h2>
          <p className="muted m-0 text-sm">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
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

