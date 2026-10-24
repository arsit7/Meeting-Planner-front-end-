import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from './ProfilePage.jsx';
import { renderWithAuth, testUser } from '../test/renderWithAuth.jsx';
import * as usersApi from '../api/users.js';

vi.mock('../api/users.js');

const image = (name = 'me.png', bytes = 1024, type = 'image/png') => new File(['x'.repeat(bytes)], name, { type });

function renderProfile() {
  const result = renderWithAuth(<ProfilePage />, { auth: { isAuthenticated: true, user: testUser } });
  return { ...result, fileInput: result.container.querySelector('input[type="file"]') };
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  it('opens the file picker when the photo is clicked', async () => {
    const { fileInput } = renderProfile();
    const click = vi.spyOn(fileInput, 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Change profile picture' }));

    expect(click).toHaveBeenCalled();
  });

  it('previews the chosen photo and uploads it on save', async () => {
    const updated = { ...testUser, avatarUrl: '/api/users/1/avatar' };
    usersApi.uploadAvatar.mockResolvedValue(updated);
    const { fileInput, auth } = renderProfile();
    const file = image();

    await userEvent.upload(fileInput, file);
    expect(screen.getByText('me.png')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save photo' }));

    expect(usersApi.uploadAvatar).toHaveBeenCalledWith(file);
    expect(auth.updateUser).toHaveBeenCalledWith(updated);
    expect(await screen.findByText('Your profile picture was updated.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save photo' })).not.toBeInTheDocument();
  });

  it('cancelling a chosen photo does not upload it', async () => {
    const { fileInput } = renderProfile();

    await userEvent.upload(fileInput, image());
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('button', { name: 'Save photo' })).not.toBeInTheDocument();
    expect(usersApi.uploadAvatar).not.toHaveBeenCalled();
  });

  it('rejects files that are too large or not images', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { fileInput } = renderProfile();

    await user.upload(fileInput, image('huge.png', 3 * 1024 * 1024));
    expect(screen.getByRole('alert')).toHaveTextContent('“huge.png” is 3.0 MB. Please choose an image of 2 MB or less.');

    await user.upload(fileInput, image('notes.pdf', 10, 'application/pdf'));
    expect(screen.getByRole('alert')).toHaveTextContent('“notes.pdf” isn\'t a supported image.');
    expect(screen.queryByRole('button', { name: 'Save photo' })).not.toBeInTheDocument();
  });
});
