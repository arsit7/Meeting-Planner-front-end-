import client from './client.js';

export async function getMe() {
  const { data } = await client.get('/users/me');
  return data;
}

export async function uploadAvatar(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await client.post('/users/me/avatar', form);
  return data;
}

/** Avatars require the bearer token, so they are fetched as a blob rather than via <img src>. */
export async function fetchAvatarBlob(avatarUrl) {
  const path = avatarUrl.replace(/^\/api/, '');
  const { data } = await client.get(path, { responseType: 'blob' });
  return data;
}
