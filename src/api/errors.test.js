import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors.js';

const httpError = (status, data = {}) => ({ response: { status, data } });

describe('getErrorMessage', () => {
  it('explains network failures and timeouts', () => {
    expect(getErrorMessage({ code: 'ERR_NETWORK' })).toMatch(/Cannot reach the server/);
    expect(getErrorMessage({ code: 'ECONNABORTED' })).toMatch(/taking too long/);
  });

  it('prefers the backend message for client errors', () => {
    expect(getErrorMessage(httpError(409, { message: 'Already a participant' }))).toBe('Already a participant');
  });

  it('falls back to a status-specific message, then the caller fallback', () => {
    expect(getErrorMessage(httpError(403))).toBe("You don't have permission to do that.");
    expect(getErrorMessage(httpError(418), 'We couldn’t save.')).toBe('We couldn’t save. Please try again.');
  });

  it('hides server error details', () => {
    const message = getErrorMessage(httpError(500, { message: 'NullPointerException at Foo.java:42' }), 'We couldn’t save.');
    expect(message).toBe('We couldn’t save. The server ran into a problem. Please try again in a moment.');
  });

  it('points to the highlighted fields when the response has field errors', () => {
    const error = httpError(400, { message: 'Validation failed', fieldErrors: { title: 'Title is required' } });
    expect(getErrorMessage(error)).toBe('Please fix the highlighted fields and try again.');
  });
});
