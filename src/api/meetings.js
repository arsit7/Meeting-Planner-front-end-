import client from './client.js';

export async function listMeetings() {
  const { data } = await client.get('/meetings');
  return data;
}

export async function getMeeting(id) {
  const { data } = await client.get(`/meetings/${id}`);
  return data;
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
