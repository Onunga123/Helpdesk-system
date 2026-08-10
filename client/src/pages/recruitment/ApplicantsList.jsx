import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "../../styles/recruitment.css";

const ApplicantsList = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchApplicants();
    fetchStats();
  }, [filters]);

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
    } catch (error) {
      console.error("Error updating applicant:", error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="recruitment-container">
      <h1>Applicants</h1>

      <div className="stats-cards">
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
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Rejected">Rejected</option>
          <option value="Offered">Offered</option>
          <option value="Hired">Hired</option>
        </select>
      </div>

      <table className="applicants-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Experience</th>
            <th>Education</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applicants.length === 0 ? (
            <tr><td colSpan="7">No applicants found</td></tr>
          ) : (
            applicants.map((applicant) => (
              <tr key={applicant._id}>
                <td>{applicant.firstName} {applicant.lastName}</td>
                <td>{applicant.email}</td>
                <td>{applicant.phone}</td>
                <td>{applicant.yearsOfExperience} years</td>
                <td>{applicant.educationLevel}</td>
                <td><span className={`badge badge-${applicant.status.toLowerCase()}`}>{applicant.status}</span></td>
                <td>
                  <select value={applicant.status} onChange={(e) => updateStatus(applicant._id, e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Offered">Offered</option>
                    <option value="Hired">Hired</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicantsList;
