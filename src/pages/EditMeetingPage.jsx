import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MeetingForm from '../components/MeetingForm.jsx';
import Alert from '../components/Alert.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import { getMeeting, updateMeeting } from '../api/meetings.js';
import { getErrorMessage, getFieldErrors } from '../api/errors.js';
import { formatDateTime, isPast } from '../utils/dates.js';
import { useDocumentTitle } from '../utils/ui.js';

export default function EditMeetingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  useDocumentTitle(meeting ? `Edit ${meeting.title}` : 'Edit meeting');

  useEffect(() => {
    let cancelled = false;
    getMeeting(id)
      .then((m) => !cancelled && setMeeting(m))
      .catch((err) => !cancelled && setLoadError(getErrorMessage(err, "We couldn't load this meeting.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      await updateMeeting(id, payload);
      navigate(`/meetings/${id}`, { state: { flash: 'Your changes were saved.' } });
    } catch (err) {
      // The meeting ended while the form was open: the API refuses the change, so show the locked view.
      if (err?.response?.status === 409 && isPast(meeting.endTime)) {
        setMeeting((m) => ({ ...m, completed: true }));
      }
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "We couldn't save your changes."));
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading meeting…" />;
  if (loadError) {
    return (
      <section className="mx-auto max-w-3xl">
        <Alert type="error">{loadError}</Alert>
        <Link to="/meetings" className="back-link">
          <Icon name="arrowLeft" size={16} />
          Back to meetings
        </Link>
      </section>
    );
  }
  if (!meeting.owner) {
    return (
      <section className="mx-auto max-w-3xl">
        <Alert type="info">
          Only the organizer ({meeting.organizer.name}) can edit this meeting. Contact them if something needs
          to change.
        </Alert>
        <Link to={`/meetings/${id}`} className="back-link">
          <Icon name="arrowLeft" size={16} />
          Back to meeting
        </Link>
      </section>
    );
  }
  if (meeting.completed || isPast(meeting.endTime)) {
    return (
      <section className="mx-auto max-w-xl">
        <div className="card empty-card">
          <div className="empty-icon bg-slate-100 text-slate-500" aria-hidden="true">
            <Icon name="lock" size={28} />
          </div>
          <h1 className="text-xl">This meeting can no longer be edited</h1>
          <p className="muted">
            “{meeting.title}” ended {formatDateTime(meeting.endTime)}. Completed meetings are kept as a record, so
            their details and participants can’t be changed.
          </p>
          <Link to={`/meetings/${id}`} className="btn btn-primary">
            <Icon name="arrowLeft" size={16} />
            Back to meeting
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <Link to={`/meetings/${id}`} className="back-link">
        <Icon name="arrowLeft" size={16} />
        Back to meeting
      </Link>
      <div className="page-header">
        <div>
          <h1>Edit meeting</h1>
          <p className="muted [overflow-wrap:anywhere]">{meeting.title}</p>
        </div>
      </div>
      <Alert type="error" onDismiss={() => setError('')}>
        {error}
      </Alert>
      <MeetingForm
        initialMeeting={meeting}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/meetings/${id}`)}
        serverErrors={fieldErrors}
        submitting={submitting}
      />
    </section>
  );
}
