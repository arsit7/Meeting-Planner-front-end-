import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { parseDateKey, toDateKey } from '../utils/dates.js';
import { useDismiss } from '../utils/ui.js';

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const sameDay = (a, b) => a && b && toDateKey(a) === toDateKey(b);

// 4 Jan 2026 is a Sunday; the grid starts weeks on Sunday.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 4 + i).toLocaleDateString(undefined, { weekday: 'short' }),
);
const KEY_STEPS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/**
 * Calendar date field. `value` and `min` are 'YYYY-MM-DD' strings. Arrow keys move between days,
 * Enter picks, Escape closes and returns focus to the field.
 */
export default function DatePicker({ label, value, onChange, error, min }) {
  const id = useId();
  const errorId = `${id}-error`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const gridRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = value ? parseDateKey(value) : null;
  const minDate = min ? parseDateKey(min) : null;
  const today = new Date();
  const [focused, setFocused] = useState(selected ?? today);
  const [viewMonth, setViewMonth] = useState(firstOfMonth(selected ?? today));

  const isDisabled = (date) => minDate !== null && date < minDate;

  const close = ({ viaEscape } = { viaEscape: true }) => {
    setOpen(false);
    if (viaEscape) triggerRef.current?.focus();
  };
  useDismiss(rootRef, open, close);

  const openPicker = () => {
    const start = selected ?? (minDate && today < minDate ? minDate : today);
    setFocused(start);
    setViewMonth(firstOfMonth(start));
    setOpen(true);
  };

  // Keep keyboard focus on the focused day as it moves (roving tabindex).
  useEffect(() => {
    if (open) gridRef.current?.querySelector(`[data-date="${toDateKey(focused)}"]`)?.focus();
  }, [open, focused]);

  const moveFocus = (date) => {
    setFocused(date);
    setViewMonth(firstOfMonth(date));
  };

  const pick = (date) => {
    if (isDisabled(date)) return;
    onChange(toDateKey(date));
    close();
  };

  const handleGridKey = (e) => {
    if (e.key in KEY_STEPS) {
      e.preventDefault();
      moveFocus(addDays(focused, KEY_STEPS[e.key]));
    }
  };

  const gridStart = addDays(viewMonth, -viewMonth.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const shiftMonth = (n) => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + n, 1));

  return (
    <div className="field relative" ref={rootRef}>
      <label htmlFor={id}>{label}</label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`picker-trigger ${open ? 'is-open' : ''}`}
        onClick={() => (open ? close() : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        <Icon name="calendar" size={18} className="shrink-0 text-indigo-500" />
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>
          {selected
            ? selected.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            : 'Select a date'}
        </span>
        <Icon name="chevronDown" size={16} className={`ml-auto shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}

      {open && (
        <div role="dialog" aria-label={`Choose ${label.toLowerCase()}`} className="picker-popover w-[19rem] p-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="icon-button size-8" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <Icon name="arrowLeft" size={16} />
            </button>
            <p className="m-0 text-sm font-semibold text-slate-900" aria-live="polite">
              {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <button type="button" className="icon-button size-8" onClick={() => shiftMonth(1)} aria-label="Next month">
              <Icon name="arrowRight" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[0.7rem] font-semibold tracking-wide text-slate-400 uppercase">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d.slice(0, 2)}
              </span>
            ))}
          </div>
          <div ref={gridRef} className="grid grid-cols-7 gap-0.5" onKeyDown={handleGridKey}>
            {days.map((date) => {
              const inMonth = date.getMonth() === viewMonth.getMonth();
              const isSelected = sameDay(date, selected);
              const isToday = sameDay(date, today);
              const disabled = isDisabled(date);
              return (
                <button
                  key={toDateKey(date)}
                  type="button"
                  data-date={toDateKey(date)}
                  tabIndex={sameDay(date, focused) ? 0 : -1}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  aria-label={date.toLocaleDateString(undefined, { dateStyle: 'full' })}
                  onClick={() => pick(date)}
                  className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg border-0 text-sm tabular-nums transition-all duration-100 disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? 'bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-200'
                      : isToday
                        ? 'bg-indigo-50 font-semibold text-indigo-700 hover:bg-indigo-100'
                        : inMonth
                          ? 'bg-transparent text-slate-700 hover:bg-slate-100'
                          : 'bg-transparent text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
            {[
              ['Today', today],
              ['Tomorrow', addDays(today, 1)],
            ].map(([text, date]) => (
              <button
                key={text}
                type="button"
                className="btn btn-sm btn-secondary flex-1"
                disabled={isDisabled(date)}
                onClick={() => pick(date)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
