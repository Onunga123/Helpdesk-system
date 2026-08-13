import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaFileAlt,
  FaQuestionCircle,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../../api/axios";
import PageLoader from "../../components/ui/PageLoader";
import WorkExperienceSection from "../../components/recruitment/WorkExperienceSection";
import {
  buildProfilePayload,
  emptyEducation,
  emptyExperience,
  normalizeApplicantProfile,
} from "../../lib/applicantProfile";
import {
  getValidationSummary,
  hasExperienceContent,
  isExperienceComplete,
  validateExperienceEntry,
} from "../../utils/profileFormUtils";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import "../../styles/applicant-profile.css";
import "../../styles/applicant-application.css";

const STEPS = [
  { id: "summary", label: "Job Summary", icon: FaClipboardCheck },
  { id: "personal", label: "Personal Information", icon: FaUser },
  { id: "experience", label: "Education & Experience", icon: FaClipboardCheck },
  { id: "cv", label: "CV / Resume", icon: FaFileAlt },
  { id: "cover", label: "Cover Letter", icon: FaFileAlt },
  { id: "questions", label: "Application Questions", icon: FaQuestionCircle },
  { id: "review", label: "Review Application", icon: FaClipboardCheck },
  { id: "consent", label: "Consent & Declarations", icon: FaShieldAlt },
  { id: "submit", label: "Submit Application", icon: FaCheckCircle },
];

const defaultConsent = {
  privacyConsent: false,
  accuracyDeclaration: false,
  verificationAuthorization: false,
};

