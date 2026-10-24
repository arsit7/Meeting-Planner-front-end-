/** Human-readable message for an Axios error, using the backend's ApiError body when present. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'The server took too long to respond.'
      : 'Cannot reach the server. Is the backend running?';
  }
  return error.response.data?.message || fallback;
}

/** Field-level validation errors from a 400 response, e.g. { title: 'Title is required' }. */
export function getFieldErrors(error) {
  return error?.response?.data?.fieldErrors || {};
}
