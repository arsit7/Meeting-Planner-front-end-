import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listMeetings } from '../api/meetings.js';
import { getErrorMessage } from '../api/errors.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { formatTimeRange, isPast } from '../utils/dates.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMeetings(await listMeetings());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load meetings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = meetings.filter((m) => !isPast(m.endTime));
  const past = meetings.filter((m) => isPast(m.endTime));

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Hi, {user?.name?.split(' ')[0]}</h1>
          <p className="muted">Meetings you organize or are invited to.</p>
        </div>
        <Link to="/meetings/new" className="btn btn-primary">
          + New meeting
        </Link>
      </div>

      <Alert type="success">{location.state?.flash}</Alert>

      {loading && <Spinner label="Loading meetings…" />}

      {!loading && error && (
        <Alert type="error">
          {error}{' '}
          <button type="button" className="link-button" onClick={load}>
            Retry
          </button>
        </Alert>
      )}

      {!loading && !error && meetings.length === 0 && (
        <div className="card empty-card">
          <h2>No meetings yet</h2>
          <p className="muted">Create your first meeting and invite participants.</p>
          <Link to="/meetings/new" className="btn btn-primary">
            Create a meeting
          </Link>
        </div>
      )}

      {!loading && !error && meetings.length > 0 && (
        <>
          <MeetingGroup title="Upcoming" meetings={upcoming} emptyText="No upcoming meetings." />
          {past.length > 0 && <MeetingGroup title="Past" meetings={past} muted />}
        </>
      )}
    </section>
  );
}

function MeetingGroup({ title, meetings, emptyText, muted = false }) {
  return (
    <div className="meeting-group">
      <h2 className="group-title">{title}</h2>
      {meetings.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <ul className={`meeting-list ${muted ? 'is-past' : ''}`}>
          {meetings.map((m) => (
            <li key={m.id}>
              <Link to={`/meetings/${m.id}`} className="card meeting-card">
                <div className="meeting-card-main">
                  <h3>{m.title}</h3>
                  <p className="muted">{formatTimeRange(m.startTime, m.endTime)}</p>
                </div>
                <div className="meeting-card-meta">
                  <span className={`badge ${m.owner ? 'badge-owner' : 'badge-invited'}`}>
                    {m.owner ? 'Organizer' : `Invited by ${m.organizerName}`}
                  </span>
                  <span className="muted">
                    {m.participantCount} participant{m.participantCount === 1 ? '' : 's'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
