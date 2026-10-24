import { useState } from 'react';
import FormField from './FormField.jsx';
import { validateParticipant } from '../utils/validation.js';
import { getErrorMessage, getFieldErrors } from '../api/errors.js';

/** onAdd({name, email}) should return a promise; server errors are shown inline. */
export default function AddParticipantForm({ onAdd }) {
  const [values, setValues] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validation = validateParticipant(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await onAdd({ name: values.name.trim(), email: values.email.trim() });
      setValues({ name: '', email: '' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="add-participant" onSubmit={handleSubmit} noValidate>
      <FormField
        label="Name"
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        error={errors.name}
      />
      <FormField
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        error={errors.email}
      />
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add participant'}
      </button>
      {formError && !errors.name && !errors.email && <p className="field-error full">{formError}</p>}
    </form>
  );
}
