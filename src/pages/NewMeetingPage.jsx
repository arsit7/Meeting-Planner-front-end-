import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MeetingForm from '../components/MeetingForm.jsx';
import Alert from '../components/Alert.jsx';
import { createMeeting } from '../api/meetings.js';
import { getErrorMessage, getFieldErrors } from '../api/errors.js';

export default function NewMeetingPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const meeting = await createMeeting(payload);
      navigate(`/meetings/${meeting.id}`, { state: { flash: 'Meeting created.' } });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'Could not create the meeting'));
      setSubmitting(false);
    }
  };

  return (
    <section className="narrow">
      <h1>New meeting</h1>
      <Alert type="error">{error}</Alert>
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
