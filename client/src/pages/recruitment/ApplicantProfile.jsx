import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  FaBriefcase,
  FaCertificate,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaFileAlt,
  FaGlobe,
  FaGraduationCap,
  FaLanguage,
  FaLink,
  FaSave,
  FaTools,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import API from "../../api/axios";
import PageLoader from "../../components/ui/PageLoader";
import WorkExperienceSection from "../../components/recruitment/WorkExperienceSection";
import EducationSection from "../../components/recruitment/EducationSection";
import SkillsSection from "../../components/recruitment/SkillsSection";
import CertificationsSection from "../../components/recruitment/CertificationsSection";
import LanguagesSection from "../../components/recruitment/LanguagesSection";
import ReferencesSection from "../../components/recruitment/ReferencesSection";
import {
  getValidationSummary,
  hasEducationContent,
  hasExperienceContent,
  isEducationComplete,
  isExperienceComplete,
  isStepComplete,
  validateEducationEntry,
  validateExperienceEntry,
} from "../../utils/profileFormUtils";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import "../../styles/applicant-profile.css";

const STEPS = [
  { id: "personal", label: "Personal Details", icon: FaUser },
  { id: "professional", label: "Professional Profile", icon: FaBriefcase },
  { id: "education", label: "Education", icon: FaGraduationCap },
  { id: "experience", label: "Work Experience", icon: FaBriefcase },
  { id: "skills", label: "Skills", icon: FaTools },
  { id: "certifications", label: "Certifications", icon: FaCertificate },
  { id: "languages", label: "Languages", icon: FaLanguage },
  { id: "documents", label: "Documents", icon: FaFileAlt },
  { id: "links", label: "Portfolio & Links", icon: FaLink },
  { id: "references", label: "References", icon: FaUsers },
  { id: "preferences", label: "Job Preferences", icon: FaGlobe },
];

const emptyEducation = () => ({
  institution: "",
  qualification: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  grade: "",
  currentlyStudying: false,
});

