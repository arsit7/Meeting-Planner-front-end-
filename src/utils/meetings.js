import { useEffect, useState } from 'react';
import { getMeeting } from '../api/meetings.js';
import { getErrorMessage } from '../api/errors.js';
import { isPast } from './dates.js';

/**
 * Loads one meeting for a page. `setMeeting` lets the page apply local changes (e.g. an added participant)
 * without reloading. Responses for a previous `id` are ignored.
 */
export function useMeeting(id) {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getMeeting(id)
      .then((m) => !cancelled && setMeeting(m))
      .catch((err) => !cancelled && setError(getErrorMessage(err, "We couldn't load this meeting.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { meeting, setMeeting, loading, error };
}

/**
 * Completed meetings are read-only (the API enforces this). Trusts the server's flag, and also checks the
 * end time in case the meeting ended while the page was open.
 */
export function isMeetingLocked(meeting) {
  return Boolean(meeting.completed) || isPast(meeting.endTime);
}

/**
 * True when the API refused a change because the meeting has ended (409), as opposed to another conflict
 * such as a duplicate participant.
 */
export function isMeetingEndedError(err, meeting) {
  return err?.response?.status === 409 && isPast(meeting.endTime);
}
