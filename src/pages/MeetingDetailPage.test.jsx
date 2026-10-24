import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MeetingDetailPage from './MeetingDetailPage.jsx';
import { renderWithAuth, testUser } from '../test/renderWithAuth.jsx';
import * as meetingsApi from '../api/meetings.js';

vi.mock('../api/meetings.js');

const baseMeeting = {
  id: 7,
  title: 'Quarterly review',
  description: 'Discuss Q4 goals',
  startTime: '2026-11-01T09:00:00Z',
  endTime: '2026-11-01T10:00:00Z',
  organizer: { id: 1, name: 'Olivia Owner', email: 'olivia@example.com' },
  owner: true,
  participants: [
    { id: 11, name: 'Bob Builder', email: 'bob@example.com' },
    { id: 12, name: 'Carol Chen', email: 'carol@example.com' },
  ],
};

function renderDetail() {
  return renderWithAuth(
    <Routes>
      <Route path="/meetings/:id" element={<MeetingDetailPage />} />
    </Routes>,
    { auth: { isAuthenticated: true, user: testUser }, route: '/meetings/7' },
  );
}

describe('MeetingDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders meeting details and participants for the organizer', async () => {
    meetingsApi.getMeeting.mockResolvedValue(baseMeeting);
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Quarterly review' })).toBeInTheDocument();
    expect(meetingsApi.getMeeting).toHaveBeenCalledWith('7');
    expect(screen.getByText('Discuss Q4 goals')).toBeInTheDocument();

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Bob Builder')).toBeInTheDocument();
    expect(within(list).getByText(/carol@example.com/)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Remove Bob Builder' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('is read-only for an invited participant', async () => {
    meetingsApi.getMeeting.mockResolvedValue({ ...baseMeeting, owner: false });
    renderDetail();

    await screen.findByRole('heading', { name: 'Quarterly review' });
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add participant' })).not.toBeInTheDocument();
    expect(screen.getByText(/Only the organizer can change/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no participants', async () => {
    meetingsApi.getMeeting.mockResolvedValue({ ...baseMeeting, participants: [] });
    renderDetail();

    expect(await screen.findByText('No participants have been added yet.')).toBeInTheDocument();
  });

  it('adds a participant and shows it in the list', async () => {
    meetingsApi.getMeeting.mockResolvedValue(baseMeeting);
    meetingsApi.addParticipant.mockResolvedValue({ id: 13, name: 'Dana', email: 'dana@example.com' });
    renderDetail();
    await screen.findByRole('heading', { name: 'Quarterly review' });

    await userEvent.type(screen.getByLabelText('Name'), 'Dana');
    await userEvent.type(screen.getByLabelText('Email'), 'dana@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add participant' }));

    expect(meetingsApi.addParticipant).toHaveBeenCalledWith('7', { name: 'Dana', email: 'dana@example.com' });
    expect(await screen.findByText('Dana')).toBeInTheDocument();
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows the server message when adding a duplicate participant', async () => {
    meetingsApi.getMeeting.mockResolvedValue(baseMeeting);
    meetingsApi.addParticipant.mockRejectedValue({
      response: { status: 409, data: { message: 'This person is already a participant' } },
    });
    renderDetail();
    await screen.findByRole('heading', { name: 'Quarterly review' });

    await userEvent.type(screen.getByLabelText('Name'), 'Bob');
    await userEvent.type(screen.getByLabelText('Email'), 'bob@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add participant' }));

    expect(await screen.findByText('This person is already a participant')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Email'), 'x');
    expect(screen.queryByText('This person is already a participant')).not.toBeInTheDocument();
  });

  it('clears a stale add-participant error when the list changes', async () => {
    meetingsApi.getMeeting.mockResolvedValue(baseMeeting);
    meetingsApi.addParticipant.mockRejectedValue({
      response: { status: 409, data: { message: 'This person is already a participant' } },
    });
    meetingsApi.removeParticipant.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderDetail();
    await screen.findByRole('heading', { name: 'Quarterly review' });

    await userEvent.type(screen.getByLabelText('Name'), 'Bob');
    await userEvent.type(screen.getByLabelText('Email'), 'bob@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add participant' }));
    await screen.findByText('This person is already a participant');

    await userEvent.click(screen.getByRole('button', { name: 'Remove Bob Builder' }));

    expect(await screen.findByText('Bob Builder was removed.')).toBeInTheDocument();
    expect(screen.queryByText('This person is already a participant')).not.toBeInTheDocument();
  });

  it('shows an error when the meeting cannot be loaded', async () => {
    meetingsApi.getMeeting.mockRejectedValue({ response: { status: 404, data: { message: 'Meeting not found' } } });
    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent('Meeting not found');
  });
});
