import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import { validateSignup } from '../utils/validation.js';
import { focusFirstInvalid, useDocumentTitle } from '../utils/ui.js';
import { getErrorMessage, getFieldErrors } from '../api/errors.js';

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useDocumentTitle('Sign up');

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
    const validation = validateSignup(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      focusFirstInvalid(form);
      return;
    }

    setSubmitting(true);
    try {
      await signup(values.name.trim(), values.email.trim(), values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, "We couldn't create your account."));
      setSubmitting(false);
      focusFirstInvalid(form);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="text-3xl">Create your account</h1>
        <p className="muted mt-1 mb-8">Start planning meetings in seconds.</p>
        <Alert type="error">{formError}</Alert>
        <FormField
          label="Name"
          autoComplete="name"
          autoFocus
          value={values.name}
          onChange={set('name')}
          error={errors.name}
          maxLength={100}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="you@example.com"
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={set('password')}
          error={errors.password}
          hint="Use 8 to 72 characters."
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
        />
        <button type="submit" className="btn btn-primary btn-block mt-2 py-3" disabled={submitting} aria-busy={submitting}>
          {submitting && <span className="btn-spinner" aria-hidden="true" />}
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
