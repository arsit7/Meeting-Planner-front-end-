import client from './client.js';

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

export async function signup(name, email, password) {
  const { data } = await client.post('/auth/signup', { name, email, password });
  return data;
}
