import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage.jsx';
import { renderWithAuth, testUser } from '../test/renderWithAuth.jsx';
import * as meetingsApi from '../api/meetings.js';

vi.mock('../api/meetings.js');

const HOUR = 3600_000;
const NOW = new Date(2026, 9, 25, 14, 0);

const meeting = (id, title, start, owner, participantCount = 2) => ({
  id,
  title,
  startTime: start.toISOString(),
  endTime: new Date(start.getTime() + HOUR).toISOString(),
  owner,
  completed: start < NOW,
  organizerName: owner ? 'Olivia Owner' : 'Sam Smith',
  participantCount,
});

const sprint = meeting(1, 'Sprint planning', new Date(2026, 9, 27, 10), true, 4);
const design = meeting(2, 'Design review', new Date(2026, 9, 20, 10), false, 3);
const retro = meeting(3, 'Retro', new Date(2026, 8, 30, 10), true, 5);

const STATS = {
  total: 3,
  upcoming: 1,
  completed: 2,
  organized: 2,
  invited: 1,
  last30Days: 2,
  previous30Days: 1,
  months: [
    { month: '2026-05', organized: 0, invited: 0, participants: 0 },
    { month: '2026-06', organized: 0, invited: 0, participants: 0 },
    { month: '2026-07', organized: 0, invited: 0, participants: 0 },
    { month: '2026-08', organized: 0, invited: 0, participants: 0 },
    { month: '2026-09', organized: 1, invited: 0, participants: 5 },
    { month: '2026-10', organized: 1, invited: 1, participants: 7 },
  ],
};
const pageOf = (content, total = content.length) => ({
  content,
  page: 0,
  size: 3,
  totalElements: total,
  totalPages: Math.ceil(total / 3),
  counts: {},
});

function mockApi(stats = STATS) {
  meetingsApi.getMeetingStats.mockResolvedValue(stats);
  meetingsApi.listMeetings.mockImplementation(async ({ filter }) =>
    filter === 'upcoming' ? pageOf([sprint]) : pageOf([design, retro]),
  );
}

function renderDashboard() {
  return renderWithAuth(<DashboardPage />, { auth: { isAuthenticated: true, user: testUser } });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const tile = (label) => screen.getByText(label, { selector: '.stat-label' }).closest('.stat-tile');

  it('loads totals from the stats API and the previews as small pages', async () => {
    mockApi();
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Good afternoon, Olivia' })).toBeInTheDocument();
    expect(meetingsApi.getMeetingStats).toHaveBeenCalledWith({ months: 6 });
    expect(meetingsApi.listMeetings).toHaveBeenCalledWith({ filter: 'upcoming', size: 3 });
    expect(meetingsApi.listMeetings).toHaveBeenCalledWith({ filter: 'completed', size: 3 });

    expect(within(tile('Completed')).getByText('2')).toBeInTheDocument();
    expect(within(tile('Upcoming')).getByText('1')).toBeInTheDocument();
    expect(within(tile('Invited to')).getByText('2 organized by you')).toBeInTheDocument();
    expect(within(tile('Last 30 days')).getByText('2')).toBeInTheDocument();
    expect(within(tile('Last 30 days')).getByText('▲ 1 vs the 30 days before')).toBeInTheDocument();

    expect(screen.getByRole('listitem', { name: /^October 2026/ })).toHaveAccessibleName(
      'October 2026: 2 meetings, 1 organized by you, 1 invited to',
    );

    // Linked from the "Next up" banner and from its card.
    expect(screen.getByRole('link', { name: 'Sprint planning' })).toHaveAttribute('href', '/meetings/1');
    expect(screen.getAllByRole('link', { name: /Sprint planning/ })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /^Completed/ })).toHaveAttribute('href', '/meetings?tab=completed');
    expect(screen.getByRole('link', { name: /Design review/ })).toHaveAttribute('href', '/meetings/2');
  });

  it('links to the full list when a preview has more meetings than it shows', async () => {
    mockApi();
    meetingsApi.listMeetings.mockImplementation(async ({ filter }) =>
      filter === 'upcoming' ? pageOf([sprint]) : pageOf([design, retro], 8),
    );
    renderDashboard();

    await screen.findByText('Recently completed');
    const viewAll = screen.getAllByRole('link', { name: 'View all' });
    expect(viewAll).toHaveLength(1);
    expect(viewAll[0]).toHaveAttribute('href', '/meetings?tab=completed');
  });

  it('shows month details when a column is hovered', async () => {
    mockApi();
    renderDashboard();

    const september = await screen.findByRole('listitem', { name: /^September 2026/ });
    await userEvent.hover(september);

    const tooltip = document.querySelector('.chart-tooltip');
    expect(tooltip).toHaveTextContent('September 2026');
    expect(tooltip).toHaveTextContent('Organized by you1');
    expect(tooltip).toHaveTextContent('People invited 5');

    await userEvent.unhover(september);
    expect(document.querySelector('.chart-tooltip')).not.toBeInTheDocument();
  });

  it('welcomes a user with no meetings', async () => {
    mockApi({ ...STATS, total: 0, upcoming: 0, completed: 0, organized: 0, invited: 0 });
    meetingsApi.listMeetings.mockResolvedValue(pageOf([]));
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Welcome to Meeting Planner' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create your first meeting' })).toHaveAttribute('href', '/meetings/new');
  });

  it('offers a retry when loading fails', async () => {
    mockApi();
    meetingsApi.getMeetingStats.mockRejectedValueOnce({ code: 'ERR_NETWORK' });
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Meetings per month')).toBeInTheDocument();
  });
});
