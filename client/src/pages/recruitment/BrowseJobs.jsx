import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import "../../styles/applicant-portal.css";

const BrowseJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    fetchPublishedJobs();
  }, [filterDept]);

  const fetchPublishedJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: "Published" });
      if (filterDept) params.append("department", filterDept);

      const response = await axios.get(`/recruitment/jobs?${params}`);
      setJobs(response.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load positions");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (filteredJobs.length > 0 && !selectedJob) {
      setSelectedJob(filteredJobs[0]);
    } else if (filteredJobs.length === 0) {
      setSelectedJob(null);
    } else if (selectedJob && !filteredJobs.find((j) => j._id === selectedJob._id)) {
      setSelectedJob(filteredJobs[0]);
    }
  }, [filteredJobs, selectedJob]);

  useEffect(() => {
    const pendingJobId = sessionStorage.getItem("pendingJobId");
    if (!pendingJobId || jobs.length === 0) return;

    const pendingJob = jobs.find((job) => job._id === pendingJobId);
    if (pendingJob) {
      setSelectedJob(pendingJob);
      if (localStorage.getItem("applicantId")) {
        navigate(`/recruitment/apply/${pendingJob._id}`);
      }
    }
    sessionStorage.removeItem("pendingJobId");
  }, [jobs, navigate]);

  const openApplyFlow = () => {
    if (!selectedJob) return;

    const applicantId = localStorage.getItem("applicantId");
    if (!applicantId) {
      sessionStorage.setItem("pendingJobId", selectedJob._id);
      navigate("/recruitment/auth");
      return;
    }

    navigate(`/recruitment/apply/${selectedJob._id}`);
  };

  if (loading) {
    return (
      <div className="applicant-page">
        <div className="loading">Loading available positions...</div>
      </div>
    );
  }

  return (
    <div className="applicant-page">
      <header className="applicant-page-header">
        <h1>Open positions</h1>
        <p className="subtitle">Explore career opportunities at Turkana University College</p>
        <span className="result-count" aria-live="polite">
          {filteredJobs.length} {filteredJobs.length === 1 ? "position" : "positions"} available
        </span>
      </header>

      <div className="search-filters" role="search">
        <label className="search-field">
          Search
          <input
            type="search"
            placeholder="Job title or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </label>
        <label className="filter-field">
          Department
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="filter-select"
          >
            <option value="">All departments</option>
            <option value="ICT">ICT</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="Academic">Academic</option>
          </select>
        </label>
      </div>

      <div className="jobs-browse-grid">
        <section className="jobs-list" aria-label="Position list">
          <div className="jobs-list-header">Select a role</div>
          {filteredJobs.length === 0 ? (
            <div className="no-results">
              <strong>No positions match your search</strong>
              Try different keywords or clear the department filter.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <button
                type="button"
                key={job._id}
                className={`job-item ${selectedJob?._id === job._id ? "active" : ""}`}
                onClick={() => setSelectedJob(job)}
              >
                <h3>{job.jobTitle}</h3>
                <p className="department">{job.department}</p>
                <p className="deadline">Closes {new Date(job.deadline).toLocaleDateString()}</p>
                <span className="applicant-count">{job.applicantCount} applications</span>
              </button>
            ))
          )}
        </section>

        <section className="job-details" aria-label="Position details">
          {selectedJob ? (
            <>
              <h2>{selectedJob.jobTitle}</h2>
              <span className="department-badge">{selectedJob.department}</span>

              <div className="job-info">
                <div className="info-section">
                  <h4>Position type</h4>
                  <p>{selectedJob.jobType}</p>
                </div>
                <div className="info-section">
                  <h4>Salary range</h4>
                  <p>
                    KES {selectedJob.salary?.min?.toLocaleString() || "TBD"} – KES{" "}
                    {selectedJob.salary?.max?.toLocaleString() || "TBD"}
                  </p>
                </div>
                <div className="info-section">
                  <h4>Application deadline</h4>
                  <p>{new Date(selectedJob.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="job-description">
                <h4>About this position</h4>
                <p>{selectedJob.description}</p>
              </div>

              <div className="job-requirements">
                <h4>Requirements</h4>
                <p>{selectedJob.requirements}</p>
              </div>

              <div className="job-apply-actions">
                <button type="button" className="btn-apply" onClick={openApplyFlow}>
                  Apply now
                </button>
                {localStorage.getItem("applicantId") && (
                  <Link to="/recruitment/profile" className="btn-browse btn-browse-secondary">
                    Update my profile
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <strong>Select a position to view details</strong>
              Choose a role from the list to see requirements and apply.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BrowseJobs;
