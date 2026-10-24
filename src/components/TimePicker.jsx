import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { formatDuration, formatTimeValue, minutesOf, timeOf } from '../utils/dates.js';
import { useDismiss } from '../utils/ui.js';

const STEP_MINUTES = 15;
const SLOTS = Array.from({ length: (24 * 60) / STEP_MINUTES }, (_, i) => i * STEP_MINUTES);
const DEFAULT_SCROLL_TO = 9 * 60;

/**
 * Time field with a 15-minute dropdown. `value` is 'HH:MM'. When `after` ('HH:MM') is given, only later
 * times are offered and each shows its duration from `after` (used for the end time).
 */
export default function TimePicker({ label, value, onChange, error, after }) {
  const id = useId();
  const errorId = `${id}-error`;
  const listId = `${id}-list`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const afterMinutes = after ? minutesOf(after) : null;
  // Keep a value that isn't on the 15-minute grid (e.g. an existing 10:05 meeting) selectable.
  const valueMinutes = value ? minutesOf(value) : null;
  const options = [...new Set([...SLOTS, ...(valueMinutes === null ? [] : [valueMinutes])])]
    .filter((m) => afterMinutes === null || m > afterMinutes)
    .sort((a, b) => a - b);

  const close = ({ viaEscape } = { viaEscape: true }) => {
    setOpen(false);
    if (viaEscape) triggerRef.current?.focus();
  };
  useDismiss(rootRef, open, close);

  const openList = () => {
    const selectedIndex = options.indexOf(valueMinutes);
    const fallback = options.findIndex((m) => m >= DEFAULT_SCROLL_TO);
    setActive(selectedIndex >= 0 ? selectedIndex : Math.max(fallback, 0));
    setOpen(true);
  };

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  // Keep the highlighted option visible while scrolling with the keyboard.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const pick = (minutes) => {
    onChange(timeOf(minutes));
    close();
  };

  const handleListKey = (e) => {
    const last = options.length - 1;
    const moves = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: last, PageDown: active + 4, PageUp: active - 4 };
    if (e.key in moves) {
      e.preventDefault();
      setActive(Math.min(Math.max(moves[e.key], 0), last));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[active] !== undefined) pick(options[active]);
    } else if (e.key === 'Tab') {
      close({ viaEscape: false });
    }
  };

  return (
    <div className="field relative" ref={rootRef}>
      <label htmlFor={id}>{label}</label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`picker-trigger ${open ? 'is-open' : ''}`}
        onClick={() => (open ? close() : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        <Icon name="clock" size={18} className="shrink-0 text-indigo-500" />
        <span className={`truncate ${value ? '' : 'text-slate-400'}`}>{value ? formatTimeValue(value) : 'Select a time'}</span>
        <Icon name="chevronDown" size={16} className={`ml-auto shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={options.length ? `${id}-opt-${options[active]}` : undefined}
          onKeyDown={handleListKey}
          className="picker-popover m-0 max-h-64 w-full min-w-48 list-none overflow-y-auto p-1.5 outline-none"
        >
          {options.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No later times on this day</li>}
          {options.map((m, i) => {
            const isSelected = m === valueMinutes;
            return (
              <li
                key={m}
                id={`${id}-opt-${m}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(m)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm tabular-nums ${
                  isSelected
                    ? 'bg-indigo-600 font-semibold text-white'
                    : i === active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700'
                }`}
              >
                {formatTimeValue(timeOf(m))}
                {afterMinutes !== null && (
                  <span className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {formatDuration(m - afterMinutes)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
