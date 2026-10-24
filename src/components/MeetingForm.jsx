import { useState } from 'react';
import FormField from './FormField.jsx';
import { validateMeeting } from '../utils/validation.js';
import { fromLocalInputValue, toLocalInputValue } from '../utils/dates.js';

let nextRowKey = 0;

/**
 * Create/edit form. When `withParticipants` is true (create mode) the user can add an initial
 * participant list that is saved together with the meeting in a single request.
 *
 * onSubmit receives the API payload and may throw; serverErrors maps field names to messages.
 */
export default function MeetingForm({
  initialMeeting,
  withParticipants = false,
  submitLabel = 'Save meeting',
  onSubmit,
  onCancel,
  serverErrors = {},
  submitting = false,
}) {
  const [values, setValues] = useState({
    title: initialMeeting?.title ?? '',
    description: initialMeeting?.description ?? '',
    start: toLocalInputValue(initialMeeting?.startTime),
    end: toLocalInputValue(initialMeeting?.endTime),
  });
  const [participants, setParticipants] = useState([]);
  const [errors, setErrors] = useState({});

  const allErrors = { ...serverErrors, ...errors };
  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const updateParticipant = (index, field, value) =>
    setParticipants((list) => list.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateMeeting(values, participants);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      startTime: fromLocalInputValue(values.start),
      endTime: fromLocalInputValue(values.end),
    };
    if (withParticipants) {
      payload.participants = participants.map((p) => ({ name: p.name.trim(), email: p.email.trim() }));
    }
    onSubmit(payload);
  };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <FormField
        label="Title"
        value={values.title}
        onChange={set('title')}
        error={allErrors.title}
        maxLength={150}
        placeholder="e.g. Sprint planning"
      />
      <FormField
        label="Description (optional)"
        as="textarea"
        rows={4}
        value={values.description}
        onChange={set('description')}
        error={allErrors.description}
        maxLength={2000}
        placeholder="Agenda, links, notes…"
      />
      <div className="field-row">
        <FormField
          label="Start time"
          type="datetime-local"
          value={values.start}
          onChange={set('start')}
          error={allErrors.startTime}
        />
        <FormField
          label="End time"
          type="datetime-local"
          value={values.end}
          onChange={set('end')}
          error={allErrors.endTime}
        />
      </div>

      {withParticipants && (
        <fieldset className="participants-fieldset">
          <legend>Participants</legend>
          {participants.length === 0 && <p className="muted">No participants yet. You can also add them later.</p>}
          {participants.map((p, i) => (
            <div className="participant-row" key={p.key}>
              <FormField
                label={`Participant ${i + 1} name`}
                value={p.name}
                onChange={(e) => updateParticipant(i, 'name', e.target.value)}
                error={allErrors[`participants[${i}].name`]}
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
                className="btn btn-ghost btn-danger-text"
                onClick={() => setParticipants((list) => list.filter((_, idx) => idx !== i))}
                aria-label={`Remove participant ${i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setParticipants((list) => [...list, { key: (nextRowKey += 1), name: '', email: '' }])
            }
          >
            + Add participant
          </button>
        </fieldset>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
