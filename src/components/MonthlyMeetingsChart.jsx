import { useState } from 'react';

const SERIES = [
  { key: 'organized', label: 'Organized by you' },
  { key: 'invited', label: 'Invited to' },
];
const TICK_COUNT = 4;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Stacked column chart of meetings per month (organized vs invited), drawn with HTML so text stays
 * readable at any width. Hovering or focusing a month shows its numbers; a table view is available.
 */
export default function MonthlyMeetingsChart({ data }) {
  const [active, setActive] = useState(null);
  const totals = data.map((d) => d.organized + d.invited);
  const step = Math.max(1, Math.ceil(Math.max(0, ...totals) / TICK_COUNT));
  const yMax = step * TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * step);
  const activeMonth = active === null ? null : data[active];

  if (totals.every((t) => t === 0)) {
    return <p className="muted chart-empty">No meetings in the last {data.length} months yet.</p>;
  }

  return (
    <div className="chart">
      <ul className="chart-legend" aria-hidden="true">
        {SERIES.map((s) => (
          <li key={s.key}>
            <span className={`chart-swatch series-${s.key}`} />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="chart-plot">
        {ticks.map((t) => (
          <div key={t} className="chart-gridline" style={{ bottom: `${(t / yMax) * 100}%` }}>
            <span>{t}</span>
          </div>
        ))}

        <div className="chart-columns" role="list" aria-label="Meetings per month">
          {data.map((d, i) => {
            const total = totals[i];
            return (
              <div
                key={d.key}
                role="listitem"
                tabIndex={0}
                className={`chart-col ${active === i ? 'is-active' : ''}`}
                aria-label={`${d.fullLabel}: ${plural(total, 'meeting')}, ${d.organized} organized by you, ${d.invited} invited to`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {total > 0 && (
                  <div className="chart-stack" style={{ height: `${(total / yMax) * 100}%` }}>
                    <strong className="chart-total">{total}</strong>
                    {[...SERIES].reverse().map(
                      (s) =>
                        d[s.key] > 0 && (
                          <span key={s.key} className={`chart-seg series-${s.key}`} style={{ flexGrow: d[s.key] }} />
                        ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activeMonth && (
          <div
            className="chart-tooltip"
            // Clamped so the first and last months' tooltips don't spill off the card.
            style={{ left: `${Math.min(85, Math.max(15, ((active + 0.5) / data.length) * 100))}%` }}
            aria-hidden="true"
          >
            <strong>{activeMonth.fullLabel}</strong>
            {SERIES.map((s) => (
              <div key={s.key} className="chart-tooltip-row">
                <span className={`chart-swatch series-${s.key}`} />
                {s.label}
                <b>{activeMonth[s.key]}</b>
              </div>
            ))}
            <div className="chart-tooltip-row muted">
              People invited <b>{activeMonth.participants}</b>
            </div>
          </div>
        )}
      </div>

      <div className="chart-xlabels" aria-hidden="true">
        {data.map((d) => (
          <span key={d.key}>{d.label}</span>
        ))}
      </div>

      <details className="chart-table">
        <summary>Show as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Organized</th>
              <th scope="col">Invited to</th>
              <th scope="col">Total</th>
              <th scope="col">People invited</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.key}>
                <th scope="row">{d.fullLabel}</th>
                <td>{d.organized}</td>
                <td>{d.invited}</td>
                <td>{totals[i]}</td>
                <td>{d.participants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
