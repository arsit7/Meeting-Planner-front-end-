// Mirrors the backend rules so users get instant feedback; the backend remains the authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_RE.test((value || '').trim());
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateSignup({ name, email, password, confirmPassword }) {
  const errors = validateLogin({ email, password });
  if (!name?.trim()) errors.name = 'Name is required';
  else if (name.trim().length > 100) errors.name = 'Name must be at most 100 characters';
  if (password && (password.length < 8 || password.length > 72)) {
    errors.password = 'Password must be between 8 and 72 characters';
  }
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function validateParticipant({ name, email }) {
  const errors = {};
  if (!name?.trim()) errors.name = 'Participant name is required';
  else if (name.trim().length > 100) errors.name = 'Participant name must be at most 100 characters';
  if (!email?.trim()) errors.email = 'Participant email is required';
  else if (!isValidEmail(email)) errors.email = 'Participant email must be a valid email address';
  return errors;
}

/**
 * @param values {title, description, start, end} where start/end are datetime-local strings
 * @param participants optional array of {name, email}
 */
export function validateMeeting({ title, description, start, end }, participants = []) {
  const errors = {};
  if (!title?.trim()) errors.title = 'Title is required';
  else if (title.trim().length > 150) errors.title = 'Title must be at most 150 characters';
  if ((description || '').length > 2000) errors.description = 'Description must be at most 2000 characters';
  if (!start) errors.startTime = 'Start time is required';
  if (!end) errors.endTime = 'End time is required';
  if (start && end && new Date(end) <= new Date(start)) {
    errors.endTime = 'End time must be after start time';
  }

  const seen = new Set();
  participants.forEach((p, i) => {
    const pErrors = validateParticipant(p);
    const email = (p.email || '').trim().toLowerCase();
    if (!pErrors.email && seen.has(email)) pErrors.email = 'This email is already in the list';
    seen.add(email);
    if (pErrors.name) errors[`participants[${i}].name`] = pErrors.name;
    if (pErrors.email) errors[`participants[${i}].email`] = pErrors.email;
  });
  return errors;
}
