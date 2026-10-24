/** Participant list; remove buttons are shown only when the current user can edit. */
export default function ParticipantList({ participants, canEdit = false, onRemove, removingId = null }) {
  if (participants.length === 0) {
    return <p className="empty-state">No participants have been added yet.</p>;
  }
  return (
    <ul className="participant-list">
      {participants.map((p) => (
        <li key={p.id}>
          <div>
            <strong>{p.name}</strong>
            <span className="muted"> · {p.email}</span>
          </div>
          {canEdit && (
            <button
              type="button"
              className="btn btn-ghost btn-danger-text"
              onClick={() => onRemove(p)}
              disabled={removingId === p.id}
              aria-label={`Remove ${p.name}`}
            >
              {removingId === p.id ? 'Removing…' : 'Remove'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
