import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import { validateLogin } from '../utils/validation.js';
import { focusFirstInvalid, useDocumentTitle } from '../utils/ui.js';
import { getErrorMessage } from '../api/errors.js';

export default function LoginPage() {
  const { login, isAuthenticated, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useDocumentTitle('Log in');

  // Every login lands on the dashboard.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Editing a field clears its error from the previous attempt.
  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormError('');
    const validation = validateLogin(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      focusFirstInvalid(form);
      return;
    }

    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, "We couldn't log you in."));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="text-3xl">Welcome back</h1>
        <p className="muted mt-1 mb-8">Log in to manage your meetings.</p>
        {sessionExpired && !formError && (
          <Alert type="info">Your session has expired. Please log in again.</Alert>
        )}
        <Alert type="error">{formError}</Alert>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="you@example.com"
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={set('password')}
          error={errors.password}
        />
        <button type="submit" className="btn btn-primary btn-block mt-2 py-3" disabled={submitting} aria-busy={submitting}>
          {submitting && <span className="btn-spinner" aria-hidden="true" />}
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="font-semibold hover:text-indigo-700">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
