import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from './ProtectedRoute.jsx';
import { renderWithAuth, testUser } from '../test/renderWithAuth.jsx';

function LoginProbe() {
  const location = useLocation();
  return <p>Login page (from: {location.state?.from})</p>;
}

function renderRoutes(auth, route = '/meetings') {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/meetings" element={<p>Secret meetings</p>} />
      </Route>
    </Routes>,
    { auth, route },
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login and remembers where they were going', () => {
    renderRoutes({ isAuthenticated: false });

    expect(screen.queryByText('Secret meetings')).not.toBeInTheDocument();
    expect(screen.getByText('Login page (from: /meetings)')).toBeInTheDocument();
  });

  it('renders the protected page for authenticated users', () => {
    renderRoutes({ isAuthenticated: true, user: testUser });

    expect(screen.getByText('Secret meetings')).toBeInTheDocument();
  });

  it('shows a loading state while the session is being verified', () => {
    renderRoutes({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
    expect(screen.queryByText('Secret meetings')).not.toBeInTheDocument();
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
  });
});
