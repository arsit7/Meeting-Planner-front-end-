import axios from 'axios';
import { getToken } from '../auth/tokenStorage.js';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

let unauthorizedHandler = null;
const inFlight = new Map();

/**
 * Runs `request` once for callers that ask for the same `key` while it is still loading, e.g. React
 * StrictMode running an effect twice in development, or two components mounting together. Once it
 * settles, the next call makes a fresh request.
 */
export function shareInFlight(key, request) {
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      request().finally(() => inFlight.delete(key)),
    );
  }
  return inFlight.get(key);
}

/** Registered by AuthProvider so an expired/invalid token anywhere logs the user out. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export default client;
