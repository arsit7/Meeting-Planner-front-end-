import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MeetingForm from '../components/MeetingForm.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { getMeeting, updateMeeting } from '../api/meetings.js';
import { getErrorMessage, getFieldErrors } from '../api/errors.js';

export default function EditMeetingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMeeting(id)
      .then((m) => !cancelled && setMeeting(m))
      .catch((err) => !cancelled && setLoadError(getErrorMessage(err, 'Could not load the meeting')))
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
      navigate(`/meetings/${id}`, { state: { flash: 'Meeting updated.' } });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'Could not save changes'));
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading meeting…" />;
  if (loadError) {
    return (
      <section className="narrow">
        <Alert type="error">{loadError}</Alert>
        <Link to="/meetings">← Back to meetings</Link>
      </section>
    );
  }
  if (!meeting.owner) {
    return (
      <section className="narrow">
        <Alert type="error">Only the organizer can edit this meeting.</Alert>
        <Link to={`/meetings/${id}`}>← Back to meeting</Link>
      </section>
    );
  }

  return (
    <section className="narrow">
      <h1>Edit meeting</h1>
      <Alert type="error">{error}</Alert>
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
