import React, { useState, useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import "../../styles/recruitment.css";

const initialOfferForm = {
  applicationId: "",
  jobTitle: "",
  salaryOffered: "",
  startDate: "",
  employmentType: "Full-time",
  terms: "",
};

const formatApplicationLabel = (application) => {
  const applicant = application.applicantId;
  const job = application.jobId;
  const name = applicant ? `${applicant.firstName} ${applicant.lastName}` : "Unknown applicant";
  const jobTitle = job?.jobTitle || "Unknown role";
  return `${name} — ${jobTitle} (${application.status})`;
};

const OFFER_STATUSES = ["Pending", "Approved", "On Hold", "Accepted", "Rejected", "Expired"];

const statusBadgeClass = (status) => {
  if (!status) return "badge-pending";
  return `badge-${status.toLowerCase().replace(/\s+/g, "-")}`;
};

const OffersList = () => {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialOfferForm);
  const [createError, setCreateError] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, [filters]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);

      const response = await axios.get(`/recruitment/offers?${params}`);
      setOffers(response.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load offers");
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
    setCreateForm(initialOfferForm);
    setCreateError("");
    setShowCreate(true);
    await fetchApplications();
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setCreateForm(initialOfferForm);
    setCreateError("");
  };

  const onApplicationChange = (applicationId) => {
    const selected = applications.find((app) => app._id === applicationId);
    setCreateForm((prev) => ({
      ...prev,
      applicationId,
      jobTitle: selected?.jobId?.jobTitle || "",
    }));
  };

  const onCreateOffer = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!createForm.applicationId || !createForm.jobTitle || !createForm.salaryOffered || !createForm.startDate || !createForm.employmentType) {
      setCreateError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/recruitment/offers", {
        applicationId: createForm.applicationId,
        jobTitle: createForm.jobTitle.trim(),
        salaryOffered: Number(createForm.salaryOffered),
        startDate: createForm.startDate,
        employmentType: createForm.employmentType,
        terms: createForm.terms.trim() || undefined,
      });
      toast.success("Offer created successfully");
      closeCreateModal();
      await fetchOffers();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to create offer";
      setCreateError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateOfferStatus = async (offerId, status, selectEl) => {
    if (!status) return;

    const offer = offers.find((item) => item._id === offerId);
    if (offer?.status === status) return;

    const terminalStatuses = ["Accepted", "Rejected", "Expired"];
    if (terminalStatuses.includes(status)) {
      const confirmed = window.confirm(`Change this offer status to "${status}"?`);
      if (!confirmed) {
        if (selectEl) selectEl.value = offer.status;
        return;
      }
    }

    setStatusUpdatingId(offerId);
    try {
      await axios.put(`/recruitment/offers/${offerId}/status`, { status });
      toast.success(`Offer status updated to ${status}`);
      await fetchOffers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update offer status");
      if (selectEl && offer) selectEl.value = offer.status;
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="recruitment-container">
      <div className="rec-page-header">
        <button type="button" className="rec-btn-primary" onClick={openCreateModal}>
          <FiPlus aria-hidden="true" />
          Create Offer
        </button>
      </div>

      <div className="rec-toolbar" role="search" aria-label="Filter offers">
        <div className="rec-toolbar-group">
          <label htmlFor="offer-status-filter">Status</label>
          <select
            id="offer-status-filter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            {OFFER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <p className="rec-result-count" aria-live="polite">
          {offers.length} {offers.length === 1 ? "offer" : "offers"}
        </p>
      </div>

      {loading ? (
        <div className="loading">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="rec-empty-state">
          <strong>No offers found</strong>
          Offers will appear here once they are sent to selected candidates.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="offers-table">
            <thead>
              <tr>
                <th>Job title</th>
                <th>Salary</th>
                <th>Start date</th>
                <th>Status</th>
                <th>Response</th>
                <th>Sent date</th>
                <th>Update status</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td>{offer.jobTitle}</td>
                  <td>KES {offer.salaryOffered.toLocaleString()}</td>
                  <td>{new Date(offer.startDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(offer.status)}`}>{offer.status}</span>
                  </td>
                  <td>{offer.response || "—"}</td>
                  <td>{new Date(offer.sentDate).toLocaleDateString()}</td>
                  <td>
                    <div className="rec-offer-actions">
                      <label className="rec-status-select-label">
                        <span className="sr-only">Change status for {offer.jobTitle}</span>
                        <select
                          className="rec-status-select"
                          value={offer.status}
                          onChange={(e) => updateOfferStatus(offer._id, e.target.value, e.target)}
                          disabled={statusUpdatingId === offer._id}
                        >
                          {OFFER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </td>
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
              <h2 className="card-title">Create Offer</h2>
              <button type="button" className="btn btn-sm" onClick={closeCreateModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <form className="card-body rec-form-grid" onSubmit={onCreateOffer}>
              <div className="rec-form-field">
                <label htmlFor="offer-application">Application *</label>
                <select
                  id="offer-application"
                  value={createForm.applicationId}
                  onChange={(e) => onApplicationChange(e.target.value)}
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

              <div className="rec-form-field">
                <label htmlFor="offer-job-title">Job title *</label>
                <input
                  id="offer-job-title"
                  value={createForm.jobTitle}
                  onChange={(e) => setCreateForm((p) => ({ ...p, jobTitle: e.target.value }))}
                  required
                />
              </div>

              <div className="rec-form-row">
                <div className="rec-form-field">
                  <label htmlFor="offer-salary">Salary offered (KES) *</label>
                  <input
                    id="offer-salary"
                    type="number"
                    min="0"
                    value={createForm.salaryOffered}
                    onChange={(e) => setCreateForm((p) => ({ ...p, salaryOffered: e.target.value }))}
                    required
                  />
                </div>
                <div className="rec-form-field">
                  <label htmlFor="offer-start-date">Start date *</label>
                  <input
                    id="offer-start-date"
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="rec-form-field">
                <label htmlFor="offer-employment-type">Employment type *</label>
                <select
                  id="offer-employment-type"
                  value={createForm.employmentType}
                  onChange={(e) => setCreateForm((p) => ({ ...p, employmentType: e.target.value }))}
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>

              <div className="rec-form-field">
                <label htmlFor="offer-terms">Terms</label>
                <textarea
                  id="offer-terms"
                  value={createForm.terms}
                  onChange={(e) => setCreateForm((p) => ({ ...p, terms: e.target.value }))}
                  placeholder="Optional offer terms and conditions"
                />
              </div>

              {createError && <p className="rec-form-error">{createError}</p>}

              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="rec-btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersList;
