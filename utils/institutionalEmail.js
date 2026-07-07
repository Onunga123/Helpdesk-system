const INSTITUTIONAL_EMAIL_SUFFIX = '@tuc.ac.ke';

const INSTITUTIONAL_EMAIL_ERROR =
  'Only official Turkana University College email addresses (@tuc.ac.ke) are allowed.';

const normalizeInstitutionalEmail = (email) => {
  if (email === undefined || email === null) return '';
  return String(email).trim().toLowerCase();
};

const isInstitutionalEmail = (email) => {
  const normalized = normalizeInstitutionalEmail(email);
  if (!normalized || !normalized.includes('@')) return false;
  return normalized.endsWith(INSTITUTIONAL_EMAIL_SUFFIX);
};

const assertInstitutionalEmail = (email, res) => {
  const normalized = normalizeInstitutionalEmail(email);

  if (!normalized) {
    if (res) res.status(400);
    throw new Error('Please provide a valid email address.');
  }

  const basicFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicFormat.test(normalized)) {
    if (res) res.status(400);
    throw new Error('Please provide a valid email address.');
  }

  if (!isInstitutionalEmail(normalized)) {
    if (res) res.status(400);
    throw new Error(INSTITUTIONAL_EMAIL_ERROR);
  }

  return normalized;
};

module.exports = {
  INSTITUTIONAL_EMAIL_SUFFIX,
  INSTITUTIONAL_EMAIL_ERROR,
  normalizeInstitutionalEmail,
  isInstitutionalEmail,
  assertInstitutionalEmail,
};
