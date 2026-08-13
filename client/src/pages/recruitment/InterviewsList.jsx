import React, { useState, useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import "../../styles/recruitment.css";

const initialInterviewForm = {
  applicationId: "",
  interviewDate: "",
  interviewTime: "",
  location: "Physical",
  interviewType: "In-Person",
  meetingLink: "",
};

const RECOMMENDATIONS = ["Proceed", "Reject", "On Hold"];

const formatApplicationLabel = (application) => {
  const applicant = application.applicantId;
  const job = application.jobId;
  const name = applicant ? `${applicant.firstName} ${applicant.lastName}` : "Unknown applicant";
  const jobTitle = job?.jobTitle || "Unknown role";
  return `${name} — ${jobTitle} (${application.status})`;
};

const getApplicantLabel = (interview) => {
  const applicant = interview.applicationId?.applicantId;
  if (!applicant) return "Unknown applicant";
  return `${applicant.firstName} ${applicant.lastName}`;
};

const getJobTitle = (interview) => interview.applicationId?.jobId?.jobTitle || "Unknown role";

const InterviewsList = () => {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialInterviewForm);
  const [createError, setCreateError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [completeForm, setCompleteForm] = useState({ interviewNotes: "", recommendation: "Proceed" });
  const [cancelReason, setCancelReason] = useState("");
  const [outcomeForm, setOutcomeForm] = useState({ interviewNotes: "", recommendation: "Proceed" });
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, [filters]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);

      const response = await axios.get(`/recruitment/interviews?${params}`);
      setInterviews(response.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get("/recruitment/applications");
      setApplications(response.data.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load applications");
    }
  };

  const openCreateModal = async () => {
    setCreateForm(initialInterviewForm);
    setCreateError("");
    setShowCreate(true);
    await fetchApplications();
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setCreateForm(initialInterviewForm);
    setCreateError("");
  };

  const closeActionModal = () => {
    setActiveModal(null);
    setSelectedInterview(null);
    setCompleteForm({ interviewNotes: "", recommendation: "Proceed" });
    setCancelReason("");
    setOutcomeForm({ interviewNotes: "", recommendation: "Proceed" });
    setModalError("");
  };

  const openCompleteModal = (interview) => {
    setSelectedInterview(interview);
    setCompleteForm({ interviewNotes: "", recommendation: "Proceed" });
    setModalError("");
    setActiveModal("complete");
  };

  const openCancelModal = (interview) => {
    setSelectedInterview(interview);
    setCancelReason("");
    setModalError("");
    setActiveModal("cancel");
  };

  const openDetailsModal = (interview) => {
    setSelectedInterview(interview);
    setModalError("");
    setActiveModal("details");
  };

  const openOutcomeModal = (interview) => {
    setSelectedInterview(interview);
    setOutcomeForm({
      interviewNotes: interview.interviewNotes || "",
      recommendation: interview.recommendation || "Proceed",
    });
    setModalError("");
    setActiveModal("outcome");
  };

  const onScheduleInterview = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!createForm.applicationId || !createForm.interviewDate || !createForm.interviewTime || !createForm.location || !createForm.interviewType) {
      setCreateError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/recruitment/interviews", {
        applicationId: createForm.applicationId,
        interviewDate: createForm.interviewDate,
        interviewTime: createForm.interviewTime,
        location: createForm.location,
        interviewType: createForm.interviewType,
        meetingLink: createForm.meetingLink.trim() || undefined,
      });
      toast.success("Interview scheduled successfully");
      closeCreateModal();
      await fetchInterviews();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to schedule interview";
      setCreateError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onCompleteInterview = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    if (!completeForm.recommendation) {
      setModalError("Please select a recommendation.");
      return;
    }

    setActionLoadingId(selectedInterview._id);
    setModalError("");
    try {
      await axios.put(`/recruitment/interviews/${selectedInterview._id}/complete`, {
        interviewNotes: completeForm.interviewNotes.trim(),
        recommendation: completeForm.recommendation,
      });
      toast.success("Interview marked as completed");
      closeActionModal();
      await fetchInterviews();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to complete interview";
      setModalError(message);
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const onCancelInterview = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    setActionLoadingId(selectedInterview._id);
    setModalError("");
    try {
      await axios.put(`/recruitment/interviews/${selectedInterview._id}/cancel`, {
        cancellationReason: cancelReason.trim(),
      });
      toast.success("Interview cancelled");
      closeActionModal();
      await fetchInterviews();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to cancel interview";
      setModalError(message);
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const onUpdateOutcome = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    if (!outcomeForm.recommendation) {
      setModalError("Please select a recommendation.");
      return;
    }

    setActionLoadingId(selectedInterview._id);
    setModalError("");
    try {
      await axios.put(`/recruitment/interviews/${selectedInterview._id}/outcome`, {
        interviewNotes: outcomeForm.interviewNotes.trim(),
        recommendation: outcomeForm.recommendation,
      });
      toast.success("Interview recommendation updated");
      closeActionModal();
      await fetchInterviews();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update recommendation";
      setModalError(message);
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderActions = (interview) => {
    const isLoading = actionLoadingId === interview._id;

    if (interview.status === "Scheduled") {
      return (
        <div className="rec-action-group">
          <button
            type="button"
            className="btn-small"
            onClick={() => openCompleteModal(interview)}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Complete"}
          </button>
          <button
            type="button"
            className="btn-small btn-danger"
            onClick={() => openCancelModal(interview)}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      );
    }

    if (interview.status === "Completed") {
      return (
        <div className="rec-action-group">
          <button type="button" className="btn-small" onClick={() => openDetailsModal(interview)} disabled={isLoading}>
            View Details
          </button>
          <button type="button" className="btn-small" onClick={() => openOutcomeModal(interview)} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Recommendation"}
          </button>
        </div>
      );
    }

    return (
      <button type="button" className="btn-small" onClick={() => openDetailsModal(interview)}>
        View Details
      </button>
    );
  };

  return (
    <div className="recruitment-container">
      <div className="rec-page-header">
        <button type="button" className="rec-btn-primary" onClick={openCreateModal}>
          <FiPlus aria-hidden="true" />
          Schedule Interview
        </button>
      </div>

      <div className="rec-toolbar" role="search" aria-label="Filter interviews">
        <div className="rec-toolbar-group">
          <label htmlFor="interview-status-filter">Status</label>
          <select
            id="interview-status-filter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <p className="rec-result-count" aria-live="polite">
          {interviews.length} {interviews.length === 1 ? "interview" : "interviews"}
        </p>
      </div>

      {loading ? (
        <div className="loading">Loading interviews...</div>
      ) : interviews.length === 0 ? (
        <div className="rec-empty-state">
          <strong>No interviews scheduled</strong>
          Interviews will appear here once they are created for shortlisted candidates.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="interviews-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Role</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Recommendation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview._id}>
                  <td>{getApplicantLabel(interview)}</td>
                  <td>{getJobTitle(interview)}</td>
                  <td>{new Date(interview.interviewDate).toLocaleDateString()}</td>
                  <td>{interview.interviewTime}</td>
                  <td>{interview.interviewType}</td>
                  <td>{interview.location}</td>
                  <td>
                    <span className={`badge badge-${interview.status.toLowerCase()}`}>
                      {interview.status}
                    </span>
                  </td>
                  <td>{interview.recommendation || "—"}</td>
                  <td>{renderActions(interview)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Schedule Interview</h2>
              <button type="button" className="btn btn-sm" onClick={closeCreateModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <form className="card-body rec-form-grid" onSubmit={onScheduleInterview}>
              <div className="rec-form-field">
                <label htmlFor="interview-application">Application *</label>
                <select
                  id="interview-application"
                  value={createForm.applicationId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, applicationId: e.target.value }))}
                  required
                >
                  <option value="">Select an application</option>
                  {applications.map((application) => (
                    <option key={application._id} value={application._id}>
                      {formatApplicationLabel(application)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rec-form-row">
                <div className="rec-form-field">
                  <label htmlFor="interview-date">Interview date *</label>
                  <input
                    id="interview-date"
                    type="date"
                    value={createForm.interviewDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, interviewDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="rec-form-field">
                  <label htmlFor="interview-time">Interview time *</label>
                  <input
                    id="interview-time"
                    type="time"
                    value={createForm.interviewTime}
                    onChange={(e) => setCreateForm((p) => ({ ...p, interviewTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="rec-form-row">
                <div className="rec-form-field">
                  <label htmlFor="interview-location">Location *</label>
                  <select
                    id="interview-location"
                    value={createForm.location}
                    onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))}
                    required
                  >
                    <option value="Physical">Physical</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div className="rec-form-field">
                  <label htmlFor="interview-type">Interview type *</label>
                  <select
                    id="interview-type"
                    value={createForm.interviewType}
                    onChange={(e) => setCreateForm((p) => ({ ...p, interviewType: e.target.value }))}
                    required
                  >
                    <option value="Phone">Phone</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Video">Video</option>
                  </select>
                </div>
              </div>

              <div className="rec-form-field">
                <label htmlFor="meeting-link">Meeting link</label>
                <input
                  id="meeting-link"
                  type="url"
                  placeholder="https://..."
                  value={createForm.meetingLink}
                  onChange={(e) => setCreateForm((p) => ({ ...p, meetingLink: e.target.value }))}
                />
              </div>

              {createError && <p className="rec-form-error">{createError}</p>}

              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={submitting}>
                  Close
                </button>
                <button type="submit" className="rec-btn-primary" disabled={submitting}>
                  {submitting ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "complete" && selectedInterview && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Complete Interview</h2>
              <button type="button" className="btn btn-sm" onClick={closeActionModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <form className="card-body rec-form-grid" onSubmit={onCompleteInterview}>
              <p className="rec-modal-intro">
                Mark the interview for <strong>{getApplicantLabel(selectedInterview)}</strong> as completed.
                This action cannot be undone.
              </p>
              <div className="rec-form-field">
                <label htmlFor="complete-recommendation">Recommendation *</label>
                <select
                  id="complete-recommendation"
                  value={completeForm.recommendation}
                  onChange={(e) => setCompleteForm((p) => ({ ...p, recommendation: e.target.value }))}
                  required
                >
                  {RECOMMENDATIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rec-form-field">
                <label htmlFor="complete-notes">Interview notes</label>
                <textarea
                  id="complete-notes"
                  rows={4}
                  value={completeForm.interviewNotes}
                  onChange={(e) => setCompleteForm((p) => ({ ...p, interviewNotes: e.target.value }))}
                  placeholder="Summary of the interview, key observations, or outcome notes"
                />
              </div>
              {modalError && <p className="rec-form-error">{modalError}</p>}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeActionModal} disabled={actionLoadingId}>
                  Close
                </button>
                <button type="submit" className="rec-btn-primary" disabled={actionLoadingId}>
                  {actionLoadingId ? "Completing..." : "Confirm Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "cancel" && selectedInterview && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Cancel Interview</h2>
              <button type="button" className="btn btn-sm" onClick={closeActionModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <form className="card-body rec-form-grid" onSubmit={onCancelInterview}>
              <p className="rec-modal-intro">
                Cancel the interview for <strong>{getApplicantLabel(selectedInterview)}</strong>?
                The interview will be marked as cancelled and cannot be completed unless rescheduled as a new interview.
              </p>
              <div className="rec-form-field">
                <label htmlFor="cancel-reason">Cancellation reason (optional)</label>
                <textarea
                  id="cancel-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Candidate unavailable, position filled, rescheduled"
                />
              </div>
              {modalError && <p className="rec-form-error">{modalError}</p>}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeActionModal} disabled={actionLoadingId}>
                  Keep Scheduled
                </button>
                <button type="submit" className="btn-small btn-danger" disabled={actionLoadingId}>
                  {actionLoadingId ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "outcome" && selectedInterview && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Update Recommendation</h2>
              <button type="button" className="btn btn-sm" onClick={closeActionModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <form className="card-body rec-form-grid" onSubmit={onUpdateOutcome}>
              <div className="rec-form-field">
                <label htmlFor="outcome-recommendation">Recommendation *</label>
                <select
                  id="outcome-recommendation"
                  value={outcomeForm.recommendation}
                  onChange={(e) => setOutcomeForm((p) => ({ ...p, recommendation: e.target.value }))}
                  required
                >
                  {RECOMMENDATIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rec-form-field">
                <label htmlFor="outcome-notes">Interview notes</label>
                <textarea
                  id="outcome-notes"
                  rows={4}
                  value={outcomeForm.interviewNotes}
                  onChange={(e) => setOutcomeForm((p) => ({ ...p, interviewNotes: e.target.value }))}
                />
              </div>
              {modalError && <p className="rec-form-error">{modalError}</p>}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeActionModal} disabled={actionLoadingId}>
                  Close
                </button>
                <button type="submit" className="rec-btn-primary" disabled={actionLoadingId}>
                  {actionLoadingId ? "Saving..." : "Save Recommendation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "details" && selectedInterview && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Interview Details</h2>
              <button type="button" className="btn btn-sm" onClick={closeActionModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <div className="card-body rec-details-grid">
              <div><strong>Applicant</strong><p>{getApplicantLabel(selectedInterview)}</p></div>
              <div><strong>Role</strong><p>{getJobTitle(selectedInterview)}</p></div>
              <div><strong>Date</strong><p>{new Date(selectedInterview.interviewDate).toLocaleDateString()}</p></div>
              <div><strong>Time</strong><p>{selectedInterview.interviewTime}</p></div>
              <div><strong>Type</strong><p>{selectedInterview.interviewType}</p></div>
              <div><strong>Location</strong><p>{selectedInterview.location}</p></div>
              <div><strong>Status</strong><p>{selectedInterview.status}</p></div>
              <div><strong>Recommendation</strong><p>{selectedInterview.recommendation || "—"}</p></div>
              {selectedInterview.meetingLink && (
                <div><strong>Meeting link</strong><p>{selectedInterview.meetingLink}</p></div>
              )}
              {selectedInterview.interviewNotes && (
                <div className="rec-details-full"><strong>Interview notes</strong><p>{selectedInterview.interviewNotes}</p></div>
              )}
              {selectedInterview.cancellationReason && (
                <div className="rec-details-full"><strong>Cancellation reason</strong><p>{selectedInterview.cancellationReason}</p></div>
              )}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeActionModal}>
                  Close
                </button>
                {selectedInterview.status === "Completed" && (
                  <button type="button" className="rec-btn-primary" onClick={() => openOutcomeModal(selectedInterview)}>
                    Update Recommendation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewsList;
