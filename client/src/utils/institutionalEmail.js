export const INSTITUTIONAL_EMAIL_ERROR =
  'Only official Turkana University College email addresses (@tuc.ac.ke) are allowed.';

export const normalizeInstitutionalEmail = (email) =>
  String(email ?? '').trim().toLowerCase();

export const isInstitutionalEmail = (email) => {
  const normalized = normalizeInstitutionalEmail(email);
  if (!normalized || !normalized.includes('@')) return false;
  return normalized.endsWith('@tuc.ac.ke');
};

export const validateInstitutionalEmail = (email) => {
  const normalized = normalizeInstitutionalEmail(email);

  if (!normalized) {
    return 'Please provide an email address.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Please provide a valid email address.';
  }

  if (!isInstitutionalEmail(normalized)) {
    return INSTITUTIONAL_EMAIL_ERROR;
  }

  return null;
};
