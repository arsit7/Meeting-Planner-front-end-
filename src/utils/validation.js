// Mirrors the backend rules so users get instant feedback; the backend remains the authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field length limits; keep in step with the backend's Bean Validation constraints. */
export const LIMITS = {
  name: 100,
  passwordMin: 8,
  passwordMax: 72,
  title: 150,
  description: 2000,
  search: 100,
};

export function isValidEmail(value) {
  return EMAIL_RE.test((value || '').trim());
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address, like name@example.com';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateSignup({ name, email, password, confirmPassword }) {
  const errors = validateLogin({ email, password });
  if (!name?.trim()) errors.name = 'Name is required';
  else if (name.trim().length > LIMITS.name) errors.name = `Name must be at most ${LIMITS.name} characters`;
  if (password && password.length < LIMITS.passwordMin) {
    errors.password = `Password must be at least ${LIMITS.passwordMin} characters (${
      LIMITS.passwordMin - password.length
    } more needed)`;
  } else if (password && password.length > LIMITS.passwordMax) {
    errors.password = `Password must be at most ${LIMITS.passwordMax} characters`;
  }
  if (password && !confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function validateParticipant({ name, email }) {
  const errors = {};
  if (!name?.trim()) errors.name = 'Participant name is required';
  else if (name.trim().length > LIMITS.name) {
    errors.name = `Participant name must be at most ${LIMITS.name} characters`;
  }
  if (!email?.trim()) errors.email = 'Participant email is required';
  else if (!isValidEmail(email)) errors.email = 'Participant email must be a valid email address';
  return errors;
}

/**
 * @param values {title, description, start, end} where start/end are local 'YYYY-MM-DDTHH:MM' strings
 * @param participants optional array of {name, email}
 */
export function validateMeeting({ title, description, start, end }, participants = []) {
  const errors = {};
  if (!title?.trim()) errors.title = 'Title is required';
  else if (title.trim().length > LIMITS.title) errors.title = `Title must be at most ${LIMITS.title} characters`;
  if ((description || '').length > LIMITS.description) {
    errors.description = `Description must be at most ${LIMITS.description} characters`;
  }
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
