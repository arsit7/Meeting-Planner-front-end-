import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

/** Participant list; remove buttons are shown only when the current user can edit. */
export default function ParticipantList({ participants, canEdit = false, onRemove, removingId = null }) {
  if (participants.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        No participants have been added yet.
      </p>
    );
  }
  return (
    <ul className="m-0 list-none divide-y divide-slate-100 p-0">
      {participants.map((p) => (
        <li
          key={p.id}
          className={`group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50 ${
            removingId === p.id ? 'opacity-50' : ''
          }`}
        >
          <Avatar user={p} size={36} />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm text-slate-900">{p.name}</strong>
            <span className="block truncate text-xs text-slate-500"> {p.email}</span>
          </div>
          {canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-danger-text opacity-70 group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onRemove(p)}
              disabled={removingId === p.id}
              aria-label={`Remove ${p.name}`}
            >
              <Icon name="trash" size={15} />
              <span className="hidden sm:inline">{removingId === p.id ? 'Removing…' : 'Remove'}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
