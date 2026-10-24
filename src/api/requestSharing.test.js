import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import client, { shareInFlight } from './client.js';
import { clearAvatarCache, getMe } from './users.js';
import { listMeetings } from './meetings.js';
import Avatar from '../components/Avatar.jsx';

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('shareInFlight', () => {
  it('runs one request for overlapping callers, then a fresh one after it settles', async () => {
    const pending = deferred();
    const request = vi.fn(() => pending.promise);

    const first = shareInFlight('key', request);
    const second = shareInFlight('key', request);
    expect(request).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);

    pending.resolve('done');
    await expect(first).resolves.toBe('done');

    shareInFlight('key', () => Promise.resolve('again'));
    expect(await shareInFlight('key', request)).toBe('again');
  });

  it('frees the key after a failure so callers can retry', async () => {
    await expect(shareInFlight('fails', () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(shareInFlight('fails', () => Promise.resolve('ok'))).resolves.toBe('ok');
  });
});

describe('API helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAvatarCache();
    URL.createObjectURL = vi.fn(() => 'blob:avatar');
    URL.revokeObjectURL = vi.fn();
  });

  it('sends one request when the same data is requested twice at once (e.g. StrictMode)', async () => {
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: {} });

    await Promise.all([listMeetings(), listMeetings(), getMe(), getMe()]);

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledWith('/meetings', { params: { q: '', filter: 'all', page: 0, size: 10 } });
    expect(get).toHaveBeenCalledWith('/users/me');
  });

  it('keeps requests for different pages or searches separate', async () => {
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: {} });

    await Promise.all([listMeetings({ page: 0 }), listMeetings({ page: 1 }), listMeetings({ q: 'sprint' })]);

    expect(get).toHaveBeenCalledTimes(3);
  });

  it('downloads an avatar once however many places show it, and again after logout', async () => {
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: new Blob(['img']) });
    const user = { name: 'Olivia Owner', avatarUrl: '/api/users/me/avatar?v=abc' };

    const { unmount } = render(
      createElement('div', null, createElement(Avatar, { user }), createElement(Avatar, { user, size: 96 })),
    );
    expect(await screen.findAllByRole('img')).toHaveLength(2);
    unmount();
    render(createElement(Avatar, { user }));
    await screen.findByRole('img');

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/users/me/avatar?v=abc', { responseType: 'blob' });

    clearAvatarCache();
    await Promise.resolve();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:avatar');
    render(createElement(Avatar, { user }));
    await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });
});
