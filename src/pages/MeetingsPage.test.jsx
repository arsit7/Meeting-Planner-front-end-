import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MeetingsPage from './MeetingsPage.jsx';
import { renderWithAuth, testUser } from '../test/renderWithAuth.jsx';
import * as meetingsApi from '../api/meetings.js';

vi.mock('../api/meetings.js');

const HOUR = 3600_000;
const meeting = (id, title, offsetHours, owner, organizerName = 'Olivia Owner') => {
  const start = new Date(Date.now() + offsetHours * HOUR);
  return {
    id,
    title,
    startTime: start.toISOString(),
    endTime: new Date(start.getTime() + HOUR).toISOString(),
    owner,
    completed: offsetHours < 0,
    organizerName,
    participantCount: 2,
  };
};

const COUNTS = { all: 3, upcoming: 2, completed: 1, organized: 2, invited: 1 };
const pageOf = (content, { page = 0, size = 10, total = content.length, counts = COUNTS } = {}) => ({
  content,
  page,
  size,
  totalElements: total,
  totalPages: Math.ceil(total / size),
  counts,
});

const sprint = meeting(1, 'Sprint planning', 48, true);
const design = meeting(2, 'Design review', 72, false, 'Sam Smith');
const retro = meeting(3, 'Retro', -48, true);

function renderMeetings(route = '/meetings') {
  return renderWithAuth(<MeetingsPage />, { auth: { isAuthenticated: true, user: testUser }, route });
}

// The title is the heading's first child; status badges follow it.
const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.firstChild.textContent);
const lastRequest = () => meetingsApi.listMeetings.mock.lastCall[0];

describe('MeetingsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    meetingsApi.listMeetings.mockResolvedValue(pageOf([sprint, design, retro]));
  });

  it('asks the server for the first page and labels the tabs with its counts', async () => {
    renderMeetings();

    expect(await screen.findByRole('tab', { name: /All/, selected: true })).toBeInTheDocument();
    expect(meetingsApi.listMeetings).toHaveBeenCalledWith({ q: '', filter: 'all', page: 0, size: 10 });
    expect(titles()).toEqual(['Sprint planning', 'Design review', 'Retro']);
    expect(within(screen.getByRole('tab', { name: /Completed/ })).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByRole('tab', { name: /Organized by me/ })).getByText('2')).toBeInTheDocument();
  });

  it('sends the selected tab to the server, starting from the tab in the URL', async () => {
    meetingsApi.listMeetings.mockResolvedValue(pageOf([retro]));
    renderMeetings('/meetings?tab=completed&page=2');

    await screen.findByRole('tab', { name: /Completed/, selected: true });
    expect(lastRequest()).toEqual({ q: '', filter: 'completed', page: 1, size: 10 });

    meetingsApi.listMeetings.mockResolvedValue(pageOf([design]));
    await userEvent.click(screen.getByRole('tab', { name: /Invited/ }));

    await waitFor(() => expect(lastRequest()).toEqual({ q: '', filter: 'invited', page: 0, size: 10 }));
    expect(await screen.findByRole('heading', { name: 'Design review' })).toBeInTheDocument();
  });

  it('searches on the server once the user stops typing', async () => {
    renderMeetings();
    const search = await screen.findByRole('searchbox', { name: 'Search meetings' });
    meetingsApi.listMeetings.mockResolvedValue(pageOf([design], { counts: { ...COUNTS, all: 1 } }));

    await userEvent.type(search, 'sam');

    await waitFor(() => expect(lastRequest()).toEqual({ q: 'sam', filter: 'all', page: 0, size: 10 }));
    // One request for the finished text, not one per keystroke.
    expect(meetingsApi.listMeetings.mock.calls.map(([params]) => params.q)).toEqual(['', 'sam']);
    expect(await screen.findByRole('heading', { name: 'Design review' })).toBeInTheDocument();
  });

  it('pages through results', async () => {
    const many = Array.from({ length: 10 }, (_, i) => meeting(100 + i, `Meeting ${i + 1}`, 24 + i, true));
    meetingsApi.listMeetings.mockResolvedValue(pageOf(many, { total: 25 }));
    renderMeetings();

    const pager = await screen.findByRole('navigation', { name: 'Pagination' });
    expect(pager).toHaveTextContent('Showing 1–10 of 25');
    expect(within(pager).getByRole('button', { name: 'Previous page' })).toBeDisabled();

    meetingsApi.listMeetings.mockResolvedValue(pageOf(many, { page: 1, total: 25 }));
    await userEvent.click(within(pager).getByRole('button', { name: 'Page 2' }));

    await waitFor(() => expect(lastRequest()).toMatchObject({ page: 1 }));
    expect(await screen.findByText(/Showing/)).toHaveTextContent('Showing 11–20 of 25');
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Per page' }), '20');
    await waitFor(() => expect(lastRequest()).toEqual({ q: '', filter: 'all', page: 0, size: 20 }));
  });

  it('offers to clear filters when nothing matches', async () => {
    meetingsApi.listMeetings.mockResolvedValueOnce(pageOf([], { counts: { ...COUNTS, all: 0 } }));
    renderMeetings('/meetings?q=zzz');

    expect(await screen.findByRole('heading', { name: 'No matching meetings' })).toBeInTheDocument();
    expect(screen.getByText(/Nothing matches “zzz”/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(lastRequest()).toEqual({ q: '', filter: 'all', page: 0, size: 10 }));
    expect(screen.getByRole('searchbox', { name: 'Search meetings' })).toHaveValue('');
  });

  it('welcomes a user who has no meetings at all', async () => {
    meetingsApi.listMeetings.mockResolvedValue(pageOf([], { counts: { all: 0, upcoming: 0, completed: 0, organized: 0, invited: 0 } }));
    renderMeetings();

    expect(await screen.findByRole('heading', { name: 'No meetings yet' })).toBeInTheDocument();
  });
});
