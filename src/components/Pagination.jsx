import Icon from './Icon.jsx';

const PAGE_SIZES = [10, 20, 50];

/** Page numbers to show around the current one, with null marking a gap: [1, null, 4, 5, 6, null, 12]. */
export function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}

/**
 * Pager for server-side lists. `page` is 1-based. Shows the visible range ("11–20 of 57"),
 * previous/next, page numbers and a page-size picker.
 */
export default function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange, disabled }) {
  if (totalElements === 0) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, totalElements);
  const button =
    'flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-xl border px-2.5 text-sm font-semibold tabular-nums transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row"
    >
      <p className="m-0 text-sm text-slate-500" aria-live="polite">
        Showing <strong className="text-slate-900">{from}</strong>–<strong className="text-slate-900">{to}</strong> of{' '}
        <strong className="text-slate-900">{totalElements}</strong>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={`${button} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1 text-slate-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${button} ${
                p === page
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
              }`}
              onClick={() => onPageChange(p)}
              disabled={disabled}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={`${button} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
        >
          <Icon name="arrowRight" size={16} />
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-500">
        Per page
        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          disabled={disabled}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
