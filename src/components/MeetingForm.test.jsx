import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MeetingForm from './MeetingForm.jsx';

async function fillTimes(start, end) {
  if (start) await userEvent.type(screen.getByLabelText('Start time'), start);
  if (end) await userEvent.type(screen.getByLabelText('End time'), end);
}

describe('MeetingForm', () => {
  it('requires a non-blank title and both times', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Save meeting' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Start time is required')).toBeInTheDocument();
    expect(screen.getByText('End time is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an end time that is before the start time', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), 'Planning');
    await fillTimes('2026-11-01T10:00', '2026-11-01T09:00');
    await userEvent.click(screen.getByRole('button', { name: 'Save meeting' }));

    expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an end time equal to the start time', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), 'Planning');
    await fillTimes('2026-11-01T10:00', '2026-11-01T10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Save meeting' }));

    expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates participant emails and duplicates in create mode', async () => {
    const onSubmit = vi.fn();
    render(<MeetingForm withParticipants onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), 'Planning');
    await fillTimes('2026-11-01T09:00', '2026-11-01T10:00');
    await userEvent.click(screen.getByRole('button', { name: '+ Add participant' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Add participant' }));
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
    await fillTimes('2026-11-01T09:00', '2026-11-01T10:30');
    await userEvent.click(screen.getByRole('button', { name: '+ Add participant' }));
    await userEvent.type(screen.getByLabelText('Participant 1 name'), ' Bob ');
    await userEvent.type(screen.getByLabelText('Participant 1 email'), 'bob@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Create meeting' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Sprint planning',
      description: null,
      startTime: new Date('2026-11-01T09:00').toISOString(),
      endTime: new Date('2026-11-01T10:30').toISOString(),
      participants: [{ name: 'Bob', email: 'bob@example.com' }],
    });
  });

  it('pre-fills values in edit mode and shows server-side field errors', () => {
    render(
      <MeetingForm
        initialMeeting={{
          title: 'Existing',
          description: 'Notes',
          startTime: new Date('2026-11-01T09:00').toISOString(),
          endTime: new Date('2026-11-01T10:00').toISOString(),
        }}
        serverErrors={{ title: 'Title must be at most 150 characters' }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('Existing');
    expect(screen.getByLabelText('Start time')).toHaveValue('2026-11-01T09:00');
    expect(screen.getByText('Title must be at most 150 characters')).toBeInTheDocument();
    expect(screen.queryByText('Participants')).not.toBeInTheDocument();
  });
});
