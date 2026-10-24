import { describe, expect, it } from 'vitest';
import { isMeetingEndedError, isMeetingLocked } from './meetings.js';

const HOUR = 3600_000;
const ended = { completed: false, endTime: new Date(Date.now() - HOUR).toISOString() };
const upcoming = { completed: false, endTime: new Date(Date.now() + HOUR).toISOString() };
const conflict = { response: { status: 409, data: {} } };

describe('isMeetingLocked', () => {
  it('trusts the server flag and also locks once the end time has passed', () => {
    expect(isMeetingLocked({ ...upcoming, completed: true })).toBe(true);
    expect(isMeetingLocked(ended)).toBe(true);
    expect(isMeetingLocked(upcoming)).toBe(false);
  });
});

describe('isMeetingEndedError', () => {
  it('recognises a 409 for a meeting that has ended', () => {
    expect(isMeetingEndedError(conflict, ended)).toBe(true);
  });

  it('ignores other conflicts, such as a duplicate participant on an upcoming meeting', () => {
    expect(isMeetingEndedError(conflict, upcoming)).toBe(false);
    expect(isMeetingEndedError({ response: { status: 400 } }, ended)).toBe(false);
    expect(isMeetingEndedError({ code: 'ERR_NETWORK' }, ended)).toBe(false);
  });
});
