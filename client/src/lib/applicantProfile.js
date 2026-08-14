export const emptyEducation = () => ({
  institution: "",
  qualification: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  grade: "",
  currentlyStudying: false,
});

export const emptyExperience = () => ({
  employer: "",
  jobTitle: "",
  employmentType: "",
  location: "",
  startDate: "",
  endDate: "",
  currentlyWorking: false,
  responsibilities: "",
  achievements: "",
});

export const defaultProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  yearsOfExperience: 0,
  educationLevel: "Bachelor",
  profile: {
    personalDetails: {
      location: { city: "", state: "", country: "" },
      nationality: "",
      profilePhoto: "",
      alternateEmail: "",
      alternatePhone: "",
    },
    professionalProfile: {
      currentJobTitle: "",
      currentEmployer: "",
      professionalSummary: "",
      careerLevel: "",
      availability: "",
      expectedSalary: { amount: "", currency: "KES", period: "monthly" },
      workPreferences: { remote: false, hybrid: false, onsite: true },
    },
    education: [emptyEducation()],
    workExperience: [emptyExperience()],
    skills: [],
    certifications: [],
    languages: [],
    documents: { cvPath: "", coverLetterPath: "", profilePhoto: "", supportingDocuments: [] },
    links: { linkedin: "", github: "", website: "", portfolio: "", other: [] },
    references: [],
    jobPreferences: {
      desiredRole: "",
      preferredLocations: [],
      workArrangement: "",
      employmentType: "",
      salaryExpectations: { min: "", max: "", currency: "KES", period: "monthly" },
      willingToRelocate: false,
      travelAvailability: "",
    },
  },
};

export const normalizeApplicantProfile = (data) => {
  const merged = JSON.parse(JSON.stringify(defaultProfileForm));
  if (!data) return merged;

  merged.firstName = data.firstName || "";
  merged.lastName = data.lastName || "";
  merged.email = data.email || "";
  merged.phone = data.phone || "";
  merged.yearsOfExperience = data.yearsOfExperience ?? 0;
  merged.educationLevel = data.educationLevel || "Bachelor";

  const profile = data.profile || {};
  merged.profile = {
    ...merged.profile,
    ...profile,
    personalDetails: {
      ...merged.profile.personalDetails,
      ...(profile.personalDetails || {}),
      location: {
        ...merged.profile.personalDetails.location,
        ...(profile.personalDetails?.location || {}),
      },
    },
    professionalProfile: {
      ...merged.profile.professionalProfile,
      ...(profile.professionalProfile || {}),
      expectedSalary: {
        ...merged.profile.professionalProfile.expectedSalary,
        ...(profile.professionalProfile?.expectedSalary || {}),
      },
      workPreferences: {
        ...merged.profile.professionalProfile.workPreferences,
        ...(profile.professionalProfile?.workPreferences || {}),
      },
    },
    documents: {
      ...merged.profile.documents,
      ...(profile.documents || {}),
      cvPath: profile.documents?.cvPath || data.resumePath || "",
      supportingDocuments: profile.documents?.supportingDocuments || [],
    },
    links: { ...merged.profile.links, ...(profile.links || {}), other: profile.links?.other || [] },
    jobPreferences: {
      ...merged.profile.jobPreferences,
      ...(profile.jobPreferences || {}),
      preferredLocations: profile.jobPreferences?.preferredLocations || [],
      salaryExpectations: {
        ...merged.profile.jobPreferences.salaryExpectations,
        ...(profile.jobPreferences?.salaryExpectations || {}),
      },
    },
    education: profile.education?.length ? profile.education : [emptyEducation()],
    workExperience: profile.workExperience?.length ? profile.workExperience : [emptyExperience()],
    skills: profile.skills || [],
    certifications: profile.certifications || [],
    languages: profile.languages || [],
    references: profile.references || [],
  };

  return merged;
};

export const buildProfilePayload = (form) => ({
  firstName: form.firstName,
  lastName: form.lastName,
  email: form.email,
  phone: form.phone,
  yearsOfExperience: Number(form.yearsOfExperience) || 0,
  educationLevel: form.educationLevel,
  profile: form.profile,
});
