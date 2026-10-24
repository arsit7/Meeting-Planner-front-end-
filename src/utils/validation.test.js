import { describe, expect, it } from 'vitest';
import { isValidEmail, validateMeeting, validateParticipant, validateSignup } from './validation.js';
import { isTokenExpired } from '../auth/tokenStorage.js';

describe('validation', () => {
  it('recognises valid and invalid emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail(' a@b.co ')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('enforces signup password length and confirmation', () => {
    const errors = validateSignup({ name: 'A', email: 'a@b.co', password: 'short', confirmPassword: 'other' });
    expect(errors.password).toBe('Password must be at least 8 characters (3 more needed)');
    expect(errors.confirmPassword).toBe('Passwords do not match');

    const tooLong = validateSignup({ name: 'A', email: 'a@b.co', password: 'x'.repeat(73), confirmPassword: '' });
    expect(tooLong.password).toBe('Password must be at most 72 characters');
    expect(tooLong.confirmPassword).toBe('Please confirm your password');
  });

  it('validates participants', () => {
    expect(validateParticipant({ name: '', email: 'x' })).toEqual({
      name: 'Participant name is required',
      email: 'Participant email must be a valid email address',
    });
    expect(validateParticipant({ name: 'Bob', email: 'bob@example.com' })).toEqual({});
  });

  it('requires both times and an end after the start', () => {
    expect(validateMeeting({ title: 'T', start: '', end: '' })).toMatchObject({
      startTime: 'Start time is required',
      endTime: 'End time is required',
    });
    expect(validateMeeting({ title: 'T', start: '2026-01-01T10:00', end: '2026-01-01T09:00' }).endTime).toBe(
      'End time must be after start time',
    );
    expect(validateMeeting({ title: 'T', start: '2026-01-01T10:00', end: '2026-01-01T10:00' }).endTime).toBe(
      'End time must be after start time',
    );
  });

  it('accepts a valid meeting', () => {
    expect(validateMeeting({ title: 'T', description: '', start: '2026-01-01T09:00', end: '2026-01-01T09:30' })).toEqual(
      {},
    );
  });
});

describe('isTokenExpired', () => {
  const tokenWithExp = (exp) => `header.${btoa(JSON.stringify({ exp }))}.signature`;

  it('detects expired, valid and malformed tokens', () => {
    const now = 1_700_000_000_000;
    expect(isTokenExpired(tokenWithExp(now / 1000 - 1), now)).toBe(true);
    expect(isTokenExpired(tokenWithExp(now / 1000 + 600), now)).toBe(false);
    expect(isTokenExpired('garbage', now)).toBe(true);
    expect(isTokenExpired(null, now)).toBe(true);
  });
});
