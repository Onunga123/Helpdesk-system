const ROLE_LABELS = {
  admin: 'Administrator',
  ict_officer: 'ICT Officer',
  staff: 'Staff',
  student: 'Student',
};

const normalizeRoleKey = (role) => {
  if (!role) return '';
  return String(role)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
};

export const formatRole = (role) => {
  const key = normalizeRoleKey(role);
  return ROLE_LABELS[key] || role || 'N/A';
};

export default formatRole;
