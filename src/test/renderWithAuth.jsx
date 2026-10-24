import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../auth/AuthContext.jsx';

export const testUser = { id: 1, name: 'Olivia Owner', email: 'olivia@example.com', avatarUrl: null };

/** Renders UI inside a router and a stubbed auth context (no network). */
export function renderWithAuth(ui, { auth = {}, route = '/' } = {}) {
  const value = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    ...auth,
  };
  const result = render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  );
  return { ...result, auth: value };
}
