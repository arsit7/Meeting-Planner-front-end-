import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MeetingForm from '../components/MeetingForm.jsx';
import Alert from '../components/Alert.jsx';
import Icon from '../components/Icon.jsx';
import { createMeeting } from '../api/meetings.js';
import { getErrorMessage, getFieldErrors } from '../api/errors.js';
import { useDocumentTitle } from '../utils/ui.js';

export default function NewMeetingPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  useDocumentTitle('New meeting');

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const meeting = await createMeeting(payload);
      navigate(`/meetings/${meeting.id}`, { state: { flash: 'Meeting created.' } });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "We couldn't create the meeting."));
      setSubmitting(false);
    }
  };

  return (
    <section>
      <Link to="/meetings" className="back-link">
        <Icon name="arrowLeft" size={16} />
        All meetings
      </Link>
      <div className="page-header">
        <div>
          <h1>New meeting</h1>
          <p className="muted">Pick a time, add a description and invite people. You can change it later.</p>
        </div>
      </div>
      <Alert type="error" onDismiss={() => setError('')}>
        {error}
      </Alert>
      <MeetingForm
        withParticipants
        submitLabel="Create meeting"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/meetings')}
        serverErrors={fieldErrors}
        submitting={submitting}
      />
    </section>
  );
}
