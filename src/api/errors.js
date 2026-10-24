// Shown when the backend gives no message of its own for a 4xx status.
const STATUS_MESSAGES = {
  401: 'Incorrect email or password.',
  403: "You don't have permission to do that.",
  404: "We couldn't find that. It may have been deleted.",
  409: 'That conflicts with existing data. Refresh the page and try again.',
  413: 'That file is too large to upload.',
  429: 'Too many attempts. Please wait a moment and try again.',
};

/**
 * Human-readable message for an Axios error. `fallback` describes what failed (a full sentence, e.g.
 * "We couldn't load your meetings.") and is used when the backend's ApiError body has no message.
 */
export function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'The server is taking too long to respond. Please try again in a moment.'
      : 'Cannot reach the server. Check your internet connection and try again.';
  }
  const { status, data } = error.response;
  // Server-side failures may carry internal details, so never show their text to the user.
  if (status >= 500) return `${fallback} The server ran into a problem. Please try again in a moment.`;
  if (Object.keys(getFieldErrors(error)).length > 0) return 'Please fix the highlighted fields and try again.';
  return data?.message || STATUS_MESSAGES[status] || `${fallback} Please try again.`;
}

/** Field-level validation errors from a 400 response, e.g. { title: 'Title is required' }. */
export function getFieldErrors(error) {
  return error?.response?.data?.fieldErrors || {};
}
