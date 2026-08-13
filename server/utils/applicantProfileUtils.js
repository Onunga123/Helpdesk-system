const path = require('path');

const toWebPath = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return '';
  if (filePath.startsWith('/uploads/')) return filePath;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

  const normalized = filePath.replace(/\\/g, '/');
  const uploadsIndex = normalized.indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  const fileName = path.basename(normalized);
  if (fileName.startsWith('resume-')) return `/uploads/resumes/${fileName}`;
  if (fileName.startsWith('applicant-')) return `/uploads/applicants/${fileName}`;
  return normalized;
};

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const calculateProfileCompletion = (applicant) => {
  const profile = applicant.profile || {};
  const personal = profile.personalDetails || {};
  const professional = profile.professionalProfile || {};
  const documents = profile.documents || {};
  const links = profile.links || {};
  const jobPreferences = profile.jobPreferences || {};

  const checks = [
    hasText(applicant.firstName),
    hasText(applicant.lastName),
    hasText(applicant.email),
    hasText(applicant.phone),
    hasText(personal.location?.city) || hasText(personal.location?.country),
    hasText(personal.nationality),
    Boolean(personal.profilePhoto || documents.profilePhoto),
    hasText(professional.currentJobTitle) || applicant.yearsOfExperience > 0,
    hasText(professional.professionalSummary),
    hasText(professional.careerLevel),
    (profile.education || []).length > 0,
    (profile.workExperience || []).length > 0,
    (profile.skills || []).length > 0,
    (profile.certifications || []).length > 0,
    (profile.languages || []).length > 0,
    Boolean(documents.cvPath || applicant.resumePath),
    Boolean(links.linkedin || links.github || links.website || links.portfolio),
    (profile.references || []).length > 0,
    hasText(jobPreferences.desiredRole) || (jobPreferences.preferredLocations || []).length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

const serializeApplicantProfile = (applicant) => {
  const data = applicant.toObject ? applicant.toObject() : applicant;
  const profile = data.profile || {};
  const documents = profile.documents || {};

  if (!documents.cvPath && data.resumePath) {
    documents.cvPath = toWebPath(data.resumePath);
  }

  ['profilePhoto', 'cvPath', 'coverLetterPath'].forEach((key) => {
    if (documents[key]) documents[key] = toWebPath(documents[key]);
  });

  if (profile.personalDetails?.profilePhoto) {
    profile.personalDetails.profilePhoto = toWebPath(profile.personalDetails.profilePhoto);
  }

  (profile.certifications || []).forEach((cert) => {
    if (cert.certificatePath) cert.certificatePath = toWebPath(cert.certificatePath);
  });

  (documents.supportingDocuments || []).forEach((doc) => {
    if (doc.path) doc.path = toWebPath(doc.path);
  });

  data.profile = profile;
  data.profileCompletion = calculateProfileCompletion(data);
  return data;
};

const getAbsoluteUploadPath = (webPath) => {
  if (!webPath) return '';
  if (webPath.startsWith('http://') || webPath.startsWith('https://')) return '';
  const relative = webPath.replace(/^\//, '');
  return path.join(__dirname, '..', relative);
};

module.exports = {
  toWebPath,
  calculateProfileCompletion,
  serializeApplicantProfile,
  getAbsoluteUploadPath,
};
