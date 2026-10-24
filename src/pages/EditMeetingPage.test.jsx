import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditMeetingPage from './EditMeetingPage.jsx';
import { renderWithAuth, testUser } from '../test/renderWithAuth.jsx';
import * as meetingsApi from '../api/meetings.js';

vi.mock('../api/meetings.js');

const HOUR = 3600_000;
const meeting = (overrides) => ({
  id: 7,
  title: 'Quarterly review',
  description: 'Discuss goals',
  startTime: new Date(Date.now() + 24 * HOUR).toISOString(),
  endTime: new Date(Date.now() + 25 * HOUR).toISOString(),
  organizer: { id: 1, name: 'Olivia Owner', email: 'olivia@example.com' },
  owner: true,
  completed: false,
  participants: [],
  ...overrides,
});

function renderEdit() {
  return renderWithAuth(
    <Routes>
      <Route path="/meetings/:id/edit" element={<EditMeetingPage />} />
      <Route path="/meetings/:id" element={<h1>Meeting details</h1>} />
    </Routes>,
    { auth: { isAuthenticated: true, user: testUser }, route: '/meetings/7/edit' },
  );
}

describe('EditMeetingPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows the form for an upcoming meeting', async () => {
    meetingsApi.getMeeting.mockResolvedValue(meeting());
    renderEdit();

    expect(await screen.findByRole('heading', { name: 'Edit meeting' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Quarterly review');
  });

  it('refuses to edit a completed meeting', async () => {
    meetingsApi.getMeeting.mockResolvedValue(
      meeting({ startTime: '2020-03-01T09:00:00Z', endTime: '2020-03-01T10:00:00Z', completed: true }),
    );
    renderEdit();

    expect(await screen.findByRole('heading', { name: 'This meeting can no longer be edited' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Back to meeting' }));
    expect(screen.getByRole('heading', { name: 'Meeting details' })).toBeInTheDocument();
  });

  it('switches to the locked view when saving fails because the meeting has ended', async () => {
    meetingsApi.getMeeting.mockResolvedValue(
      meeting({ startTime: new Date(Date.now() - HOUR).toISOString(), endTime: new Date(Date.now() + 200).toISOString() }),
    );
    meetingsApi.updateMeeting.mockRejectedValue({
      response: { status: 409, data: { message: 'This meeting has already ended, so it can no longer be changed' } },
    });
    renderEdit();
    await screen.findByRole('heading', { name: 'Edit meeting' });

    await new Promise((resolve) => setTimeout(resolve, 250));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { name: 'This meeting can no longer be edited' })).toBeInTheDocument();
  });
});
