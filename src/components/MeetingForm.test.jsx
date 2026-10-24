import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MeetingForm from './MeetingForm.jsx';
import { formatTimeValue } from '../utils/dates.js';

// 1 Nov 2026, 08:10 local: the form should suggest 08:30–09:30 that day.
const NOW = new Date(2026, 10, 1, 8, 10);

// Expected text uses the same locale formatting as the app, so these tests pass in any locale.
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const time = (hhmm) => formatTimeValue(hhmm);
const shortDate = (day) =>
  new Date(2026, 10, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const dayButton = (day) =>
  new RegExp(`^${escapeRegExp(new Date(2026, 10, day).toLocaleDateString(undefined, { dateStyle: 'full' }))}$`);

async function pickDate(label, day) {
  await userEvent.click(screen.getByLabelText(label));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: dayButton(day) }));
}

async function pickTime(label, hhmm) {
  await userEvent.click(screen.getByLabelText(label));
  await userEvent.click(screen.getByRole('option', { name: new RegExp(`^${escapeRegExp(time(hhmm))}`) }));
}

describe('MeetingForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('suggests the next half-hour slot for a one-hour meeting', () => {
    render(<MeetingForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Date')).toHaveTextContent(shortDate(1));
    expect(screen.getByLabelText('Start time')).toHaveTextContent(time('08:30'));
    expect(screen.getByLabelText('End time')).toHaveTextContent(time('09:30'));
    expect(screen.getByRole('button', { name: '1 hr' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('requires a non-blank title and clears the error once the user types', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Save meeting' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Title'), 'P');
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  it('keeps the meeting length when the start time moves', async () => {
    render(<MeetingForm onSubmit={vi.fn()} />);

    await pickTime('Start time', '10:00');

    expect(screen.getByLabelText('Start time')).toHaveTextContent(time('10:00'));
    expect(screen.getByLabelText('End time')).toHaveTextContent(time('11:00'));
  });

  it('sets the end time from a duration chip', async () => {
    render(<MeetingForm onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '30 min' }));

    expect(screen.getByLabelText('End time')).toHaveTextContent(time('09:00'));
    expect(screen.getByRole('button', { name: '30 min' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('only offers end times after the start, labelled with the duration', async () => {
    render(<MeetingForm onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByLabelText('End time'));

    expect(screen.getAllByRole('option')[0]).toHaveTextContent(`${time('08:45')}15 min`);
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent(`${time('09:30')}1 hr`);
  });

  it('supports meetings that end on a later day', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), 'Offsite');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ends on a different day' }));
    await pickDate('End date', 2);
    await pickTime('End time', '17:00');
    await userEvent.click(screen.getByRole('button', { name: 'Save meeting' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: new Date(2026, 10, 1, 8, 30).toISOString(),
        endTime: new Date(2026, 10, 2, 17, 0).toISOString(),
      }),
    );
  });

  it('lets the calendar be driven from the keyboard', async () => {
    render(<MeetingForm onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByLabelText('Date'));
    expect(screen.getByRole('button', { name: dayButton(1) })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{Enter}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toHaveTextContent(shortDate(9));
    expect(screen.getByLabelText('Date')).toHaveFocus();
  });

  it('validates participant emails and duplicates in create mode', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm withParticipants onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), 'Planning');
    await userEvent.click(screen.getByRole('button', { name: 'Add participant' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add participant' }));
    await userEvent.type(screen.getByLabelText('Participant 1 name'), 'Bob');
    await userEvent.type(screen.getByLabelText('Participant 1 email'), 'bob-at-example');
    await userEvent.type(screen.getByLabelText('Participant 2 name'), 'Carol');
    await userEvent.type(screen.getByLabelText('Participant 2 email'), 'carol@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save meeting' }));

    expect(screen.getByText('Participant email must be a valid email address')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText('Participant 1 email'));
    await userEvent.type(screen.getByLabelText('Participant 1 email'), 'CAROL@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save meeting' }));

    expect(screen.getByText('This email is already in the list')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed payload with ISO timestamps and participants', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm withParticipants onSubmit={onSubmit} submitLabel="Create meeting" />);

    await userEvent.type(screen.getByLabelText('Title'), '  Sprint planning ');
    await pickDate('Date', 5);
    await pickTime('Start time', '09:00');
    await pickTime('End time', '10:30');
    await userEvent.click(screen.getByRole('button', { name: 'Add participant' }));
    await userEvent.type(screen.getByLabelText('Participant 1 name'), ' Bob ');
    await userEvent.type(screen.getByLabelText('Participant 1 email'), 'bob@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Create meeting' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Sprint planning',
      description: null,
      startTime: new Date(2026, 10, 5, 9, 0).toISOString(),
      endTime: new Date(2026, 10, 5, 10, 30).toISOString(),
      participants: [{ name: 'Bob', email: 'bob@example.com' }],
    });
  });

  it('pre-fills values in edit mode and shows server-side field errors', () => {
    render(
      <MeetingForm
        initialMeeting={{
          title: 'Existing',
          description: 'Notes',
          startTime: new Date(2026, 10, 3, 9, 5).toISOString(),
          endTime: new Date(2026, 10, 3, 10, 0).toISOString(),
        }}
        serverErrors={{ title: 'Title must be at most 150 characters', startTime: 'Start time must be in the future' }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('Existing');
    expect(screen.getByLabelText('Date')).toHaveTextContent(shortDate(3));
    // Times off the 15-minute grid are kept as they are.
    expect(screen.getByLabelText('Start time')).toHaveTextContent(time('09:05'));
    expect(screen.getByText('Title must be at most 150 characters')).toBeInTheDocument();
    expect(screen.getByLabelText('Start time')).toHaveAccessibleDescription('Start time must be in the future');
    expect(screen.queryByText('Participants')).not.toBeInTheDocument();
  });
});
