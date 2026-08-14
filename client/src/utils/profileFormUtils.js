export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
  "Volunteer",
  "Other",
];

export const TEXT_LIMITS = {
  responsibilities: 2000,
  achievements: 1500,
};

export const toMonthInputValue = (value) => {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed.slice(0, 7);
  return "";
};

export const formatMonthLabel = (value) => {
  const normalized = toMonthInputValue(value);
  if (!normalized) return "";
  const [year, month] = normalized.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

export const formatMonthRange = (startDate, endDate, current) => {
  const start = formatMonthLabel(startDate);
  if (!start) return "";
  if (current) return `${start} – Present`;
  const end = formatMonthLabel(endDate);
  return end ? `${start} – ${end}` : start;
};

export const isEducationDraft = (item) => !item?.institution?.trim() && !item?.qualification?.trim();

export const isEducationComplete = (item) =>
  Boolean(item?.institution?.trim() && item?.qualification?.trim());

export const hasEducationContent = (item) =>
  Boolean(
    item?.institution?.trim() ||
      item?.qualification?.trim() ||
      item?.fieldOfStudy?.trim() ||
      item?.grade?.trim() ||
      item?.startDate?.trim() ||
      item?.endDate?.trim()
  );

export const validateEducationEntry = (item, index) => {
  const errors = {};
  const prefix = `education-${index}`;
  if (!hasEducationContent(item)) return errors;
  if (!item.institution?.trim()) errors[`${prefix}-institution`] = "Institution is required";
  if (!item.qualification?.trim()) errors[`${prefix}-qualification`] = "Qualification is required";
  return errors;
};

export const toDateInputValue = (value) => {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  return "";
};

export const formatDisplayDate = (value) => {
  const normalized = toDateInputValue(value);
  if (!normalized) return "";
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

export const formatDateRange = (startDate, endDate, currentlyWorking) => {
  const start = formatDisplayDate(startDate);
  if (!start) return "";
  if (currentlyWorking) return `${start} – Present`;
  const end = formatDisplayDate(endDate);
  return end ? `${start} – ${end}` : start;
};

export const isExperienceDraft = (item) =>
  !item?.employer?.trim() && !item?.jobTitle?.trim();

export const isExperienceComplete = (item) =>
  Boolean(
    item?.employer?.trim() &&
      item?.jobTitle?.trim() &&
      item?.employmentType?.trim() &&
      toDateInputValue(item?.startDate) &&
      (item?.currentlyWorking || toDateInputValue(item?.endDate))
  );

export const hasExperienceContent = (item) =>
  Boolean(
    item?.employer?.trim() ||
      item?.jobTitle?.trim() ||
      item?.employmentType?.trim() ||
      item?.location?.trim() ||
      item?.startDate?.trim() ||
      item?.endDate?.trim() ||
      item?.responsibilities?.trim() ||
      item?.achievements?.trim()
  );

export const validateExperienceEntry = (item, index) => {
  const errors = {};
  const prefix = `experience-${index}`;

  if (!hasExperienceContent(item)) return errors;

  if (!item.employer?.trim()) errors[`${prefix}-employer`] = "Employer name is required";
  if (!item.jobTitle?.trim()) errors[`${prefix}-jobTitle`] = "Job title is required";
  if (!item.employmentType?.trim()) errors[`${prefix}-employmentType`] = "Select an employment type";
  if (!toDateInputValue(item.startDate)) errors[`${prefix}-startDate`] = "Start date is required";
  if (!item.currentlyWorking && !toDateInputValue(item.endDate)) {
    errors[`${prefix}-endDate`] = "End date is required unless you currently work here";
  }

  return errors;
};

export const STEP_LABELS = {
  personal: "Personal Details",
  professional: "Professional Profile",
  education: "Education",
  experience: "Work Experience",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  documents: "Documents",
  links: "Portfolio & Links",
  references: "References",
  preferences: "Job Preferences",
};

export const getValidationSummary = (stepId, errors) => {
  const count = Object.keys(errors).length;
  if (!count) return "";
  const section = STEP_LABELS[stepId] || "this section";
  return `${count} required field${count > 1 ? "s" : ""} in ${section} need your attention before you can continue.`;
};

export const isStepComplete = (stepId, form) => {
  const profile = form.profile || {};

  switch (stepId) {
    case "personal":
      return Boolean(
        form.firstName?.trim() &&
          form.lastName?.trim() &&
          form.phone?.trim() &&
          form.email?.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      );
    case "professional": {
      const years = Number(form.yearsOfExperience);
      return (
        form.educationLevel &&
        form.yearsOfExperience !== "" &&
        !Number.isNaN(years) &&
        years >= 0 &&
        profile.professionalProfile?.professionalSummary?.trim()
      );
    }
    case "education":
      return (profile.education || []).some(
        (item) => item.institution?.trim() && item.qualification?.trim()
      );
    case "experience":
      return (profile.workExperience || []).some(isExperienceComplete);
    case "skills":
      return (profile.skills || []).some((item) => item.name?.trim());
    case "certifications":
      return (profile.certifications || []).some((item) => item.name?.trim());
    case "languages":
      return (profile.languages || []).some((item) => item.language?.trim());
    case "documents":
      return Boolean(profile.documents?.cvPath);
    case "links":
      return Boolean(
        profile.links?.linkedin?.trim() ||
          profile.links?.github?.trim() ||
          profile.links?.website?.trim() ||
          profile.links?.portfolio?.trim()
      );
    case "references":
      return (profile.references || []).some((item) => item.name?.trim() && item.email?.trim());
    case "preferences":
      return Boolean(
        profile.jobPreferences?.desiredRole?.trim() ||
          (profile.jobPreferences?.preferredLocations || []).length > 0
      );
    default:
      return false;
  }
};