const validateStep = (stepId, state) => {
  const errors = {};
  const { profileForm, selectedCvPath, coverLetterMode, coverLetterText, coverLetterPath, questions, consent } = state;

  if (stepId === "personal") {
    if (!profileForm.firstName?.trim()) errors.firstName = "First name is required";
    if (!profileForm.lastName?.trim()) errors.lastName = "Last name is required";
    if (!profileForm.email?.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      errors.email = "Enter a valid email address";
    }
    if (!profileForm.phone?.trim()) errors.phone = "Phone is required";
  }

  if (stepId === "experience") {
    const entries = profileForm.profile.workExperience || [];
    entries.forEach((item, index) => {
      Object.assign(errors, validateExperienceEntry(item, index));
      if (hasExperienceContent(item) && !isExperienceComplete(item)) {
        errors[`experience-${index}-incomplete`] = "Complete all required fields for this work experience entry.";
      }
    });

    const hasEducation = profileForm.profile.education.some(
      (item) => item.institution?.trim() && item.qualification?.trim()
    );
    const hasCompleteExperience = entries.some(isExperienceComplete);

    if (!hasEducation && !hasCompleteExperience) {
      errors.experience =
        "Add at least one education record or a complete work experience with employer, job title, employment type, and dates.";
    }
  }

  if (stepId === "cv") {
    if (!selectedCvPath) errors.cv = "Please select or upload a CV/Resume";
  }

  if (stepId === "cover") {
    if (coverLetterMode === "text" && !coverLetterText.trim()) {
      errors.coverLetter = "Please write your cover letter";
    }
    if (coverLetterMode === "upload" && !coverLetterPath) {
      errors.coverLetter = "Please upload your cover letter";
    }
  }

  if (stepId === "questions") {
    questions.forEach((item, index) => {
      if (item.required !== false && !item.answer?.trim()) {
        errors[`question-${index}`] = "This question is required";
      }
    });
  }

  if (stepId === "consent") {
    if (!consent.privacyConsent) errors.privacyConsent = "Privacy consent is required";
    if (!consent.accuracyDeclaration) errors.accuracyDeclaration = "Accuracy declaration is required";
    if (!consent.verificationAuthorization) errors.verificationAuthorization = "Verification authorization is required";
  }

  return errors;
};

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("applicantToken"));
  const applicantId = localStorage.getItem("applicantId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [job, setJob] = useState(null);
  const [profileForm, setProfileForm] = useState(normalizeApplicantProfile());
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedCvPath, setSelectedCvPath] = useState("");
  const [coverLetterMode, setCoverLetterMode] = useState("text");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [coverLetterPath, setCoverLetterPath] = useState("");
  const [consent, setConsent] = useState(defaultConsent);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const profileFormRef = useRef(profileForm);

  useEffect(() => {
    profileFormRef.current = profileForm;
  }, [profileForm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, formRes] = await Promise.all([
        API.get("/recruitment/applicants/me"),
        API.get(`/recruitment/applications/form/job/${jobId}`),
      ]);

      const normalized = normalizeApplicantProfile(profileRes.data.data);
      setProfileForm(normalized);
      setProfileCompletion(profileRes.data.data?.profileCompletion ?? 0);
      setSelectedCvPath(normalized.profile.documents.cvPath || "");
      setJob(formRes.data.data.job);
      setQuestions(formRes.data.data.screeningQuestions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load application form");
      navigate("/recruitment/browse");
    } finally {
      setLoading(false);
    }
  }, [jobId, navigate]);

  useEffect(() => {
    if (isLoggedIn && jobId) loadData();
  }, [isLoggedIn, jobId, loadData]);

  useEffect(() => {
    if (STEPS[activeStep]?.id !== "experience") {
      setEditingExperienceIndex(null);
      setIsAddingExperience(false);
    }
  }, [activeStep]);

  const updateField = (path, value) => {
    setProfileForm((prev) => {
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
  };

  const updateListItem = (listPath, index, field, value) => {
    setProfileForm((prev) => {
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
      return next;
    });
  };

  const addListItem = (listPath, factory) => {
    setProfileForm((prev) => {
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

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await API.put(
        "/recruitment/applicants/me",
        buildProfilePayload(profileFormRef.current)
      );
      setProfileCompletion(data.data?.profileCompletion ?? profileCompletion);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save profile");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const stepId = STEPS[activeStep].id;
    const stepErrors = validateStep(stepId, {
      profileForm: profileFormRef.current,
      selectedCvPath,
      coverLetterMode,
      coverLetterText,
      coverLetterPath,
      questions,
      consent,
    });

    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      const summary = getValidationSummary(stepId, stepErrors);
      toast.error(summary || "Please complete the required fields before continuing.");
      return;
    }

    setErrors({});
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));

    if (["personal", "experience"].includes(stepId)) {
      const saved = await saveProfile();
      if (!saved) {
        toast.error("Your changes could not be saved. Please review this step and try again.");
      }
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
    setProfileForm((prev) => {
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
      setProfileForm((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const items = next.profile.workExperience;
        if (items.length > 1) items.pop();
        return next;
      });
    }
    setEditingExperienceIndex(null);
    setIsAddingExperience(false);
  };

  const uploadDocument = async (file, documentType) => {
    if (!file) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", file);
      const { data } = await API.post(
        `/recruitment/applicants/me/documents?documentType=${encodeURIComponent(documentType)}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data.data.path;
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep("consent", {
      profileForm,
      selectedCvPath,
      coverLetterMode,
      coverLetterText,
      coverLetterPath,
      questions,
      consent,
    });

    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      setActiveStep(STEPS.findIndex((step) => step.id === "consent"));
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await API.post("/recruitment/applications", {
        jobId,
        applicantId,
        cvPath: selectedCvPath,
        coverLetter: coverLetterMode === "text" ? coverLetterText.trim() : "",
        coverLetterPath: coverLetterMode === "upload" ? coverLetterPath : "",
        applicationQuestions: questions.map(({ question, answer }) => ({ question, answer: answer.trim() })),
        consent,
        profileUpdates: buildProfilePayload(profileForm),
      });
      setSubmitted(true);
      setActiveStep(STEPS.length - 1);
      toast.success("Application submitted successfully");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit application";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => Math.round(((activeStep + 1) / STEPS.length) * 100), [activeStep]);

  const stepContent = useMemo(() => {
    const stepId = STEPS[activeStep].id;
    const profile = profileForm.profile;

    if (stepId === "summary" && job) {
      return (
        <div className="app-step-card">
          <div className="app-job-banner">
            <span className="app-job-badge">Applying for</span>
            <h2>{job.jobTitle}</h2>
            <p>{job.department} · {job.jobType}</p>
          </div>
          <div className="app-summary-grid">
            <div>
              <h3>About this role</h3>
              <p>{job.description}</p>
            </div>
            <div>
              <h3>Requirements</h3>
              <p>{job.requirements}</p>
            </div>
            <div>
              <h3>Deadline</h3>
              <p>{new Date(job.deadline).toLocaleDateString()}</p>
            </div>
          </div>
          <p className="app-step-note">
            Your saved profile will be used for this application. You can review and update details in the next steps.
            Profile completion: <strong>{profileCompletion}%</strong>
          </p>
          <Link to="/recruitment/profile" className="app-inline-link">Update master profile</Link>
        </div>
      );
    }

    if (stepId === "personal") {
      const personal = profile.personalDetails;
      return (
        <div className="app-fields">
          <p className="app-step-note">Review your personal details from your master profile. Changes here will update your profile.</p>
          <div className="app-field-row">
            <label className={errors.firstName ? "has-error" : ""}>
              First name *
              <input value={profileForm.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </label>
            <label className={errors.lastName ? "has-error" : ""}>
              Last name *
              <input value={profileForm.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </label>
          </div>
          <div className="app-field-row">
            <label className={errors.email ? "has-error" : ""}>
              Email *
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <label className={errors.phone ? "has-error" : ""}>
              Phone *
              <input value={profileForm.phone} onChange={(e) => updateField("phone", e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
          </div>
          <div className="app-field-row">
            <label>
              City
              <input value={personal.location.city} onChange={(e) => updateField("profile.personalDetails.location.city", e.target.value)} />
            </label>
            <label>
              Country
              <input value={personal.location.country} onChange={(e) => updateField("profile.personalDetails.location.country", e.target.value)} />
            </label>
            <label>
              Nationality
              <input value={personal.nationality} onChange={(e) => updateField("profile.personalDetails.nationality", e.target.value)} />
            </label>
          </div>
          <div className="app-field-row">
            <label>
              Current job title
              <input value={profile.professionalProfile.currentJobTitle} onChange={(e) => updateField("profile.professionalProfile.currentJobTitle", e.target.value)} />
            </label>
            <label>
              Years of experience
              <input type="number" min="0" value={profileForm.yearsOfExperience} onChange={(e) => updateField("yearsOfExperience", e.target.value)} />
            </label>
          </div>
        </div>
      );
    }

    if (stepId === "experience") {
      return (
        <div className="app-fields">
          <p className="app-step-note">Confirm your education and work experience. Add or edit records as needed.</p>
          {errors.experience && <p className="field-error block">{errors.experience}</p>}

          <h3 className="app-section-title">Education</h3>
          {profile.education.map((item, index) => (
            <div className="app-repeat-card" key={`edu-${index}`}>
              <div className="app-field-row">
                <label>
                  Institution
                  <input value={item.institution} onChange={(e) => updateListItem("profile.education", index, "institution", e.target.value)} />
                </label>
                <label>
                  Qualification
                  <input value={item.qualification} onChange={(e) => updateListItem("profile.education", index, "qualification", e.target.value)} />
                </label>
              </div>
            </div>
          ))}
          <button type="button" className="app-secondary-btn" onClick={() => addListItem("profile.education", emptyEducation)}>
            Add education
          </button>

          <h3 className="app-section-title">Work experience</h3>
          <div className="profile-fields">
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
        </div>
      );
    }

    if (stepId === "cv") {
      const cvPath = profile.documents.cvPath;
      return (
        <div className="app-fields">
          <p className="app-step-note">Select the CV/Resume to submit with this application.</p>
          {errors.cv && <p className="field-error block">{errors.cv}</p>}
          <div className={`app-select-card ${selectedCvPath === cvPath && cvPath ? "selected" : ""}`}>
            <div>
              <strong>Profile CV</strong>
              <p>{cvPath ? "Use the CV saved in your profile" : "No CV uploaded in your profile yet"}</p>
            </div>
            <div className="app-card-actions">
              {cvPath && (
                <a href={resolveMediaUrl(cvPath)} target="_blank" rel="noreferrer" className="app-inline-link">
                  View
                </a>
              )}
              {cvPath && (
                <button type="button" className="app-primary-btn small" onClick={() => setSelectedCvPath(cvPath)}>
                  {selectedCvPath === cvPath ? "Selected" : "Select"}
                </button>
              )}
            </div>
          </div>
          <label className="app-upload-btn">
            Upload new CV for profile
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={async (e) => {
                const path = await uploadDocument(e.target.files?.[0], "cv");
                if (path) {
                  updateField("profile.documents.cvPath", path);
                  setSelectedCvPath(path);
                }
              }}
            />
          </label>
        </div>
      );
    }

    if (stepId === "cover") {
      return (
        <div className="app-fields">
          <p className="app-step-note">This cover letter is specific to this job application.</p>
          {errors.coverLetter && <p className="field-error block">{errors.coverLetter}</p>}
          <div className="app-toggle-row">
            <button type="button" className={coverLetterMode === "text" ? "active" : ""} onClick={() => setCoverLetterMode("text")}>
              Write cover letter
            </button>
            <button type="button" className={coverLetterMode === "upload" ? "active" : ""} onClick={() => setCoverLetterMode("upload")}>
              Upload document
            </button>
          </div>
          {coverLetterMode === "text" ? (
            <label>
              Cover letter *
              <textarea
                rows={8}
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder={`Explain why you are a strong fit for ${job?.jobTitle || "this role"}...`}
              />
            </label>
          ) : (
            <div className="app-upload-panel">
              <p>{coverLetterPath ? "Cover letter document uploaded" : "Upload PDF, DOC, or DOCX"}</p>
              <label className="app-upload-btn">
                {coverLetterPath ? "Replace file" : "Upload cover letter"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  hidden
                  onChange={async (e) => {
                    const path = await uploadDocument(e.target.files?.[0], "applicationDocument");
                    if (path) setCoverLetterPath(path);
                  }}
                />
              </label>
              {coverLetterPath && (
                <a href={resolveMediaUrl(coverLetterPath)} target="_blank" rel="noreferrer" className="app-inline-link">
                  View uploaded file
                </a>
              )}
            </div>
          )}
        </div>
      );
    }

    if (stepId === "questions") {
      return (
        <div className="app-fields">
          <p className="app-step-note">Answer the screening questions for this vacancy.</p>
          {questions.map((item, index) => (
            <label key={`q-${index}`} className={errors[`question-${index}`] ? "has-error" : ""}>
              {item.question}{item.required !== false ? " *" : ""}
              <textarea
                rows={3}
                value={item.answer}
                onChange={(e) =>
                  setQuestions((prev) =>
                    prev.map((q, i) => (i === index ? { ...q, answer: e.target.value } : q))
                  )
                }
              />
              {errors[`question-${index}`] && <span className="field-error">{errors[`question-${index}`]}</span>}
            </label>
          ))}
        </div>
      );
    }

    if (stepId === "review") {
      return (
        <div className="app-review">
          <div className="app-review-section">
            <h3>Position</h3>
            <p>{job?.jobTitle}</p>
          </div>
          <div className="app-review-section">
            <h3>Applicant</h3>
            <p>{profileForm.firstName} {profileForm.lastName} · {profileForm.email} · {profileForm.phone}</p>
          </div>
          <div className="app-review-section">
            <h3>CV / Resume</h3>
            <p>{selectedCvPath ? "CV selected" : "No CV selected"}</p>
          </div>
          <div className="app-review-section">
            <h3>Cover letter</h3>
            <p>
              {coverLetterMode === "text"
                ? coverLetterText.trim() || "Not provided"
                : coverLetterPath
                  ? "Uploaded document"
                  : "Not provided"}
            </p>
          </div>
          <div className="app-review-section">
            <h3>Screening answers</h3>
            {questions.map((item, index) => (
              <div key={`review-q-${index}`} className="app-review-item">
                <strong>{item.question}</strong>
                <p>{item.answer || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (stepId === "consent") {
      return (
        <div className="app-fields consent-fields">
          <label className={`app-consent ${errors.privacyConsent ? "has-error" : ""}`}>
            <input type="checkbox" checked={consent.privacyConsent} onChange={(e) => setConsent((p) => ({ ...p, privacyConsent: e.target.checked }))} />
            <span>I consent to Turkana University College processing my personal data for this recruitment process.</span>
          </label>
          <label className={`app-consent ${errors.accuracyDeclaration ? "has-error" : ""}`}>
            <input type="checkbox" checked={consent.accuracyDeclaration} onChange={(e) => setConsent((p) => ({ ...p, accuracyDeclaration: e.target.checked }))} />
            <span>I declare that all information in this application is true and accurate.</span>
          </label>
          <label className={`app-consent ${errors.verificationAuthorization ? "has-error" : ""}`}>
            <input type="checkbox" checked={consent.verificationAuthorization} onChange={(e) => setConsent((p) => ({ ...p, verificationAuthorization: e.target.checked }))} />
            <span>I authorize TUC HR to verify my credentials and references for this application.</span>
          </label>
        </div>
      );
    }

    if (stepId === "submit") {
      if (submitted) {
        return (
          <div className="app-success">
            <FaCheckCircle aria-hidden="true" />
            <h2>Application submitted</h2>
            <p>Your application for <strong>{job?.jobTitle}</strong> has been received.</p>
            <div className="app-success-actions">
              <Link to="/recruitment/applications" className="app-primary-btn">View my applications</Link>
              <Link to="/recruitment/browse" className="app-secondary-btn">Browse more jobs</Link>
            </div>
          </div>
        );
      }

      return (
        <div className="app-fields">
          <p className="app-step-note">Ready to submit your application for <strong>{job?.jobTitle}</strong>?</p>
          {submitError && <p className="field-error block">{submitError}</p>}
          <button type="button" className="app-primary-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </div>
      );
    }

    return null;
  }, [
    activeStep,
    job,
    profileForm,
    profileCompletion,
    selectedCvPath,
    coverLetterMode,
    coverLetterText,
    coverLetterPath,
    questions,
    consent,
    errors,
    submitted,
    submitError,
    submitting,
    editingExperienceIndex,
    isAddingExperience,
  ]);

  if (!isLoggedIn) {
    sessionStorage.setItem("pendingJobId", jobId);
    return <Navigate to="/recruitment/auth" replace />;
  }

  if (!applicantId) {
    return <Navigate to="/recruitment/auth" replace />;
  }

  if (loading) {
    return <PageLoader label="Preparing your application..." />;
  }

  const currentStep = STEPS[activeStep];
  const StepIcon = currentStep.icon;
  const isFinalSubmitted = submitted && activeStep === STEPS.length - 1;

  return (
    <div className="applicant-page app-page">
      <div className="app-hero">
        <div>
          <span className="app-flow-badge">Job Application</span>
          <h1>{job?.jobTitle || "Apply for position"}</h1>
          <p className="subtitle">Complete this application for this specific vacancy. Your master profile is used as the starting point.</p>
        </div>
        <div className="app-progress-card">
          <div className="app-progress-bar">
            <div className="app-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p>Step {activeStep + 1} of {STEPS.length} · {progress}% complete</p>
        </div>
      </div>

      <div className="app-layout">
        <aside className="app-steps" aria-label="Application steps">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const done = index < activeStep || (submitted && step.id === "submit");
            return (
              <button
                key={step.id}
                type="button"
                className={`app-step-btn ${index === activeStep ? "active" : ""} ${done ? "done" : ""}`}
                onClick={() => !submitted && setActiveStep(index)}
                disabled={submitted && step.id !== "submit"}
              >
                <Icon aria-hidden="true" />
                <span>{step.label}</span>
              </button>
            );
          })}
        </aside>

        <section className="app-panel">
          <header className="app-panel-header">
            <StepIcon aria-hidden="true" />
            <div>
              <h2>{currentStep.label}</h2>
              <p>{currentStep.id === "summary" ? "Review the vacancy details" : `Application for ${job?.jobTitle}`}</p>
            </div>
          </header>

          <div className="app-panel-body">{stepContent}</div>

          {!isFinalSubmitted && (
            <footer className="app-panel-footer">
              <button type="button" className="app-secondary-btn" onClick={handlePrevious} disabled={activeStep === 0 || submitting}>
                <FaChevronLeft aria-hidden="true" />
                Previous
              </button>
              <div className="app-footer-actions">
                {currentStep.id === "consent" ? (
                  <button type="button" className="app-primary-btn" onClick={handleNext} disabled={saving || uploading}>
                    Continue to submit
                    <FaChevronRight aria-hidden="true" />
                  </button>
                ) : currentStep.id === "submit" ? null : (
                  <button type="button" className="app-primary-btn" onClick={handleNext} disabled={saving || uploading || submitting}>
                    {saving ? "Saving..." : "Save & Continue"}
                    <FaChevronRight aria-hidden="true" />
                  </button>
                )}
              </div>
            </footer>
          )}
        </section>
      </div>
    </div>
  );
};

export default JobApplication;
