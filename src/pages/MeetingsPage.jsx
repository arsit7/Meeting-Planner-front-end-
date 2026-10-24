import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listMeetings } from '../api/meetings.js';
import { getErrorMessage } from '../api/errors.js';
import Alert from '../components/Alert.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import MeetingCard from '../components/MeetingCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { useDocumentTitle, useFlash } from '../utils/ui.js';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'organized', label: 'Organized by me' },
  { id: 'invited', label: 'Invited' },
];
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 300;

const positiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * Meetings the user organizes or is invited to. Search, filter tabs and pagination all run on the server;
 * the tab, search text, page and page size live in the URL so links and refreshes keep them.
 */
export default function MeetingsPage() {
  const [flash, setFlash] = useFlash();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);
  useDocumentTitle('Meetings');

  const tab = TABS.find((t) => t.id === searchParams.get('tab')) ?? TABS[0];
  const query = searchParams.get('q') ?? '';
  const page = positiveInt(searchParams.get('page'), 1);
  const size = positiveInt(searchParams.get('size'), DEFAULT_PAGE_SIZE);
  const [searchText, setSearchText] = useState(query);

  const updateParams = useCallback(
    (changes) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) =>
            value === '' || value === null || value === undefined ? next.delete(key) : next.set(key, value),
          );
          return next;
        },
        { replace: true, state: {} },
      );
    },
    [setSearchParams],
  );

  // Send the search to the server once the user pauses typing, starting again from page 1.
  useEffect(() => {
    if (searchText.trim() === query.trim()) return undefined;
    const timer = setTimeout(() => updateParams({ q: searchText.trim(), page: '' }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText, query, updateParams]);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const result = await listMeetings({ q: query, filter: tab.id, page: page - 1, size });
      // Ignore responses that arrive after a newer search or page change.
      if (requestId === latestRequest.current) setData(result);
    } catch (err) {
      if (requestId === latestRequest.current) setError(getErrorMessage(err, "We couldn't load your meetings."));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [query, tab.id, page, size]);

  useEffect(() => {
    load();
  }, [load]);

  // A page past the end (e.g. after deleting the last meeting on it) falls back to the last page.
  useEffect(() => {
    if (data && data.content.length === 0 && data.totalPages > 0 && page > data.totalPages) {
      updateParams({ page: data.totalPages === 1 ? '' : data.totalPages });
    }
  }, [data, page, updateParams]);

  const clearFilters = () => {
    setSearchText('');
    updateParams({ tab: '', q: '', page: '' });
  };

  const counts = data?.counts;
  const hasNoMeetingsAtAll = counts && counts.all === 0 && !query;
  const meetings = data?.content ?? [];
  const upcoming = meetings.filter((m) => !m.completed);
  const completed = meetings.filter((m) => m.completed);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Meetings</h1>
          <p className="muted">Everything you organize or are invited to.</p>
        </div>
        <Link to="/meetings/new" className="btn btn-primary sm:hidden">
          <Icon name="plus" size={18} strokeWidth={2.4} />
          New meeting
        </Link>
      </div>

      <Alert type="success" onDismiss={() => setFlash('')}>
        {flash}
      </Alert>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Filter meetings"
        >
          {TABS.map((t) => {
            const selected = t.id === tab.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => updateParams({ tab: t.id === 'all' ? '' : t.id, page: '' })}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border-0 px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                  selected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t.label}
                {counts && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                      selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <label className="relative block lg:w-80">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
          />
          <span className="sr-only">Search meetings</span>
          <input
            type="search"
            placeholder="Search by title or organizer…"
            value={searchText}
            maxLength={100}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pr-10 pl-10 text-sm shadow-sm transition outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
          />
          {loading && data && (
            <span className="spinner absolute top-1/2 right-3.5 size-4 -translate-y-1/2 border-2" aria-hidden="true" />
          )}
        </label>
      </div>

      {loading && !data && <Spinner label="Loading meetings…" />}

      {!loading && error && (
        <Alert type="error">
          {error}{' '}
          <button type="button" className="link-button" onClick={load}>
            Try again
          </button>
        </Alert>
      )}

      {data && !error && hasNoMeetingsAtAll && (
        <div className="card empty-card">
          <div className="empty-icon" aria-hidden="true">
            <Icon name="calendar" size={30} />
          </div>
          <h2>No meetings yet</h2>
          <p className="muted">Create your first meeting and invite participants. Meetings you're invited to will show up here too.</p>
          <Link to="/meetings/new" className="btn btn-primary">
            Create a meeting
          </Link>
        </div>
      )}

      {data && !error && !hasNoMeetingsAtAll && meetings.length === 0 && !loading && (
        <div className="card empty-card">
          <div className="empty-icon" aria-hidden="true">
            <Icon name="search" size={30} />
          </div>
          <h2>No matching meetings</h2>
          <p className="muted">
            {query ? `Nothing matches “${query}”` : `You have no ${tab.label.toLowerCase()} meetings`}
            {tab.id !== 'all' && ' in this tab'}.
          </p>
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {data && !error && meetings.length > 0 && (
        <div className={`transition-opacity duration-150 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {upcoming.length > 0 && <MeetingGroup title="Upcoming" meetings={upcoming} />}
          {completed.length > 0 && <MeetingGroup title="Completed" meetings={completed} past />}
          <Pagination
            page={page}
            size={data.size}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            disabled={loading}
            onPageChange={(p) => {
              updateParams({ page: p === 1 ? '' : p });
              window.scrollTo?.({ top: 0, behavior: 'smooth' });
            }}
            onSizeChange={(s) => updateParams({ size: s === DEFAULT_PAGE_SIZE ? '' : s, page: '' })}
          />
        </div>
      )}
    </section>
  );
}

function MeetingGroup({ title, meetings, past = false }) {
  return (
    <div className="mb-8 last-of-type:mb-0">
      <h2 className="group-title">{title}</h2>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 lg:grid-cols-2">
        {meetings.map((m) => (
          <li key={m.id} className="min-w-0">
            <MeetingCard meeting={m} past={past} />
          </li>
        ))}
      </ul>
    </div>
  );
}
