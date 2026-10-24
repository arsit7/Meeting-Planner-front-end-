import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMeetingStats, listMeetings } from '../api/meetings.js';
import { getErrorMessage } from '../api/errors.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import MeetingCard from '../components/MeetingCard.jsx';
import MonthlyMeetingsChart from '../components/MonthlyMeetingsChart.jsx';
import { formatDateTime, isOngoing } from '../utils/dates.js';
import { toChartMonths } from '../utils/meetingStats.js';
import { useDocumentTitle, useFlash } from '../utils/ui.js';

const PREVIEW_COUNT = 3;
const CHART_MONTHS = 6;

const TONES = {
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  primary: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  warning: 'bg-orange-50 text-orange-600 ring-orange-100',
  info: 'bg-sky-50 text-sky-600 ring-sky-100',
};

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Landing page after login: headline numbers, a monthly chart, and the next and latest meetings. */
export default function DashboardPage() {
  const { user } = useAuth();
  const [flash, setFlash] = useFlash();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Dashboard');

  // Totals and the chart come from the stats endpoint; the two short lists are the first page of each tab.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stats, upcoming, completed] = await Promise.all([
        getMeetingStats({ months: CHART_MONTHS }),
        listMeetings({ filter: 'upcoming', size: PREVIEW_COUNT }),
        listMeetings({ filter: 'completed', size: PREVIEW_COUNT }),
      ]);
      setData({ stats, upcoming, completed });
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = data?.stats;
  const trend = stats ? stats.last30Days - stats.previous30Days : 0;
  const nextMeeting = data?.upcoming.content[0];

  return (
    <section>
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-200 sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-violet-400/30 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-indigo-100">
              {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
            </p>
            <h1 className="mt-1 text-2xl text-white sm:text-3xl">
              {greeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-2 text-indigo-100">
              {nextMeeting ? (
                <>
                  Next up:{' '}
                  <Link
                    to={`/meetings/${nextMeeting.id}`}
                    className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  >
                    {nextMeeting.title}
                  </Link>
                  {' · '}
                  {isOngoing(nextMeeting.startTime, nextMeeting.endTime)
                    ? 'happening now'
                    : formatDateTime(nextMeeting.startTime)}
                </>
              ) : (
                'Here’s an overview of your meetings.'
              )}
            </p>
          </div>
          <Link to="/meetings/new" className="btn btn-light">
            <Icon name="plus" size={18} strokeWidth={2.4} />
            New meeting
          </Link>
        </div>
      </div>

      <Alert type="success" onDismiss={() => setFlash('')}>
        {flash}
      </Alert>

      {loading && <Spinner label="Loading your dashboard…" />}

      {!loading && error && (
        <Alert type="error">
          {error}{' '}
          <button type="button" className="link-button" onClick={load}>
            Try again
          </button>
        </Alert>
      )}

      {!loading && !error && stats?.total === 0 && (
        <div className="card empty-card">
          <div className="empty-icon" aria-hidden="true">
            <Icon name="calendar" size={30} />
          </div>
          <h2>Welcome to Meeting Planner</h2>
          <p className="muted">
            Your dashboard fills up as you plan meetings. Create your first one, or ask a colleague to invite you.
          </p>
          <Link to="/meetings/new" className="btn btn-primary">
            Create your first meeting
          </Link>
        </div>
      )}

      {!loading && !error && stats?.total > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatTile
              to="/meetings?tab=completed"
              icon="check"
              tone="success"
              label="Completed"
              value={stats.completed}
              note="meetings finished"
            />
            <StatTile
              to="/meetings?tab=upcoming"
              icon="calendar"
              tone="primary"
              label="Upcoming"
              value={stats.upcoming}
              note="still to come"
            />
            <StatTile
              to="/meetings?tab=invited"
              icon="mail"
              tone="warning"
              label="Invited to"
              value={stats.invited}
              note={`${stats.organized} organized by you`}
            />
            <StatTile
              to="/meetings"
              icon="trend"
              tone="info"
              label="Last 30 days"
              value={stats.last30Days}
              note={
                trend === 0
                  ? 'same as the 30 days before'
                  : `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)} vs the 30 days before`
              }
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
            <div className="card mb-0 min-w-0 xl:col-span-3">
              <div className="mb-2">
                <h2>Meetings per month</h2>
                <p className="muted small">Last {CHART_MONTHS} months, by start date</p>
              </div>
              <MonthlyMeetingsChart data={toChartMonths(stats.months)} />
            </div>

            <div className="min-w-0 space-y-6 xl:col-span-2">
              <MeetingPreview
                title="Next up"
                viewAllTo="/meetings?tab=upcoming"
                page={data.upcoming}
                emptyText={
                  <>
                    Nothing scheduled. <Link to="/meetings/new">Plan a meeting</Link>
                  </>
                }
              />
              <MeetingPreview
                title="Recently completed"
                viewAllTo="/meetings?tab=completed"
                page={data.completed}
                emptyText="No completed meetings yet."
                past
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function StatTile({ to, icon, tone, label, value, note }) {
  return (
    <Link
      to={to}
      className="stat-tile group rounded-2xl border border-slate-200/80 bg-white p-4 text-inherit no-underline shadow-sm shadow-slate-200/50 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="stat-label text-sm font-medium text-slate-500">{label}</p>
        <span
          className={`flex size-10 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 ${TONES[tone]}`}
          aria-hidden="true"
        >
          <Icon name={icon} size={20} />
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </Link>
  );
}

/** `page` is the first page of a filter tab, so totalElements counts the whole tab, not just what's shown. */
function MeetingPreview({ title, viewAllTo, page, emptyText, past = false }) {
  const meetings = page.content;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="group-title mb-0">
          {title} <span className="count">{page.totalElements}</span>
        </h2>
        {page.totalElements > meetings.length && (
          <Link
            to={viewAllTo}
            className="group flex items-center gap-1 text-sm font-semibold no-underline hover:text-indigo-700"
          >
            View all
            <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {meetings.length === 0 ? (
        <p className="card muted mb-0">{emptyText}</p>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {meetings.map((m) => (
            <li key={m.id}>
              <MeetingCard meeting={m} past={past} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
