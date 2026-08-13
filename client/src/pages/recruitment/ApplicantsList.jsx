import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "../../api/axios";
import "../../styles/recruitment.css";

const ApplicantsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const jobTitle = searchParams.get("jobTitle");

  const [applicants, setApplicants] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (jobId) {
      fetchApplicationsForJob();
    } else {
      fetchApplicants();
      fetchStats();
    }
  }, [filters, jobId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const response = await axios.get(`/recruitment/applicants?${params}`);
      setApplicants(response.data.data);
    } catch (error) {
      console.error("Error fetching applicants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsForJob = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ jobId });
      if (filters.status) params.append("status", filters.status);

      const response = await axios.get(`/recruitment/applications?${params}`);
      setApplications(response.data.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/recruitment/applicants/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateStatus = async (applicantId, newStatus) => {
    try {
      await axios.put(`/recruitment/applicants/${applicantId}`, { status: newStatus });
      fetchApplicants();
      fetchStats();
    } catch (error) {
      console.error("Error updating applicant:", error);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await axios.put(`/recruitment/applications/${applicationId}/status`, { status: newStatus });
      fetchApplicationsForJob();
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const clearJobFilter = () => {
    setSearchParams({});
    setFilters({ status: "", search: "" });
  };

  const filteredApplications = applications.filter((application) => {
    if (!filters.search) return true;
    const applicant = application.applicantId;
    const term = filters.search.toLowerCase();
    const name = applicant ? `${applicant.firstName} ${applicant.lastName}`.toLowerCase() : "";
    const email = applicant?.email?.toLowerCase() || "";
    return name.includes(term) || email.includes(term);
  });

  if (loading) return <div className="loading">Loading {jobId ? "applications" : "applicants"}...</div>;

  if (jobId) {
    return (
      <div className="recruitment-container">
        <div className="rec-job-filter-banner">
          <span>
            Showing applications for <strong>{jobTitle || "selected vacancy"}</strong>
          </span>
          <Link to="/hr-portal/applicants" onClick={clearJobFilter}>
            View all applicants
          </Link>
        </div>

        <div className="filters" role="search" aria-label="Filter applications">
          <input
            type="search"
            placeholder="Search by name or email..."
            aria-label="Search applications"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            aria-label="Filter by application status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Rejected">Rejected</option>
            <option value="Selected">Selected</option>
            <option value="Offered">Offered</option>
          </select>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="rec-empty-state">
            <strong>No applications found</strong>
            {filters.search || filters.status
              ? "Try a different search term or status filter."
              : "Applications for this vacancy will appear here once candidates apply."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="applicants-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Update status</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => {
                  const applicant = application.applicantId;
                  return (
                    <tr key={application._id}>
                      <td>
                        {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Unknown"}
                      </td>
                      <td>{applicant?.email || "—"}</td>
                      <td>{applicant?.phone || "—"}</td>
                      <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${application.status.toLowerCase()}`}>
                          {application.status}
                        </span>
                      </td>
                      <td>
                        <select
                          aria-label={`Update application status for ${applicant?.firstName || "applicant"}`}
                          value={application.status}
                          onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Selected">Selected</option>
                          <option value="Offered">Offered</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="recruitment-container">
      <div className="stats-cards" aria-label="Applicant summary">
        <div className="stat-card">
          <h3>{stats.total || 0}</h3>
          <p>Total Applicants</p>
        </div>
        <div className="stat-card">
          <h3>{stats.active || 0}</h3>
          <p>Active</p>
        </div>
        <div className="stat-card">
          <h3>{stats.shortlisted || 0}</h3>
          <p>Shortlisted</p>
        </div>
        <div className="stat-card">
          <h3>{stats.offered || 0}</h3>
          <p>Offered</p>
        </div>
        <div className="stat-card">
          <h3>{stats.hired || 0}</h3>
          <p>Hired</p>
        </div>
        <div className="stat-card">
          <h3>{stats.rejected || 0}</h3>
          <p>Rejected</p>
        </div>
      </div>

      <div className="filters" role="search" aria-label="Filter applicants">
        <input
          type="search"
          placeholder="Search by name or email..."
          aria-label="Search applicants"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Rejected">Rejected</option>
          <option value="Offered">Offered</option>
          <option value="Hired">Hired</option>
        </select>
      </div>

      {applicants.length === 0 ? (
        <div className="rec-empty-state">
          <strong>No applicants found</strong>
          Try a different search term or status filter.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="applicants-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Experience</th>
                <th>Education</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Update status</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr key={applicant._id}>
                  <td>{applicant.firstName} {applicant.lastName}</td>
                  <td>{applicant.email}</td>
                  <td>{applicant.phone}</td>
                  <td>{applicant.yearsOfExperience} yrs</td>
                  <td>{applicant.educationLevel}</td>
                  <td>{applicant.appliedJobs?.length || 0}</td>
                  <td>
                    <span className={`badge badge-${applicant.status.toLowerCase()}`}>
                      {applicant.status}
                    </span>
                  </td>
                  <td>
                    <select
                      aria-label={`Update status for ${applicant.firstName} ${applicant.lastName}`}
                      value={applicant.status}
                      onChange={(e) => updateStatus(applicant._id, e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Offered">Offered</option>
                      <option value="Hired">Hired</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicantsList;
