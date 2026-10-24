import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addParticipant, deleteMeeting, getMeeting, removeParticipant } from '../api/meetings.js';
import { getErrorMessage } from '../api/errors.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ParticipantList from '../components/ParticipantList.jsx';
import AddParticipantForm from '../components/AddParticipantForm.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import { DateBlock } from '../components/MeetingCard.jsx';
import { formatDateTime, formatTimeRange, isOngoing, isPast } from '../utils/dates.js';
import { useDocumentTitle, useFlash } from '../utils/ui.js';

// setTimeout can't wait longer than ~24.8 days; meetings further out are locked by the render-time check.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [flash, setFlash] = useFlash();
  const [removingId, setRemovingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // { type: 'remove', participant } or { type: 'delete' } while the confirm dialog is open.
  const [pendingAction, setPendingAction] = useState(null);
  useDocumentTitle(meeting?.title ?? 'Meeting');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMeeting(id)
      .then((m) => !cancelled && setMeeting(m))
      .catch((err) => !cancelled && setError(getErrorMessage(err, "We couldn't load this meeting.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Lock the page the moment the meeting ends, even if it stays open.
  const endTime = meeting?.endTime;
  const alreadyCompleted = meeting?.completed;
  useEffect(() => {
    if (!endTime || alreadyCompleted) return undefined;
    const msUntilEnd = new Date(endTime).getTime() - Date.now();
    if (msUntilEnd > MAX_TIMEOUT_MS) return undefined;
    const timer = setTimeout(() => setMeeting((m) => ({ ...m, completed: true })), Math.max(msUntilEnd, 0));
    return () => clearTimeout(timer);
  }, [endTime, alreadyCompleted]);

  // The API refuses changes to a meeting that has ended (409); reflect that if it happened mid-visit.
  const lockIfEnded = (err) => {
    if (err?.response?.status === 409 && isPast(meeting.endTime)) {
      setMeeting((m) => ({ ...m, completed: true }));
    }
  };

  const handleAdd = async (participant) => {
    setActionError('');
    try {
      const created = await addParticipant(id, participant);
      setMeeting((m) => ({ ...m, participants: [...m.participants, created] }));
      setFlash(`${created.name} was added.`);
    } catch (err) {
      lockIfEnded(err);
      throw err;
    }
  };

  const handleRemove = async (participant) => {
    setActionError('');
    setRemovingId(participant.id);
    try {
      await removeParticipant(id, participant.id);
      setMeeting((m) => ({ ...m, participants: m.participants.filter((p) => p.id !== participant.id) }));
      setFlash(`${participant.name} was removed.`);
    } catch (err) {
      lockIfEnded(err);
      setActionError(getErrorMessage(err, `We couldn't remove ${participant.name}.`));
    } finally {
      setRemovingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setActionError('');
    try {
      await deleteMeeting(id);
      navigate('/meetings', { replace: true, state: { flash: `“${meeting.title}” was deleted.` } });
    } catch (err) {
      setActionError(getErrorMessage(err, "We couldn't delete this meeting."));
      setDeleting(false);
    }
  };

  const confirmPending = () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action.type === 'remove') handleRemove(action.participant);
    else handleDelete();
  };

  if (loading) return <Spinner label="Loading meeting…" />;
  if (error) {
    return (
      <section className="mx-auto max-w-3xl">
        <Alert type="error">{error}</Alert>
        <Link to="/meetings" className="back-link">
          <Icon name="arrowLeft" size={16} />
          Back to meetings
        </Link>
      </section>
    );
  }

  const ongoing = isOngoing(meeting.startTime, meeting.endTime);
  // Trust the server's flag, but also lock on the local clock in case the page has been open a while.
  const past = meeting.completed || isPast(meeting.endTime);
  const canChange = meeting.owner && !past;

  return (
    <section>
      <Link to="/meetings" className="back-link">
        <Icon name="arrowLeft" size={16} />
        All meetings
      </Link>

      <div
        className={`card relative flex flex-col gap-5 overflow-hidden sm:flex-row sm:items-start ${
          ongoing ? 'border-emerald-200 ring-1 ring-emerald-100' : ''
        }`}
      >
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            ongoing ? 'bg-emerald-500' : past ? 'bg-slate-300' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
          }`}
          aria-hidden="true"
        />
        <DateBlock iso={meeting.startTime} tone={ongoing ? 'live' : past ? 'past' : 'default'} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2 [&>.badge]:ml-0">
            {ongoing && (
              <span className="badge badge-now">
                <span className="live-dot" aria-hidden="true" />
                Happening now
              </span>
            )}
            {past && (
              <span className="badge badge-past">
                <Icon name="lock" size={12} strokeWidth={2.4} />
                Completed
              </span>
            )}
            {!ongoing && !past && <span className="badge badge-day">Upcoming</span>}
            <span className={`badge ${meeting.owner ? 'badge-owner' : 'badge-invited'}`}>
              {meeting.owner ? 'You organize this' : 'You’re invited'}
            </span>
          </div>
          <h1 className="[overflow-wrap:anywhere]">{meeting.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Icon name="clock" size={16} className="text-slate-400" />
              {formatTimeRange(meeting.startTime, meeting.endTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="users" size={16} className="text-slate-400" />
              {meeting.participants.length} participant{meeting.participants.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        {meeting.owner && (
          <div className="flex shrink-0 gap-2">
            {canChange && (
              <Link to={`/meetings/${id}/edit`} className="btn btn-secondary">
                <Icon name="edit" size={16} />
                Edit
              </Link>
            )}
            <button
              type="button"
              className="btn btn-danger-soft"
              onClick={() => setPendingAction({ type: 'delete' })}
              disabled={deleting}
            >
              <Icon name="trash" size={16} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {past && (
        <div
          role="status"
          className="mb-4 flex animate-fade-in items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100/70 p-4 text-sm text-slate-600"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
            <Icon name="lock" size={18} />
          </span>
          <p className="m-0">
            <strong className="block text-slate-800">This meeting is complete</strong>
            It ended {formatDateTime(meeting.endTime)}, so its details and participants can no longer be changed.
            {meeting.owner && ' You can still delete it.'}
          </p>
        </div>
      )}

      <Alert type="success" onDismiss={() => setFlash('')}>
        {flash}
      </Alert>
      <Alert type="error" onDismiss={() => setActionError('')}>
        {actionError}
      </Alert>

      <div className="grid items-start gap-4 lg:grid-cols-5">
      <div className="card mb-0 lg:col-span-2">
        <h2 className="mb-2">About</h2>
        <p className="leading-relaxed whitespace-pre-wrap text-slate-600 [overflow-wrap:anywhere]">
          {meeting.description || <span className="muted italic">No description</span>}
        </p>
        <h3 className="mt-5 mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">Organizer</h3>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <Avatar user={meeting.organizer} size={40} />
          <div className="min-w-0">
            <strong className="text-sm text-slate-900">{meeting.organizer.name}</strong>
            {meeting.owner && <span className="badge badge-owner">You</span>}
            <span className="block truncate text-xs text-slate-500">{meeting.organizer.email}</span>
          </div>
        </div>
      </div>

      <div className="card mb-0 lg:col-span-3">
        <h2 className="mb-3 flex items-center gap-2">
          Participants <span className="count">{meeting.participants.length}</span>
        </h2>
        <ParticipantList
          participants={meeting.participants}
          canEdit={canChange}
          onRemove={(participant) => setPendingAction({ type: 'remove', participant })}
          removingId={removingId}
        />
        {canChange ? (
          <>
            <h3 className="mt-6 mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">Add a participant</h3>
            <AddParticipantForm onAdd={handleAdd} participantCount={meeting.participants.length} />
          </>
        ) : (
          <p className="mt-4 mb-0 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            {past ? (
              <>
                <Icon name="lock" size={15} className="shrink-0" />
                The participant list is final because the meeting has ended.
              </>
            ) : (
              'Only the organizer can change the participant list.'
            )}
          </p>
        )}
      </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        danger
        title={pendingAction?.type === 'delete' ? 'Delete this meeting?' : `Remove ${pendingAction?.participant?.name}?`}
        message={
          pendingAction?.type === 'delete'
            ? `“${meeting.title}” and its participant list will be permanently deleted. This can't be undone.`
            : `${pendingAction?.participant?.name} (${pendingAction?.participant?.email}) will be removed from this meeting.`
        }
        confirmLabel={pendingAction?.type === 'delete' ? 'Delete meeting' : 'Remove'}
        onConfirm={confirmPending}
        onCancel={() => setPendingAction(null)}
      />
    </section>
  );
}
