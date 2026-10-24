import client, { shareInFlight } from './client.js';

/**
 * One page of meetings, searched and filtered by the server.
 * Resolves to { content, page, size, totalElements, totalPages, counts: { all, upcoming, completed, organized, invited } }.
 * `page` is zero-based; `filter` is all | upcoming | completed | organized | invited.
 */
export function listMeetings({ q = '', filter = 'all', page = 0, size = 10 } = {}) {
  const params = { q, filter, page, size };
  return shareInFlight(
    `GET /meetings?${new URLSearchParams(params)}`,
    async () => (await client.get('/meetings', { params })).data,
  );
}

/** Dashboard totals and meetings per month, bucketed in the user's own time zone. */
export function getMeetingStats({ months = 6, zone = Intl.DateTimeFormat().resolvedOptions().timeZone } = {}) {
  const params = { months, zone };
  return shareInFlight(
    `GET /meetings/stats?${new URLSearchParams(params)}`,
    async () => (await client.get('/meetings/stats', { params })).data,
  );
}

export function getMeeting(id) {
  return shareInFlight(`GET /meetings/${id}`, async () => (await client.get(`/meetings/${id}`)).data);
}

export async function createMeeting(payload) {
  const { data } = await client.post('/meetings', payload);
  return data;
}

export async function updateMeeting(id, payload) {
  const { data } = await client.put(`/meetings/${id}`, payload);
  return data;
}

export async function deleteMeeting(id) {
  await client.delete(`/meetings/${id}`);
}

export async function addParticipant(meetingId, participant) {
  const { data } = await client.post(`/meetings/${meetingId}/participants`, participant);
  return data;
}

export async function removeParticipant(meetingId, participantId) {
  await client.delete(`/meetings/${meetingId}/participants/${participantId}`);
}