const emptyExperience = () => ({
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

const emptySkill = () => ({ name: "", category: "technical", proficiency: "Intermediate" });
const emptyCertification = () => ({
  name: "",
  issuingOrganization: "",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  certificatePath: "",
});
const emptyLanguage = () => ({ language: "", proficiency: "Conversational" });
const emptyReference = () => ({
  name: "",
  title: "",
  organization: "",
  email: "",
  phone: "",
  relationship: "",
  location: "",
});
const emptyLink = () => ({ label: "", url: "" });

const defaultForm = {
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
    skills: [emptySkill()],
    certifications: [emptyCertification()],
    languages: [emptyLanguage()],
    documents: { cvPath: "", coverLetterPath: "", profilePhoto: "", supportingDocuments: [] },
    links: { linkedin: "", github: "", website: "", portfolio: "", other: [] },
    references: [emptyReference()],
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

const normalizeProfile = (data) => {
  const merged = JSON.parse(JSON.stringify(defaultForm));
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
    links: {
      ...merged.profile.links,
      ...(profile.links || {}),
      other: profile.links?.other || [],
    },
    jobPreferences: {
      ...merged.profile.jobPreferences,
      ...(profile.jobPreferences || {}),
      preferredLocations: profile.jobPreferences?.preferredLocations || [],
      salaryExpectations: {
        ...merged.profile.jobPreferences.salaryExpectations,
        ...(profile.jobPreferences?.salaryExpectations || {}),
      },
    },
    consent: { ...merged.profile.consent, ...(profile.consent || {}) },
    education: profile.education?.length ? profile.education : [emptyEducation()],
    workExperience: profile.workExperience?.length ? profile.workExperience : [emptyExperience()],
    skills: profile.skills?.length ? profile.skills : [emptySkill()],
    certifications: profile.certifications?.length ? profile.certifications : [emptyCertification()],
    languages: profile.languages?.length ? profile.languages : [emptyLanguage()],
    references: profile.references?.length ? profile.references : [emptyReference()],
  };

  return merged;
};

const validateStep = (stepId, form) => {
  const errors = {};
  const profile = form.profile || {};

  if (stepId === "personal") {
    if (!form.firstName?.trim()) errors.firstName = "First name is required";
    if (!form.lastName?.trim()) errors.lastName = "Last name is required";
    if (!form.phone?.trim()) errors.phone = "Phone number is required";
    if (!form.email?.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address";
    }
  }

  if (stepId === "professional") {
    const years = Number(form.yearsOfExperience);
    if (form.yearsOfExperience === "" || Number.isNaN(years) || years < 0) {
      errors.yearsOfExperience = "Years of experience is required";
    }
    if (!form.educationLevel) errors.educationLevel = "Education level is required";
  }

  if (stepId === "education") {
    const entries = profile.education || [];
    entries.forEach((item, index) => {
      Object.assign(errors, validateEducationEntry(item, index));
      if (hasEducationContent(item) && !isEducationComplete(item)) {
        errors[`education-${index}-incomplete`] = "Complete all required fields for this education entry.";
      }
    });
    if (!entries.some(isEducationComplete)) {
      errors.education = "Add at least one education record with institution and qualification.";
    }
  }

  if (stepId === "experience") {
    const entries = profile.workExperience || [];
    entries.forEach((item, index) => {
      Object.assign(errors, validateExperienceEntry(item, index));
      if (hasExperienceContent(item) && !isExperienceComplete(item)) {
        errors[`experience-${index}-incomplete`] = "Complete all required fields for this work experience entry.";
      }
    });

    const hasComplete = entries.some(isExperienceComplete);

    if (!hasComplete) {
      errors.experience =
        "Add at least one complete work experience with employer, job title, employment type, and dates.";
    }
  }

  return errors;
};

const ApplicantProfile = () => {
  const isLoggedIn = Boolean(localStorage.getItem("applicantToken"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [completion, setCompletion] = useState(0);
  const [errors, setErrors] = useState({});
  const [saveMessage, setSaveMessage] = useState("");
  const [preferredLocationInput, setPreferredLocationInput] = useState("");
  const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [editingEducationIndex, setEditingEducationIndex] = useState(null);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [editingReferenceIndex, setEditingReferenceIndex] = useState(null);
  const [isAddingReference, setIsAddingReference] = useState(false);
  const autoSaveTimer = useRef(null);
  const skipAutoSave = useRef(true);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/recruitment/applicants/me");
      const normalized = normalizeProfile(data.data);
      setForm(normalized);
      setCompletion(data.data?.profileCompletion ?? 0);
      skipAutoSave.current = true;
    } catch (error) {
      setSaveMessage(error.response?.data?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadProfile();
  }, [isLoggedIn, loadProfile]);

  useEffect(() => {
    const stepId = STEPS[activeStep]?.id;
    if (stepId !== "experience") {
      setEditingExperienceIndex(null);
      setIsAddingExperience(false);
    }
    if (stepId !== "education") {
      setEditingEducationIndex(null);
      setIsAddingEducation(false);
    }
    if (stepId !== "references") {
      setEditingReferenceIndex(null);
      setIsAddingReference(false);
    }
  }, [activeStep]);

  const saveProfile = useCallback(
    async (options = {}) => {
      const { silent = false, stepId = null } = options;
      const currentForm = formRef.current;

      if (stepId) {
        const stepErrors = validateStep(stepId, currentForm);
        if (Object.keys(stepErrors).length) {
          setErrors(stepErrors);
          setSaveMessage(getValidationSummary(stepId, stepErrors));
          return false;
        }
      }

      setSaving(true);
      setErrors({});
      try {
        const payload = {
          firstName: currentForm.firstName,
          lastName: currentForm.lastName,
          email: currentForm.email,
          phone: currentForm.phone,
          yearsOfExperience: Number(currentForm.yearsOfExperience) || 0,
          educationLevel: currentForm.educationLevel,
          profile: currentForm.profile,
        };
        const { data } = await API.put("/recruitment/applicants/me", payload);
        setCompletion(data.data?.profileCompletion ?? completion);
        if (!silent) setSaveMessage("Profile saved successfully.");
        skipAutoSave.current = true;
        return true;
      } catch (error) {
        const message = error.response?.data?.message || "Failed to save profile.";
        if (!silent) setSaveMessage(message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [completion]
  );

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return undefined;
    }

    autoSaveTimer.current = setTimeout(() => {
      saveProfile({ silent: true });
    }, 2500);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, saveProfile]);

  const updateField = (path, value) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let cursor = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
        if (!cursor[keys[i]]) cursor[keys[i]] = {};
        cursor = cursor[keys[i]];
      }
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
    setSaveMessage("");
  };

  const updateListItem = (listPath, index, field, value) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = listPath.split(".");
      let cursor = next;
      keys.forEach((key) => {
        cursor = cursor[key];
      });
      cursor[index][field] = value;
      if (listPath === "profile.workExperience" && field === "currentlyWorking" && value) {
        cursor[index].endDate = "";
      }
      if (listPath === "profile.education" && field === "currentlyStudying" && value) {
        cursor[index].endDate = "";
      }
      return next;
    });
  };

  const addListItem = (listPath, factory) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = listPath.split(".");
      let cursor = next;
      keys.forEach((key) => {
        cursor = cursor[key];
      });
      cursor.push(factory());
      return next;
    });
  };

  const removeListItem = (listPath, index) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = listPath.split(".");
      let cursor = next;
      keys.forEach((key) => {
        cursor = cursor[key];
      });
      if (cursor.length > 1) cursor.splice(index, 1);
      return next;
    });
  };

  const uploadDocument = async (file, documentType, extra = {}) => {
    if (!file) return;
    setUploading(true);
    setSaveMessage("");
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      Object.entries(extra).forEach(([key, value]) => formData.append(key, value));
      formData.append("file", file);

      const { data } = await API.post(
        `/recruitment/applicants/me/documents?documentType=${encodeURIComponent(documentType)}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const normalized = normalizeProfile(data.data.profile);
      setForm(normalized);
      setCompletion(data.data.profile?.profileCompletion ?? completion);
      const labels = {
        cv: "CV",
        coverLetter: "Cover letter",
        certificate: "Certificate",
        supporting: "Document",
        profilePhoto: "Profile photo",
      };
      setSaveMessage(`${labels[documentType] || "Document"} uploaded successfully.`);
    } catch (error) {
      setSaveMessage(error.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentType, query = "") => {
    setUploading(true);
    try {
      const { data } = await API.delete(`/recruitment/applicants/me/documents/${documentType}${query}`);
      setForm(normalizeProfile(data.data));
      setCompletion(data.data?.profileCompletion ?? completion);
      setSaveMessage("Document removed.");
    } catch (error) {
      setSaveMessage(error.response?.data?.message || "Unable to remove document.");
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    const stepId = STEPS[activeStep].id;
    const stepErrors = validateStep(stepId, formRef.current);

    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      setSaveMessage(getValidationSummary(stepId, stepErrors));
      return;
    }

    setErrors({});
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));

    const saved = await saveProfile({ silent: true });
    if (!saved) {
      setSaveMessage("Could not save your profile. Please try Save before leaving this section.");
    }
  };

  const handlePrevious = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleExperienceUpdate = (index, field, value) => {
    updateListItem("profile.workExperience", index, field, value);
  };

  const handleExperienceEdit = (index) => {
    setEditingExperienceIndex(index);
    setIsAddingExperience(false);
  };

  const handleExperienceDelete = (index) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const items = next.profile.workExperience;
      if (items.length > 1) {
        items.splice(index, 1);
      } else {
        items[0] = emptyExperience();
      }
      return next;
    });
    setEditingExperienceIndex(null);
    setIsAddingExperience(false);
  };

  const handleExperienceAdd = () => {
    addListItem("profile.workExperience", emptyExperience);
    setIsAddingExperience(true);
    setEditingExperienceIndex(null);
  };

  const handleExperienceCancel = () => {
    if (isAddingExperience) {
      setForm((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const items = next.profile.workExperience;
        if (items.length > 1) items.pop();
        return next;
      });
    }
    setEditingExperienceIndex(null);
    setIsAddingExperience(false);
  };

  const handleEducationUpdate = (index, field, value) => {
    updateListItem("profile.education", index, field, value);
  };

  const handleEducationEdit = (index) => {
    setEditingEducationIndex(index);
    setIsAddingEducation(false);
  };

  const handleEducationDelete = (index) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const items = next.profile.education;
      if (items.length > 1) {
        items.splice(index, 1);
      } else {
        items[0] = emptyEducation();
      }
      return next;
    });
    setEditingEducationIndex(null);
    setIsAddingEducation(false);
  };

  const handleEducationAdd = () => {
    addListItem("profile.education", emptyEducation);
    setIsAddingEducation(true);
    setEditingEducationIndex(null);
  };

  const handleEducationCancel = () => {
    if (isAddingEducation) {
      setForm((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const items = next.profile.education;
        if (items.length > 1) items.pop();
        return next;
      });
    }
    setEditingEducationIndex(null);
    setIsAddingEducation(false);
  };

  const handleReferenceUpdate = (index, field, value) => {
    updateListItem("profile.references", index, field, value);
  };

  const handleReferenceEdit = (index) => {
    setEditingReferenceIndex(index);
    setIsAddingReference(false);
  };

  const handleReferenceDelete = (index) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const items = next.profile.references;
      if (items.length > 1) {
        items.splice(index, 1);
      } else {
        items[0] = emptyReference();
      }
      return next;
    });
    setEditingReferenceIndex(null);
    setIsAddingReference(false);
  };

  const handleReferenceAdd = () => {
    addListItem("profile.references", emptyReference);
    setIsAddingReference(true);
    setEditingReferenceIndex(null);
  };

  const handleReferenceCancel = () => {
    if (isAddingReference) {
      setForm((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const items = next.profile.references;
        if (items.length > 1) items.pop();
        return next;
      });
    }
    setEditingReferenceIndex(null);
    setIsAddingReference(false);
  };

  const profilePhoto =
    form.profile.personalDetails.profilePhoto ||
    form.profile.documents.profilePhoto;

  const stepContent = useMemo(() => {
    const stepId = STEPS[activeStep].id;
    const profile = form.profile;

    if (stepId === "personal") {
      return (
        <div className="profile-grid">
          <div className="profile-photo-card">
            <div className="profile-photo-preview">
              {profilePhoto ? (
                <img src={resolveMediaUrl(profilePhoto)} alt="Profile" />
              ) : (
                <span>{form.firstName?.[0] || "A"}</span>
              )}
            </div>
            <label className="profile-upload-btn">
              Upload photo
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => uploadDocument(e.target.files?.[0], "profilePhoto")}
                hidden
              />
            </label>
            {profilePhoto && (
              <button type="button" className="profile-link-btn" onClick={() => deleteDocument("profilePhoto")}>
                Remove photo
              </button>
            )}
          </div>
          <div className="profile-fields">
            <div className="profile-field-row">
              <label className={errors.firstName ? "has-error" : ""}>
                First name *
                <input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}
              </label>
              <label className={errors.lastName ? "has-error" : ""}>
                Last name *
                <input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}
              </label>
            </div>
            <div className="profile-field-row">
              <label className={errors.email ? "has-error" : ""}>
                Email *
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  autoComplete="email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <label className={errors.phone ? "has-error" : ""}>
                Phone *
                <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </label>
            </div>
            <div className="profile-field-row">
              <label>
                Alternate email
                <input
                  type="email"
                  value={profile.personalDetails.alternateEmail}
                  onChange={(e) => updateField("profile.personalDetails.alternateEmail", e.target.value)}
                />
              </label>
              <label>
                Alternate phone
                <input
                  value={profile.personalDetails.alternatePhone}
                  onChange={(e) => updateField("profile.personalDetails.alternatePhone", e.target.value)}
                />
              </label>
            </div>
            <div className="profile-field-row">
              <label>
                City
                <input
                  value={profile.personalDetails.location.city}
                  onChange={(e) => updateField("profile.personalDetails.location.city", e.target.value)}
                />
              </label>
              <label>
                State / County
                <input
                  value={profile.personalDetails.location.state}
                  onChange={(e) => updateField("profile.personalDetails.location.state", e.target.value)}
                />
              </label>
              <label>
                Country
                <input
                  value={profile.personalDetails.location.country}
                  onChange={(e) => updateField("profile.personalDetails.location.country", e.target.value)}
                />
              </label>
            </div>
            <label>
              Nationality
              <input
                value={profile.personalDetails.nationality}
                onChange={(e) => updateField("profile.personalDetails.nationality", e.target.value)}
              />
            </label>
          </div>
        </div>
      );
    }

    if (stepId === "professional") {
      const pro = profile.professionalProfile;
      return (
        <div className="profile-fields">
          <div className="profile-field-row">
            <label>
              Current job title
              <input value={pro.currentJobTitle} onChange={(e) => updateField("profile.professionalProfile.currentJobTitle", e.target.value)} />
            </label>
            <label>
              Current employer
              <input value={pro.currentEmployer} onChange={(e) => updateField("profile.professionalProfile.currentEmployer", e.target.value)} />
            </label>
          </div>
          <div className="profile-field-row">
            <label className={errors.yearsOfExperience ? "has-error" : ""}>
              Years of experience *
              <input
                type="number"
                min="0"
                value={form.yearsOfExperience}
                onChange={(e) => updateField("yearsOfExperience", e.target.value)}
              />
              {errors.yearsOfExperience && <span className="field-error">{errors.yearsOfExperience}</span>}
            </label>
            <label className={errors.educationLevel ? "has-error" : ""}>
              Highest education level *
              <select value={form.educationLevel} onChange={(e) => updateField("educationLevel", e.target.value)}>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>
            </label>
            <label>
              Career level
              <select value={pro.careerLevel} onChange={(e) => updateField("profile.professionalProfile.careerLevel", e.target.value)}>
                <option value="">Select level</option>
                <option value="Entry">Entry</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Executive">Executive</option>
              </select>
            </label>
          </div>
          <label>
            Professional summary
            <textarea
              rows={5}
              value={pro.professionalSummary}
              onChange={(e) => updateField("profile.professionalProfile.professionalSummary", e.target.value)}
              placeholder="Brief overview of your experience, strengths, and career goals"
            />
          </label>
          <div className="profile-field-row">
            <label>
              Availability
              <input value={pro.availability} onChange={(e) => updateField("profile.professionalProfile.availability", e.target.value)} placeholder="e.g. Immediate, 30 days notice" />
            </label>
            <label>
              Expected salary
              <input
                type="number"
                value={pro.expectedSalary.amount}
                onChange={(e) => updateField("profile.professionalProfile.expectedSalary.amount", e.target.value)}
              />
            </label>
            <label>
              Currency
              <input value={pro.expectedSalary.currency} onChange={(e) => updateField("profile.professionalProfile.expectedSalary.currency", e.target.value)} />
            </label>
          </div>
          <fieldset className="profile-check-group">
            <legend>Work preferences</legend>
            <label className="profile-check">
              <input type="checkbox" checked={pro.workPreferences.remote} onChange={(e) => updateField("profile.professionalProfile.workPreferences.remote", e.target.checked)} />
              Remote
            </label>
            <label className="profile-check">
              <input type="checkbox" checked={pro.workPreferences.hybrid} onChange={(e) => updateField("profile.professionalProfile.workPreferences.hybrid", e.target.checked)} />
              Hybrid
            </label>
            <label className="profile-check">
              <input type="checkbox" checked={pro.workPreferences.onsite} onChange={(e) => updateField("profile.professionalProfile.workPreferences.onsite", e.target.checked)} />
              On-site
            </label>
          </fieldset>
        </div>
      );
    }

    if (stepId === "education") {
      return (
        <div className="profile-fields">
          {errors.education && <p className="field-error block">{errors.education}</p>}
          <EducationSection
            entries={profile.education}
            errors={errors}
            editingIndex={editingEducationIndex}
            isAddingNew={isAddingEducation}
            onUpdate={handleEducationUpdate}
            onEdit={handleEducationEdit}
            onDelete={handleEducationDelete}
            onAddNew={handleEducationAdd}
            onCancelEdit={handleEducationCancel}
          />
        </div>
      );
    }

    if (stepId === "experience") {
      return (
        <div className="profile-fields">
          {errors.experience && <p className="field-error block">{errors.experience}</p>}
          <WorkExperienceSection
            experiences={profile.workExperience}
            errors={errors}
            editingIndex={editingExperienceIndex}
            isAddingNew={isAddingExperience}
            onUpdate={handleExperienceUpdate}
            onEdit={handleExperienceEdit}
            onDelete={handleExperienceDelete}
            onAddNew={handleExperienceAdd}
            onCancelEdit={handleExperienceCancel}
          />
        </div>
      );
    }

    if (stepId === "skills") {
      return (
        <div className="profile-fields">
          <SkillsSection
            skills={profile.skills}
            errors={errors}
            onUpdate={(index, field, value) => updateListItem("profile.skills", index, field, value)}
            onRemove={(index) => removeListItem("profile.skills", index)}
            onAdd={() => addListItem("profile.skills", emptySkill)}
          />
        </div>
      );
    }

    if (stepId === "certifications") {
      return (
        <div className="profile-fields">
          <CertificationsSection
            certifications={profile.certifications}
            errors={errors}
            uploading={uploading}
            onUpdate={(index, field, value) => updateListItem("profile.certifications", index, field, value)}
            onRemove={(index) => removeListItem("profile.certifications", index)}
            onAdd={() => addListItem("profile.certifications", emptyCertification)}
            onUpload={(index, file, name) =>
              uploadDocument(file, "certificate", { certificateIndex: index, name: name || file.name })
            }
            onRemoveCertificate={(index) => deleteDocument("certificate", `?certificateIndex=${index}`)}
          />
        </div>
      );
    }

    if (stepId === "languages") {
      return (
        <div className="profile-fields">
          <LanguagesSection
            languages={profile.languages}
            errors={errors}
            onUpdate={(index, field, value) => updateListItem("profile.languages", index, field, value)}
            onRemove={(index) => removeListItem("profile.languages", index)}
            onAdd={() => addListItem("profile.languages", emptyLanguage)}
          />
        </div>
      );
    }

    if (stepId === "documents") {
      const docs = profile.documents;
      return (
        <div className="profile-fields">
          {[
            { key: "cv", label: "CV / Resume", path: docs.cvPath, accept: ".pdf,.doc,.docx" },
            { key: "coverLetter", label: "Cover Letter", path: docs.coverLetterPath, accept: ".pdf,.doc,.docx" },
          ].map((doc) => (
            <div className="profile-doc-card" key={doc.key}>
              <div>
                <h3>{doc.label}</h3>
                <p>{doc.path ? "File uploaded" : "PDF, DOC, or DOCX up to 5MB"}</p>
              </div>
              <div className="profile-doc-actions">
                {doc.path && (
                  <a href={resolveMediaUrl(doc.path)} target="_blank" rel="noreferrer" className="profile-link-btn">
                    View
                  </a>
                )}
                <label className="profile-upload-btn small">
                  {doc.path ? "Replace" : "Upload"}
                  <input type="file" accept={doc.accept} onChange={(e) => uploadDocument(e.target.files?.[0], doc.key)} hidden />
                </label>
                {doc.path && (
                  <button type="button" className="profile-link-btn danger" onClick={() => deleteDocument(doc.key)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="profile-doc-card">
            <div>
              <h3>Supporting documents</h3>
              <p>Optional additional documents (PDF, DOC, DOCX)</p>
            </div>
            <label className="profile-upload-btn small">
              Add document
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => uploadDocument(e.target.files?.[0], "supporting")} hidden />
            </label>
          </div>
          {(docs.supportingDocuments || []).map((doc, index) => (
            <div className="profile-doc-row" key={`support-${index}`}>
              <span>{doc.name || `Document ${index + 1}`}</span>
              <div className="profile-doc-actions">
                <a href={resolveMediaUrl(doc.path)} target="_blank" rel="noreferrer" className="profile-link-btn">
                  View
                </a>
                <button
                  type="button"
                  className="profile-link-btn danger"
                  onClick={() => deleteDocument("supporting", `?supportingIndex=${index}`)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (stepId === "links") {
      const links = profile.links;
      return (
        <div className="profile-fields">
          <div className="profile-field-row">
            <label>
              LinkedIn
              <input value={links.linkedin} onChange={(e) => updateField("profile.links.linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </label>
            <label>
              GitHub
              <input value={links.github} onChange={(e) => updateField("profile.links.github", e.target.value)} placeholder="https://github.com/..." />
            </label>
          </div>
          <div className="profile-field-row">
            <label>
              Personal website
              <input value={links.website} onChange={(e) => updateField("profile.links.website", e.target.value)} />
            </label>
            <label>
              Portfolio
              <input value={links.portfolio} onChange={(e) => updateField("profile.links.portfolio", e.target.value)} />
            </label>
          </div>
          {(links.other || []).map((item, index) => (
            <div className="profile-field-row" key={`link-${index}`}>
              <label>
                Label
                <input value={item.label} onChange={(e) => updateListItem("profile.links.other", index, "label", e.target.value)} />
              </label>
              <label>
                URL
                <input value={item.url} onChange={(e) => updateListItem("profile.links.other", index, "url", e.target.value)} />
              </label>
              <button type="button" className="profile-link-btn" onClick={() => removeListItem("profile.links.other", index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="profile-secondary-btn" onClick={() => addListItem("profile.links.other", emptyLink)}>
            Add another link
          </button>
        </div>
      );
    }

    if (stepId === "references") {
      return (
        <div className="profile-fields">
          <ReferencesSection
            references={profile.references}
            errors={errors}
            editingIndex={editingReferenceIndex}
            isAddingNew={isAddingReference}
            onUpdate={handleReferenceUpdate}
            onEdit={handleReferenceEdit}
            onDelete={handleReferenceDelete}
            onAddNew={handleReferenceAdd}
            onCancelEdit={handleReferenceCancel}
          />
        </div>
      );
    }

    if (stepId === "preferences") {
      const prefs = profile.jobPreferences;
      return (
        <div className="profile-fields">
          <label>
            Desired role
            <input value={prefs.desiredRole} onChange={(e) => updateField("profile.jobPreferences.desiredRole", e.target.value)} />
          </label>
          <div className="profile-tag-input">
            <label>
              Preferred locations
              <div className="profile-tag-row">
                <input
                  value={preferredLocationInput}
                  onChange={(e) => setPreferredLocationInput(e.target.value)}
                  placeholder="Add a location and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = preferredLocationInput.trim();
                      if (!value) return;
                      updateField("profile.jobPreferences.preferredLocations", [...prefs.preferredLocations, value]);
                      setPreferredLocationInput("");
                    }
                  }}
                />
              </div>
            </label>
            <div className="profile-tags">
              {prefs.preferredLocations.map((loc, index) => (
                <button
                  type="button"
                  key={`${loc}-${index}`}
                  className="profile-tag"
                  onClick={() =>
                    updateField(
                      "profile.jobPreferences.preferredLocations",
                      prefs.preferredLocations.filter((_, i) => i !== index)
                    )
                  }
                >
                  {loc} ×
                </button>
              ))}
            </div>
          </div>
          <div className="profile-field-row">
            <label>
              Work arrangement
              <select value={prefs.workArrangement} onChange={(e) => updateField("profile.jobPreferences.workArrangement", e.target.value)}>
                <option value="">Select arrangement</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Flexible">Flexible</option>
              </select>
            </label>
            <label>
              Employment type
              <select value={prefs.employmentType} onChange={(e) => updateField("profile.jobPreferences.employmentType", e.target.value)}>
                <option value="">Select type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Any">Any</option>
              </select>
            </label>
          </div>
          <div className="profile-field-row">
            <label>
              Salary min
              <input type="number" value={prefs.salaryExpectations.min} onChange={(e) => updateField("profile.jobPreferences.salaryExpectations.min", e.target.value)} />
            </label>
            <label>
              Salary max
              <input type="number" value={prefs.salaryExpectations.max} onChange={(e) => updateField("profile.jobPreferences.salaryExpectations.max", e.target.value)} />
            </label>
            <label>
              Currency
              <input value={prefs.salaryExpectations.currency} onChange={(e) => updateField("profile.jobPreferences.salaryExpectations.currency", e.target.value)} />
            </label>
          </div>
          <div className="profile-field-row profile-field-row-2">
            <label className="profile-toggle-check">
              <input
                type="checkbox"
                checked={prefs.willingToRelocate}
                onChange={(e) => updateField("profile.jobPreferences.willingToRelocate", e.target.checked)}
              />
              <span>Willing to relocate</span>
            </label>
            <label>
              Travel availability
              <input value={prefs.travelAvailability} onChange={(e) => updateField("profile.jobPreferences.travelAvailability", e.target.value)} />
            </label>
          </div>
        </div>
      );
    }

    return null;
  }, [
    activeStep,
    form,
    errors,
    profilePhoto,
    preferredLocationInput,
    completion,
    uploading,
    editingExperienceIndex,
    isAddingExperience,
    editingEducationIndex,
    isAddingEducation,
    editingReferenceIndex,
    isAddingReference,
  ]);

  if (!isLoggedIn) {
    return <Navigate to="/recruitment/auth" replace />;
  }

  if (loading) {
    return <PageLoader label="Loading your profile..." />;
  }

  const currentStep = STEPS[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <div className="applicant-page profile-page">
      <div className="profile-hero">
        <div>
          <h1>Candidate Profile</h1>
          <p className="subtitle">
            Build your reusable candidate profile once and use it across all TUC job applications.
          </p>
        </div>
        <div className="profile-completion-card">
          <div className="profile-completion-ring" style={{ "--progress": `${completion}%` }}>
            <span>{completion}%</span>
          </div>
          <div>
            <strong>Profile completion</strong>
            <p>{completion >= 80 ? "Great progress — you're almost ready to apply." : "Keep going — a complete profile improves your chances."}</p>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-steps" aria-label="Profile sections">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const complete = isStepComplete(step.id, form);
            const isActive = index === activeStep;
            const statusClass = isActive ? "active" : complete ? "complete" : "incomplete";
            return (
              <button
                key={step.id}
                type="button"
                className={`profile-step-btn ${statusClass}`}
                onClick={() => setActiveStep(index)}
              >
                <span className="profile-step-icon-wrap" aria-hidden="true">
                  {complete && !isActive ? <FaCheckCircle className="profile-step-check" /> : <Icon />}
                </span>
                <span className="profile-step-label">
                  <span>{step.label}</span>
                  <small>{complete ? "Complete" : isActive ? "In progress" : "Incomplete"}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="profile-panel">
          <header className="profile-panel-header">
            <div>
              <StepIcon aria-hidden="true" />
              <div>
                <h2>{currentStep.label}</h2>
                <p>
                  Step {activeStep + 1} of {STEPS.length}
                </p>
              </div>
            </div>
            {saveMessage && (
              <p
                className={`profile-save-message ${
                  saveMessage.includes("success") || saveMessage.includes("uploaded") || saveMessage.includes("removed")
                    ? "success"
                    : saveMessage.includes("need your attention") || saveMessage.includes("Unable") || saveMessage.includes("failed")
                      ? "error"
                      : ""
                }`}
              >
                {saveMessage}
              </p>
            )}
          </header>

          <div className="profile-panel-body">{stepContent}</div>

          <footer className="profile-panel-footer">
            <button type="button" className="profile-secondary-btn" onClick={handlePrevious} disabled={activeStep === 0}>
              <FaChevronLeft aria-hidden="true" />
              Previous
            </button>
            <div className="profile-footer-actions">
              <button type="button" className="profile-secondary-btn" onClick={() => saveProfile()} disabled={saving || uploading}>
                <FaSave aria-hidden="true" />
                {saving ? "Saving..." : "Save"}
              </button>
              {activeStep < STEPS.length - 1 ? (
                <button type="button" className="profile-primary-btn" onClick={handleNext} disabled={saving || uploading}>
                  Save & Continue
                  <FaChevronRight aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className="profile-primary-btn"
                  onClick={() => saveProfile()}
                  disabled={saving || uploading}
                >
                  <FaCheckCircle aria-hidden="true" />
                  Save Profile
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>

      <p className="profile-footer-note">
        Changes are auto-saved as you work. You can also browse <Link to="/recruitment/browse">open positions</Link> anytime.
      </p>
    </div>
  );
};

export default ApplicantProfile;
