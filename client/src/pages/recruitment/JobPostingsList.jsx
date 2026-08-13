import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiX,
  FiMoreHorizontal,
  FiGrid,
  FiList,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiUsers,
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import {
  SHORT_DESCRIPTION_LENGTH,
  formatJobDate,
  getDeadlineInfo,
  jobToForm,
  getRecruitmentMetrics,
  buildJobPayload,
} from "../../utils/jobPostingUtils";
import "../../styles/recruitment.css";

const initialJobForm = {
  jobTitle: "",
  department: "",
  description: "",
  requirements: "",
  salaryMin: "",
  salaryMax: "",
  jobType: "Administrative",
  deadline: "",
};

const INITIAL_FILTERS = {
  search: "",
  status: "",
  jobType: "",
  department: "",
  deadlineFilter: "",
};

const statusBadgeClass = (status) => `badge badge-${(status || "").toLowerCase()}`;

const JobFormFields = ({ form, setForm, idPrefix = "job" }) => (
  <>
    <div className="rec-form-field">
      <label htmlFor={`${idPrefix}-title`}>Job title *</label>
      <input
        id={`${idPrefix}-title`}
        value={form.jobTitle}
        onChange={(e) => setForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
        required
      />
    </div>

    <div className="rec-form-field">
      <label htmlFor={`${idPrefix}-department`}>Department *</label>
      <input
        id={`${idPrefix}-department`}
        value={form.department}
        onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
        required
      />
    </div>

    <div className="rec-form-field">
      <label htmlFor={`${idPrefix}-description`}>Description *</label>
      <textarea
        id={`${idPrefix}-description`}
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        required
      />
    </div>

    <div className="rec-form-field">
      <label htmlFor={`${idPrefix}-requirements`}>Requirements *</label>
      <textarea
        id={`${idPrefix}-requirements`}
        value={form.requirements}
        onChange={(e) => setForm((prev) => ({ ...prev, requirements: e.target.value }))}
        required
      />
    </div>

    <div className="rec-form-row">
      <div className="rec-form-field">
        <label htmlFor={`${idPrefix}-salary-min`}>Salary min (KES)</label>
        <input
          id={`${idPrefix}-salary-min`}
          type="number"
          min="0"
          value={form.salaryMin}
          onChange={(e) => setForm((prev) => ({ ...prev, salaryMin: e.target.value }))}
        />
      </div>
      <div className="rec-form-field">
        <label htmlFor={`${idPrefix}-salary-max`}>Salary max (KES)</label>
        <input
          id={`${idPrefix}-salary-max`}
          type="number"
          min="0"
          value={form.salaryMax}
          onChange={(e) => setForm((prev) => ({ ...prev, salaryMax: e.target.value }))}
        />
      </div>
    </div>

    <div className="rec-form-row">
      <div className="rec-form-field">
        <label htmlFor={`${idPrefix}-type`}>Job type *</label>
        <select
          id={`${idPrefix}-type`}
          value={form.jobType}
          onChange={(e) => setForm((prev) => ({ ...prev, jobType: e.target.value }))}
          required
        >
          <option value="Academic">Academic</option>
          <option value="Administrative">Administrative</option>
          <option value="Technical">Technical</option>
          <option value="Support">Support</option>
        </select>
      </div>
      <div className="rec-form-field">
        <label htmlFor={`${idPrefix}-deadline`}>Application deadline *</label>
        <input
          id={`${idPrefix}-deadline`}
          type="date"
          value={form.deadline}
          onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
          required
        />
      </div>
    </div>
  </>
);

const RecruitmentActivity = ({ job, linkApplications = false, compact = false }) => {
  const metrics = getRecruitmentMetrics(job);
  const applicationsLink = `/hr-portal/applicants?jobId=${job._id}&jobTitle=${encodeURIComponent(job.jobTitle)}`;

  const metricsData = [
    { key: "applications", label: "Applications", value: metrics.applications, link: linkApplications },
    { key: "shortlisted", label: "Shortlisted", value: metrics.shortlisted },
    { key: "interviews", label: "Interviews", value: metrics.interviews },
    { key: "offers", label: "Offers", value: metrics.offers },
  ];

  return (
    <div
      className={`job-recruitment-activity${compact ? " is-compact" : ""}`}
      aria-label="Recruitment activity"
    >
      {metricsData.map((metric) => {
        const content = (
          <>
            <span className="job-metric-label">{metric.label}</span>
            <strong className="job-metric-value">{metric.value}</strong>
          </>
        );

        if (metric.link) {
          return (
            <Link
              key={metric.key}
              to={applicationsLink}
              className="job-metric-block job-metric-block--action"
              aria-label={`${metric.value} applications for ${job.jobTitle}`}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={metric.key} className="job-metric-block">
            {content}
          </div>
        );
      })}
    </div>
  );
};

const JobPostingsList = () => {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, closed: 0, departments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialJobForm);
  const [createError, setCreateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [viewJob, setViewJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState(initialJobForm);
  const [editError, setEditError] = useState("");
  const [deleteJob, setDeleteJob] = useState(null);

  const menuRef = useRef(null);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => Boolean(value)),
    [filters]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get("/recruitment/jobs/stats");
      setStats(response.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ metrics: "true" });
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.jobType) params.append("jobType", filters.jobType);
      if (filters.department) params.append("department", filters.department);
      if (filters.deadlineFilter) params.append("deadlineFilter", filters.deadlineFilter);

      const response = await axios.get(`/recruitment/jobs?${params}`);
      setJobs(response.data.data);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to load job postings";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [fetchJobs, fetchStats]);

  const refreshAll = async () => {
    await Promise.all([fetchJobs(), fetchStats()]);
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setCreateForm(initialJobForm);
    setCreateError("");
  };

  const validateForm = (form) => {
    if (!form.jobTitle || !form.department || !form.description || !form.requirements || !form.deadline) {
      return "Please fill in all required fields.";
    }
    return "";
  };

  const onCreateJob = async (e) => {
    e.preventDefault();
    const validationError = validateForm(createForm);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setSubmitting(true);
    setCreateError("");
    try {
      await axios.post("/recruitment/jobs", buildJobPayload(createForm));
      toast.success("Job posting saved as draft");
      closeCreateModal();
      await refreshAll();
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create job posting";
      setCreateError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (job) => {
    setOpenMenuId(null);
    setEditJob(job);
    setEditForm(jobToForm(job));
    setEditError("");
  };

  const closeEditModal = () => {
    setEditJob(null);
    setEditForm(initialJobForm);
    setEditError("");
  };

  const onEditJob = async (e) => {
    e.preventDefault();
    const validationError = validateForm(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setSubmitting(true);
    setEditError("");
    try {
      await axios.put(`/recruitment/jobs/${editJob._id}`, buildJobPayload(editForm));
      toast.success("Job posting updated");
      closeEditModal();
      await refreshAll();
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update job posting";
      setEditError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const runJobAction = async (jobId, action) => {
    setActionLoadingId(jobId);
    setOpenMenuId(null);
    try {
      if (action === "publish") {
        await axios.put(`/recruitment/jobs/${jobId}/publish`);
        toast.success("Job published");
      } else if (action === "close") {
        await axios.put(`/recruitment/jobs/${jobId}/close`);
        toast.success("Job posting closed");
      } else if (action === "reopen") {
        await axios.put(`/recruitment/jobs/${jobId}/reopen`);
        toast.success("Job posting reopened");
      } else if (action === "delete") {
        await axios.delete(`/recruitment/jobs/${jobId}`);
        toast.success("Job posting deleted");
        setDeleteJob(null);
      }
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilters(INITIAL_FILTERS);
  };

  const departmentOptions = useMemo(() => {
    const fromStats = stats.departments || [];
    const fromJobs = jobs.map((job) => job.department).filter(Boolean);
    return [...new Set([...fromStats, ...fromJobs])].sort((a, b) => a.localeCompare(b));
  }, [stats.departments, jobs]);

  const renderActionMenu = (job) => {
    const isLoading = actionLoadingId === job._id;
    const applicationsLink = `/hr-portal/applicants?jobId=${job._id}&jobTitle=${encodeURIComponent(job.jobTitle)}`;

    const menuItems = [];

    menuItems.push({
      key: "view",
      label: job.status === "Draft" ? "Preview" : "View",
      icon: FiEye,
      onClick: () => {
        setOpenMenuId(null);
        setViewJob(job);
      },
    });

    if (job.status === "Draft" || job.status === "Published") {
      menuItems.push({
        key: "edit",
        label: "Edit",
        icon: FiEdit2,
        onClick: () => openEditModal(job),
      });
    }

    if (job.status === "Draft") {
      menuItems.push({
        key: "publish",
        label: "Publish",
        icon: FiUpload,
        onClick: () => runJobAction(job._id, "publish"),
      });
      menuItems.push({
        key: "delete",
        label: "Delete",
        icon: FiTrash2,
        danger: true,
        onClick: () => {
          setOpenMenuId(null);
          setDeleteJob(job);
        },
      });
    }

    if (job.status === "Published") {
      menuItems.push({
        key: "applications",
        label: "View Applications",
        icon: FiUsers,
        to: applicationsLink,
      });
      menuItems.push({
        key: "close",
        label: "Close Posting",
        icon: FiLock,
        onClick: () => runJobAction(job._id, "close"),
      });
    }

    if (job.status === "Closed") {
      menuItems.push({
        key: "applications",
        label: "View Applications",
        icon: FiUsers,
        to: applicationsLink,
      });
      menuItems.push({
        key: "reopen",
        label: "Reopen",
        icon: FiRefreshCw,
        onClick: () => runJobAction(job._id, "reopen"),
      });
    }

    return (
      <div className="rec-action-menu-wrap" ref={openMenuId === job._id ? menuRef : null}>
        <button
          type="button"
          className="rec-action-menu-trigger"
          aria-label={`Actions for ${job.jobTitle}`}
          aria-expanded={openMenuId === job._id}
          onClick={() => setOpenMenuId(openMenuId === job._id ? null : job._id)}
          disabled={isLoading}
        >
          <FiMoreHorizontal aria-hidden="true" />
        </button>
        {openMenuId === job._id && (
          <div className="rec-action-menu" role="menu">
            {menuItems.map((item) =>
              item.to ? (
                <Link
                  key={item.key}
                  to={item.to}
                  className="rec-action-menu-item"
                  role="menuitem"
                  onClick={() => setOpenMenuId(null)}
                >
                  <item.icon aria-hidden="true" />
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  className={`rec-action-menu-item${item.danger ? " is-danger" : ""}`}
                  role="menuitem"
                  onClick={item.onClick}
                  disabled={isLoading}
                >
                  <item.icon aria-hidden="true" />
                  {item.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  const renderJobCard = (job) => {
    const deadline = getDeadlineInfo(job.deadline, job.status);
    const metrics = getRecruitmentMetrics(job);
    const applicationsLink = `/hr-portal/applicants?jobId=${job._id}&jobTitle=${encodeURIComponent(job.jobTitle)}`;
    const description =
      job.description.length > SHORT_DESCRIPTION_LENGTH
        ? `${job.description.substring(0, SHORT_DESCRIPTION_LENGTH)}…`
        : job.description;

    return (
      <article key={job._id} className="job-card job-posting-card">
        <header className="job-card-header">
          <div className="job-card-title-row">
            <h3 className="job-card-title">{job.jobTitle}</h3>
            <span className={`job-card-status ${statusBadgeClass(job.status)}`}>{job.status}</span>
          </div>
        </header>

        <div className="job-card-metadata" aria-label="Job details">
          <span className="job-meta-item job-meta-department">{job.department}</span>
          <span className="job-meta-separator" aria-hidden="true">
            •
          </span>
          <span className="job-meta-item job-meta-type">{job.jobType}</span>
        </div>

        <div className="job-card-description">
          <p>{description}</p>
        </div>

        <div className="job-card-divider" role="presentation" />

        <RecruitmentActivity job={job} linkApplications />

        <footer className="job-card-footer">
          <div className="job-card-dates">
            <div className="job-date-block">
              <span className="job-date-label">Deadline</span>
              <strong>{formatJobDate(job.deadline)}</strong>
            </div>
            <div className="job-date-block job-date-block--remaining">
              <span className="job-date-label">Closing</span>
              <span className={`job-deadline-note tone-${deadline.tone}`}>{deadline.label}</span>
            </div>
            <div className="job-date-block">
              <span className="job-date-label">Created</span>
              <strong>{formatJobDate(job.createdAt)}</strong>
            </div>
          </div>

          <div className="job-card-actions">
            <button
              type="button"
              className="job-card-btn job-card-btn-secondary"
              onClick={() => setViewJob(job)}
            >
              {job.status === "Draft" ? "Preview" : "View Job"}
            </button>
            <Link to={applicationsLink} className="job-card-btn job-card-btn-primary">
              Applications ({metrics.applications})
            </Link>
            {renderActionMenu(job)}
          </div>
        </footer>
      </article>
    );
  };

  const renderTable = () => (
    <>
      <div className="table-wrap jobs-desktop-table">
        <table className="jobs-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Department</th>
              <th>Type</th>
              <th>Status</th>
              <th>Applications</th>
              <th>Shortlisted</th>
              <th>Interviews</th>
              <th>Offers</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const metrics = getRecruitmentMetrics(job);
              const deadline = getDeadlineInfo(job.deadline, job.status);
              const applicationsLink = `/hr-portal/applicants?jobId=${job._id}&jobTitle=${encodeURIComponent(job.jobTitle)}`;

              return (
                <tr key={job._id}>
                  <td>
                    <strong className="jobs-table-title">{job.jobTitle}</strong>
                  </td>
                  <td>{job.department}</td>
                  <td>{job.jobType}</td>
                  <td>
                    <span className={statusBadgeClass(job.status)}>{job.status}</span>
                  </td>
                  <td>
                    <Link to={applicationsLink} className="job-metric-link">
                      {metrics.applications}
                    </Link>
                  </td>
                  <td>{metrics.shortlisted}</td>
                  <td>{metrics.interviews}</td>
                  <td>{metrics.offers}</td>
                  <td>
                    <div className="jobs-table-deadline">
                      <span>{formatJobDate(job.deadline)}</span>
                      <small className={`tone-${deadline.tone}`}>{deadline.label}</small>
                    </div>
                  </td>
                  <td>{renderActionMenu(job)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="jobs-mobile-cards" aria-label="Job postings">
        {jobs.map((job) => {
          const deadline = getDeadlineInfo(job.deadline, job.status);
          return (
            <article key={job._id} className="job-performance-card">
              <div className="job-performance-header">
                <div>
                  <h3>{job.jobTitle}</h3>
                  <p>{job.department} · {job.jobType}</p>
                </div>
                <span className={statusBadgeClass(job.status)}>{job.status}</span>
              </div>
              <RecruitmentActivity job={job} linkApplications />
              <p className={`job-deadline-note tone-${deadline.tone}`}>
                {formatJobDate(job.deadline)} — {deadline.label}
              </p>
              <div className="jobs-mobile-card-actions">{renderActionMenu(job)}</div>
            </article>
          );
        })}
      </div>
    </>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="jobs-skeleton-grid" aria-busy="true" aria-label="Loading job postings">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rec-skeleton-card" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rec-empty-state rec-error-state">
          <strong>Unable to load job postings</strong>
          {error}
          <button type="button" className="rec-btn-secondary" onClick={refreshAll}>
            Try again
          </button>
        </div>
      );
    }

    if (jobs.length === 0) {
      const isFiltered = hasActiveFilters;
      return (
        <div className="rec-empty-state">
          <strong>{isFiltered ? "No job postings match your filters" : "No job postings yet"}</strong>
          {isFiltered
            ? "Try changing your filters or create a new vacancy."
            : "Create your first vacancy to start receiving applications."}
          {isFiltered ? (
            <button type="button" className="rec-btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          ) : (
            <button type="button" className="rec-btn-primary" onClick={() => setShowCreate(true)}>
              <FiPlus aria-hidden="true" />
              Create Job
            </button>
          )}
        </div>
      );
    }

    return viewMode === "card" ? <div className="jobs-grid">{jobs.map(renderJobCard)}</div> : renderTable();
  };

  return (
    <div className="recruitment-container">
      <header className="rec-page-heading">
        <div>
          <h1>Job Postings</h1>
          <p className="subtitle">Manage, publish and monitor recruitment opportunities.</p>
        </div>
        <button type="button" className="rec-btn-primary" onClick={() => setShowCreate(true)}>
          <FiPlus aria-hidden="true" />
          Create Job
        </button>
      </header>

      <div className="stats-cards" aria-label="Job posting summary">
        <div className="stat-card">
          <h3>{stats.total || 0}</h3>
          <p>Total Jobs</p>
        </div>
        <div className="stat-card">
          <h3>{stats.published || 0}</h3>
          <p>Published</p>
        </div>
        <div className="stat-card">
          <h3>{stats.drafts || 0}</h3>
          <p>Drafts</p>
        </div>
        <div className="stat-card">
          <h3>{stats.closed || 0}</h3>
          <p>Closed</p>
        </div>
      </div>

      <div className="rec-toolbar" role="search" aria-label="Filter job postings">
        <div className="rec-toolbar-group rec-toolbar-search">
          <label htmlFor="job-search">Search</label>
          <input
            id="job-search"
            type="search"
            placeholder="Job title, department, or keyword"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="rec-toolbar-group">
          <label htmlFor="job-status-filter">Status</label>
          <select
            id="job-status-filter"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="rec-toolbar-group">
          <label htmlFor="job-type-filter">Job type</label>
          <select
            id="job-type-filter"
            value={filters.jobType}
            onChange={(e) => setFilters((prev) => ({ ...prev, jobType: e.target.value }))}
          >
            <option value="">All</option>
            <option value="Academic">Academic</option>
            <option value="Administrative">Administrative</option>
            <option value="Technical">Technical</option>
            <option value="Support">Support</option>
          </select>
        </div>

        <div className="rec-toolbar-group">
          <label htmlFor="job-dept-filter">Department</label>
          <select
            id="job-dept-filter"
            value={filters.department}
            onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
          >
            <option value="">All</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="rec-toolbar-group">
          <label htmlFor="job-deadline-filter">Deadline</label>
          <select
            id="job-deadline-filter"
            value={filters.deadlineFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, deadlineFilter: e.target.value }))}
          >
            <option value="">Any</option>
            <option value="active">Active (open)</option>
            <option value="closing_soon">Closing within 7 days</option>
            <option value="expired">Deadline passed</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button type="button" className="rec-btn-text" onClick={clearFilters}>
            Clear filters
          </button>
        )}

        <div className="rec-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={viewMode === "card" ? "is-active" : ""}
            onClick={() => setViewMode("card")}
            aria-pressed={viewMode === "card"}
            title="Card view"
          >
            <FiGrid aria-hidden="true" />
          </button>
          <button
            type="button"
            className={viewMode === "table" ? "is-active" : ""}
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            title="Table view"
          >
            <FiList aria-hidden="true" />
          </button>
        </div>

        <p className="rec-result-count" aria-live="polite">
          {loading ? "Loading…" : `${jobs.length} ${jobs.length === 1 ? "posting" : "postings"}`}
        </p>
      </div>

      {renderContent()}

      {showCreate && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-job-title">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 id="create-job-title" className="card-title">Create Job Posting</h2>
              <button type="button" className="btn btn-sm" onClick={closeCreateModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <form className="card-body rec-form-grid" onSubmit={onCreateJob}>
              <JobFormFields form={createForm} setForm={setCreateForm} idPrefix="create" />
              {createError && <p className="rec-form-error">{createError}</p>}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="rec-btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editJob && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-job-title">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 id="edit-job-title" className="card-title">Edit Job Posting</h2>
              <button type="button" className="btn btn-sm" onClick={closeEditModal} aria-label="Close">
                <FiX />
              </button>
            </div>
            <form className="card-body rec-form-grid" onSubmit={onEditJob}>
              <JobFormFields form={editForm} setForm={setEditForm} idPrefix="edit" />
              {editError && <p className="rec-form-error">{editError}</p>}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="rec-btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewJob && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="view-job-title">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 id="view-job-title" className="card-title">{viewJob.jobTitle}</h2>
              <button type="button" className="btn btn-sm" onClick={() => setViewJob(null)} aria-label="Close">
                <FiX />
              </button>
            </div>
            <div className="card-body">
              <div className="rec-details-grid">
                <div>
                  <strong>Department</strong>
                  <p>{viewJob.department}</p>
                </div>
                <div>
                  <strong>Job type</strong>
                  <p>{viewJob.jobType}</p>
                </div>
                <div>
                  <strong>Status</strong>
                  <p>
                    <span className={statusBadgeClass(viewJob.status)}>{viewJob.status}</span>
                  </p>
                </div>
                <div>
                  <strong>Deadline</strong>
                  <p>
                    {formatJobDate(viewJob.deadline)}
                    <span className={`job-deadline-note tone-${getDeadlineInfo(viewJob.deadline, viewJob.status).tone}`}>
                      {" "}
                      · {getDeadlineInfo(viewJob.deadline, viewJob.status).label}
                    </span>
                  </p>
                </div>
                <div>
                  <strong>Salary range</strong>
                  <p>
                    KES {viewJob.salary?.min?.toLocaleString() || "TBD"} – KES{" "}
                    {viewJob.salary?.max?.toLocaleString() || "TBD"}
                  </p>
                </div>
                <div>
                  <strong>Created</strong>
                  <p>{formatJobDate(viewJob.createdAt)}</p>
                </div>
                <div className="rec-details-full">
                  <strong>Description</strong>
                  <p>{viewJob.description}</p>
                </div>
                <div className="rec-details-full">
                  <strong>Requirements</strong>
                  <p>{viewJob.requirements}</p>
                </div>
              </div>
              <RecruitmentActivity job={viewJob} linkApplications compact />
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setViewJob(null)}>
                  Close
                </button>
                {(viewJob.status === "Draft" || viewJob.status === "Published") && (
                  <button
                    type="button"
                    className="rec-btn-primary"
                    onClick={() => {
                      setViewJob(null);
                      openEditModal(viewJob);
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteJob && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-job-title">
          <div className="card um-modal-card um-modal-card-sm">
            <div className="card-header">
              <h2 id="delete-job-title" className="card-title">Delete draft?</h2>
              <button type="button" className="btn btn-sm" onClick={() => setDeleteJob(null)} aria-label="Close">
                <FiX />
              </button>
            </div>
            <div className="card-body">
              <p className="rec-modal-intro">
                This will permanently delete <strong>{deleteJob.jobTitle}</strong>. This action cannot be undone.
              </p>
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteJob(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-small btn-danger"
                  onClick={() => runJobAction(deleteJob._id, "delete")}
                  disabled={actionLoadingId === deleteJob._id}
                >
                  {actionLoadingId === deleteJob._id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingsList;
