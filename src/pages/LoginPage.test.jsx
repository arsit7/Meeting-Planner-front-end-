import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage.jsx';
import { renderWithAuth } from '../test/renderWithAuth.jsx';

function renderLogin(auth) {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<h1>Dashboard</h1>} />
    </Routes>,
    { auth, route: '/login' },
  );
}

describe('LoginPage', () => {
  it('shows validation errors and does not call login when fields are empty', async () => {
    const { auth } = renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('rejects a malformed email before calling the API', async () => {
    const { auth } = renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Enter a valid email address, like name@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus());
    expect(auth.login).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Email'), '@example.com');
    expect(screen.queryByText(/Enter a valid email address/)).not.toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('shows the server error message when credentials are rejected', async () => {
    const login = vi.fn().mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid email or password' } },
    });
    renderLogin({ login });

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(login).toHaveBeenCalledWith('alice@example.com', 'wrong-password');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });

  it('shows a helpful message when the backend is unreachable', async () => {
    const login = vi.fn().mockRejectedValue({ code: 'ERR_NETWORK' });
    renderLogin({ login });

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
  });

  it('navigates to the dashboard after a successful login', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderLogin({ login });

    await userEvent.type(screen.getByLabelText('Email'), ' alice@example.com ');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument());
    expect(login).toHaveBeenCalledWith('alice@example.com', 'secret123');
  });

  it('tells the user when their session expired', () => {
    renderLogin({ sessionExpired: true });

    expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
  });
});
