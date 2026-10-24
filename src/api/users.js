import client, { shareInFlight } from './client.js';

export function getMe() {
  return shareInFlight('GET /users/me', async () => (await client.get('/users/me')).data);
}

export async function uploadAvatar(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await client.post('/users/me/avatar', form);
  return data;
}

// avatarUrl -> Promise<object URL>. Every <Avatar> showing the same picture shares one download for the
// session, instead of each copy (sidebar, top bar, menu) fetching it on every page.
const avatarCache = new Map();

/**
 * Object URL for an avatar. Avatars require the bearer token, so they are fetched as a blob rather than
 * via <img src>. The URL carries a version (?v=…) that changes on upload, so a new picture is a new entry.
 */
export function getAvatarObjectUrl(avatarUrl) {
  if (!avatarCache.has(avatarUrl)) {
    const path = avatarUrl.replace(/^\/api/, '');
    const promise = client.get(path, { responseType: 'blob' }).then(({ data }) => URL.createObjectURL(data));
    // Don't cache failures, so a later render can retry.
    promise.catch(() => avatarCache.delete(avatarUrl));
    avatarCache.set(avatarUrl, promise);
  }
  return avatarCache.get(avatarUrl);
}

/** Frees cached avatar images; called on logout so the next user starts clean. */
export function clearAvatarCache() {
  avatarCache.forEach((promise) => promise.then(URL.revokeObjectURL, () => {}));
  avatarCache.clear();
}
