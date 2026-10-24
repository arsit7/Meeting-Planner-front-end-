import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { addParticipant, deleteMeeting, getMeeting, removeParticipant } from '../api/meetings.js';
import { getErrorMessage } from '../api/errors.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import ParticipantList from '../components/ParticipantList.jsx';
import AddParticipantForm from '../components/AddParticipantForm.jsx';
import { formatTimeRange } from '../utils/dates.js';

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [flash, setFlash] = useState(location.state?.flash || '');
  const [removingId, setRemovingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMeeting(id)
      .then((m) => !cancelled && setMeeting(m))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load the meeting')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAdd = async (participant) => {
    setActionError('');
    const created = await addParticipant(id, participant);
    setMeeting((m) => ({ ...m, participants: [...m.participants, created] }));
    setFlash(`${created.name} was added.`);
  };

  const handleRemove = async (participant) => {
    if (!window.confirm(`Remove ${participant.name} from this meeting?`)) return;
    setActionError('');
    setRemovingId(participant.id);
    try {
      await removeParticipant(id, participant.id);
      setMeeting((m) => ({ ...m, participants: m.participants.filter((p) => p.id !== participant.id) }));
      setFlash(`${participant.name} was removed.`);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not remove participant'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this meeting? This cannot be undone.')) return;
    setDeleting(true);
    setActionError('');
    try {
      await deleteMeeting(id);
      navigate('/meetings', { replace: true, state: { flash: 'Meeting deleted.' } });
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete the meeting'));
      setDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading meeting…" />;
  if (error) {
    return (
      <section className="narrow">
        <Alert type="error">{error}</Alert>
        <Link to="/meetings">← Back to meetings</Link>
      </section>
    );
  }

  return (
    <section className="narrow">
      <Link to="/meetings" className="back-link">
        ← All meetings
      </Link>

      <div className="page-header">
        <div>
          <h1>{meeting.title}</h1>
          <p className="muted">{formatTimeRange(meeting.startTime, meeting.endTime)}</p>
        </div>
        {meeting.owner && (
          <div className="header-actions">
            <Link to={`/meetings/${id}/edit`} className="btn btn-secondary">
              Edit
            </Link>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <Alert type="success">{flash}</Alert>
      <Alert type="error">{actionError}</Alert>

      <div className="card">
        <dl className="details">
          <dt>Organizer</dt>
          <dd>
            {meeting.organizer.name} <span className="muted">({meeting.organizer.email})</span>
            {meeting.owner && <span className="badge badge-owner">You</span>}
          </dd>
          <dt>Description</dt>
          <dd className="description">{meeting.description || <span className="muted">No description</span>}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>
          Participants <span className="count">{meeting.participants.length}</span>
        </h2>
        <ParticipantList
          participants={meeting.participants}
          canEdit={meeting.owner}
          onRemove={handleRemove}
          removingId={removingId}
        />
        {meeting.owner ? (
          <>
            <h3 className="subheading">Add a participant</h3>
            <AddParticipantForm onAdd={handleAdd} />
          </>
        ) : (
          <p className="muted small">Only the organizer can change the participant list.</p>
        )}
      </div>
    </section>
  );
}
